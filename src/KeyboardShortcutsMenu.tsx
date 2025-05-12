import React from 'react';
import { TOP_MENU } from './config';

interface KeyboardShortcutsMenuProps {
  onClose: () => void;
}

const KeyboardShortcutsMenu: React.FC<KeyboardShortcutsMenuProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'W', description: 'Enter/Exit wire mode' },
    { key: 'E', description: 'Pin wire segment and continue routing' },
    { key: 'C', description: 'Change wire color' },
    { key: 'I', description: 'Open IC selection menu' },
    { key: 'B', description: 'Start board placement' },
    { key: 'Shift + Click', description: 'Multi-select ICs or wires' },
    { key: 'Backspace', description: 'Delete selected ICs or wires' },
    { key: 'Shift + Backspace', description: 'Delete selected board' },
    { key: 'Escape', description: 'Cancel current operation' },
  ];

  const scale = TOP_MENU.SHORTCUTS_MENU_SCALE;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: TOP_MENU.PADDING * 2 * scale,
          borderRadius: TOP_MENU.BUTTON.BORDER_RADIUS * scale,
          minWidth: `${400 * scale}px`,
          maxWidth: `${600 * scale}px`,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ 
          margin: `0 0 ${20 * scale}px 0`,
          fontSize: TOP_MENU.FONT_SIZE * 0.8 * scale,
          color: '#333'
        }}>
          Keyboard Shortcuts
        </h2>
        <div style={{ display: 'grid', gap: `${10 * scale}px` }}>
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${8 * scale}px`,
                backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white',
                borderRadius: `${4 * scale}px`,
              }}
            >
              <span style={{ 
                fontSize: TOP_MENU.FONT_SIZE * 0.5 * scale,
                color: '#666'
              }}>
                {shortcut.description}
              </span>
              <kbd style={{
                backgroundColor: '#eee',
                borderRadius: `${3 * scale}px`,
                border: '1px solid #b4b4b4',
                boxShadow: '0 1px 1px rgba(0,0,0,.2)',
                color: '#333',
                display: 'inline-block',
                fontSize: TOP_MENU.FONT_SIZE * 0.4 * scale,
                fontWeight: 700,
                lineHeight: 1,
                padding: `${8 * scale}px ${12 * scale}px`,
                whiteSpace: 'nowrap',
              }}>
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <div style={{ 
          marginTop: `${20 * scale}px`,
          textAlign: 'center',
          fontSize: TOP_MENU.FONT_SIZE * 0.4 * scale,
          color: '#666'
        }}>
          Click anywhere outside this window to close
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsMenu; 