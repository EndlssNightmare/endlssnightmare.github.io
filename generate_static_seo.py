#!/usr/bin/env python3
"""
Script to generate static HTML files with SEO meta tags for Discord previews
This ensures Discord can read the meta tags without executing JavaScript
"""

import os
from datetime import datetime

# Writeup data (same as in your React components)
writeups = [
    {
        "id": "tombwatcher-walkthrough",
        "title": "TombWatcher Walkthrough",
        "excerpt": "TombWatcher is a medium-difficulty Windows Active Directory machine that demonstrates advanced ADCS exploitation techniques. Starting with provided credentials (henry / H3nry_987TGV!), the machine showcases GMSA enumeration, Kerberoasting attacks, and ESC15 vulnerability exploitation through Certipy. The walkthrough covers tombstone object abuse, certificate template manipulation, and privilege escalation to Domain Administrator through ADCS certificate abuse.",
        "date": "2025-10-11",
        "tags": ["Htb", "Ad", "Adcs", "Password-Cracking", "Gmsa", "Kerberoasting", "Kerberos", "Tombstone", "Esc15"],
        "image": "/images/writeups/tombwatcher/machine.png",
        "difficulty": "Medium",
        "os": "Windows"
    },
    {
        "id": "aria-walkthrough",
        "title": "Aria Walkthrough",
        "excerpt": "Aria is a Linux machine that demonstrates file upload bypass techniques, zero-width steganography, and JSON-RPC exploitation through aria2c. The machine showcases how improper input validation and services running with elevated privileges can lead to complete system compromise.",
        "date": "2025-10-04",
        "tags": ["Linux", "Hmv", "Steg", "Aria2c", "Json-rpc"],
        "image": "/images/writeups/aria/machine.png",
        "difficulty": "Easy",
        "os": "Linux"
    },
    {
        "id": "puppy-walkthrough",
        "title": "Puppy Walkthrough",
        "excerpt": "Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals GenericWrite on the Developers group, allowing the attacker to add the user and access the DEV share. A KeePass file harvested from DEV is cracked to recover additional credentials. A password-spraying and further enumeration lead to steph.cooper and extraction of DPAPI-protected secrets. Using steph.cooper_adm recovered credentials the box allows DCSync to dump the Administrator hash, enabling remote authentication and full domain compromise.",
        "date": "2025-09-27",
        "tags": ["Htb", "Ad", "DPAPI", "Password-Cracking", "Kerberos", "Smb", "Ldap", "Windows", "Dcsync"],
        "image": "/images/writeups/puppy/machine.png",
        "difficulty": "Medium",
        "os": "Windows"
    },
    {
        "id": "fluffy-walkthrough",
        "title": "Fluffy Walkthrough",
        "excerpt": "Fluffy is an easy-difficulty Windows machine designed around an assumed breach scenario, where credentials for a low-privileged user are provided. By exploiting CVE-2025-24071, the credentials of another low-privileged user can be obtained. Further enumeration reveals the existence of ACLs over the winrm_svc and ca_svc accounts. WinRM can then be used to log in to the target using the winrc_svc account. Exploitation of an Active Directory Certificate service (ESC15) using the ca_svc account is required to obtain access to the Administrator account.",
        "date": "2025-09-20",
        "tags": ["Htb", "Ad", "Smb", "Ldap", "Windows", "Password-Cracking", "Kerberoasting"],
        "image": "/images/writeups/fluffy/machine.png",
        "difficulty": "Easy",
        "os": "Windows"
    },
    {
        "id": "wcorp-walkthrough",
        "title": "Wcorp Walkthrough",
        "excerpt": "A challenging Windows Active Directory environment featuring SMB enumeration, AS-REP roasting, Kerberoasting, and DCSync techniques. This writeup covers advanced lateral movement and privilege escalation methods.",
        "date": "2025-09-05",
        "tags": ["Hc", "Smb", "Ad", "Windows", "Asreproast", "Dcsync", "Kerberoasting", "Password-Cracking"],
        "image": "/images/writeups/wcorp/machine.png",
        "difficulty": "Hard",
        "os": "Windows"
    },
    {
        "id": "dc02-walkthrough",
        "title": "DC02 Walkthrough",
        "excerpt": "This Windows Domain Controller (DC01) in the SOUPEDECODE.LOCAL domain was discovered via internal network scanning. Enumeration revealed multiple Active Directory services and valid SMB credentials (charlie:charlie). AS-REP roasting against zximena448 yielded the password internet, granting Backup Operators group privileges.",
        "date": "2025-08-20",
        "tags": ["Hmv", "Windows", "Ad", "Asreproast", "Dcsync", "Backup-operators", "Password-Cracking", "Smb", "Ldap"],
        "image": "/images/writeups/dc02/machine.png",
        "difficulty": "Medium",
        "os": "Windows"
    }
]

def generate_static_html(writeup):
    """Generate static HTML with SEO meta tags for Discord previews"""
    
    # Convert tags to lowercase for keywords
    keywords = ", ".join([tag.lower() for tag in writeup["tags"]]) + f", writeup, walkthrough, cybersecurity, {writeup['os'].lower()}, {writeup['difficulty'].lower()}"
    
    # Convert date to ISO format
    date_obj = datetime.strptime(writeup["date"], "%Y-%m-%d")
    iso_date = date_obj.isoformat() + "Z"
    
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#3D0000" />
    
    <!-- Basic Meta Tags -->
    <title>{writeup["title"]} - V01 Cybersecurity Writeup</title>
    <meta name="description" content="{writeup["excerpt"]}" />
    <meta name="keywords" content="{keywords}" />
    <meta name="author" content="V01" />
    <meta name="robots" content="index, follow" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://endlssightmare.com/writeups/{writeup["id"]}" />
    <meta property="og:title" content="{writeup["title"]} - V01 Cybersecurity Writeup" />
    <meta property="og:description" content="{writeup["excerpt"]}" />
    <meta property="og:image" content="https://endlssightmare.com{writeup["image"]}" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="{writeup["title"]}" />
    <meta property="og:site_name" content="V01 Notes" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:updated_time" content="{iso_date}" />
    <meta property="article:published_time" content="{iso_date}" />
    <meta property="article:author" content="V01" />
    <meta property="article:section" content="Cybersecurity" />
    <meta property="article:tag" content="HackTheBox" />
    <meta property="article:tag" content="{writeup["os"]}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://endlssightmare.com/writeups/{writeup["id"]}" />
    <meta name="twitter:title" content="{writeup["title"]} - V01 Cybersecurity Writeup" />
    <meta name="twitter:description" content="{writeup["excerpt"]}" />
    <meta name="twitter:image" content="https://endlssightmare.com{writeup["image"]}" />
    <meta name="twitter:creator" content="@v01_cyber" />
    <meta name="twitter:site" content="@v01_cyber" />
    <meta name="twitter:domain" content="endlssightmare.com" />
    
    <!-- Additional Meta Tags -->
    <link rel="canonical" href="https://endlssightmare.com/writeups/{writeup["id"]}" />
    
    <!-- Cache busting for link previews -->
    <meta property="og:image:secure_url" content="https://endlssightmare.com{writeup["image"]}" />
    <meta name="twitter:image:alt" content="{writeup["title"]}" />
    
    <!-- Redirect to main app after meta tags are read -->
    <script>
        // Redirect to the main React app
        setTimeout(() => {{
            window.location.replace('https://endlssightmare.com/writeups/{writeup["id"]}');
        }}, 100);
    </script>
</head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background-color: #0a0a0a; color: #e0e0e0; text-align: center;">
    <h1 style="color: #ff6b6b;">{writeup["title"]}</h1>
    <p style="font-size: 16px; line-height: 1.6;">{writeup["excerpt"]}</p>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">Redirecting to the full writeup...</p>
    <noscript>
        <p><a href="https://endlssightmare.com/writeups/{writeup["id"]}" style="color: #ff6b6b;">Click here to view the full writeup</a></p>
    </noscript>
</body>
</html>'''
    
    return html_content

def main():
    """Generate static HTML files for all writeups"""
    
    # Create public directory if it doesn't exist
    os.makedirs("public", exist_ok=True)
    
    for writeup in writeups:
        # Generate HTML content
        html_content = generate_static_html(writeup)
        
        # Write HTML file directly in public directory
        filename = f"public/{writeup['id']}.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Generated: {filename}")
    
    print(f"\nGenerated {len(writeups)} static SEO pages!")
    print("These files will provide proper meta tags for Discord and other social media platforms.")
    print("\nFiles created:")
    for writeup in writeups:
        print(f"  - public/{writeup['id']}.html")

if __name__ == "__main__":
    main()
