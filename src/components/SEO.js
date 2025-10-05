import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "V01 - Cybersecurity Notes", 
  description = "V01's Cybersecurity Notes - Pentester, CTF player, ACCH Team",
  image = "https://endlssightmare.com/images/profile/profile.jpg",
  url = "https://endlssightmare.com/",
  type = "website",
  keywords = "cybersecurity, pentesting, CTF, hacking, security, notes, V01, ACCH"
}) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="V01" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="V01 Notes" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@v01_cyber" />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
      
      {/* Additional Open Graph tags for better compatibility */}
      <meta property="og:locale" content="en_US" />
      <meta property="og:updated_time" content={new Date().toISOString()} />
      
      {/* Additional Twitter tags */}
      <meta name="twitter:site" content="@v01_cyber" />
      <meta name="twitter:domain" content="endlssightmare.com" />
    </Helmet>
  );
};

export default SEO;


