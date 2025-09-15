import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaKey, FaBox, FaServer, FaUsers } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const [displayedText, setDisplayedText] = useState('');
  
  const targetName = 'V01';
  const hashChars = 'abcdef0123456789';
  const socialLinks = [
    { icon: FaGithub, url: 'https://github.com/EndlssNightmare', label: 'GitHub' },
    { icon: FaKey, url: 'https://keybase.io/endlssnightmare', label: 'Keybase' },
    { icon: FaBox, url: 'https://app.hackthebox.com/profile/782262', label: 'HackTheBox' },
    { icon: FaServer, url: 'https://hackmyvm.eu/profile/?user=V01', label: 'HackMyVM' },
    { icon: FaUsers, url: 'https://app.hackingclub.com/profile/user/20057', label: 'HackingClub' }
  ];

  // Hash to name transformation effect
  useEffect(() => {
    // Start with random hash
    let currentHash = generateRandomHash(targetName.length);
    setDisplayedText(currentHash);
    
    let crackProgress = 0;
    
    // Fast randomization timer
    const randomizeTimer = setInterval(() => {
      // Generate new random hash for unrevealed characters
      let newText = '';
      for (let i = 0; i < targetName.length; i++) {
        const charactersToReveal = Math.floor((crackProgress / 100) * targetName.length);
        if (i < charactersToReveal) {
          newText += targetName[i]; // Show target character
        } else {
          newText += generateRandomHash(1); // Show random hash character
        }
      }
      setDisplayedText(newText);
    }, 50); // Fast randomization every 50ms
    
    // Slow cracking timer
    const crackTimer = setInterval(() => {
      crackProgress += Math.random() * 3 + 1; // Very slow progress between 1-4%
      
      if (crackProgress >= 100) {
        // Complete transformation
        setDisplayedText(targetName);
        clearInterval(randomizeTimer);
        clearInterval(crackTimer);
      }
    }, 300); // Slow cracking every 300ms

    return () => {
      clearInterval(randomizeTimer);
      clearInterval(crackTimer);
    };
  }, []);

  // Generate random hash characters for display
  const generateRandomHash = (length) => {
    let hash = '';
    for (let i = 0; i < length; i++) {
      hash += hashChars[Math.floor(Math.random() * hashChars.length)];
    }
    return hash;
  };


  return (
    <motion.aside 
      className="sidebar"
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >

      <div className="sidebar-content">
        <motion.div 
          className="profile-section"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div 
            className="profile-avatar-container"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            
            <img 
              src="/images/profile/profile.jpg" 
              alt="V01" 
              className="profile-avatar"
            />
          </motion.div>
          
          <motion.h2 
            className="profile-name"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="hash-crack-container">
              <span className="hash-crack-text">
                {displayedText}
              </span>
            </div>
          </motion.h2>
          
          <motion.p 
            className="profile-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Pentester, CTF player
          </motion.p>
          
          <motion.p 
            className="profile-team"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            ACCH Team
          </motion.p>
        </motion.div>

        <motion.div 
          className="social-links"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <motion.a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
                transition={{ 
                  delay: 0.7 + index * 0.1, 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                whileHover={{ 
                  color: 'var(--primary-color)',
                  y: -5,
                  scale: 1.05,
                  rotateX: 5,
                  transition: {
                    duration: 0.2,
                    type: "spring",
                    stiffness: 400
                  }
                }}
                whileTap={{ 
                  scale: 0.95,
                  rotateX: -5
                }}
              >
                <Icon />
                <span className="social-label">{social.label}</span>
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
