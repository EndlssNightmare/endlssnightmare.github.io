import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTags, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import posts from '../data/posts';
import './Tags.css';

const Tags = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const calculateTagCount = (tagName) => {
    return posts.filter(post =>
      Array.isArray(post.tags) && post.tags.some(postTag => postTag.toLowerCase() === tagName.toLowerCase())
    ).length;
  };

  const allTagNames = [...new Set(posts.flatMap(post => Array.isArray(post.tags) ? post.tags : []))];

  const tags = allTagNames.map(tagName => ({
    name: tagName.toLowerCase(),
    count: calculateTagCount(tagName),
    color: '#3D0000'
  })).sort((a, b) => a.name.localeCompare(b.name));

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 20 }
    }
  };

  return (
    <motion.div
      className="tags-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="page-header" variants={itemVariants}>
        <div className="header-content">
          <FaTags className="header-icon" />
          <h1>Tags</h1>
        </div>
        <p className="page-description">
          Browse all technologies, tools, and methodologies used in cybersecurity projects and writeups.
        </p>
      </motion.div>

      <motion.div className="search-section" variants={itemVariants}>
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </motion.div>

      <motion.div className="tags-grid" variants={containerVariants}>
        {filteredTags.map((tag) => (
          <motion.div
            key={tag.name}
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to={`/tags/${tag.name}`} className="tag-card">
              <div className="tag-content">
                <h3 className="tag-name">{tag.name}</h3>
                <span className="tag-count">{tag.count} posts</span>
              </div>
              <motion.div
                className="tag-hover-effect"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filteredTags.length === 0 && (
        <motion.div
          className="no-results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="no-results-content">
            <FaTags className="no-results-icon" />
            <h3>No tags found</h3>
            <p>Try adjusting your search criteria.</p>
            <button
              className="clear-filters-btn"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          </div>
        </motion.div>
      )}


    </motion.div>
  );
};

export default Tags;
