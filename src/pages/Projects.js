import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCode, FaSearch, FaFilter } from 'react-icons/fa';
import Card from '../components/Card';
import './Projects.css';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTech, setFilterTech] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);

  const projects = useMemo(() => [
    {
      id: 1,
      title: 'Knock-Tool',
      excerpt: 'A network reconnaissance tool designed for port knocking techniques and stealthy network enumeration. Features advanced scanning capabilities with customizable timing and protocol support.',
      date: 'Aug 10, 2025',
      tags: ['python', 'network', 'security'],
      image: '/images/projects/Knock-Tool.png',
      link: 'https://github.com/EndlssNightmare/Knock-Tool',
      github: 'https://github.com/EndlssNightmare/Knock-Tool',
      demo: null,
      category: 'project'
    },
    {
      id: 4,
      title: 'Digispark Scripts',
      excerpt: 'Collection of Arduino Digispark payloads and scripts for penetration testing and security research. Includes various USB attack vectors and automation scripts for ethical hacking assessments.',
      date: 'Aug 5, 2025',
      tags: ['arduino', 'usb', 'pentesting'],
      image: '/images/projects/digispark_scripts.png',
      link: 'https://github.com/EndlssNightmare/Digispark-scripts',
      github: 'https://github.com/EndlssNightmare/Digispark-scripts',
      demo: null,
      category: 'project'
    },
    {
      id: 5,
      title: 'MullvScript',
      excerpt: 'Automated VPN configuration and management script for Mullvad VPN. Streamlines the setup process and provides enhanced privacy features for secure network connections.',
      date: 'Aug 1, 2025',
      tags: ['bash', 'vpn'],
      image: '/images/projects/MullvScript.png',
      link: 'https://github.com/EndlssNightmare/MullvScript',
      github: 'https://github.com/EndlssNightmare/MullvScript',
      demo: null,
      category: 'project'
    },
    {
      id: 6,
      title: 'zsh-configs',
      excerpt: 'Custom zsh configuration files and aliases optimized for penetration testing workflows. Includes specialized functions for common security tools and enhanced terminal productivity features.',
      date: 'Jul 28, 2025',
      tags: ['zsh', 'shell', 'pentesting'],
      image: '/images/projects/zshconf.png',
      link: 'https://github.com/EndlssNightmare/zsh-configs',
      github: 'https://github.com/EndlssNightmare/zsh-configs',
      demo: null,
      category: 'project'
    }
  ], []);

  const allTechs = [...new Set(projects.flatMap(project => project.tags))];

  useEffect(() => {
    const filtered = projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTech = !filterTech || project.tags.includes(filterTech);
      return matchesSearch && matchesTech;
    });
    
    // Remove duplicates based on ID
    const uniqueFiltered = filtered.filter((project, index, self) => 
      index === self.findIndex(p => p.id === project.id)
    );
    
    setFilteredProjects(uniqueFiltered);
  }, [searchTerm, filterTech, projects]);

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

  return (
    <motion.div 
      className="projects-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="page-header" variants={itemVariants}>
        <div className="header-content">
          <FaCode className="header-icon" />
          <h1>Projects</h1>
        </div>
        <p className="page-description">
          Open source security tools, custom implementations, and innovative cybersecurity solutions.
        </p>
      </motion.div>

      <motion.div className="search-filter-section" variants={itemVariants}>
        <div className="search-container">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <FaFilter className="filter-icon" />
            <select
              value={filterTech}
              onChange={(e) => setFilterTech(e.target.value)}
              className="filter-select"
            >
              <option value="">All Technologies</option>
              {allTechs.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div className="projects-grid" variants={containerVariants}>
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                title={project.title}
                excerpt={project.excerpt}
                date={project.date}
                tags={project.tags}
                image={project.image}
                link={project.link}
                category={project.category}
                github={project.github}
                demo={project.demo}
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
              <FaCode className="no-results-icon" />
              <h3>No projects found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilterTech('');
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

export default Projects;
