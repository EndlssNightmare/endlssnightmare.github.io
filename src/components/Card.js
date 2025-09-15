import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaTag } from 'react-icons/fa';
import './Card.css';

const Card = ({ title, excerpt, date, tags, image, link, category, os, github }) => {
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleCardClick = (e) => {
    // Don't navigate if clicking on a tag or any link
    if (e.target.closest('.tag-badge') || e.target.closest('a')) {
      e.stopPropagation();
      return;
    }
    
    // Criar efeito ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remover ripple após animação
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
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
          {imageLoading && !imageError && (
            <div className="card-image card-image-loading" />
          )}
          <img 
            src={image} 
            alt={title} 
            className={`card-image ${imageLoading ? 'hidden' : ''}`}
            onError={(e) => {
              console.error(`Failed to load image: ${image}`);
              setImageError(true);
              setImageLoading(false);
            }}
            onLoad={() => {
              console.log(`Successfully loaded image: ${image}`);
              setImageLoading(false);
            }}
          />
          <motion.div 
            className="card-overlay"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glitch-effect">
              <div className="scan-lines"></div>
              <div className="glitch-text" data-text={category.toUpperCase()}>{category.toUpperCase()}</div>
              <div className="digital-noise"></div>
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
        
        {/* Efeitos ripple */}
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="ripple-effect"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </div>
    </motion.div>
  );

  // Always render directly, no Link wrapper
  return cardContent;
};

export default Card;
