import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBookOpen, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './TableOfContents.css';

const TableOfContents = ({ content, title }) => {
  const [headings, setHeadings] = useState([]);
  const [activeSection, setActiveSection] = useState('');
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    // Extract headings from content
    const lines = content.split('\n');
    const extractedHeadings = [];
    
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        extractedHeadings.push({
          id: `heading-${index}`,
          text: line.substring(2),
          level: 1,
          lineIndex: index
        });
      } else if (line.startsWith('## ')) {
        extractedHeadings.push({
          id: `heading-${index}`,
          text: line.substring(3),
          level: 2,
          lineIndex: index
        });
      } else if (line.startsWith('### ')) {
        extractedHeadings.push({
          id: `heading-${index}`,
          text: line.substring(4),
          level: 3,
          lineIndex: index
        });
      }
    });

    // Prepend writeup title as first TOC item (links to id="writeup-title" in header)
    const withTitle = title
      ? [{ id: 'writeup-title', text: title, level: 1 }, ...extractedHeadings]
      : extractedHeadings;
    
    setHeadings(withTitle);
  }, [content, title]);

  useEffect(() => {
    // Add IDs to headings in the content (title is outside .markdown-content, so offset by 1 when title exists)
    const contentElement = document.querySelector('.markdown-content');
    if (contentElement) {
      const headingElements = contentElement.querySelectorAll('h1, h2, h3');
      const offset = title ? 1 : 0;
      headingElements.forEach((heading, index) => {
        if (headings[index + offset]) {
          heading.id = headings[index + offset].id;
        }
      });
    }
  }, [headings, title]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll('h1, h2, h3');
      let currentSection = '';

      headingElements.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = heading.id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.dispatchEvent(new CustomEvent('toc-programmatic-scroll-start'));
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Navbar will ignore "scroll up" until this ends (smooth scroll ~1s)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('toc-programmatic-scroll-end'));
      }, 1500);
    }
  };

  return (
    <>
      <button
        className={`toc-toggle ${collapsed ? 'toc-toggle--collapsed' : ''}`}
        onClick={() => setCollapsed(prev => !prev)}
        title={collapsed ? 'Show table of contents' : 'Hide table of contents'}
      >
        {collapsed ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      <div
        className={`table-of-contents ${collapsed ? 'toc--collapsed' : ''}`}
      >
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="toc-inner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.5 } }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.15 } }}
            >
              <div className="toc-header">
                <FaBookOpen className="toc-icon" />
                <h3>Table of Contents</h3>
              </div>
              
              <div className="toc-content">
                {headings.map((heading) => (
                  <div
                    key={heading.id}
                    className={`toc-item toc-level-${heading.level} ${
                      activeSection === heading.id ? 'active' : ''
                    }`}
                    onClick={() => scrollToSection(heading.id)}
                  >
                    {heading.level > 1 && <span className="toc-arrow">›</span>}
                    <span className="toc-text">{heading.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default TableOfContents;

