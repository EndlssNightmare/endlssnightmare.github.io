import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaFileAlt, FaSearch } from 'react-icons/fa';
import Card from '../components/Card';
import './Writeups.css';

const Writeups = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Writeups data
  const writeups = useMemo(() => [
    
    
    
    
    {
      id: 19,
      title: 'Phantom Walkthrough',
      excerpt: 'Phantom is a medium difficulty Windows Active Directory machine. Guest SMB access reveals a PDF containing a default password, which is sprayed to gain initial credentials. A VeraCrypt-encrypted backup is cracked with hashcat, exposing a VyOS configuration with service account credentials. WinRM access as svc_sspr allows resetting a user password via SSPR, enabling a Resource Based Constrained Delegation (RBCD) attack to impersonate Administrator and achieve full domain compromise.',
      date: 'Jul 28, 2026',
      tags: ['Htb', 'Windows', 'Ad', 'Smb', 'Password-Spraying', 'Password-Cracking', 'RBCD', 'VeraCrypt', 'Kerberos'],
      image: '/images/writeups/phantom/machine.png',
      link: '/writeups/phantom-walkthrough',
      difficulty: 'Medium',
      category: 'writeup',
      os: 'Windows'
    },{
      id: 18,
      title: 'Pycrt Walkthrough',
      excerpt: 'Pycrt is a medium difficulty Hack My VM machine featuring IRC enumeration, Local File Inclusion via a hidden PHP endpoint, a custom base64-reversed command injection backdoor, lateral movement through sudo weechat and an IRC bot that executes decimal-encoded commands, and privilege escalation via sudo gtkwave with a malicious Tcl script.',
      date: 'May 14, 2026',
      tags: ['Hmv', 'Linux', 'IRC', 'LFI', 'Path-Traversal', 'Sudo-Weechat', 'Sudo-Gtkwave'],
      image: '/images/writeups/pycrt/machine.png',
      link: '/writeups/pycrt-walkthrough',
      difficulty: 'Medium',
      category: 'writeup',
      os: 'Linux'
    },{
      id: 17,
      title: 'Principal Walkthrough',
      excerpt: 'Principal is a medium difficulty machine that is themed around misplaced cryptographic trust. The foothold exploits CVE-2026-29000, an authentication bypass in pac4j-jwts JwtAuthenticator where a PlainJWT wrapped inside a valid JWE envelope bypasses signature verification entirely. After forging an admin token and extracting SSH credentials from the corporate dashboard, privilege escalation abuses an SSH CA configuration that trusts any certificate signed by the CA without validating the principal (username) claim, allowing us to forge a certificate for root. Both attack stages exploit the same class of flaw: a system that verifies the cryptographic envelope but never validates the identity claim inside it.',
      date: 'Mar 16, 2026',
      tags: ['Htb', 'Linux', 'Jwt', 'Pac4j', 'Ca'],
      image: '/images/writeups/principal/machine.png',
      link: '/writeups/principal-walkthrough',
      difficulty: 'Medium',
      category: 'writeup',
      os: 'Linux'
    },{
      id: 16,
      title: 'Expressway Walkthrough',
      excerpt: 'Expressway is an easy-difficulty Linux machine that demonstrates enumeration and exploits the IKE service, a component of the IPsec framework. Upon leaking the Pre-Shared key of the service and cracking it, the retrieved clear-text credentials are used to access the target via SSH. For privilege escalation, CVE-2025-32462 is exploited to get a privileged shell as the root user.',
      date: 'Mar 07, 2026',
      tags: ['Ike', 'Htb', 'Linux', 'Ipsec', 'Sudo_chwoot'],
      image: '/images/writeups/expressway/machine.png',
      link: '/writeups/expressway-walkthrough',
      difficulty: 'Easy',
      category: 'writeup',
      os: 'Linux'
    },{
      id: 15,
      title: 'Umz Walkthrough',
      excerpt: 'Umz is an easy Hack My VM machine featuring a DDoS-triggered backend, OS command injection via a ping form, sudo md5sum, rainbow table recovery, and SUID dd for root.',
      date: 'Mar 05, 2026',
      tags: ['Hmv', 'Linux', 'DDOS', 'Command-Injection', 'Sudo_Md5sum', 'Rainbowlist', 'DD'],
      image: '/images/writeups/umz/machine.png',
      link: '/writeups/umz-walkthrough',
      difficulty: 'Easy',
      category: 'writeup',
      os: 'Linux'
    },
    {
      id: 14,
      title: 'Active Walkthrough',
      excerpt: 'Active is an easy to medium difficulty machine, which features two very prevalent techniques to gain privileges within an Active Directory environment.',
      date: 'Feb 15, 2026',
      tags: ['Htb', 'Ad', 'Gpp', 'Kerberoasting', 'Kerberos', 'Windows', 'Smb', 'Password-cracking'],
      image: '/images/writeups/active/machine.png',
      link: '/writeups/active-walkthrough',
      difficulty: 'Easy',
      category: 'writeup',
      os: 'Windows'
    },{
      id: 12,
      title: 'Editor Walkthrough',
      excerpt: 'Full Nmap reconnaissance exposed SSH, nginx and a vulnerable XWiki on Jetty. XWiki RCE gave an xwiki reverse shell, revealed plaintext DB credentials in /etc/xwiki to SSH as oliver, and a writable SUID ndsudo binary was abused via an untrusted-search-path exploit to escalate to root.',
      date: 'Dec 06, 2025',
      tags: ['Htb', 'Linux', 'Xwiki', 'Ndsudo'],
      image: '/images/writeups/editor/machine.png',
      link: '/writeups/editor-walkthrough',
      difficulty: 'Easy',
      category: 'writeup',
      os: 'Linux'
    },
    {
      id: 13,
      title: 'TombWatcher Walkthrough',
      excerpt: 'TombWatcher is a medium-difficulty Windows Active Directory machine that demonstrates advanced ADCS exploitation techniques. Starting with provided credentials (henry / H3nry_987TGV!), the machine showcases GMSA enumeration, Kerberoasting attacks, and ESC15 vulnerability exploitation through Certipy. The walkthrough covers tombstone object abuse, certificate template manipulation, and privilege escalation to Domain Administrator through ADCS certificate abuse.',
      date: 'Oct 11, 2025',
      tags: ['Htb', 'Ad', 'Adcs', 'Password-Cracking', 'Gmsa', 'Kerberoasting', 'Kerberos', 'Tombstone', 'Esc15'],
      image: '/images/writeups/tombwatcher/machine.png',
      link: '/writeups/tombwatcher-walkthrough',
      difficulty: 'Medium',
      category: 'writeup',
      os: 'Windows'
    },
    {
      id: 10,
      title: 'Aria Walkthrough',
      excerpt: 'Aria is a Linux machine that demonstrates file upload bypass techniques, zero-width steganography, and JSON-RPC exploitation through aria2c. The machine showcases how improper input validation and services running with elevated privileges can lead to complete system compromise.',
      date: 'Oct 04, 2025',
      tags: ['Linux', 'Hmv', 'Steg', 'Aria2c', 'Json-rpc'],
      image: '/images/writeups/aria/machine.png',
      link: '/writeups/aria-walkthrough',
      difficulty: 'Easy',
      category: 'writeup',
      os: 'Linux'
    },
    {
      id: 9,
      title: 'Puppy Walkthrough',
      excerpt: 'Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals GenericWrite on the Developers group, allowing the attacker to add the user and access the DEV share. A KeePass file harvested from DEV is cracked to recover additional credentials. A password-spraying and further enumeration lead to steph.cooper and extraction of DPAPI-protected secrets. Using steph.cooper_adm recovered credentials the box allows DCSync to dump the Administrator hash, enabling remote authentication and full domain compromise.',
      date: 'Sep 27, 2025',
      tags: ['Htb', 'Ad', 'DPAPI', 'Password-Cracking', 'Kerberos', 'Smb', 'Ldap', 'Windows', 'Dcsync'],
      image: '/images/writeups/puppy/machine.png',
      link: '/writeups/puppy-walkthrough',
      difficulty: 'Medium',
      category: 'writeup',
      os: 'Windows'
    },
    {
      id: 8,
      title: 'Fluffy Walkthrough',
      excerpt: 'Fluffy is an easy-difficulty Windows machine designed around an assumed breach scenario, where credentials for a low-privileged user are provided. By exploiting CVE-2025-24071, the credentials of another low-privileged user can be obtained. Further enumeration reveals the existence of ACLs over the winrm_svc and ca_svc accounts. WinRM can then be used to log in to the target using the winrc_svc account. Exploitation of an Active Directory Certificate service (ESC15) using the ca_svc account is required to obtain access to the Administrator account.',
      date: 'Sep 20, 2025',
      tags: ['Htb', 'Ad', 'Adcs', 'Smb', 'Ldap', 'Windows', 'Password-Cracking', 'Kerberoasting'],
      image: '/images/writeups/fluffy/machine.png',
      link: '/writeups/fluffy-walkthrough',
      difficulty: 'Easy',
      category: 'writeup',
      os: 'Windows'
    },
    {
    id: 7,
    title: 'Wcorp Walkthrough',
    excerpt: 'A challenging Windows Active Directory environment featuring SMB enumeration, AS-REP roasting, Kerberoasting, and DCSync techniques. This writeup covers advanced lateral movement and privilege escalation methods.',
    date: 'Sep 05, 2025',
    tags: ['hc', 'smb', 'ad', 'windows', 'asreproast', 'dcsync', 'kerberoasting', 'password-cracking'],
    image: '/images/writeups/wcorp/machine.png',
    link: '/writeups/wcorp-walkthrough',
    difficulty: 'Hard',
    category: 'writeup',
    os: 'Windows'
    },
    {
    id: 1,
    title: 'DC02 Walkthrough',
    excerpt: 'This Windows Domain Controller (DC01) in the SOUPEDECODE.LOCAL domain was discovered via internal network scanning. Enumeration revealed multiple Active Directory services and valid SMB credentials (charlie:charlie). AS-REP roasting against zximena448 yielded the password internet, granting Backup Operators group privileges.',
    date: 'Aug 20, 2025',
    tags: ["hmv", "windows", "ad", "asreproast", "dcsync", "backup-operators", "password-cracking", "smb", "ldap"],
    image: '/images/writeups/dc02/machine.png',
    link: '/writeups/dc02-walkthrough',
    difficulty: 'Medium',
    category: 'writeup',
    os: 'Windows'
    }], []);

  const filteredWriteups = useMemo(() => {
    const filtered = writeups.filter(writeup => {
      const matchesSearch = writeup.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           writeup.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
    return filtered.filter((writeup, index, self) =>
      index === self.findIndex(w => w.id === writeup.id)
    );
  }, [searchTerm, writeups]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 20 }
    }
  };

  return (
    <motion.div 
      className="writeups-page"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="page-header" variants={itemVariants}>
        <div className="header-content">
          <FaFileAlt className="header-icon" />
          <h1>Writeups</h1>
        </div>
        <p className="page-description">
          Detailed walkthroughs and analysis of cybersecurity challenges, CTF solutions, and penetration testing methodologies.
        </p>
      </motion.div>

      <motion.div className="search-filter-section" variants={itemVariants}>
        <div className="search-container">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search writeups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </motion.div>

      <motion.div className="writeups-grid" variants={containerVariants}>
        {filteredWriteups.length > 0 ? (
          filteredWriteups.map((writeup, index) => (
            <motion.div
              key={writeup.id}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Card
                title={writeup.title}
                excerpt={writeup.excerpt}
                date={writeup.date}
                tags={writeup.tags}
                image={writeup.image}
                link={writeup.link}
                category={writeup.category}
                difficulty={writeup.difficulty}
                os={writeup.os}
              />
            </motion.div>
          ))
        ) : (
          <motion.div 
            className="no-results"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="no-results-content">
              <FaFileAlt className="no-results-icon" />
              <h3>No writeups found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              <button 
                className="clear-filters-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>


    </motion.div>
  );
};

export default Writeups;
