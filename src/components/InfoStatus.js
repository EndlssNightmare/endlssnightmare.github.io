import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import './InfoStatus.css';

const InfoStatus = ({ title, message, type = 'info' }) => {
  // Process bold text in message
  const processBoldText = (text) => {
    const parts = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add the bold text
      parts.push(
        <strong key={match.index}>
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`info-status info-status-${type}`}>
      <div className="info-status-icon">
        <FaInfoCircle />
      </div>
      <div className="info-status-content">
        <div className="info-status-title">{title}</div>
        <div className="info-status-message">{processBoldText(message)}</div>
      </div>
    </div>
  );
};

export default InfoStatus;
