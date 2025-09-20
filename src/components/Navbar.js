import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaFileAlt, FaCode, FaTags, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { theme, toggleTheme, isTransitioning } = useTheme();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const isScrollingDown = scrollTop > lastScrollY && scrollTop > 80;
          
          setIsScrolled(scrollTop > 50);
          
          // Only hide navbar when scrolling down significantly
          if (isScrollingDown && scrollTop > 120) {
            setIsVisible(false);
          } else if (scrollTop < 80 || scrollTop < lastScrollY) {
            setIsVisible(true);
          }
          
          setLastScrollY(scrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/writeups', icon: FaFileAlt, label: 'Writeups' },
    { path: '/projects', icon: FaCode, label: 'Projects' },
    { path: '/tags', icon: FaTags, label: 'Tags' }
  ];

  return (
    <motion.nav 
      className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}
      initial={{ y: 0, opacity: 1 }}
      animate={{ 
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1],
        opacity: { duration: 0.3 }
      }}
    >
      <div className="navbar-container">
        <motion.div 
          className="navbar-brand"
        >
          <Link to="/" className="brand-link">
            <img 
              src="/images/V01Logo2.png" 
              alt="V01 Logo" 
              className="brand-logo"
            />
          </Link>
        </motion.div>

        <div className="navbar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.div
                key={item.path}
                className="nav-item"
              >
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
                {isActive && (
                  <motion.div
                    className="active-indicator"
                    layoutId="activeIndicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            );
          })}
          
          <motion.button
            className={`theme-toggle ${isTransitioning ? 'theme-transitioning' : ''}`}
            onClick={toggleTheme}
            whileHover={{ 
              scale: 1.05,
              y: -3,
              rotateY: 5,
              rotateX: 5
            }}
            whileTap={{ 
              scale: 0.95,
              rotateY: -5,
              rotateX: -5
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 20,
              mass: 0.8
            }}
            style={{
              transformStyle: "preserve-3d"
            }}
          >
            <motion.div
              className="theme-icon-wrapper"
              animate={{
                rotate: isTransitioning ? 360 : 0,
                scale: isTransitioning ? 1.1 : 1
              }}
              transition={{
                duration: 0.6,
                ease: [0.23, 1, 0.32, 1]
              }}
            >
              <motion.div
                className="theme-icon"
                animate={{
                  opacity: theme === 'dark' ? 1 : 0,
                  scale: theme === 'dark' ? 1 : 0.8,
                  rotateY: theme === 'dark' ? 0 : 90
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.23, 1, 0.32, 1]
                }}
                style={{
                  transformStyle: "preserve-3d"
                }}
              >
                <FaSun />
              </motion.div>
              <motion.div
                className="theme-icon"
                animate={{
                  opacity: theme === 'light' ? 1 : 0,
                  scale: theme === 'light' ? 1 : 0.8,
                  rotateY: theme === 'light' ? 0 : 90
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.23, 1, 0.32, 1]
                }}
                style={{
                  transformStyle: "preserve-3d"
                }}
              >
                <FaMoon />
              </motion.div>
            </motion.div>
            
            
            {/* Particle effects */}
            {isTransitioning && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="theme-particle"
                    initial={{
                      opacity: 0,
                      scale: 0,
                      x: 0,
                      y: 0
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: Math.cos(i * 60 * Math.PI / 180) * 40,
                      y: Math.sin(i * 60 * Math.PI / 180) * 40
                    }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                    style={{
                      position: 'absolute',
                      width: '4px',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '50%',
                      pointerEvents: 'none',
                      zIndex: 3
                    }}
                  />
                ))}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
