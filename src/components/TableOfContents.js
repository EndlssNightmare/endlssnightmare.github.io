import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen } from 'react-icons/fa';
import './TableOfContents.css';

const TableOfContents = ({ content }) => {
  const [headings, setHeadings] = useState([]);
  const [activeSection, setActiveSection] = useState('');

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
    
    setHeadings(extractedHeadings);
  }, [content]);

  useEffect(() => {
    // Add IDs to headings in the content
    const contentElement = document.querySelector('.markdown-content');
    if (contentElement) {
      const headingElements = contentElement.querySelectorAll('h1, h2, h3');
      headingElements.forEach((heading, index) => {
        if (headings[index]) {
          heading.id = headings[index].id;
        }
      });
    }
  }, [headings]);

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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="table-of-contents"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="toc-header">
        <FaBookOpen className="toc-icon" />
        <h3>Table of Contents</h3>
      </div>
      
      <div className="toc-content">
        {headings.map((heading, index) => (
          <motion.div
            key={heading.id}
            className={`toc-item toc-level-${heading.level} ${
              activeSection === heading.id ? 'active' : ''
            }`}
            variants={itemVariants}
            onClick={() => scrollToSection(heading.id)}
          >
            {heading.level > 1 && <span className="toc-arrow">›</span>}
            <span className="toc-text">{heading.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TableOfContents;

