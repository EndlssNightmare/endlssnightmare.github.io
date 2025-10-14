#!/usr/bin/env python3
"""
Generate static HTML files for each writeup with specific SEO meta tags.
These files will be served to Discord and other social media crawlers
while allowing normal React routing for users.
"""

import os

# Writeup data with specific SEO information
writeups = [
    {
        "id": "tombwatcher-walkthrough",
        "title": "TombWatcher Walkthrough",
        "excerpt": "This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods for the TombWatcher machine. The machine demonstrates various Active Directory attack vectors including Kerberoasting, GMSA exploitation, and ESC15 (ADCS vulnerability) techniques.",
        "image": "/images/writeups/tombwatcher/machine.png",
        "tags": ["Windows", "Active Directory", "Kerberoasting", "GMSA", "ESC15", "ADCS"]
    },
    {
        "id": "aria-walkthrough", 
        "title": "Aria Walkthrough",
        "excerpt": "Aria is a Linux machine that demonstrates file upload bypass techniques, zero-width steganography, and JSON-RPC exploitation through aria2c. The machine showcases how improper input validation and services running with elevated privileges can lead to complete system compromise.",
        "image": "/images/writeups/aria/machine.png",
        "tags": ["Linux", "File Upload", "Steganography", "JSON-RPC", "Privilege Escalation"]
    },
    {
        "id": "puppy-walkthrough",
        "title": "Puppy Walkthrough", 
        "excerpt": "Puppy is a Windows machine that demonstrates various Active Directory exploitation techniques including Kerberoasting, WriteSPN attacks, and DPAPI credential extraction. The machine showcases real-world AD security vulnerabilities and lateral movement techniques.",
        "image": "/images/writeups/puppy/machine.png",
        "tags": ["Windows", "Active Directory", "Kerberoasting", "WriteSPN", "DPAPI"]
    },
    {
        "id": "fluffy-walkthrough",
        "title": "Fluffy Walkthrough",
        "excerpt": "Fluffy is a Windows machine focusing on Active Directory exploitation including Kerberoasting, WriteSPN abuse, and ESC15 (ADCS vulnerability) techniques. The machine demonstrates advanced AD attack vectors and privilege escalation methods.",
        "image": "/images/writeups/fluffy/machine.png", 
        "tags": ["Windows", "Active Directory", "Kerberoasting", "WriteSPN", "ESC15", "ADCS"]
    },
    {
        "id": "wcorp-walkthrough",
        "title": "Wcorp Walkthrough",
        "excerpt": "Wcorp is a Windows machine demonstrating Active Directory exploitation techniques including Kerberoasting, WriteSPN attacks, and various privilege escalation methods. The machine showcases real-world AD security vulnerabilities.",
        "image": "/images/writeups/wcorp/machine.png",
        "tags": ["Windows", "Active Directory", "Kerberoasting", "WriteSPN", "Privilege Escalation"]
    },
    {
        "id": "dc02-walkthrough", 
        "title": "DC02 Walkthrough",
        "excerpt": "DC02 is a Windows Domain Controller machine that demonstrates various Active Directory exploitation techniques including Kerberoasting, WriteSPN abuse, and Backup Operators privilege escalation. The machine showcases real-world DC security vulnerabilities.",
        "image": "/images/writeups/dc02/machine.png",
        "tags": ["Windows", "Domain Controller", "Active Directory", "Kerberoasting", "WriteSPN", "Backup Operators"]
    }
]

def generate_html_content(writeup):
    """Generate HTML content with SEO meta tags for a specific writeup."""
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Basic Meta Tags -->
    <title>{writeup["title"]} | V01 Notes</title>
    <meta name="description" content="{writeup["excerpt"]}" />
    <meta name="keywords" content="{', '.join(writeup["tags"])}" />
    
    <!-- Open Graph Meta Tags for Discord/Facebook -->
    <meta property="og:title" content="{writeup["title"]} | V01 Notes" />
    <meta property="og:description" content="{writeup["excerpt"]}" />
    <meta property="og:image" content="https://endlssightmare.com{writeup["image"]}" />
    <meta property="og:url" content="https://endlssightmare.com/writeups/{writeup["id"]}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="V01 Notes" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{writeup["title"]} | V01 Notes" />
    <meta name="twitter:description" content="{writeup["excerpt"]}" />
    <meta name="twitter:image" content="https://endlssightmare.com{writeup["image"]}" />
    <meta name="twitter:url" content="https://endlssightmare.com/writeups/{writeup["id"]}" />
    <meta name="twitter:creator" content="@v01_cyber" />
    
    <!-- Cache busting for link previews -->
    <meta property="og:image:secure_url" content="https://endlssightmare.com{writeup["image"]}" />
    <meta name="twitter:image:alt" content="{writeup["title"]}" />
    
    <!-- No redirect - let React Router handle navigation -->
</head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background-color: #0a0a0a; color: #e0e0e0; text-align: center;">
    <h1 style="color: #ff6b6b;">{writeup["title"]}</h1>
    <p style="font-size: 16px; line-height: 1.6;">{writeup["excerpt"]}</p>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">Loading the full writeup...</p>
    <p><a href="/writeups/{writeup["id"]}" style="color: #ff6b6b; text-decoration: none; font-weight: bold;">← View Full Writeup</a></p>
</body>
</html>'''
    
    return html_content

def main():
    """Generate static HTML files for each writeup."""
    print("Generating static SEO files for Discord previews...")
    
    # Ensure public directory exists
    os.makedirs("public", exist_ok=True)
    
    generated_files = []
    
    for writeup in writeups:
        # Generate HTML content
        html_content = generate_html_content(writeup)
        
        # Write to file
        filename = f"public/{writeup['id']}.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        generated_files.append(filename)
        print(f"Generated: {filename}")
    
    print(f"\nGenerated {len(generated_files)} static SEO pages!")
    print("These files will provide proper meta tags for Discord and other social media platforms.")
    print("\nFiles created:")
    for file in generated_files:
        print(f"  - {file}")

if __name__ == "__main__":
    main()
