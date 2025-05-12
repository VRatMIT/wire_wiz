// Global configuration constants for the breadboard layout
export const GRID_SIZE =40;
export const CENTER_DIVIDE_HEIGHT = GRID_SIZE;
export const POWER_RAIL_HEIGHT = 2*GRID_SIZE;
export const HOLE_SIZE = 0.4*GRID_SIZE;
export const PIN_SIZE = 0.4*GRID_SIZE;
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

export const WIRE_WEIGHT = GRID_SIZE/2;
export const WIRE_OFFSET = 10; // Offset multiplier for wire separation

export const WIRE_COLORS = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#ffd700' },
  { name: 'Green', value: '#008000' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Brown', value: '#8b4513' },
  { name: 'Orange', value: '#ffa500' },
  { name: 'Purple', value: '#800080' },
  { name: 'Gray', value: '#808080' },
  { name: 'Pink', value: '#ffc0cb' },
] as const;

// Menu scaling
export const MENU_SCALE = 2; // Scale factor for menu elements 

// Top menu bar stylingw
let over_all_scale = 2;
export const TOP_MENU = {
  PADDING: 10*over_all_scale,
  BACKGROUND_COLOR: '#f0f0f0',
  FONT_SIZE: 16*over_all_scale,
  BUTTON: {
    PADDING: `${8*over_all_scale}px ${16*over_all_scale}px`,
    MARGIN: `0 ${10*over_all_scale}px`,
    MARGIN_RIGHT: 10*over_all_scale,
    BORDER_RADIUS: 5*over_all_scale,
    FONT_SIZE: 14*over_all_scale,
    MIN_WIDTH: 100*over_all_scale,
    HOVER_COLOR: '#d0d0d0',
    ACTIVE_COLOR: '#ff9999',
    ACTIVE_TEXT_COLOR: 'white',
  },
  STATUS_TEXT: {
    MARGIN: `0 ${10*over_all_scale}px`,
    MARGIN_LEFT: 10*over_all_scale,
    COLOR: '#666',
    FONT_SIZE: 14*over_all_scale,
  },
  SHORTCUTS_MENU_SCALE: 1.5*over_all_scale, // Scale factor for the keyboard shortcuts menu
  THEME_TOGGLE: {
    MARGIN_RIGHT: 20*over_all_scale,
    SWITCH_WIDTH: 60*over_all_scale,
    SWITCH_HEIGHT: 24*over_all_scale,
    KNOB_SIZE: 20*over_all_scale,
    FONT_SIZE: 14*over_all_scale,
    GAP: 8*over_all_scale,
  }
} as const; 