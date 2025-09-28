import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck } from 'react-icons/fa';
import './CodeBlock.css';

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = children;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="code-block-container">
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="terminal-button close"></div>
          <div className="terminal-button minimize"></div>
          <div className="terminal-button maximize"></div>
        </div>
        <div className="terminal-title">
          <span className="terminal-icon">{"</>"}</span>
          <span className="terminal-text">Shell</span>
        </div>
        <motion.button
          className={`copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {copied ? <FaCheck /> : <FaCopy />}
        </motion.button>
      </div>
      <div className="terminal-content">
        <pre className="code-block">
          <code className={`language-${language}`}>
            {children}
          </code>
        </pre>
        <div className="terminal-scrollbar">
          <div className="scrollbar-track">
            <div className="scrollbar-thumb"></div>
          </div>
          <div className="scrollbar-arrows">
            <div className="scrollbar-arrow left">◀</div>
            <div className="scrollbar-arrow right">▶</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
