import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "V01 - Cybersecurity Portfolio", 
  description = "V01's Cybersecurity Portfolio - Pentester, CTF player, ACCH Team",
  image = "https://endlssightmare.com/images/profile/profile.jpg",
  url = "https://endlssightmare.com/",
  type = "website",
  keywords = "cybersecurity, pentesting, CTF, hacking, security, portfolio, V01, ACCH"
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
      <meta property="og:site_name" content="V01 Portfolio" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:creator" content="@v01_cyber" />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;


