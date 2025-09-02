import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaTag } from 'react-icons/fa';
import './Card.css';

const Card = ({ title, excerpt, date, tags, image, link, category, os, github }) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Don't navigate if clicking on a tag or any link
    if (e.target.closest('.tag-badge') || e.target.closest('a')) {
      e.stopPropagation();
      return;
    }
    
    if (category === 'project') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else if (category === 'writeup') {
      navigate(link);
    }
  };

  const handleTagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    // Add a small delay to ensure smooth navigation
    setTimeout(() => {
      navigate(`/tags/${tag}`);
    }, 50);
  };

  const cardContent = (
    <motion.div
      className="card"
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3 }
      }}
      
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
                  <motion.div
                    key={index}
                    className="tag-badge"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleTagClick(e, tag)}
                  >
                    {tag}
                  </motion.div>
                ))}
                {tags.length > 3 && (
                  <motion.span
                    className="tag-badge more-tags"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 * 0.1, duration: 0.3 }}
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
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );

  // Always render directly, no Link wrapper
  return cardContent;
};

export default Card;
