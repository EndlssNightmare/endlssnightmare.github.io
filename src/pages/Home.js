import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaClock, FaSearch, FaFilter } from 'react-icons/fa';
import Card from '../components/Card';
import SEO from '../components/SEO';
import './Home.css';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);

  // Recent posts data
  const recentPosts = useMemo(() => [
    {
      id: 10,
      title: 'Aria Walkthrough',
      excerpt: 'Aria Walkthrough - This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods.',
      date: 'Oct 04, 2025',
      category: 'writeup',
      tags: ['linux', 'hmv', 'steg', 'aria2c', 'json-rpc'],
      image: '/images/writeups/aria/machine.png',
      link: '/writeups/aria-walkthrough',
      os: 'Linux'
    },
    {
      id: 9,
      title: 'Puppy Walkthrough',
      excerpt: 'Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals GenericWrite on the Developers group, allowing the attacker to add the user and access the DEV share. A KeePass file harvested from DEV is cracked to recover additional credentials. A password-spraying and further enumeration lead to steph.cooper and extraction of DPAPI-protected secrets. Using steph.cooper_adm recovered credentials the box allows DCSync to dump the Administrator hash, enabling remote authentication and full domain compromise.',
      date: 'Sep 27, 2025',
      category: 'writeup',
      tags: ['htb', 'ad', 'dpapi', 'password-cracking', 'kerberos', 'smb', 'ldap', 'windows', 'dcsync'],
      image: '/images/writeups/puppy/machine.png',
      link: '/writeups/puppy-walkthrough',
      os: 'Windows'
    },
    {
      id: 8,
      title: 'Fluffy Walkthrough',
      excerpt: 'Fluffy is an easy-difficulty Windows machine designed around an assumed breach scenario, where credentials for a low-privileged user are provided. By exploiting CVE-2025-24071, the credentials of another low-privileged user can be obtained. Further enumeration reveals the existence of ACLs over the winrm_svc and ca_svc accounts. WinRM can then be used to log in to the target using the winrc_svc account. Exploitation of an Active Directory Certificate service (ESC16) using the ca_svc account is required to obtain access to the Administrator account.',
      date: 'Sep 20, 2025',
      category: 'writeup',
      tags: ['htb', 'ad', 'smb', 'ldap', 'windows', 'password-cracking', 'kerberoasting'],
      image: '/images/writeups/fluffy/machine.png',
      link: '/writeups/fluffy-walkthrough',
      os: 'Windows'
    },
    {
    id: 7,
    title: 'Wcorp Walkthrough',
    excerpt: 'A challenging Windows Active Directory environment featuring SMB enumeration, AS-REP roasting, Kerberoasting, and DCSync techniques. This writeup covers advanced lateral movement and privilege escalation methods.',
    date: 'Sep 05, 2025',
    category: 'writeup',
    tags: ['hc', 'smb', 'ad', 'windows', 'asreproast', 'dcsync', 'kerberoasting', 'password-cracking'],
    image: '/images/writeups/wcorp/machine.png',
    link: '/writeups/wcorp-walkthrough',
    os: 'Windows'
    },
    {
    id: 2,
    title: 'DC02 Walkthrough',
    excerpt: 'This Windows Domain Controller (DC01) in the SOUPEDECODE.LOCAL domain was discovered via internal network scanning. Enumeration revealed multiple Active Directory services and valid SMB credentials (charlie:charlie). AS-REP roasting against zximena448 yielded the password internet, granting Backup Operators group privileges.',
    date: 'Aug 20, 2025',
    category: 'writeup',
    tags: ["hmv", "windows", "ad", "asreproast", "dcsync", "backup-operators", "password-cracking", "smb", "ldap"],
    image: '/images/writeups/dc02/machine.png',
    link: '/writeups/dc02-walkthrough',
    os: 'Windows'
    },
    {
      id: 6,
      title: 'zsh-configs',
      excerpt: 'Custom zsh configuration files and aliases optimized for penetration testing workflows. Includes specialized functions for common security tools and enhanced terminal productivity features.',
      date: 'Jul 28, 2025',
      category: 'project',
      tags: ['zsh', 'shell', 'pentesting'],
      image: '/images/projects/zshconf.png',
      link: 'https://github.com/EndlssNightmare/zsh-configs',
      github: 'https://github.com/EndlssNightmare/zsh-configs'
    },
    {
      id: 5,
      title: 'MullvScript',
      excerpt: 'Automated VPN configuration and management script for Mullvad VPN. Streamlines the setup process and provides enhanced privacy features for secure network connections.',
      date: 'Feb 27, 2025',
      category: 'project',
      tags: ['bash', 'vpn'],
      image: '/images/projects/MullvScript.png',
      link: 'https://github.com/EndlssNightmare/MullvScript',
      github: 'https://github.com/EndlssNightmare/MullvScript'
    },
    {
    id: 4,
    title: 'Digispark Scripts',
    excerpt: 'Collection of Arduino Digispark payloads and scripts for penetration testing and security research. Includes various USB attack vectors and automation scripts for ethical hacking assessments.',
    date: 'Feb 03, 2025',
    category: 'project',
    tags: ['arduino', 'usb', 'pentesting'],
    image: '/images/projects/digispark_scripts.png',
    link: 'https://github.com/EndlssNightmare/Digispark-scripts',
    github: 'https://github.com/EndlssNightmare/Digispark-scripts'
    },
    {
      id: 1,
      title: 'Knock-Tool',
      excerpt: 'A network reconnaissance tool designed for port knocking techniques and stealthy network enumeration. Features advanced scanning capabilities with customizable timing and protocol support.',
      date: 'May 05, 2024',
      category: 'project',
      tags: ['python', 'network', 'security'],
      image: '/images/projects/Knock-Tool.png',
      link: 'https://github.com/EndlssNightmare/Knock-Tool',
      github: 'https://github.com/EndlssNightmare/Knock-Tool'
      }], []);

  useEffect(() => {
    const filtered = recentPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || post.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
    
    // Remove duplicates based on ID
    const uniqueFiltered = filtered.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    );
    
    setFilteredPosts(uniqueFiltered);
  }, [searchTerm, filterCategory, recentPosts]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
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
          
          <div className="filter-container">
            <FaFilter className="filter-icon" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="writeup">Writeups</option>
              <option value="project">Projects</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div className="posts-grid" variants={containerVariants}>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
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
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                }}
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
