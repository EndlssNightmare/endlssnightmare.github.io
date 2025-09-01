import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaKey, FaBox, FaServer, FaUsers } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const socialLinks = [
    { icon: FaGithub, url: 'https://github.com/EndlssNightmare', label: 'GitHub' },
    { icon: FaKey, url: 'https://keybase.io/endlssnightmare', label: 'Keybase' },
    { icon: FaBox, url: 'https://app.hackthebox.com/profile/782262', label: 'HackTheBox' },
    { icon: FaServer, url: 'https://hackmyvm.eu/profile/?user=V01', label: 'HackMyVM' },
    { icon: FaUsers, url: 'https://app.hackingclub.com/profile/user/20057', label: 'HackingClub' }
  ];

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
            <motion.div 
              className="avatar-glow"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(255, 0, 0, 0.3)",
                  "0 0 40px rgba(255, 0, 0, 0.5)",
                  "0 0 20px rgba(255, 0, 0, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          <motion.h2 
            className="profile-name"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            V01
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
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: 0.7 + index * 0.1, 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                whileHover={{ 
                  scale: 1.2, 
                  color: 'var(--primary-color)',
                  y: -3,
                  transition: {
                    duration: 0.15  // Zoom rápido ao entrar (0.15s)
                  }
                }}
                whileTap={{ 
                  scale: 0.9,
                  transition: {
                    duration: 0.1
                  }
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
