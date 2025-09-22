import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import './InfoStatus.css';

const InfoStatus = ({ title, message, type = 'info' }) => {
  return (
    <div className={`info-status info-status-${type}`}>
      <div className="info-status-icon">
        <FaInfoCircle />
      </div>
      <div className="info-status-content">
        <div className="info-status-title">{title}</div>
        <div className="info-status-message">{message}</div>
      </div>
    </div>
  );
};

export default InfoStatus;
