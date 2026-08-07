import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaFileAlt, FaCode } from 'react-icons/fa';
import Card from '../components/Card';
import posts from '../data/posts';
import './TagDetail.css';

const TagDetail = () => {
  const { tag } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const filteredPosts = posts.filter(post =>
    post.tags.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
  );

  const uniqueFilteredPosts = filteredPosts.filter((post, index, self) =>
    index === self.findIndex(p => p.id === post.id)
  );

  const tagData = {
    name: tag,
    count: uniqueFilteredPosts.length,
    posts: uniqueFilteredPosts
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [tag]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  if (isLoading) {
    return (
      <motion.div
        className="tag-detail-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading tag content...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="tag-detail-page"
      key={tag}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="tag-header">
        <Link to="/tags" className="back-button">
          <FaArrowLeft />
          <span>Back to Tags</span>
        </Link>

        <motion.div
          className="tag-title-section"
          variants={itemVariants}
        >
          <div className="tag-badge-large">
            {tagData.name}
          </div>

          <div className="tag-stats">
            <div className="stat-item">
              <FaFileAlt />
              <span>{tagData.count} posts</span>
            </div>
            <div className="stat-item">
              <FaCode />
              <span>{new Set(uniqueFilteredPosts.map(post => post.category)).size} categories</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="tag-posts"
        variants={containerVariants}
      >

        <div className="posts-grid" key={`posts-${tag}`}>
          {tagData.posts.map((post, index) => (
            <motion.div
              key={`${tag}-${post.id}`}
              variants={itemVariants}
              transition={{ duration: 0.3 }}
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
          ))}
        </div>
      </motion.div>

      <motion.div
        className="related-tags"
        variants={itemVariants}
        key={`related-tags-${tag}`}
      >
        <h3>Related Tags</h3>
        <div className="related-tags-grid">
          {(() => {
            const allTags = [...new Set(posts.flatMap(post => post.tags.map(t => t.toLowerCase())))];
            const otherTags = allTags.filter(tagName => tagName !== tag.toLowerCase());
            const sortedTags = otherTags.sort();
            const selectedTags = sortedTags.slice(0, 6);

            return selectedTags.map((relatedTag, index) => (
              <motion.div
                key={`${tag}-${relatedTag}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                layout
              >
                <Link to={`/tags/${relatedTag}`} className="related-tag">
                  #{relatedTag}
                </Link>
              </motion.div>
            ));
          })()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TagDetail;
