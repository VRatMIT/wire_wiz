import React from 'react';
import { GRID_SIZE, CENTER_DIVIDE_HEIGHT, POWER_RAIL_HEIGHT, ROWS, COLS, HOLE_SIZE, WIRE_WEIGHT } from './config';
import type { WirePathProps, Point, Hole, IC } from './types';
import { findPath } from './pathfinding';

interface ExtendedWirePathProps extends WirePathProps {
  color?: string;
  isPreview?: boolean;
  customPath?: Point[];
  isSelected?: boolean;
  onClick?: () => void;
  ics?: IC[];
}

export default function WirePath({ 
  start, 
  end, 
  boards, 
  color = 'black', 
  isPreview = false,
  customPath,
  isSelected = false,
  onClick,
  ics = []
}: ExtendedWirePathProps) {
  // Helper function to convert grid coordinates to pixel coordinates
  const gridToPixel = (point: Point) => {
    const board = boards.find(b => b.id === point.boardId);
    if (!board) return null;

    const x = board.x + 1.5 * GRID_SIZE + point.x * GRID_SIZE;
    let y = board.y;

    if (point.y < 0) {
      // Top power rail section
      y += GRID_SIZE + (point.y + 3) * GRID_SIZE;
    } else if (point.y < ROWS/2) {
      // Top section
      y += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (point.y + 2) * GRID_SIZE;
    } else {
      // Bottom section (account for center divide)
      y += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE + CENTER_DIVIDE_HEIGHT + (point.y - ROWS/2) * GRID_SIZE;
    }

    return { x, y };
  };

  // Find the path using A* algorithm or use custom path
  const path = customPath ? customPath : findPath(start, end, boards, ics);

  // Convert path points to pixel coordinates
  const pathPoints = path.map(point => gridToPixel(point)).filter((point): point is { x: number; y: number } => point !== null);

  // Create SVG path string with rounded corners
  const pathString = pathPoints.length > 0 
    ? `M ${pathPoints[0].x} ${pathPoints[0].y} ${pathPoints.map((point, i) => {
        if (i === 0) return '';
        const prev = pathPoints[i - 1];
        // Add rounded corner if direction changes
        if (i < pathPoints.length - 1) {
          const next = pathPoints[i + 1];
          const dx1 = point.x - prev.x;
          const dy1 = point.y - prev.y;
          const dx2 = next.x - point.x;
          const dy2 = next.y - point.y;
          // If direction changes, add rounded corner
          if (dx1 !== dx2 || dy1 !== dy2) {
            const radius = WIRE_WEIGHT / 2;
            return `L ${point.x - dx1 * radius/Math.sqrt(dx1*dx1 + dy1*dy1)} ${point.y - dy1 * radius/Math.sqrt(dx1*dx1 + dy1*dy1)} 
                    Q ${point.x} ${point.y} 
                    ${point.x + dx2 * radius/Math.sqrt(dx2*dx2 + dy2*dy2)} ${point.y + dy2 * radius/Math.sqrt(dx2*dx2 + dy2*dy2)}`;
          }
        }
        return `L ${point.x} ${point.y}`;
      }).join(' ')}`
    : '';

  // Get connection points
  const startPoint = gridToPixel({ x: start.col, y: start.row, boardId: start.boardId });
  const endPoint = gridToPixel({ x: end.col, y: end.row, boardId: end.boardId });

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <path
        d={pathString}
        stroke={color}
        strokeWidth={WIRE_WEIGHT}
        fill="none"
        strokeDasharray={isPreview ? "5,5" : undefined}
        opacity={isPreview ? 0.5 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {isSelected && (
        <path
          d={pathString}
          stroke="#00ff00"
          strokeWidth={WIRE_WEIGHT + 4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />
      )}
      {!isPreview && startPoint && (
        <rect
          x={startPoint.x - WIRE_WEIGHT/2}
          y={startPoint.y - WIRE_WEIGHT/2}
          width={WIRE_WEIGHT}
          height={WIRE_WEIGHT}
          fill={isSelected ? "#00ff00" : "#C0C0C0"}
          stroke={isSelected ? "#00ff00" : "#C0C0C0"}
          strokeWidth={2}
          rx={2}
          ry={2}
        />
      )}
      {!isPreview && endPoint && (
        <rect
          x={endPoint.x - WIRE_WEIGHT/2}
          y={endPoint.y - WIRE_WEIGHT/2}
          width={WIRE_WEIGHT}
          height={WIRE_WEIGHT}
          fill={isSelected ? "#00ff00" : "#C0C0C0"}
          stroke={isSelected ? "#00ff00" : "#C0C0C0"}
          strokeWidth={2}
          rx={2}
          ry={2}
        />
      )}
    </g>
  );
}