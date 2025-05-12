// App.tsx with IC drag updates and dynamic wire re-routing

import React, { useState, useEffect, useRef } from 'react';
import Breadboard from './Breadboard';
import type { Hole, Board, Point, IC, WirePathProps, Wire } from './types';
import ICComponent from './ICComponent';
import WirePath, { cleanupWirePosition, resetAllWirePositions } from './WirePath';
import ICSelectionMenu from './ICSelectionMenu';
import KeyboardShortcutsMenu from './KeyboardShortcutsMenu';
import { GRID_SIZE, CENTER_DIVIDE_HEIGHT, POWER_RAIL_HEIGHT, ROWS, COLS, IC_HEIGHT, MIN_IC_WIDTH, IC_SIZES, WIRE_COLORS, PIN_SIZE, TOP_MENU } from './config';
import { findPath } from './pathfinding';
import ThemeToggle from './ThemeToggle';

interface ExtendedWirePathProps extends WirePathProps {
  isSelected?: boolean;
  onClick?: () => void;
}

function App() {
  const [boards, setBoards] = useState<Board[]>([{ id: 0, x: 0, y: 0 }]);
  const [ics, setICs] = useState<Array<IC>>([]);
  const [wires, setWires] = useState<Array<Wire>>([]);
  const [selectedHoles, setSelectedHoles] = useState<Hole[]>([]);
  const [startHole, setStartHole] = useState<Hole | null>(null);
  const [hoverHole, setHoverHole] = useState<Hole | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [selectedIC, setSelectedIC] = useState<number | null>(null);
  const [selectedWires, setSelectedWires] = useState<number[]>([]);
  const [isPlacingBoard, setIsPlacingBoard] = useState(false);
  const [previewBoard, setPreviewBoard] = useState<{ x: number; y: number } | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<number | null>(null);
  const [isWireMode, setIsWireMode] = useState(false);
  const [currentWireColor, setCurrentWireColor] = useState(0);
  const [pinnedPath, setPinnedPath] = useState<Point[]>([]);
  const [pinnedEnd, setPinnedEnd] = useState<Hole | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [placingIC, setPlacingIC] = useState<{ pins: number; width: number } | null>(null);
  const [previewIC, setPreviewIC] = useState<{
    x: number;
    y: number;
    boardId: number;
    startCol: number;
    startRow: number;
  } | null>(null);
  const [selectedICs, setSelectedICs] = useState<number[]>([]);
  const [showICMenu, setShowICMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [currentMousePosition, setCurrentMousePosition] = useState({ x: 0, y: 0 });
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Calculate board dimensions
  const boardWidth = (COLS + 2) * GRID_SIZE;
  const boardHeight = (ROWS + 6) * GRID_SIZE + 2 * GRID_SIZE;

  // Add mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCurrentMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        // Store current mouse position and show menu
        setMenuPosition(currentMousePosition);
        setShowICMenu(true);
      } else if (e.key === 'b' || e.key === 'B') {
        // Start board placement
        startBoardPlacement();
      } else if (e.key === 'w' || e.key === 'W') {
        if (isWireMode) {
          // Exit wire mode and place wire
          if (startHole && hoverHole && 
              (startHole.row !== hoverHole.row || startHole.col !== hoverHole.col || startHole.boardId !== hoverHole.boardId)) {
            // Create the final wire with all segments
            let finalPath: Point[] = [];
            
            // If we have pinned segments, we need to include all pinned segments
            if (pinnedPath.length > 0 && pinnedEnd) {
              // Add all pinned segments
              finalPath = [...pinnedPath];
              
              // Add the final segment from the last pin to the hover hole
              const lastSegment = findPath(pinnedEnd, hoverHole, boards, ics);
              // Remove the first point of lastSegment if it's a duplicate
              if (lastSegment.length > 0) {
                const lastPinnedPoint = finalPath[finalPath.length - 1];
                const firstLastPoint = lastSegment[0];
                if (lastPinnedPoint.x === firstLastPoint.x && 
                    lastPinnedPoint.y === firstLastPoint.y && 
                    lastPinnedPoint.boardId === firstLastPoint.boardId) {
                  finalPath.push(...lastSegment.slice(1));
                } else {
                  finalPath.push(...lastSegment);
                }
              }
            } else {
              // If no pins, just get the direct path
              finalPath = findPath(startHole, hoverHole, boards, ics);
            }
            
            // Create the wire with the complete path
            const newWire: Wire = { 
              id: Math.max(...wires.map(wire => wire.id), -1) + 1,
              start: startHole,
              end: hoverHole,
              color: WIRE_COLORS[currentWireColor].value,
              path: finalPath,
              shift_completed: isShiftPressed
            };
            
            setWires([...wires, newWire]);
          }
          setStartHole(null);
          setIsWireMode(false);
          setIsRouting(false);
          setPinnedPath([]);
          setPinnedEnd(null);
        } else if (hoverHole) {
          // Enter wire mode with start point at current hover hole
          setStartHole(hoverHole);
          setIsWireMode(true);
          setIsRouting(true);
          // Clear any existing pinned path when starting a new wire
          setPinnedPath([]);
          setPinnedEnd(null);
          // Deselect everything when entering wire mode
          setSelectedWires([]);
          setSelectedIC(null);
          setSelectedICs([]);
          setSelectedBoard(null);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (isWireMode && startHole && hoverHole) {
          // Pin the current path and continue from the end point
          const currentPath = findPath(pinnedEnd || startHole, hoverHole, boards, ics);
          // Add the current path to the pinned path, removing the first point if it's a duplicate
          if (pinnedPath.length > 0 && currentPath.length > 0) {
            const lastPinnedPoint = pinnedPath[pinnedPath.length - 1];
            const firstCurrentPoint = currentPath[0];
            if (lastPinnedPoint.x === firstCurrentPoint.x && 
                lastPinnedPoint.y === firstCurrentPoint.y && 
                lastPinnedPoint.boardId === firstCurrentPoint.boardId) {
              setPinnedPath([...pinnedPath, ...currentPath.slice(1)]);
            } else {
              setPinnedPath([...pinnedPath, ...currentPath]);
            }
          } else {
            setPinnedPath([...pinnedPath, ...currentPath]);
          }
          setPinnedEnd(hoverHole);
          setStartHole(startHole); // Keep the original start hole
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (selectedWires.length > 0) {
          // Check if all selected wires have the same color
          const selectedWireObjects = wires.filter(wire => selectedWires.includes(wire.id));
          const allSameColor = selectedWireObjects.every(wire => wire.color === selectedWireObjects[0].color);
          
          if (allSameColor) {
            // If all wires have the same color, cycle through colors
            const newColorIndex = (currentWireColor + 1) % WIRE_COLORS.length;
            setCurrentWireColor(newColorIndex);
            setWires(wires.map(wire => 
              selectedWires.includes(wire.id)
                ? { ...wire, color: WIRE_COLORS[newColorIndex].value }
                : wire
            ));
          } else {
            // If wires have different colors, assign a random color
            const randomColorIndex = Math.floor(Math.random() * WIRE_COLORS.length);
            setCurrentWireColor(randomColorIndex);
            setWires(wires.map(wire => 
              selectedWires.includes(wire.id)
                ? { ...wire, color: WIRE_COLORS[randomColorIndex].value }
                : wire
            ));
          }
        } else if (isWireMode) {
          // If in wire mode, just cycle through colors for the preview
          const newColorIndex = (currentWireColor + 1) % WIRE_COLORS.length;
          setCurrentWireColor(newColorIndex);
        }
        // Deselect ICs when 'c' is pressed
        setSelectedICs([]);
        setSelectedIC(null);
      } else if (e.key === 'Escape') {
        setShowICMenu(false);
        if (isWireMode) {
          setStartHole(null);
          setIsWireMode(false);
          setIsRouting(false);
          setPinnedPath([]);
          setPinnedEnd(null);
        }
        if (isPlacingBoard) {
          setIsPlacingBoard(false);
          setPreviewBoard(null);
        }
        setSelectedWires([]);
      } else if (e.key === 'Backspace') {
        // Delete all selected ICs and wires at once
        if (selectedICs.length > 0 || selectedWires.length > 0) {
          // Reset all wire positions when deleting
          resetAllWirePositions();
          setICs(ics.filter(ic => !selectedICs.includes(ic.id)));
          setWires(wires.filter(wire => !selectedWires.includes(wire.id)));
          setSelectedICs([]);
          setSelectedIC(null);
        }
      } else if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIC, selectedICs, ics, isPlacingBoard, selectedBoard, boards, wires, isWireMode, startHole, hoverHole, currentWireColor, pinnedPath, pinnedEnd, selectedWires, showICMenu, currentMousePosition, isShiftPressed]);

  const startBoardPlacement = () => {
    setIsPlacingBoard(true);
    setPreviewBoard(null);
    setSelectedBoard(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start selection if we're not in wire mode or placing a board
    if (!isWireMode && !isPlacingBoard && !placingIC) {
      const svg = e.currentTarget as SVGElement;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsDragging(true);
      setSelectionBox({ start: { x, y }, end: { x, y } });
      // Prevent other click handlers from firing
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPlacingBoard) {
      const svg = e.currentTarget as SVGElement;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Snap to board-sized grid
      const snappedX = Math.round(x / boardWidth) * boardWidth;
      const snappedY = Math.round(y / boardHeight) * boardHeight;

      setPreviewBoard({ x: snappedX, y: snappedY });
    } else if (placingIC) {
      const svg = e.currentTarget as SVGElement;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find the nearest valid position on the center divide
      let nearestBoard = boards[0];
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
          nearestBoard = board;
        }
      }

      // Calculate relative position on the board
      const relativeX = x - nearestBoard.x - GRID_SIZE/2;
      const halfPins = placingIC.pins / 2;

      // Snap to grid
      let snappedX = Math.round((relativeX - 1.5 * GRID_SIZE) / GRID_SIZE) * GRID_SIZE + 1.5 * GRID_SIZE;
      const col = Math.round((snappedX - 1.5 * GRID_SIZE) / GRID_SIZE);

      // Ensure IC stays within board bounds
      const maxCol = COLS - Math.floor(halfPins/2) - 1;
      let clampedCol = Math.max(Math.floor(halfPins/2 - 0.5), Math.min(col, maxCol));

      // If the IC would be placed outside the current board's bounds, try to find a better board
      if (clampedCol < 0 || clampedCol > maxCol) {
        // Try to find a board that would better contain the IC
        for (const board of boards) {
          const boardCenterX = board.x + (COLS + 2) * GRID_SIZE / 2;
          const horizontalDistance = Math.abs(x - boardCenterX);
          
          // If this board is closer horizontally and the IC would fit within its bounds
          if (horizontalDistance < minDistance) {
            const relativeX = x - board.x - GRID_SIZE/2;
            const snappedX = Math.round((relativeX - 1.5 * GRID_SIZE) / GRID_SIZE) * GRID_SIZE + 1.5 * GRID_SIZE;
            const col = Math.round((snappedX - 1.5 * GRID_SIZE) / GRID_SIZE);
            const newClampedCol = Math.max(Math.floor(halfPins/2 - 0.5), Math.min(col, maxCol));
            
            // If the IC would fit better on this board
            if (newClampedCol >= 0 && newClampedCol <= maxCol) {
              nearestBoard = board;
              clampedCol = newClampedCol;
              break;
            }
          }
        }
      }

      // Update the preview IC position
      setPreviewIC({
        x: nearestBoard.x + 1.5 * GRID_SIZE + clampedCol * GRID_SIZE + ((placingIC.pins / 2) % 2 === 0 ? GRID_SIZE/2 : 0),
        y: nearestBoard.y + GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE - IC_HEIGHT/2,
        boardId: nearestBoard.id,
        startCol: clampedCol,
        startRow: ROWS/2 - 1
      });
    } else if (isDragging && selectionBox) {
      const svg = e.currentTarget as SVGElement;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionBox({ ...selectionBox, end: { x, y } });
      // Prevent other mouse move handlers from firing
      e.stopPropagation();
    } else {
      const svg = e.currentTarget as SVGElement;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find the nearest hole
      let nearestHole: Hole | null = null;
      let minDistance = Infinity;

      boards.forEach(board => {
        const relativeX = x - board.x;
        const relativeY = y - board.y;

        if (relativeX >= 0 && relativeX <= (COLS + 2) * GRID_SIZE &&
            relativeY >= 0 && relativeY <= (ROWS + 6) * GRID_SIZE + 2 * GRID_SIZE) {
          
          const col = Math.round((relativeX - 1.5 * GRID_SIZE) / GRID_SIZE);
          let row: number;

          if (relativeY < GRID_SIZE + CENTER_DIVIDE_HEIGHT) {
            row = Math.round((relativeY - GRID_SIZE) / GRID_SIZE) - 3;
          } else if (relativeY < GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE) {
            row = Math.round((relativeY - GRID_SIZE - CENTER_DIVIDE_HEIGHT) / GRID_SIZE) - 2;
          } else {
            row = Math.round((relativeY - GRID_SIZE - CENTER_DIVIDE_HEIGHT - (ROWS/2 + 2) * GRID_SIZE - CENTER_DIVIDE_HEIGHT) / GRID_SIZE) + ROWS/2;
          }

          if (col >= 0 && col < COLS && row >= -3 && row < ROWS + 3) {
            const hole: Hole = { boardId: board.id, row, col };
            const holeX = board.x + 1.5 * GRID_SIZE + col * GRID_SIZE;
            const holeY = board.y + (row < 0 ? 
              GRID_SIZE + (row + 3) * GRID_SIZE :
              row < ROWS/2 ?
                GRID_SIZE + CENTER_DIVIDE_HEIGHT + (row + 2) * GRID_SIZE :
                GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE + CENTER_DIVIDE_HEIGHT + (row - ROWS/2) * GRID_SIZE
            );

            const distance = Math.sqrt(Math.pow(x - holeX, 2) + Math.pow(y - holeY, 2));
            if (distance < minDistance) {
              minDistance = distance;
              nearestHole = hole;
            }
          }
        }
      });

      if (nearestHole) {
        setHoverHole(nearestHole);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && selectionBox) {
      const svg = e.currentTarget as SVGElement;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const finalBox = { ...selectionBox, end: { x, y } };
      
      // Check if it's a right-click drag (contained selection)
      const isRightClick = e.button === 2;
      
      // Find wires that intersect or are contained in the selection box
      const newSelectedWires = wires.filter(wire => {
        if (!wire.path) return false;
        
        const points = wire.path.map(point => {
          const board = boards.find(b => b.id === point.boardId);
          if (!board) return null;
          
          const x = board.x + 1.5 * GRID_SIZE + point.x * GRID_SIZE;
          let y = board.y;
          
          if (point.y < 0) {
            y += GRID_SIZE + (point.y + 3) * GRID_SIZE;
          } else if (point.y < ROWS/2) {
            y += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (point.y + 2) * GRID_SIZE;
          } else {
            y += GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE + CENTER_DIVIDE_HEIGHT + (point.y - ROWS/2) * GRID_SIZE;
          }
          
          return { x, y };
        }).filter((point): point is { x: number; y: number } => point !== null);
        
        if (isRightClick) {
          // For right-click, check if all points are contained
          return points.every(point => 
            point.x >= Math.min(finalBox.start.x, finalBox.end.x) &&
            point.x <= Math.max(finalBox.start.x, finalBox.end.x) &&
            point.y >= Math.min(finalBox.start.y, finalBox.end.y) &&
            point.y <= Math.max(finalBox.start.y, finalBox.end.y)
          );
        } else {
          // For left-click, check if any point is contained
          return points.some(point => 
            point.x >= Math.min(finalBox.start.x, finalBox.end.x) &&
            point.x <= Math.max(finalBox.start.x, finalBox.end.x) &&
            point.y >= Math.min(finalBox.start.y, finalBox.end.y) &&
            point.y <= Math.max(finalBox.start.y, finalBox.end.y)
          );
        }
      }).map(wire => wire.id);

      // Find ICs that intersect or are contained in the selection box
      const newSelectedICs = ics.filter(ic => {
        const icX = ic.x;
        const icY = ic.y;
        const icWidth = (ic.pins / 2 - 1) * GRID_SIZE + PIN_SIZE;
        const icHeight = IC_HEIGHT;

        if (isRightClick) {
          // For right-click, check if IC is fully contained
          return (
            icX - icWidth/2 >= Math.min(finalBox.start.x, finalBox.end.x) &&
            icX + icWidth/2 <= Math.max(finalBox.start.x, finalBox.end.x) &&
            icY >= Math.min(finalBox.start.y, finalBox.end.y) &&
            icY + icHeight <= Math.max(finalBox.start.y, finalBox.end.y)
          );
        } else {
          // For left-click, check if IC intersects
          return (
            icX - icWidth/2 <= Math.max(finalBox.start.x, finalBox.end.x) &&
            icX + icWidth/2 >= Math.min(finalBox.start.x, finalBox.end.x) &&
            icY <= Math.max(finalBox.start.y, finalBox.end.y) &&
            icY + icHeight >= Math.min(finalBox.start.y, finalBox.end.y)
          );
        }
      }).map(ic => ic.id);
      
      if (newSelectedWires.length > 0 || newSelectedICs.length > 0) {
        setSelectedWires(newSelectedWires);
        setSelectedIC(newSelectedICs.length === 1 ? newSelectedICs[0] : null);
        setSelectedICs(newSelectedICs);
      }
      
      setIsDragging(false);
      setSelectionBox(null);
      // Prevent other click handlers from firing
      e.stopPropagation();
    } else if (placingIC) {
      handleICPlacement(e);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the context menu from appearing
  };

  const isPositionValid = (x: number, y: number) => {
    // Check if position overlaps with any existing board
    return !boards.some(board => 
      Math.abs(board.x - x) < boardWidth && 
      Math.abs(board.y - y) < boardHeight
    );
  };

  const isAdjacentToExisting = (x: number, y: number) => {
    return boards.some(board => {
      // Check horizontal adjacency
      const isHorizontallyAdjacent = 
        (Math.abs(x - (board.x + boardWidth)) < GRID_SIZE || 
         Math.abs((x + boardWidth) - board.x) < GRID_SIZE) && 
        Math.abs(y - board.y) < boardHeight;
      
      // Check vertical adjacency
      const isVerticallyAdjacent = 
        (Math.abs(y - (board.y + boardHeight)) < GRID_SIZE || 
         Math.abs((y + boardHeight) - board.y) < GRID_SIZE) && 
        Math.abs(x - board.x) < boardWidth;

      return isHorizontallyAdjacent || isVerticallyAdjacent;
    });
  };

  const handleBoardPlacement = (e: React.MouseEvent) => {
    if (!isPlacingBoard || !previewBoard) return;

    if (isPositionValid(previewBoard.x, previewBoard.y) && 
        isAdjacentToExisting(previewBoard.x, previewBoard.y)) {
      const newId = Math.max(...boards.map(b => b.id)) + 1;
      // Reset all wire positions when adding a new board
      resetAllWirePositions();
      setBoards([...boards, { id: newId, x: previewBoard.x, y: previewBoard.y }]);
      setIsPlacingBoard(false);
      setPreviewBoard(null);
    }
  };

  const handleBoardClick = (boardId: number) => {
    setSelectedBoard(boardId);
    setSelectedIC(null);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the background (not on a board or IC)
    if (e.target === e.currentTarget) {
      setSelectedIC(null);
      setSelectedBoard(null);
      setSelectedWires([]);
    }
  };

  const handleHoleClick = (hole: Hole) => {
    // Hole clicks are now only used for highlighting
    setHoverHole(hole);
  };

  const handleHoleHover = (hole: Hole) => {
    setHoverHole(hole);
  };

  const addIC = (pins: number) => {
    const width = (pins in IC_SIZES ? IC_SIZES[pins as keyof typeof IC_SIZES] : MIN_IC_WIDTH);
    // Clear any existing selections
    setSelectedIC(null);
    setSelectedBoard(null);
    setSelectedWires([]);
    // Set the IC being placed
    setPlacingIC({ pins, width });
  };

  const handleICPlacement = (e: React.MouseEvent) => {
    if (!placingIC) return;

    const svg = e.currentTarget as SVGElement;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find the nearest valid position on the center divide
    let nearestBoard = boards[0];
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
        nearestBoard = board;
      }
    }

    // Calculate relative position on the board
    const relativeX = x - nearestBoard.x - GRID_SIZE/2;
    const halfPins = placingIC.pins / 2;

    // Snap to grid
    let snappedX = Math.round((relativeX - 1.5 * GRID_SIZE) / GRID_SIZE) * GRID_SIZE + 1.5 * GRID_SIZE;
    const col = Math.round((snappedX - 1.5 * GRID_SIZE) / GRID_SIZE);

    // Ensure IC stays within board bounds
    const maxCol = COLS - Math.floor(halfPins/2) - 1;
    let clampedCol = Math.max(Math.floor(halfPins/2 - 0.5), Math.min(col, maxCol));

    // If the IC would be placed outside the current board's bounds, try to find a better board
    if (clampedCol < 0 || clampedCol > maxCol) {
      // Try to find a board that would better contain the IC
      for (const board of boards) {
        const boardCenterX = board.x + (COLS + 2) * GRID_SIZE / 2;
        const horizontalDistance = Math.abs(x - boardCenterX);
        
        // If this board is closer horizontally and the IC would fit within its bounds
        if (horizontalDistance < minDistance) {
          const relativeX = x - board.x - GRID_SIZE/2;
          const snappedX = Math.round((relativeX - 1.5 * GRID_SIZE) / GRID_SIZE) * GRID_SIZE + 1.5 * GRID_SIZE;
          const col = Math.round((snappedX - 1.5 * GRID_SIZE) / GRID_SIZE);
          const newClampedCol = Math.max(Math.floor(halfPins/2 - 0.5), Math.min(col, maxCol));
          
          // If the IC would fit better on this board
          if (newClampedCol >= 0 && newClampedCol <= maxCol) {
            nearestBoard = board;
            clampedCol = newClampedCol;
            break;
          }
        }
      }
    }

    // Check if the position is valid (no overlapping ICs)
    const isValidPosition = !ics.some(ic => {
      if (ic.boardId !== nearestBoard.id) return false;
      
      const icStartCol = ic.startCol;
      const icEndCol = icStartCol + Math.ceil(ic.width / GRID_SIZE);
      const newICWidth = Math.ceil(placingIC.width / GRID_SIZE);
      
      return (
        (clampedCol >= icStartCol && clampedCol < icEndCol) ||
        (clampedCol + newICWidth > icStartCol && clampedCol < icEndCol)
      );
    });

    if (isValidPosition) {
      const newIC = {
        id: Math.max(...ics.map(ic => ic.id), -1) + 1,
        x: nearestBoard.x + 1.5 * GRID_SIZE + clampedCol * GRID_SIZE + ((placingIC.pins / 2) % 2 === 0 ? GRID_SIZE/2 : 0),
        y: nearestBoard.y + GRID_SIZE + CENTER_DIVIDE_HEIGHT + (ROWS/2 + 2) * GRID_SIZE - IC_HEIGHT/2,
        pins: placingIC.pins,
        width: placingIC.width,
        boardId: nearestBoard.id,
        startCol: clampedCol,
        startRow: ROWS/2 - 1
      };
      setICs([...ics, newIC]);
      setSelectedIC(newIC.id);
    }
    
    setPlacingIC(null);
  };

  const handleICDragEnd = (id: number, newX: number, newY: number, newBoardId: number, newStartCol: number, newStartRow: number) => {
    // Check if the new position is valid (no overlapping ICs)
    const isValidPosition = !ics.some(ic => {
      if (ic.id === id || ic.boardId !== newBoardId) return false;
      
      const icStartCol = ic.startCol;
      const icEndCol = icStartCol + Math.ceil(ic.width / GRID_SIZE);
      const movingIC = ics.find(ic => ic.id === id);
      if (!movingIC) return false;
      
      const newICWidth = Math.ceil(movingIC.width / GRID_SIZE);
      
      return (
        (newStartCol >= icStartCol && newStartCol < icEndCol) ||
        (newStartCol + newICWidth > icStartCol && newStartCol < icEndCol)
      );
    });

    if (isValidPosition) {
      // Update the IC's position and board
      setICs(ics.map(ic => 
        ic.id === id 
          ? { ...ic, x: newX, y: newY, boardId: newBoardId, startCol: newStartCol, startRow: newStartRow }
          : ic
      ));
    } else {
      // If position is invalid, revert to original position
      const originalIC = ics.find(ic => ic.id === id);
      if (originalIC) {
        setICs(ics.map(ic => 
          ic.id === id 
            ? { ...ic, x: originalIC.x, y: originalIC.y, boardId: originalIC.boardId, startCol: originalIC.startCol, startRow: originalIC.startRow }
            : ic
        ));
      }
    }
  };

  const handleICClick = (id: number) => {
    // Check if shift key is pressed using the window event
    if (window.event instanceof MouseEvent && window.event.shiftKey) {
      // If shift is pressed, toggle selection of this IC
      setSelectedICs(prev => 
        prev.includes(id)
          ? prev.filter(icId => icId !== id)
          : [...prev, id]
      );
      setSelectedIC(null);
    } else {
      // If shift is not pressed, select only this IC
      setSelectedICs([id]);
      setSelectedIC(id);
    }
    setSelectedWires([]);
    setSelectedBoard(null);
  };

  const handleWireClick = (wireId: number) => {
    // Check if shift key is pressed using the window event
    if (window.event instanceof MouseEvent && window.event.shiftKey) {
      // If shift is pressed, toggle selection of this wire
      setSelectedWires(prev => 
        prev.includes(wireId)
          ? prev.filter(id => id !== wireId)
          : [...prev, wireId]
      );
    } else {
      // If shift is not pressed, select only this wire
      setSelectedWires([wireId]);
    }
    setSelectedIC(null);
    setSelectedICs([]);
    setSelectedBoard(null);
  };

  const handleICSelect = (pins: number) => {
    const width = (pins in IC_SIZES ? IC_SIZES[pins as keyof typeof IC_SIZES] : MIN_IC_WIDTH);
    setPlacingIC({ pins, width });
    setShowICMenu(false);
  };

  return (
    <div 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
      onClick={handleBackgroundClick}
    >
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: TOP_MENU.PADDING,
        backgroundColor: 'var(--menu-background)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: TOP_MENU.PADDING }}>
          <button
            onClick={startBoardPlacement}
            style={{
              padding: TOP_MENU.BUTTON.PADDING,
              margin: TOP_MENU.BUTTON.MARGIN,
              borderRadius: TOP_MENU.BUTTON.BORDER_RADIUS,
              fontSize: TOP_MENU.BUTTON.FONT_SIZE,
              backgroundColor: 'var(--button-background)',
              color: 'var(--text-color)',
              border: 'none',
              cursor: 'pointer',
              minWidth: TOP_MENU.BUTTON.MIN_WIDTH,
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--button-hover)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--button-background)'}
          >
            {isPlacingBoard ? 'Cancel Board Placement (Esc)' : 'Add Board'}
          </button>
          <span style={{ 
            margin: TOP_MENU.STATUS_TEXT.MARGIN,
            color: 'var(--text-color)',
            fontSize: TOP_MENU.STATUS_TEXT.FONT_SIZE,
          }}>
            Boards: {boards.length}
          </span>
          <span style={{ 
            margin: TOP_MENU.STATUS_TEXT.MARGIN,
            color: 'var(--text-color)',
            fontSize: TOP_MENU.STATUS_TEXT.FONT_SIZE,
          }}>
            Wires: {wires.length}
          </span>
        </div>
        <ThemeToggle gridSize={GRID_SIZE} />
      </div>
      <div 
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'auto',
          cursor: placingIC ? 'crosshair' : (isWireMode ? 'crosshair' : 'default'),
          paddingTop: TOP_MENU.PADDING * 2 + TOP_MENU.FONT_SIZE + TOP_MENU.BUTTON.FONT_SIZE + (parseInt(TOP_MENU.BUTTON.PADDING.split(' ')[0]) * 2)
        }}
      >
        {showICMenu && (
          <ICSelectionMenu
            onSelect={handleICSelect}
            onClose={() => setShowICMenu(false)}
            mouseX={menuPosition.x}
            mouseY={menuPosition.y}
          />
        )}
        <svg 
          style={{ width: '100%', height: '100%' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onClick={handleBoardPlacement}
        >
          {boards.map(board => (
            <g 
              key={board.id}
              onClick={(e) => {
                e.stopPropagation();
                handleBoardClick(board.id);
              }}
            >
              <Breadboard
                onHoleClick={handleHoleClick}
                onHoleHover={handleHoleHover}
                selectedHoles={selectedHoles}
                startHole={startHole}
                hoverHole={hoverHole}
                isRouting={isWireMode}
                boardId={board.id}
                x={board.x}
                y={board.y}
              />
              {board.id === selectedBoard && (
                <rect
                  x={board.x}
                  y={board.y}
                  width={boardWidth}
                  height={boardHeight}
                  fill="none"
                  stroke="red"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
            </g>
          ))}
          {previewBoard && (
            <g transform={`translate(${previewBoard.x}, ${previewBoard.y})`}>
              <rect
                x={0}
                y={0}
                width={boardWidth}
                height={boardHeight}
                fill={isPositionValid(previewBoard.x, previewBoard.y) && 
                      isAdjacentToExisting(previewBoard.x, previewBoard.y) 
                      ? "rgba(0, 255, 0, 0.1)" 
                      : "rgba(255, 0, 0, 0.1)"}
                stroke={isPositionValid(previewBoard.x, previewBoard.y) && 
                        isAdjacentToExisting(previewBoard.x, previewBoard.y) 
                        ? "green" 
                        : "red"}
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            </g>
          )}
          {wires.map((wire, index) => (
            <WirePath
              key={wire.id}
              start={wire.start}
              end={wire.end}
              boards={boards}
              color={wire.color}
              customPath={wire.path}
              isSelected={selectedWires.includes(wire.id)}
              onClick={() => handleWireClick(wire.id)}
              ics={ics}
              wireId={wire.id}
              is_shifted={wire.shift_completed}
            />
          ))}
          {isWireMode && startHole && hoverHole && (
            <>
              {pinnedPath.length > 0 && (
                <WirePath
                  start={{ boardId: startHole.boardId, row: startHole.row, col: startHole.col }}
                  end={pinnedEnd!}
                  boards={boards}
                  color={WIRE_COLORS[currentWireColor].value}
                  isPreview={true}
                  customPath={pinnedPath}
                  ics={ics}
                  is_shifted={isShiftPressed}
                />
              )}
              <WirePath
                start={pinnedEnd || startHole}
                end={hoverHole}
                boards={boards}
                color={WIRE_COLORS[currentWireColor].value}
                isPreview={true}
                ics={ics}
                is_shifted={isShiftPressed}
              />
            </>
          )}
          {placingIC && previewIC && (
            <ICComponent
              id={-1}
              x={previewIC.x}
              y={previewIC.y}
              pins={placingIC.pins}
              width={placingIC.width}
              boardId={previewIC.boardId}
              startCol={previewIC.startCol}
              startRow={previewIC.startRow}
              onDragEnd={() => {}}
              isSelected={false}
              onSelect={() => {}}
              boards={boards}
              isPreview={true}
            />
          )}
          {ics.map(ic => (
            <ICComponent
              key={ic.id}
              id={ic.id}
              x={ic.x}
              y={ic.y}
              pins={ic.pins}
              width={ic.width}
              boardId={ic.boardId}
              startCol={ic.startCol}
              startRow={ic.startRow}
              onDragEnd={handleICDragEnd}
              isSelected={selectedICs.includes(ic.id)}
              onSelect={handleICClick}
              boards={boards}
            />
          ))}
          {selectionBox && (
            <rect
              x={Math.min(selectionBox.start.x, selectionBox.end.x)}
              y={Math.min(selectionBox.start.y, selectionBox.end.y)}
              width={Math.abs(selectionBox.end.x - selectionBox.start.x)}
              height={Math.abs(selectionBox.end.y - selectionBox.start.y)}
              fill="rgba(0, 255, 0, 0.1)"
              stroke="green"
              strokeWidth={1}
              strokeDasharray="5,5"
            />
          )}
        </svg>
      </div>
      {showKeyboardShortcuts && (
        <KeyboardShortcutsMenu onClose={() => setShowKeyboardShortcuts(false)} />
      )}
    </div>
  );
}

export default App;
