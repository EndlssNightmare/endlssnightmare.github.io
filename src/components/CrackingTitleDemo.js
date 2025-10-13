import React from 'react';
import CrackingTitle from './CrackingTitle';
import './CrackingTitle.css';

const CrackingTitleDemo = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
        Cracking Title Effect Demo
      </h1>
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        
        <div style={{
          padding: '2rem',
          border: '1px solid #444',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Full Effect (100% intensity, 2s duration):
          </h2>
          <CrackingTitle style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            TombWatcher Walkthrough
          </CrackingTitle>
        </div>

        <div style={{
          padding: '2rem',
          border: '1px solid #444',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Extended Duration (100% intensity, 3s duration):
          </h2>
          <CrackingTitle 
            intensity={1.0} 
            duration={3000}
            style={{ fontSize: '1.8rem', fontWeight: 'bold' }}
          >
            Fluffy Walkthrough
          </CrackingTitle>
        </div>

        <div style={{
          padding: '2rem',
          border: '1px solid #444',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Partial Effect (50% intensity):
          </h2>
          <CrackingTitle 
            intensity={0.5} 
            duration={1500}
            style={{ fontSize: '1.8rem', fontWeight: 'bold' }}
          >
            Puppy Walkthrough
          </CrackingTitle>
        </div>

        <div style={{
          padding: '2rem',
          border: '1px solid #444',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Long Duration Effect (4s duration):
          </h2>
          <CrackingTitle 
            intensity={1.0} 
            duration={4000}
            style={{ fontSize: '1.8rem', fontWeight: 'bold' }}
          >
            Wcorp Walkthrough
          </CrackingTitle>
        </div>

        <div style={{
          padding: '2rem',
          border: '1px solid #444',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
            Project Title Example:
          </h2>
          <CrackingTitle 
            intensity={1.0} 
            duration={2500}
            style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ecdc4' }}
          >
            V01 Cybersecurity Tools
          </CrackingTitle>
        </div>

      </div>

      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        border: '1px solid #666',
        borderRadius: '8px',
        background: 'rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        margin: '3rem auto 0'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#4ecdc4' }}>How to Use:</h3>
        <pre style={{ 
          background: 'rgba(0, 0, 0, 0.5)', 
          padding: '1rem', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.9rem'
        }}>
{`import CrackingTitle from './CrackingTitle';

// Basic usage
<CrackingTitle>TombWatcher Walkthrough</CrackingTitle>

// With custom intensity (0.0 to 1.0)
<CrackingTitle intensity={0.8}>
  Fluffy Walkthrough
</CrackingTitle>

// With custom duration (milliseconds)
<CrackingTitle duration={3000}>
  Puppy Walkthrough
</CrackingTitle>

// Combined props
<CrackingTitle intensity={0.5} duration={2500}>
  V01 Cybersecurity Tools
</CrackingTitle>`}
        </pre>
      </div>
    </div>
  );
};

export default CrackingTitleDemo;
