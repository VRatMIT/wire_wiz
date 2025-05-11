// Global configuration constants for the breadboard layout
export const GRID_SIZE = 20;
export const CENTER_DIVIDE_HEIGHT = GRID_SIZE;
export const POWER_RAIL_HEIGHT = 40;
export const HOLE_SIZE = 8;
export const PIN_SIZE = 8;
export const ROWS = 10;
export const COLS = 63;

// Derived constants
export const IC_HEIGHT = CENTER_DIVIDE_HEIGHT + GRID_SIZE - PIN_SIZE; // Fixed height to bridge the divide
export const MIN_IC_WIDTH = 40; // Minimum width for size 1 IC

// Predefined IC sizes that align with the breadboard
export const IC_SIZES = {
  8: 1,    // Size 1: 2 pins per side
  14: 2,   // Size 2: 3 pins per side
  16: 2,   // Size 2: 4 pins per side
  20: 3,   // Size 3: 5 pins per side
  24: 3,   // Size 3: 6 pins per side
  28: 4,   // Size 4: 7 pins per side
  40: 5    // Size 5: 10 pins per side
};

export const WIRE_WEIGHT = 10;

export const WIRE_COLORS = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#ffd700' },
  { name: 'Green', value: '#008000' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Brown', value: '#8b4513' },
  { name: 'Orange', value: '#ffa500' },
  { name: 'Purple', value: '#800080' }
] as const; 