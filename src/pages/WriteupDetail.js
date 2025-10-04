
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import './WriteupDetail.css';

// Import specific writeup components
import AriaWalkthrough from './writeups/aria/AriaWalkthrough';
import PuppyWalkthrough from './writeups/puppy/PuppyWalkthrough';
import FluffyWalkthrough from './writeups/fluffy/FluffyWalkthrough';
import WcorpWalkthrough from './writeups/Wcorp/WcorpWalkthrough';
import DC02Walkthrough from './writeups/dc02/DC02Walkthrough';

const WriteupDetail = () => {
  const { id } = useParams();
  const normalizedId = (id || '').toLowerCase();

  // Map of available writeups
  const writeupComponents = {
  'dc02-walkthrough': DC02Walkthrough,
    'wcorp-walkthrough': WcorpWalkthrough,
    'fluffy-walkthrough': FluffyWalkthrough,
      'puppy-walkthrough': PuppyWalkthrough,
      'aria-walkthrough': AriaWalkthrough
};

  // Get the component for this writeup
  const WriteupComponent = writeupComponents[normalizedId];

  // If writeup not found, show error
  if (!WriteupComponent) {
    return (
      <motion.div 
        className="writeup-detail-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="writeup-header">
          <Link to="/writeups" className="back-button">
            <FaArrowLeft />
            <span>Back to Writeups</span>
          </Link>
        </div>
        <div className="writeup-content">
          <h1>Writeup Not Found</h1>
          <p>The writeup "{id}" could not be found.</p>
          <p>Available writeups:</p>
          <ul>
            {Object.keys(writeupComponents).map(writeupId => (
              <li key={writeupId}>{writeupId}</li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }

  // Render the specific writeup component
  return <WriteupComponent />;
};

export default WriteupDetail;
