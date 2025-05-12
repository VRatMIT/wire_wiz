import React, { useEffect, useState } from 'react';
import { TOP_MENU } from './config';

interface ThemeToggleProps {
  gridSize: number;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ gridSize }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Update localStorage and document class when theme changes
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: TOP_MENU.THEME_TOGGLE.GAP,
        marginRight: TOP_MENU.THEME_TOGGLE.MARGIN_RIGHT,
      }}
    >
      <label
        style={{
          fontSize: TOP_MENU.THEME_TOGGLE.FONT_SIZE,
          color: 'var(--text-color)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: TOP_MENU.THEME_TOGGLE.GAP,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: TOP_MENU.THEME_TOGGLE.SWITCH_WIDTH,
            height: TOP_MENU.THEME_TOGGLE.SWITCH_HEIGHT,
            backgroundColor: isDarkMode ? '#4a4a4a' : '#e0e0e0',
            borderRadius: TOP_MENU.THEME_TOGGLE.SWITCH_HEIGHT / 2,
            transition: 'background-color 0.3s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: (TOP_MENU.THEME_TOGGLE.SWITCH_HEIGHT - TOP_MENU.THEME_TOGGLE.KNOB_SIZE) / 2,
              left: isDarkMode 
                ? TOP_MENU.THEME_TOGGLE.SWITCH_WIDTH - TOP_MENU.THEME_TOGGLE.KNOB_SIZE - 2
                : 2,
              width: TOP_MENU.THEME_TOGGLE.KNOB_SIZE,
              height: TOP_MENU.THEME_TOGGLE.KNOB_SIZE,
              backgroundColor: '#fff',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'left 0.3s',
            }}
          />
        </div>
        <input
          type="checkbox"
          checked={isDarkMode}
          onChange={() => setIsDarkMode(!isDarkMode)}
          style={{ display: 'none' }}
        />
        {isDarkMode ? 'Dark' : 'Light'}
      </label>
    </div>
  );
};

export default ThemeToggle; 