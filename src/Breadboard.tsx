// Breadboard.tsx with hover and selection highlighting
import React from 'react';
import { GRID_SIZE, CENTER_DIVIDE_HEIGHT, HOLE_SIZE, ROWS, COLS } from './config';
import type { Hole } from './types';

export type ICObstacle = { topRow: number; leftCol: number; rightCol: number; rows: number };

type Props = {
  onHoleClick: (hole: Hole) => void;
  onHoleHover: (hole: Hole) => void;
  selectedHoles: Hole[];
  startHole?: Hole | null;
  hoverHole?: Hole | null;
  isRouting?: boolean;
  boardId: number;
  x: number;
  y: number;
};

const Breadboard: React.FC<Props> = ({
  onHoleClick,
  onHoleHover,
  selectedHoles,
  startHole,
  hoverHole,
  isRouting = false,
  boardId,
  x,
  y,
}) => {
  // Calculate total dimensions including power rails
  const totalWidth = (COLS + 2) * GRID_SIZE;
  const totalHeight = (ROWS + 6) * GRID_SIZE + 2 * GRID_SIZE;

  // Helper function to convert grid coordinates to pixel coordinates
  const gridToPixel = (row: number, col: number) => {
    const pixelX = 1.5 * GRID_SIZE + col * GRID_SIZE;
    let pixelY = 0;

    if (row < 0) {
      // Top power rail section
      pixelY += GRID_SIZE + (row + 3) * GRID_SIZE;
    } else if (row < ROWS/2) {
      // Top section
      pixelY += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (row + 2) * GRID_SIZE;
    } else {
      // Bottom section (account for center divide)
      pixelY += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE + CENTER_DIVIDE_HEIGHT + (row - ROWS/2) * GRID_SIZE;
    }

    return { x: pixelX, y: pixelY };
  };

  // Helper function to render a row of holes
  const renderHoleRow = (row: number, startCol: number, endCol: number) => {
    const holes = [];
    for (let col = startCol; col < endCol; col++) {
      const { x: holeX, y: holeY } = gridToPixel(row, col);
      const isSelected = selectedHoles.some(h => h.row === row && h.col === col && h.boardId === boardId);
      const isStart = startHole?.row === row && startHole?.col === col && startHole?.boardId === boardId;
      const isHover = hoverHole?.row === row && hoverHole?.col === col && hoverHole?.boardId === boardId;

      let fill = 'black';
      if (isSelected) fill = 'orange';
      if (isStart) fill = 'lime';
      if (isHover) fill = '#ffff00'; // Yellow for hovered hole

      holes.push(
        <g key={`${row}-${col}`}>
          <rect
            x={holeX - HOLE_SIZE/2}
            y={holeY - HOLE_SIZE/2}
            width={HOLE_SIZE}
            height={HOLE_SIZE}
            fill="#666"
            stroke="#999"
            strokeWidth={2}
          />
          <rect
            x={holeX - HOLE_SIZE/3}
            y={holeY - HOLE_SIZE/3}
            width={HOLE_SIZE * 2/3}
            height={HOLE_SIZE * 2/3}
            fill={fill}
            onClick={() => onHoleClick({ row, col, boardId })}
            onMouseEnter={() => onHoleHover({ row, col, boardId })}
            style={{ cursor: isRouting ? 'crosshair' : 'pointer' }}
          />
        </g>
      );
    }
    return holes;
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={totalWidth}
        height={totalHeight}
        fill="#f0f0f0"
        stroke="#999"
        strokeWidth={0.1*GRID_SIZE}
      />

      {/* Power Rail Lines */}

      {/* Top Power Rail + */}
      <line
        x1={1.5 * GRID_SIZE}
        y1={GRID_SIZE - 0.5*GRID_SIZE}
        x2={totalWidth - 1.5 * GRID_SIZE}
        y2={GRID_SIZE - 0.5*GRID_SIZE}
        stroke="red"
        strokeWidth={2}
      />
      <line
        x1={1.5 * GRID_SIZE}
        y1={GRID_SIZE + GRID_SIZE + 0.5*GRID_SIZE}
        x2={totalWidth - 1.5 * GRID_SIZE}
        y2={GRID_SIZE + GRID_SIZE + 0.5*GRID_SIZE}
        stroke="blue"
        strokeWidth={2}
      />
      {/* top power rail - */}

      {/* Bottom Power Rail + */}
      <line
        x1={1.5 * GRID_SIZE}
        y1={totalHeight - 2 * GRID_SIZE - 0.5*GRID_SIZE}
        x2={totalWidth - 1.5 * GRID_SIZE}
        y2={totalHeight - 2 * GRID_SIZE - 0.5*GRID_SIZE}
        stroke="red"
        strokeWidth={2}
      />
      {/* Bottom Power Rail - */}
      <line
        x1={1.5 * GRID_SIZE}
        y1={totalHeight - GRID_SIZE + 0.5*GRID_SIZE}
        x2={totalWidth - 1.5 * GRID_SIZE}
        y2={totalHeight - GRID_SIZE + 0.5*GRID_SIZE}
        stroke="blue"
        strokeWidth={2}
      />

      {/* Power Rail Holes */}
      {renderHoleRow(-3, 0, COLS)} Top power rail
      {renderHoleRow(-2, 0, COLS)} {/* Top power rail */}
      {renderHoleRow(ROWS+1, 0, COLS)} {/* Bottom power rail */}
      {renderHoleRow(ROWS+2, 0, COLS)}

      {/* Main Breadboard Holes */}
      {Array.from({ length: ROWS }).map((_, row) => renderHoleRow(row, 0, COLS))}

      {/* Column Numbers */}
      {Array.from({ length: COLS }).map((_, col) => (
        <text
          key={`col-${col}`}
          x={1.5 * GRID_SIZE + col * GRID_SIZE}
          y={GRID_SIZE + CENTER_DIVIDE_HEIGHT + 2*GRID_SIZE - 6}
          fontSize={10}
          fill="#666"
          textAnchor="middle"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
        >
          {col + 1}
        </text>
      ))}
    </g>
  );
};

export default Breadboard;
