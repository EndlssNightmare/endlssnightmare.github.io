import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaFileAlt, FaSearch } from 'react-icons/fa';
import Card from '../components/Card';
import posts from '../data/posts';
import './Writeups.css';

const Writeups = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const writeups = useMemo(() =>
    posts.filter(p => p.category === 'writeup'), []
  );

  const filteredWriteups = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return writeups.filter(writeup =>
      writeup.title.toLowerCase().includes(term) ||
      writeup.excerpt.toLowerCase().includes(term) ||
      writeup.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }, [searchTerm, writeups]);

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
      className="writeups-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="page-header" variants={itemVariants}>
        <div className="header-content">
          <FaFileAlt className="header-icon" />
          <h1>Writeups</h1>
        </div>
        <p className="page-description">
          Detailed walkthroughs and analysis of cybersecurity challenges, CTF solutions, and penetration testing methodologies.
        </p>
      </motion.div>

      <motion.div className="search-filter-section" variants={itemVariants}>
        <div className="search-container">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search writeups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

      </motion.div>

      <motion.div className="writeups-grid" variants={containerVariants}>
        {filteredWriteups.length > 0 ? (
          filteredWriteups.map((writeup, index) => (
            <motion.div
              key={writeup.id}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                title={writeup.title}
                excerpt={writeup.excerpt}
                date={writeup.date}
                tags={writeup.tags}
                image={writeup.image}
                link={writeup.link}
                category={writeup.category}
                difficulty={writeup.difficulty}
                os={writeup.os}
              />
            </motion.div>
          ))
        ) : (
          <motion.div
            className="no-results"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="no-results-content">
              <FaFileAlt className="no-results-icon" />
              <h3>No writeups found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              <button
                className="clear-filters-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>


    </motion.div>
  );
};

export default Writeups;
