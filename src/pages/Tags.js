import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTags, FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Tags.css';

const Tags = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // All available posts data for counting
  const allPosts = [
    {
    id: 7,
    title: 'Wcorp Walkthrough',
    category: 'writeup',
    tags: ['hc', 'smb', 'ad', 'windows', 'asreproast', 'dcsync', 'kerberoasting', 'password-cracking']
    },
    {
    id: 1,
    title: 'DC02 Walkthrough',
    category: 'writeup',
    tags: ['hmv', 'windows', 'ad', 'asreproast', 'dcsync', 'backup-operators', 'password-cracking', 'smb', 'ldap']
    },
    {
    id: 1,
    title: 'Knock-Tool',
    excerpt: 'A network reconnaissance tool designed for port knocking techniques and stealthy network enumeration. Features advanced scanning capabilities with customizable timing and protocol support.',
    date: 'Aug 10, 2025',
    tags: ['python', 'network', 'security'],
    image: '/images/projects/Knock-Tool.png',
    link: 'https://github.com/EndlssNightmare/Knock-Tool',
    category: 'project'
    },
    {
    id: 4,
    title: 'Digispark Scripts',
    excerpt: 'Collection of Arduino Digispark payloads and scripts for penetration testing and security research. Includes various USB attack vectors and automation scripts for ethical hacking assessments.',
    date: 'Aug 5, 2025',
    tags: ['arduino', 'usb', 'pentesting'],
    image: '/images/projects/digispark_scripts.png',
    link: 'https://github.com/EndlssNightmare/Digispark-scripts',
    category: 'project'
    },
    {
    id: 5,
    title: 'MullvScript',
    excerpt: 'Automated VPN configuration and management script for Mullvad VPN. Streamlines the setup process and provides enhanced privacy features for secure network connections.',
    date: 'Aug 1, 2025',
    tags: ['bash', 'vpn'],
    image: '/images/projects/MullvScript.png',
    link: 'https://github.com/EndlssNightmare/MullvScript',
    category: 'project'
    },
    {
    id: 6,
    title: 'zsh-configs',
    excerpt: 'Custom zsh configuration files and aliases optimized for penetration testing workflows. Includes specialized functions for common security tools and enhanced terminal productivity features.',
    date: 'Jul 28, 2025',
    tags: ['zsh', 'shell', 'pentesting'],
    image: '/images/projects/zshconf.png',
    link: 'https://github.com/EndlssNightmare/zsh-configs',
    category: 'project'
    }];

  // Calculate actual tag counts
  const calculateTagCount = (tagName) => {
    return allPosts.filter(post => 
      Array.isArray(post.tags) && post.tags.some(postTag => postTag.toLowerCase() === tagName.toLowerCase())
    ).length;
  };

  // Generate tags dynamically from all posts
  const allTagNames = [...new Set(allPosts.flatMap(post => Array.isArray(post.tags) ? post.tags : []))];
  
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
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 }
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
              <div 
                className="tag-color-indicator"
                style={{ backgroundColor: tag.color }}
              />
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
