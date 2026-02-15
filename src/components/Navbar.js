import React, { useState, useEffect, useRef } from 'react';
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
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    const onTocScrollStart = () => { programmaticScrollRef.current = true; };
    const onTocScrollEnd = () => { programmaticScrollRef.current = false; };
    window.addEventListener('toc-programmatic-scroll-start', onTocScrollStart);
    window.addEventListener('toc-programmatic-scroll-end', onTocScrollEnd);
    return () => {
      window.removeEventListener('toc-programmatic-scroll-start', onTocScrollStart);
      window.removeEventListener('toc-programmatic-scroll-end', onTocScrollEnd);
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const isScrollingDown = scrollTop > lastScrollY && scrollTop > 80;

          setIsScrolled(scrollTop > 50);

          // Always show navbar when user is at the top of the page
          if (scrollTop < 80) {
            setIsVisible(true);
          } else if (isScrollingDown && scrollTop > 120) {
            setIsVisible(false);
          } else if (scrollTop < lastScrollY) {
            // Show navbar when scrolling up (unless TOC triggered the scroll)
            if (!programmaticScrollRef.current) {
              setIsVisible(true);
            }
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
          
          <button
            className="theme-toggle"
            onClick={toggleTheme}
          >
            <div className="theme-icon-wrapper">
              <div className={`theme-icon ${theme === 'dark' ? 'sun-icon' : 'moon-icon'}`}>
                <FaSun className="sun" />
                <FaMoon className="moon" />
              </div>
              <div className="theme-glow"></div>
            </div>
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
