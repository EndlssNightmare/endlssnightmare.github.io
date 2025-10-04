import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaFileAlt, FaCode } from 'react-icons/fa';
import Card from '../components/Card';
import './TagDetail.css';

const TagDetail = () => {
  const { tag } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  // All available posts data
  const allPosts = [
    {
      id: 10,
      title: 'Aria Walkthrough',
      excerpt: 'Aria Walkthrough - This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods.',
      date: 'Oct 04, 2025',
      tags: ['linux', 'hmv', 'steg', 'aria2c', 'json-rpc'],
      image: '/images/writeups/aria/machine.png',
      link: '/writeups/aria-walkthrough',
      category: 'writeup'
    },
    {
      id: 9,
      title: 'Puppy Walkthrough',
      excerpt: 'Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals GenericWrite on the Developers group, allowing the attacker to add the user and access the DEV share. A KeePass file harvested from DEV is cracked to recover additional credentials. A password-spraying and further enumeration lead to steph.cooper and extraction of DPAPI-protected secrets. Using steph.cooper_adm recovered credentials the box allows DCSync to dump the Administrator hash, enabling remote authentication and full domain compromise.',
      date: 'Sep 27, 2025',
      tags: ['htb', 'ad', 'dpapi', 'password-cracking', 'kerberos', 'smb', 'ldap', 'windows', 'dcsync'],
      image: '/images/writeups/puppy/machine.png',
      link: '/writeups/puppy-walkthrough',
      category: 'writeup'
    },
    {
      id: 8,
      title: 'Fluffy Walkthrough',
      excerpt: 'Fluffy is an easy-difficulty Windows machine designed around an assumed breach scenario, where credentials for a low-privileged user are provided. By exploiting CVE-2025-24071, the credentials of another low-privileged user can be obtained. Further enumeration reveals the existence of ACLs over the winrm_svc and ca_svc accounts. WinRM can then be used to log in to the target using the winrc_svc account. Exploitation of an Active Directory Certificate service (ESC16) using the ca_svc account is required to obtain access to the Administrator account.',
      date: 'Sep 20, 2025',
      tags: ['htb', 'ad', 'smb', 'ldap', 'windows', 'password-cracking', 'kerberoasting'],
      image: '/images/writeups/fluffy/machine.png',
      link: '/writeups/fluffy-walkthrough',
      category: 'writeup'
    },
    {
    id: 7,
    title: 'Wcorp Walkthrough',
    excerpt: 'A challenging Windows Active Directory environment featuring SMB enumeration, AS-REP roasting, Kerberoasting, and DCSync techniques. This writeup covers advanced lateral movement and privilege escalation methods.',
    date: 'Sep 05, 2025',
    tags: ['hc', 'smb', 'ad', 'windows', 'asreproast', 'dcsync', 'kerberoasting', 'password-cracking'],
    image: '/images/writeups/wcorp/machine.png',
    link: '/writeups/wcorp-walkthrough',
    category: 'writeup'
    },
    {
    id: 2,
    title: 'DC02 Walkthrough',
    excerpt: 'This Windows Domain Controller (DC01) in the SOUPEDECODE.LOCAL domain was discovered via internal network scanning. Enumeration revealed multiple Active Directory services and valid SMB credentials (charlie:charlie). AS-REP roasting against zximena448 yielded the password internet, granting Backup Operators group privileges.',
    date: 'Aug 20, 2025',
    tags: ["hmv", "windows", "ad", "asreproast", "dcsync", "backup-operators", "password-cracking", "smb", "ldap"],
    image: '/images/writeups/dc02/machine.png',
    link: '/writeups/dc02-walkthrough',
    category: 'writeup',
    os: 'Windows'
    },
    {
    id: 1,
    title: 'Knock-Tool',
    excerpt: 'A network reconnaissance tool designed for port knocking techniques and stealthy network enumeration. Features advanced scanning capabilities with customizable timing and protocol support.',
    date: 'May 05, 2024',
    tags: ['python', 'network', 'security'],
    image: '/images/projects/Knock-Tool.png',
    link: 'https://github.com/EndlssNightmare/Knock-Tool',
    category: 'project',
    github: 'https://github.com/EndlssNightmare/Knock-Tool'
    },
    {
    id: 4,
    title: 'Digispark Scripts',
    excerpt: 'Collection of Arduino Digispark payloads and scripts for penetration testing and security research. Includes various USB attack vectors and automation scripts for ethical hacking assessments.',
    date: 'Feb 03, 2025',
    tags: ['arduino', 'usb', 'pentesting'],
    image: '/images/projects/digispark_scripts.png',
    link: 'https://github.com/EndlssNightmare/Digispark-scripts',
    category: 'project',
    github: 'https://github.com/EndlssNightmare/Digispark-scripts'
    },
    {
    id: 5,
    title: 'MullvScript',
    excerpt: 'Automated VPN configuration and management script for Mullvad VPN. Streamlines the setup process and provides enhanced privacy features for secure network connections.',
    date: 'Feb 27, 2025',
    tags: ['bash', 'vpn'],
    image: '/images/projects/MullvScript.png',
    link: 'https://github.com/EndlssNightmare/MullvScript',
    category: 'project',
    github: 'https://github.com/EndlssNightmare/MullvScript'
    },
    {
    id: 6,
    title: 'zsh-configs',
    excerpt: 'Custom zsh configuration files and aliases optimized for penetration testing workflows. Includes specialized functions for common security tools and enhanced terminal productivity features.',
    date: 'Jul 28, 2025',
    tags: ['zsh', 'shell', 'pentesting'],
    image: '/images/projects/zshconf.png',
    link: 'https://github.com/EndlssNightmare/zsh-configs',
    category: 'project',
    github: 'https://github.com/EndlssNightmare/zsh-configs'
    }];

  // Filter posts that contain the selected tag
  const filteredPosts = allPosts.filter(post => 
    post.tags.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
  );
  
  // Remove duplicates based on ID
  const uniqueFilteredPosts = filteredPosts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );

  const tagData = {
    name: tag,
    count: uniqueFilteredPosts.length,
    posts: uniqueFilteredPosts
  };

  // Handle loading state
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading time to ensure smooth transitions
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
            // Get all unique tags from all posts
            const allTags = [...new Set(allPosts.flatMap(post => post.tags))];
            
            // Filter out the current tag
            const otherTags = allTags.filter(tagName => tagName.toLowerCase() !== tag.toLowerCase());
            
            // Sort tags alphabetically for consistent ordering
            const sortedTags = otherTags.sort();
            
            // Take only 6 tags
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
