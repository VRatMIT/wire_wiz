import React, { useEffect, useState } from 'react';
import { GRID_SIZE, CENTER_DIVIDE_HEIGHT, ROWS, WIRE_WEIGHT, WIRE_OFFSET } from './config';
import type { WirePathProps, Point, IC } from './types';
import { findPath } from './pathfinding';

interface ExtendedWirePathProps extends WirePathProps {
  color?: string;
  isPreview?: boolean;
  customPath?: Point[];
  isSelected?: boolean;
  onClick?: () => void;
  ics?: IC[];
  wireId?: number;
  is_shifted?: boolean;
}

// Track wire positions globally
const wirePositions = new Map<number, { path: Point[], offset: number }>();

// Reset all wire positions
export const resetAllWirePositions = () => {
  wirePositions.clear();
};

export default function WirePath({ 
  start, 
  end, 
  boards, 
  color = 'black', 
  isPreview = false,
  customPath,
  isSelected = false,
  onClick,
  ics = [],
  wireId,
  is_shifted = false
}: ExtendedWirePathProps) {
  const [offsetPoints, setOffsetPoints] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Reset offset points when boards change
    setOffsetPoints(new Map());
  }, [boards]);

  useEffect(() => {
    if (wireId !== undefined && !isPreview) {
      const path = customPath || findPath(start, end, boards, ics);
      
      // Find overlapping points and their counts, separated by orientation
      const horizontalCounts = new Map<string, number>();
      const verticalCounts = new Map<string, number>();
      
      for (const [id, data] of wirePositions.entries()) {
        if (id === wireId) continue;
        
        data.path.forEach((point, i) => {
          const pointKey = `${point.x},${point.y},${point.boardId}`;
          
          // Consider endpoints and corners as both horizontal and vertical
          if (i === 0 || i === data.path.length - 1) {
            horizontalCounts.set(pointKey, (horizontalCounts.get(pointKey) || 0) + 1);
            verticalCounts.set(pointKey, (verticalCounts.get(pointKey) || 0) + 1);
          } else {
            const prev = data.path[i - 1];
            const next = data.path[i + 1];
            const isCorner = (point.y === prev.y && point.x === next.x) || 
                           (point.x === prev.x && point.y === next.y);
            
            if (isCorner) {
              horizontalCounts.set(pointKey, (horizontalCounts.get(pointKey) || 0) + 1);
              verticalCounts.set(pointKey, (verticalCounts.get(pointKey) || 0) + 1);
            } else {
              const isHorizontal = point.y === prev.y;
              if (isHorizontal) {
                horizontalCounts.set(pointKey, (horizontalCounts.get(pointKey) || 0) + 1);
              } else {
                verticalCounts.set(pointKey, (verticalCounts.get(pointKey) || 0) + 1);
              }
            }
          }
        });
      }
      
      // Store the counts for each point in this wire's path
      const newOffsetPoints = new Map<string, number>();
      path.forEach((point, i) => {
        const pointKey = `${point.x},${point.y},${point.boardId}`;
        
        // Consider endpoints and corners as both horizontal and vertical
        if (i === 0 || i === path.length - 1) {
          const hCount = horizontalCounts.get(pointKey) || 0;
          const vCount = verticalCounts.get(pointKey) || 0;
          const count = Math.max(hCount, vCount);
          if (count > 0) {
            newOffsetPoints.set(pointKey, count);
          }
        } else {
          const prev = path[i - 1];
          const next = path[i + 1];
          const isCorner = (point.y === prev.y && point.x === next.x) || 
                         (point.x === prev.x && point.y === next.y);
          
          if (isCorner) {
            const hCount = horizontalCounts.get(pointKey) || 0;
            const vCount = verticalCounts.get(pointKey) || 0;
            const count = Math.max(hCount, vCount);
            if (count > 0) {
              newOffsetPoints.set(pointKey, count);
            }
          } else {
            const isHorizontal = point.y === prev.y;
            const count = isHorizontal 
              ? horizontalCounts.get(pointKey) || 0
              : verticalCounts.get(pointKey) || 0;
            if (count > 0) {
              newOffsetPoints.set(pointKey, count);
            }
          }
        }
      });
      
      setOffsetPoints(newOffsetPoints);
      wirePositions.set(wireId, { path, offset: Math.max(...Array.from(newOffsetPoints.values()), 0) });
    }
  }, [wireId, start, end, boards, ics, customPath, isPreview]);

  // Helper function to convert grid coordinates to pixel coordinates
  const gridToPixel = (point: Point) => {
    const board = boards.find(b => b.id === point.boardId);
    if (!board) return null;

    let x = board.x + 1.5 * GRID_SIZE + point.x * GRID_SIZE;
    let y = board.y;

    if (point.y < 0) {
      y += GRID_SIZE + (point.y + 3) * GRID_SIZE;
    } else if (point.y < ROWS/2) {
      y += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (point.y + 2) * GRID_SIZE;
    } else {
      y += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE + CENTER_DIVIDE_HEIGHT + (point.y - ROWS/2) * GRID_SIZE;
    }

    // Apply offset only at overlapping points
    const pointKey = `${point.x},${point.y},${point.boardId}`;
    if (offsetPoints.has(pointKey)) {
      const path = customPath || findPath(start, end, boards, ics);
      const pointIndex = path.findIndex(p => p.x === point.x && p.y === point.y && p.boardId === point.boardId);
      const isHorizontal = pointIndex > 0 && path[pointIndex].y === path[pointIndex - 1].y;
      const offset = offsetPoints.get(pointKey) || 0;
      
      if (isHorizontal) {
        y +=  (is_shifted ? offset : -offset) * WIRE_OFFSET;
      } else {
        x += (is_shifted ? -offset : offset) * WIRE_OFFSET;
      }
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
        const next = pathPoints[i + 1];
        
        // If this is a corner point
        if (next && ((point.x === prev.x && point.y === next.y) || (point.y === prev.y && point.x === next.x))) {
          // Calculate the offset for the corner
          const pointKey = `${path[i].x},${path[i].y},${path[i].boardId}`;
          const offset = offsetPoints.get(pointKey) || 0;
          
          // For corner points, extend to the right to account for vertical offset
          if (offset > 0) {
            if (point.x === prev.x) {
              // Vertical to horizontal corner
              return `L ${point.x} ${point.y - (is_shifted ? -offset : offset) * WIRE_OFFSET} L ${point.x + (is_shifted ? -offset : offset) * WIRE_OFFSET} ${point.y}`;
            } else {
              // Horizontal to vertical corner
              return `L ${point.x - (is_shifted ? -offset : offset) * WIRE_OFFSET} ${point.y} L ${point.x + (is_shifted ? -offset : offset) * WIRE_OFFSET} ${point.y}`;
            }
          }
        }
        
        // For non-corner points, just draw a straight line
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
        stroke={color === '#000000' ? 'white' : 'black'}
        strokeWidth={WIRE_WEIGHT + 2}
        fill="none"
        strokeDasharray={isPreview ? "5,5" : undefined}
        opacity={isPreview ? 0.5 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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