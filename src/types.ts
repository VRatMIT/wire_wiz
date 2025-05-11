export type Board = {
  id: number;
  x: number;
  y: number;
};

export type Hole = {
  boardId: number;
  row: number;
  col: number;
};

export type WirePathProps = {
  start: Hole;
  end: Hole;
  boards: Board[];
  color?: string;
  isPreview?: boolean;
  customPath?: Point[];
};

export type Wire = {
  start: Hole;
  end: Hole;
  color?: string;
  path?: Point[];
};

export type Point = {
  x: number;
  y: number;
  boardId: number;
};

export type Node = {
  x: number;
  y: number;
  boardId: number;
  g: number;  // Cost from start to current
  h: number;  // Heuristic (estimated cost from current to end)
  f: number;  // Total cost (g + h)
  parent: Node | null;
};

export type IC = {
  id: number;
  x: number;
  y: number;
  pins: number;
  width: number;
  boardId: number;
  startCol: number;
  startRow: number;
}; 