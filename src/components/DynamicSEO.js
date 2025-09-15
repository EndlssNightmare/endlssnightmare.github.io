import React from 'react';
import SEO from './SEO';

const DynamicSEO = ({ type, data }) => {
  const getSEOData = () => {
    switch (type) {
      case 'writeup':
        return {
          title: `${data.title} - V01 Cybersecurity Writeup`,
          description: data.excerpt || `Detailed walkthrough of ${data.title} - ${data.difficulty} difficulty ${data.os_type} machine`,
          image: data.image_url || 'https://endlssightmare.com/images/profile/profile.jpg',
          url: `https://endlssightmare.com/writeups/${data.id}`,
          keywords: `${data.tags?.join(', ')}, writeup, walkthrough, cybersecurity, ${data.os_type?.toLowerCase()}, ${data.difficulty?.toLowerCase()}`
        };
      
      case 'project':
        return {
          title: `${data.title} - V01 Cybersecurity Project`,
          description: data.excerpt || `Cybersecurity project: ${data.title}`,
          image: data.image || 'https://endlssightmare.com/images/profile/profile.jpg',
          url: `https://endlssightmare.com/projects/${data.id}`,
          keywords: `${data.tags?.join(', ')}, project, cybersecurity, github, open source`
        };
      
      case 'tag':
        return {
          title: `${data.tag} - V01 Cybersecurity Content`,
          description: `Explore all ${data.tag} related content on V01's cybersecurity portfolio`,
          image: 'https://endlssightmare.com/images/profile/profile.jpg',
          url: `https://endlssightmare.com/tags/${data.tag}`,
          keywords: `${data.tag}, cybersecurity, content, portfolio`
        };
      
      default:
        return {
          title: "V01 - Cybersecurity Portfolio",
          description: "V01's Cybersecurity Portfolio - Pentester, CTF player, ACCH Team",
          image: "https://endlssightmare.com/images/profile/profile.jpg",
          url: "https://endlssightmare.com/",
          keywords: "cybersecurity, pentesting, CTF, hacking, security, portfolio, V01, ACCH"
        };
    }
  };

  const seoData = getSEOData();

  return <SEO {...seoData} />;
};

export default DynamicSEO;

