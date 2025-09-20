import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage immediately to prevent flash
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Set the data-theme attribute immediately
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Add transition class and enhanced animation state
    setIsTransitioning(true);
    document.body.classList.add('theme-transitioning');
    
    // Add special class for enhanced button animations
    const themeButton = document.querySelector('.theme-toggle');
    if (themeButton) {
      themeButton.classList.add('theme-morphing');
    }
    
    // Update theme
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Remove transition classes after extended animation duration
    setTimeout(() => {
      setIsTransitioning(false);
      document.body.classList.remove('theme-transitioning');
      if (themeButton) {
        themeButton.classList.remove('theme-morphing');
      }
    }, 800); // Extended duration to match new animations
  };

  const value = {
    theme,
    toggleTheme,
    isTransitioning
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

































