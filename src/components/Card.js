import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaCalendar, FaTag } from 'react-icons/fa';
import './Card.css';

const Card = ({ title, excerpt, date, tags, image, link, category, os, github }) => {
  const handleCardClick = (e) => {
    // Don't navigate if clicking on a tag
    if (e.target.closest('.tag-badge')) {
      return;
    }
    
    if (category === 'project') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
    // For writeups, let the Link component handle navigation
  };

  const cardContent = (
    <motion.div
      className="card"
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-content">
        <div className="card-image-container">
          <img src={image} alt={title} className="card-image" />
          <motion.div 
            className="card-overlay"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overlay-content">
              <span className="category-badge">{category}</span>
            </div>
          </motion.div>
        </div>
        
        <div className="card-body">
          <h3 className="card-title">{title}</h3>
          
          <p className="card-excerpt">{excerpt}</p>
          
          <div className="card-meta">
            <div className="card-date">
              <FaCalendar className="meta-icon" />
              <span>{date}</span>
            </div>
            {os && (
              <div className="card-os">
                <img 
                  src={`/os-icons/${os}.png`} 
                  alt={`${os} Icon`} 
                  className="card-os-icon"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            {github && (
              <div className="card-github">
                <img 
                  src="/icons/github-mark-white.png" 
                  alt="GitHub Icon" 
                  className="card-github-icon"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          
          {tags && tags.length > 0 && (
            <div className="card-tags">
              <FaTag className="tags-icon" />
              <div className="tags-container">
                {tags.slice(0, 3).map((tag, index) => (
                  <Link key={index} to={`/tags/${tag}`} style={{ textDecoration: 'none' }}>
                    <motion.span
                      className="tag-badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.1 }}
                      style={{ cursor: 'pointer' }}
                    >
                      {tag}
                    </motion.span>
                  </Link>
                ))}
                {tags.length > 3 && (
                  <motion.span
                    className="tag-badge more-tags"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 3 * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                    style={{ cursor: 'pointer' }}
                  >
                    +{tags.length - 3}
                  </motion.span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <motion.div 
          className="card-hover-effect"
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );

  // Wrap in Link for writeups, render directly for projects
  if (category === 'writeup') {
    return (
      <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default Card;
