import React, { useState } from 'react';
import { TOP_MENU, MENU_SCALE } from './config';

interface ICSelectionMenuProps {
  onSelect: (pins: number, width: number) => void;
  onClose: () => void;
  mouseX: number;
  mouseY: number;
}

const ICSelectionMenu: React.FC<ICSelectionMenuProps> = ({ onSelect, onClose, mouseX, mouseY }) => {
  const [hoveredSize, setHoveredSize] = useState<number | null>(null);
  const [hoveredWidth, setHoveredWidth] = useState<number | null>(null);

  const icSizes = [
    { pins: 8, label: '8-pin' },
    { pins: 14, label: '14-pin' },
    { pins: 16, label: '16-pin' },
    { pins: 20, label: '20-pin' },
    { pins: 24, label: '24-pin' },
    { pins: 28, label: '28-pin' },
    { pins: 40, label: '40-pin' },
  ];

  const widthOptions = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div
      style={{
        position: 'fixed',
        top: mouseY,
        left: mouseX,
        backgroundColor: 'white',
        borderRadius: TOP_MENU.BUTTON.BORDER_RADIUS,
        padding: TOP_MENU.PADDING,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        transform: `scale(${MENU_SCALE})`,
        transformOrigin: 'top left',
      }}
    >
      {icSizes.map((size) => (
        <div
          key={size.pins}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
          }}
          onMouseEnter={() => setHoveredSize(size.pins)}
          onMouseLeave={() => setHoveredSize(null)}
        >
          <button
            onClick={() => onSelect(size.pins, 0)}
            style={{
              padding: TOP_MENU.BUTTON.PADDING,
              borderRadius: TOP_MENU.BUTTON.BORDER_RADIUS,
              fontSize: TOP_MENU.BUTTON.FONT_SIZE,
              border: '1px solid #ccc',
              cursor: 'pointer',
              backgroundColor: hoveredSize === size.pins ? TOP_MENU.BUTTON.HOVER_COLOR : 'white',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {size.label}
          </button>
          
          {hoveredSize === size.pins && (
            <div
              style={{
                position: 'absolute',
                left: '100%',
                top: 0,
                marginLeft: '5px',
                backgroundColor: 'white',
                borderRadius: TOP_MENU.BUTTON.BORDER_RADIUS,
                padding: TOP_MENU.PADDING,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
              onMouseEnter={() => setHoveredSize(size.pins)}
              onMouseLeave={() => setHoveredSize(null)}
            >
              <div style={{ 
                fontSize: TOP_MENU.BUTTON.FONT_SIZE * 0.8,
                color: '#666',
                marginBottom: '5px',
                borderBottom: '1px solid #eee',
                paddingBottom: '5px',
              }}>
                Width
              </div>
              {widthOptions.map((width) => (
                <button
                  key={width}
                  onClick={() => onSelect(size.pins, width)}
                  style={{
                    padding: TOP_MENU.BUTTON.PADDING,
                    borderRadius: TOP_MENU.BUTTON.BORDER_RADIUS,
                    fontSize: TOP_MENU.BUTTON.FONT_SIZE * 0.8,
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    backgroundColor: hoveredWidth === width ? TOP_MENU.BUTTON.HOVER_COLOR : 'white',
                    transition: 'background-color 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={() => setHoveredWidth(width)}
                  onMouseLeave={() => setHoveredWidth(null)}
                >
                  {width}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ICSelectionMenu; 