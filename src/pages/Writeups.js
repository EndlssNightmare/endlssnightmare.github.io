import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaFileAlt, FaSearch, FaFilter } from 'react-icons/fa';
import Card from '../components/Card';
import './Writeups.css';

const Writeups = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filteredWriteups, setFilteredWriteups] = useState([]);

  // Writeups data
  const writeups = useMemo(() => [
    {
      id: 9,
      title: 'Puppy Walkthrough',
      excerpt: 'Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals GenericWrite on the Developers group, allowing the attacker to add the user and access the DEV share. A KeePass file harvested from DEV is cracked to recover additional credentials. A password-spraying and further enumeration lead to steph.cooper and extraction of DPAPI-protected secrets. Using steph.cooper_adm recovered credentials the box allows DCSync to dump the Administrator hash, enabling remote authentication and full domain compromise.',
      date: 'Sep 27, 2025',
      tags: ['Htb', 'Ad', 'DPAPI', 'Password-Cracking', 'Kerberos', 'Smb', 'Ldap', 'Windows', 'Dcsync'],
      image: '/images/writeups/puppy/machine.png',
      link: '/writeups/puppy-walkthrough',
      difficulty: 'Medium',
      category: 'writeup',
      os: 'Windows'
    },
    {
      id: 8,
      title: 'Fluffy Walkthrough',
      excerpt: 'Fluffy is an easy-difficulty Windows machine designed around an assumed breach scenario, where credentials for a low-privileged user are provided. By exploiting CVE-2025-24071, the credentials of another low-privileged user can be obtained. Further enumeration reveals the existence of ACLs over the winrm_svc and ca_svc accounts. WinRM can then be used to log in to the target using the winrc_svc account. Exploitation of an Active Directory Certificate service (ESC16) using the ca_svc account is required to obtain access to the Administrator account.',
      date: 'Sep 20, 2025',
      tags: ['Htb', 'Ad', 'Smb', 'Ldap', 'Windows', 'Password-Cracking', 'Kerberoasting'],
      image: '/images/writeups/fluffy/machine.png',
      link: '/writeups/fluffy-walkthrough',
      difficulty: 'Easy',
      category: 'writeup',
      os: 'Windows'
    },
    {
    id: 7,
    title: 'Wcorp Walkthrough',
    excerpt: 'A challenging Windows Active Directory environment featuring SMB enumeration, AS-REP roasting, Kerberoasting, and DCSync techniques. This writeup covers advanced lateral movement and privilege escalation methods.',
    date: 'Sep 05, 2025',
    tags: ['hc', 'smb', 'ad', 'windows', 'asreproast', 'dcsync', 'kerberoasting', 'password-cracking'],
    image: '/images/writeups/wcorp/machine.png',
    link: '/writeups/wcorp-walkthrough',
    difficulty: 'Hard',
    category: 'writeup',
    os: 'Windows'
    },
    {
    id: 1,
    title: 'DC02 Walkthrough',
    excerpt: 'This Windows Domain Controller (DC01) in the SOUPEDECODE.LOCAL domain was discovered via internal network scanning. Enumeration revealed multiple Active Directory services and valid SMB credentials (charlie:charlie). AS-REP roasting against zximena448 yielded the password internet, granting Backup Operators group privileges.',
    date: 'Aug 20, 2025',
    tags: ["hmv", "windows", "ad", "asreproast", "dcsync", "backup-operators", "password-cracking", "smb", "ldap"],
    image: '/images/writeups/dc02/machine.png',
    link: '/writeups/dc02-walkthrough',
    difficulty: 'Medium',
    category: 'writeup',
    os: 'Windows'
    }], []);

  const allTags = [...new Set(writeups.flatMap(writeup => writeup.tags))];

  useEffect(() => {
    const filtered = writeups.filter(writeup => {
      const matchesSearch = writeup.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           writeup.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !filterTag || writeup.tags.includes(filterTag);
      return matchesSearch && matchesTag;
    });
    
    // Remove duplicates based on ID
    const uniqueFiltered = filtered.filter((writeup, index, self) => 
      index === self.findIndex(w => w.id === writeup.id)
    );
    
    setFilteredWriteups(uniqueFiltered);
  }, [searchTerm, filterTag, writeups]);

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
    <motion.div 
      className="writeups-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="page-header" variants={itemVariants}>
        <div className="header-content">
          <FaFileAlt className="header-icon" />
          <h1>Writeups</h1>
        </div>
        <p className="page-description">
          Detailed walkthroughs and analysis of cybersecurity challenges, CTF solutions, and penetration testing methodologies.
        </p>
      </motion.div>

      <motion.div className="search-filter-section" variants={itemVariants}>
        <div className="search-container">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search writeups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <FaFilter className="filter-icon" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="filter-select"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div className="writeups-grid" variants={containerVariants}>
        {filteredWriteups.length > 0 ? (
          filteredWriteups.map((writeup, index) => (
            <motion.div
              key={writeup.id}
              variants={itemVariants}

              transition={{ duration: 0.3 }}
            >
              <Card
                title={writeup.title}
                excerpt={writeup.excerpt}
                date={writeup.date}
                tags={writeup.tags}
                image={writeup.image}
                link={writeup.link}
                category={writeup.category}
                difficulty={writeup.difficulty}
                os={writeup.os}
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
              <FaFileAlt className="no-results-icon" />
              <h3>No writeups found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilterTag('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>


    </motion.div>
  );
};

export default Writeups;
