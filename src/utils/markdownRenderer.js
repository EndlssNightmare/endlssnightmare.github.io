import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck } from 'react-icons/fa';
import CodeBlock from '../components/CodeBlock';

/**
 * Renders markdown content with enhanced code blocks that include copy functionality
 * @param {string} content - The markdown content to render
 * @returns {Array} Array of React elements
 */
export const renderMarkdownWithCopyButtons = (content) => {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i}>{line.substring(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{line.substring(4)}</h3>);
    } else if (line.startsWith('```')) {
      // Handle code blocks with copy functionality
      const language = line.substring(3).trim();
      const codeLines = [];
      i++;
      
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      elements.push(
        <CodeBlock key={i} language={language}>
          {codeLines.join('\n')}
        </CodeBlock>
      );
    } else if (line.startsWith('![') && line.includes('](') && line.endsWith(')')) {
      const altText = line.match(/\[(.*?)\]/)[1];
      const imageSrc = line.match(/\((.*?)\)/)[1];
      elements.push(
        <div key={i} className="image-container">
          <img src={imageSrc} alt={altText} className="content-image" />
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else {
      // Process inline markdown
      const processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>'); // Inline code
      
      elements.push(
        <p key={i} dangerouslySetInnerHTML={{ __html: processedLine }} />
      );
    }
    
    i++;
  }
  
  return elements;
};

/**
 * Extracts all code blocks from markdown content
 * @param {string} content - The markdown content
 * @returns {Array} Array of objects with language and code content
 */
export const extractCodeBlocks = (content) => {
  const codeBlocks = [];
  const lines = content.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (line.startsWith('```')) {
      const language = line.substring(3).trim();
      const codeLines = [];
      i++;
      
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      codeBlocks.push({
        language,
        code: codeLines.join('\n')
      });
    }
    
    i++;
  }
  
  return codeBlocks;
};

/**
 * Creates a "Copy All Code" button that copies all code blocks from the content
 * @param {string} content - The markdown content
 * @returns {Function} A function that returns a React component for the copy all button
 */
export const createCopyAllButton = (content) => {
  const codeBlocks = extractCodeBlocks(content);
  
  if (codeBlocks.length === 0) {
    return null;
  }
  
  return () => {
    const [copied, setCopied] = useState(false);
    
    const handleCopyAll = async () => {
      const allCode = codeBlocks
        .map(block => {
          if (block.language) {
            return `# ${block.language}\n${block.code}`;
          }
          return block.code;
        })
        .join('\n\n');
      
      try {
        await navigator.clipboard.writeText(allCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = allCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    };
    
    return (
      <motion.button
        className={`copy-all-button ${copied ? 'copied' : ''}`}
        onClick={handleCopyAll}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {copied ? (
          <>
            <FaCheck />
            <span>All Code Copied!</span>
          </>
        ) : (
          <>
            <FaCopy />
            <span>Copy All Code ({codeBlocks.length} blocks)</span>
          </>
        )}
      </motion.button>
    );
  };
};
