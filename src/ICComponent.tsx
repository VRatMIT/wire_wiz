import React, { useState, useEffect } from 'react';
import { GRID_SIZE, CENTER_DIVIDE_HEIGHT, PIN_SIZE, IC_HEIGHT, ROWS, COLS } from './config';
import type { Board } from './types';

type ICProps = {
  x: number;
  y: number;
  pins: number;     // Total number of pins (even)
  width: number;    // Width of IC body in px
  id: number;
  boardId: number;
  startCol: number;
  startRow: number;
  onDragEnd: (id: number, newX: number, newY: number, newBoardId: number, newStartCol: number, newStartRow: number) => void;
  isSelected: boolean;
  onSelect: (id: number) => void;
  boards: Board[];
  isPreview?: boolean;
};

const ICComponent: React.FC<ICProps> = ({ 
  x, y, pins, width, id, boardId, startCol, startRow, onDragEnd, isSelected, onSelect, boards, isPreview = false
}) => {
  const pinSpacing = GRID_SIZE;
  const halfPins = pins / 2;
  // Calculate actual body width based on pin spacing
  const actualWidth = (halfPins - 1) * pinSpacing + PIN_SIZE;
  const actualHeight = IC_HEIGHT + width;

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [localPos, setLocalPos] = useState({ x, y });

  // Update local position when props change
  useEffect(() => {
    if (!dragging) {
      setLocalPos({ x, y });
    }
  }, [x, y, dragging]);

  const snapToGrid = (x: number, y: number) => {
    // Find the board under the cursor
    let targetBoard = boards[0];
    let minDistance = Infinity;

    for (const board of boards) {
      // Calculate the center divide position for this board
      const centerDivideY = board.y + GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE;
      const boardCenterX = board.x + (COLS + 2) * GRID_SIZE / 2;
      
      // Calculate distances to board center and center divide
      const horizontalDistance = Math.abs(x - boardCenterX);
      const verticalDistance = Math.abs(y - centerDivideY);
      
      // Use a weighted distance calculation that considers both horizontal and vertical distances
      // but gives more weight to vertical distance to maintain the center divide alignment
      const distance = Math.sqrt(
        Math.pow(horizontalDistance, 2) + 
        Math.pow(verticalDistance * 2, 2) // Double the weight of vertical distance
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        targetBoard = board;
      }
    }

    // Calculate relative position on the board
    const relativeX = x - targetBoard.x - GRID_SIZE/2;
    const relativeY = y - targetBoard.y;

    // Snap to grid
    const snappedX = Math.round((relativeX - 1.5 * GRID_SIZE) / GRID_SIZE) * GRID_SIZE + 1.5 * GRID_SIZE;

    // Calculate column
    const col = Math.round((snappedX - 1.5 * GRID_SIZE) / GRID_SIZE);

    // Ensure IC stays within board bounds
    const maxCol = COLS-Math.floor(halfPins/2)-1;
    const clampedCol = Math.max(Math.floor(halfPins/2 - 0.5), Math.min(col, maxCol));
    let final_x = targetBoard.x + 1.5 * GRID_SIZE + clampedCol * GRID_SIZE + (halfPins % 2 == 0 ? GRID_SIZE/2 : 0);


    // Calculate the center divide position
    const centerDivideY = GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 1) * GRID_SIZE;
    
    
    // Calculate the base row (center divide)
    const baseRow = ROWS/2 - 1;
    
    // Calculate the vertical offset from the center divide
    const verticalOffset = Math.round((relativeY - centerDivideY)/GRID_SIZE);
    
    // Clamp vertical offset between -width and width
    let vertical_space = width/GRID_SIZE;
    const clampedVerticalOffset = Math.min(0, Math.max(-vertical_space, verticalOffset));

    const snappedY = targetBoard.y + centerDivideY + GRID_SIZE*clampedVerticalOffset;

    return {
      x: final_x,
      y: snappedY,
      boardId: targetBoard.id,
      startCol: clampedCol,
      startRow: baseRow + verticalOffset
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (isPreview) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent background click
    onSelect(id);
    setDragging(true);
    const svg = document.querySelector('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setOffset({ 
      x: e.clientX - rect.left - x, 
      y: e.clientY - rect.top - y 
    });
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    e.preventDefault();
    const svg = document.querySelector('svg');
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const rawX = e.clientX - rect.left - offset.x;
    const rawY = e.clientY - rect.top - offset.y;
    const snapped = snapToGrid(rawX, rawY);
    setLocalPos({ x: snapped.x, y: snapped.y });
  };

  const onMouseUp = (e: MouseEvent) => {
    if (!dragging) return;
    e.preventDefault();
    setDragging(false);
    const svg = document.querySelector('svg');
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const rawX = e.clientX - rect.left - offset.x;
    const rawY = e.clientY - rect.top - offset.y;
    const snapped = snapToGrid(rawX, rawY);
    onDragEnd(id, snapped.x, snapped.y, snapped.boardId, snapped.startCol, snapped.startRow);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging]);

  // Calculate pin positions to align with breadboard holes
  const getPinPositions = (count: number) => {
    const positions = [];
    const startOffset = -(count - 1) * (pinSpacing / 2);
    for (let i = 0; i < count; i++) {
      positions.push(startOffset + i * pinSpacing);
    }
    return positions;
  };

  const topPinPositions = getPinPositions(halfPins);
  const bottomPinPositions = getPinPositions(halfPins);

  return (
    <g
      transform={`translate(${localPos.x}, ${localPos.y})`}
      onMouseDown={onMouseDown}
      style={{ cursor: isPreview ? 'crosshair' : 'move' }}
    >
      {/* IC body */}
      <rect 
        width={actualWidth} 
        height={actualHeight} 
        fill={isPreview ? "rgba(0, 0, 0, 0.5)" : "black"} 
        rx={4} 
        x={-actualWidth/2}
        stroke={isSelected ? "#00ff00" : (isPreview ? "#666" : "none")}
        strokeWidth={2}
      />

      {/* Orientation indicator (notch) */}
      <path
        d={`M${-actualWidth/2},${actualHeight/2 - 0.2*GRID_SIZE} L${-actualWidth/2},${actualHeight/2 + 0.2*GRID_SIZE} L${-actualWidth/2 + 0.3*GRID_SIZE},${actualHeight/2} Z`}
        fill={isPreview ? "#999" : "#666"}
      />

      {/* Top pins */}
      {topPinPositions.map((x, i) => (
        <g key={`T${id}-${i}`}>
          <rect 
            x={x - PIN_SIZE/2} 
            y={-PIN_SIZE} 
            width={PIN_SIZE} 
            height={PIN_SIZE} 
            fill={isPreview ? "#999" : "#666"}
            stroke="#999"
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Bottom pins */}
      {bottomPinPositions.map((x, i) => (
        <g key={`B${id}-${i}`}>
          <rect 
            x={x - PIN_SIZE/2} 
            y={actualHeight} 
            width={PIN_SIZE} 
            height={PIN_SIZE} 
            fill={isPreview ? "#999" : "#666"}
            stroke="#999"
            strokeWidth={1}
          />
        </g>
      ))}
    </g>
  );
};

export default ICComponent;
