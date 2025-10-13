#!/usr/bin/env python3
"""
Script to generate redirect pages for GitHub Pages SPA routing
This ensures direct links to writeups work correctly
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

def generate_html_page(writeup):
    """Generate HTML page for a writeup"""
    
    # Convert tags to lowercase for keywords
    keywords = ", ".join([tag.lower() for tag in writeup["tags"]]) + f", writeup, walkthrough, cybersecurity, {writeup['os'].lower()}, {writeup['difficulty'].lower()}"
    
    html_content = f'''<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{writeup["title"]} - V01 Cybersecurity Portfolio</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="{writeup["excerpt"]}" />
    <meta name="keywords" content="{keywords}" />
    <meta name="author" content="V01" />
    
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
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://endlssightmare.com/writeups/{writeup["id"]}" />
    <meta name="twitter:title" content="{writeup["title"]} - V01 Cybersecurity Writeup" />
    <meta name="twitter:description" content="{writeup["excerpt"]}" />
    <meta name="twitter:image" content="https://endlssightmare.com{writeup["image"]}" />
    <meta name="twitter:creator" content="@v01_cyber" />
    <meta name="twitter:site" content="@v01_cyber" />
    
    <style>
      body {{
        font-family: 'Space Grotesk', sans-serif;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        color: #ffffff;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        text-align: center;
      }}
      .container {{
        max-width: 800px;
        padding: 2rem;
      }}
      h1 {{
        color: #ff6b6b;
        margin-bottom: 1rem;
      }}
      p {{
        margin-bottom: 1rem;
        line-height: 1.6;
      }}
      .loading {{
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #ff6b6b;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 10px;
      }}
      @keyframes spin {{
        to {{ transform: rotate(360deg); }}
      }}
    </style>
  </head>
  <body>
    <div class="container">
      <h1>{writeup["title"]}</h1>
      <p><span class="loading"></span>Loading the full writeup...</p>
      <p>This page provides SEO meta tags for social media previews.</p>
      <p><a href="/" style="color: #ff6b6b; text-decoration: none; font-weight: bold;">← Back to V01 Notes</a></p>
    </div>
    <noscript>
      <p>Please enable JavaScript to view this content.</p>
      <p><a href="/">Click here to go to the homepage</a></p>
    </noscript>
  </body>
</html>'''
    
    return html_content

def main():
    """Generate redirect pages for all writeups"""
    
    for writeup in writeups:
        # Create directory for writeup
        writeup_dir = f"public/writeups/{writeup['id']}"
        os.makedirs(writeup_dir, exist_ok=True)
        
        # Generate HTML content
        html_content = generate_html_page(writeup)
        
        # Write index.html file
        filename = f"{writeup_dir}/index.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Generated: {filename}")
    
    print(f"\nGenerated {len(writeups)} redirect pages!")
    print("These pages will provide SEO meta tags for social media previews")
    print("and redirect users to the main React application.")

if __name__ == "__main__":
    main()
