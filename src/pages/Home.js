import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaSearch } from 'react-icons/fa';
import Card from '../components/Card';
import SEO from '../components/SEO';
import posts from '../data/posts';
import './Home.css';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = posts.filter(post =>
      post.title.toLowerCase().includes(term) ||
      post.excerpt.toLowerCase().includes(term) ||
      post.tags.some(tag => tag.toLowerCase().includes(term))
    );
    return filtered.filter((post, index, self) =>
      index === self.findIndex(p => p.id === post.id)
    );
  }, [searchTerm]);

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
    <>
      <SEO
        title="V01 - Cybersecurity Notes"
        description="V01's Cybersecurity Notes - Pentester, CTF player, ACCH Team. Explore my latest writeups, projects, and cybersecurity content."
        url="https://endlssightmare.com/"
      />
      <motion.div
        className="home-page"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
      <motion.div className="page-header" variants={itemVariants}>
        <div className="header-content">
          <FaClock className="header-icon" />
          <h1>Recent Posts</h1>
        </div>
      </motion.div>

      <motion.div className="search-filter-section" variants={itemVariants}>
        <div className="search-container">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </motion.div>

      <motion.div className="posts-grid" variants={containerVariants}>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                title={post.title}
                excerpt={post.excerpt}
                date={post.date}
                tags={post.tags}
                image={post.image}
                link={post.link}
                category={post.category}
                difficulty={post.difficulty}
                os={post.os}
                github={post.github}
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
              <FaSearch className="no-results-icon" />
              <h3>No posts found</h3>
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
    </>
  );
};

export default Home;
