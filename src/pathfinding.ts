import { GRID_SIZE, CENTER_DIVIDE_HEIGHT, POWER_RAIL_HEIGHT, ROWS, COLS, IC_HEIGHT } from './config';
import type { Board, Hole, Point, Node, IC } from './types';

export function findPath(start: Hole, end: Hole, boards: Board[], ics: IC[]): Point[] {
  // If start or end is invalid, return empty path
  if (!start || !end) return [];

  const startNode: Node = {
    x: start.col,
    y: start.row,
    boardId: start.boardId,
    g: 0,
    h: 0,
    f: 0,
    parent: null
  };

  const endNode: Node = {
    x: end.col,
    y: end.row,
    boardId: end.boardId,
    g: 0,
    h: 0,
    f: 0,
    parent: null
  };

  const openSet: Node[] = [startNode];
  const closedSet: Set<string> = new Set();

  while (openSet.length > 0) {
    // Find node with lowest f cost
    let currentIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }

    const current = openSet[currentIndex];

    // Check if we reached the end
    if (current.x === endNode.x && current.y === endNode.y && current.boardId === endNode.boardId) {
      return reconstructPath(current);
    }

    // Remove current from open set and add to closed set
    openSet.splice(currentIndex, 1);
    closedSet.add(`${current.x},${current.y},${current.boardId}`);

    // Get neighbors (only horizontal and vertical movements)
    const neighbors = getNeighbors(current, boards, ics);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y},${neighbor.boardId}`;
      if (closedSet.has(neighborKey)) continue;

      const tentativeG = current.g + 1; // Each step costs 1

      let isNewPath = false;
      const existingNeighbor = openSet.find(n => 
        n.x === neighbor.x && n.y === neighbor.y && n.boardId === neighbor.boardId
      );

      if (!existingNeighbor) {
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = current;
        openSet.push(neighbor);
        isNewPath = true;
      } else if (tentativeG < existingNeighbor.g) {
        existingNeighbor.g = tentativeG;
        existingNeighbor.f = existingNeighbor.g + existingNeighbor.h;
        existingNeighbor.parent = current;
        isNewPath = true;
      }
    }
  }

  // No path found
  return [];
}

function getNeighbors(node: Node, boards: Board[], ics: IC[]): Node[] {
  const neighbors: Node[] = [];
  const directions = [
    { dx: 0, dy: -1 },  // up
    { dx: 1, dy: 0 },   // right
    { dx: 0, dy: 1 },   // down
    { dx: -1, dy: 0 },  // left
  ];

  // First check for movement within the same board
  for (const dir of directions) {
    const newX = node.x + dir.dx;
    const newY = node.y + dir.dy;

    if (isValidPosition(newX, newY, node.boardId, boards, ics)) {
      neighbors.push({
        x: newX,
        y: newY,
        boardId: node.boardId,
        g: 0,
        h: 0,
        f: 0,
        parent: null
      });
    }
  }

  // Then check for board transitions
  const currentBoard = boards.find(b => b.id === node.boardId);
  if (currentBoard) {
    // Check adjacent boards
    for (const board of boards) {
      if (board.id === node.boardId) continue;

      // Check if boards are adjacent
      const isHorizontallyAdjacent = 
        (Math.abs(currentBoard.x - (board.x + (COLS + 2) * GRID_SIZE)) < GRID_SIZE || 
         Math.abs((currentBoard.x + (COLS + 2) * GRID_SIZE) - board.x) < GRID_SIZE) && 
        Math.abs(currentBoard.y - board.y) < (ROWS + 6) * GRID_SIZE + 2 * GRID_SIZE;
      
      const isVerticallyAdjacent = 
        (Math.abs(currentBoard.y - (board.y + (ROWS + 6) * GRID_SIZE + 2 * GRID_SIZE)) < GRID_SIZE || 
         Math.abs((currentBoard.y + (ROWS + 6) * GRID_SIZE + 2 * GRID_SIZE) - board.y) < GRID_SIZE) && 
        Math.abs(currentBoard.x - board.x) < (COLS + 2) * GRID_SIZE;

      if (isHorizontallyAdjacent) {
        // Add transition points at the edges
        const edgeX = board.x < currentBoard.x ? COLS - 1 : 0;
        if (isValidPosition(edgeX, node.y, board.id, boards, ics)) {
          neighbors.push({
            x: edgeX,
            y: node.y,
            boardId: board.id,
            g: 0,
            h: 0,
            f: 0,
            parent: null
          });
        }
      }
      if (isVerticallyAdjacent) {
        // Add transition points at the edges
        const edgeY = board.y < currentBoard.y ? ROWS - 1 : 0;
        if (isValidPosition(node.x, edgeY, board.id, boards, ics)) {
          neighbors.push({
            x: node.x,
            y: edgeY,
            boardId: board.id,
            g: 0,
            h: 0,
            f: 0,
            parent: null
          });
        }
      }
    }
  }

  return neighbors;
}

function isValidPosition(x: number, y: number, boardId: number, boards: Board[], ics: IC[]): boolean {
  // Check if position is within board bounds
  if (x < 0 || x >= COLS || y < -3 || y >= ROWS + 3) return false;

  // Check if position is blocked by an IC
  for (const ic of ics) {
    if (ic.boardId !== boardId) continue;

    // Check if point is within IC body
    const icStartX = ic.startCol;
    const icEndX = ic.startCol + Math.ceil(ic.width / GRID_SIZE);
    const icStartY = ic.startRow;
    const icEndY = ic.startRow + Math.ceil(IC_HEIGHT / GRID_SIZE);

    if (x >= icStartX && x < icEndX && y >= icStartY && y < icEndY) {
      return false;
    }

    // Check if point is blocked by IC pins
    const halfPins = ic.pins / 2;
    const pinStartX = icStartX - (halfPins - 1);
    const pinEndX = icStartX + halfPins;

    // Check top pins
    if (y === icStartY - 1 && x >= pinStartX && x < pinEndX) {
      return false;
    }
    // Check bottom pins
    if (y === icEndY && x >= pinStartX && x < pinEndX) {
      return false;
    }
  }

  // Allow routing across the center divide
  return true;
}

function heuristic(a: Node, b: Node): number {
  // Manhattan distance for grid-based movement
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(node: Node): Point[] {
  const path: Point[] = [];
  let current: Node | null = node;

  while (current) {
    path.unshift({
      x: current.x,
      y: current.y,
      boardId: current.boardId
    });
    current = current.parent;
  }

  return path;
} 