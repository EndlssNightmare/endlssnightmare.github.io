import React, { useState, useEffect } from 'react';

const CrackingTitle = ({ children, className = '', intensity = 1.0, duration = 2000 }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [crackingChars, setCrackingChars] = useState([]);
  
  // Characters for the cracking effect - more diverse set
  const crackChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~`';
  
  useEffect(() => {
    if (!isAnimating) {
      setCrackingChars([]);
      return;
    }

    // Start cracking effect
    const text = children;
    const charArray = text.split('');
    const newCrackingChars = new Array(charArray.length).fill(false);
    
    // All characters participate in the cracking effect
    const crackCount = Math.floor(charArray.length * intensity); // Now defaults to 100%
    const indices = Array.from({ length: charArray.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, crackCount);
    
    indices.forEach(index => {
      newCrackingChars[index] = true;
    });
    
    setCrackingChars(newCrackingChars);
    
    // Animate cracking effect - all characters crack continuously
    const intervals = [];
    
    // Create intervals for all characters
    charArray.forEach((_, index) => {
      const interval = setInterval(() => {
        setCrackingChars(prev => {
          const newChars = [...prev];
          newChars[index] = !newChars[index];
          return newChars;
        });
      }, 80 + Math.random() * 40); // Variable speed for more dynamic effect
      
      intervals.push(interval);
    });
    
    // Stop cracking after specified duration
    const stopTimeout = setTimeout(() => {
      intervals.forEach(interval => clearInterval(interval));
      setCrackingChars([]);
      setIsAnimating(false); // Reset animation state
    }, duration);
    
    return () => {
      intervals.forEach(interval => clearInterval(interval));
      clearTimeout(stopTimeout);
    };
  }, [isAnimating, children, intensity, duration]);
  
  const renderChar = (char, index) => {
    const isCracking = crackingChars[index];
    const randomChar = crackChars[Math.floor(Math.random() * crackChars.length)];
    
    // Red color for cracking effect
    const crackingColor = '#ff6b6b';
    
    return (
      <span
        key={index}
        className={`cracking-char ${isCracking ? 'cracking' : ''}`}
        style={{
          color: isCracking ? crackingColor : 'inherit',
          textShadow: isCracking ? `0 0 15px ${crackingColor}` : 'none',
          transition: 'all 0.1s ease',
          fontFamily: isCracking ? 'monospace' : 'inherit',
          transform: isCracking ? `scale(${1.1 + Math.random() * 0.2})` : 'scale(1)',
          display: 'inline-block',
          minWidth: '0.6em', // Prevent layout shift
          textAlign: 'center'
        }}
      >
        {isCracking ? randomChar : char}
      </span>
    );
  };
  
  const handleMouseEnter = () => {
    if (!isAnimating) {
      setIsAnimating(true);
    }
  };

  return (
    <span
      className={`cracking-title ${className}`}
      onMouseEnter={handleMouseEnter}
      style={{
        display: 'inline-block',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      {typeof children === 'string' 
        ? children.split('').map((char, index) => renderChar(char, index))
        : children
      }
    </span>
  );
};

export default CrackingTitle;
