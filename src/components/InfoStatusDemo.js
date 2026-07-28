import React from 'react';
import InfoStatus from './InfoStatus';
import './InfoStatus.css';

const InfoStatusDemo = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>InfoStatus Component Examples</h2>
      
      <InfoStatus 
        title="Info Status:" 
        message="As is common in real life Windows pentests, you will start the Fluffy box with credentials for the following account: j.fleischman / J0elTHEM4n1990!" 
      />
      
      <InfoStatus 
        title="Warning:" 
        message="This CVE-2025-24071 exploit requires careful timing and social engineering to be successful. The target user must open the malicious ZIP file in Windows File Explorer." 
        type="warning" 
      />
      
      <InfoStatus 
        title="Success:" 
        message="Successfully compromised the p.agila account! This gives us access to additional Active Directory privileges and moves us closer to domain compromise." 
        type="success" 
      />
      
      <InfoStatus 
        title="Error:" 
        message="Failed to authenticate with the provided credentials. Please verify the username and password are correct." 
        type="error" 
      />
      
      <InfoStatus 
        title="Tip:" 
        message="Remember to always document your findings and maintain a clear chain of evidence during penetration testing." 
        type="info" 
      />
    </div>
  );
};

export default InfoStatusDemo;
