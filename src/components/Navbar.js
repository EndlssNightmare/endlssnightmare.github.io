import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaFileAlt, FaCode, FaTags, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
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
            V01
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
            className="theme-toggle"
            onClick={toggleTheme}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.2 }}
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
