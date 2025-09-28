#!/usr/bin/env python3

# Read and fix Home.js
with open('src/pages/Home.js', 'r') as f:
    content = f.read()

old_text = "excerpt: 'Puppy Walkthrough - This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods.'"
new_text = "excerpt: 'Puppy is an medium-difficulty Windows Active Directory machine built around an assumed-breach scenario where credentials for a low-privileged user are provided (levi.james / KingofAkron2025!). Initial SMB/BloodHound enumeration reveals GenericWrite on the Developers group, allowing the attacker to add the user and access the DEV share. A KeePass file harvested from DEV is cracked to recover additional credentials. A password-spraying and further enumeration lead to steph.cooper and extraction of DPAPI-protected secrets. Using steph.cooper_adm recovered credentials the box allows DCSync to dump the Administrator hash, enabling remote authentication and full domain compromise.'"

content = content.replace(old_text, new_text)

with open('src/pages/Home.js', 'w') as f:
    f.write(content)

print('Home.js updated successfully')

# Read and fix Writeups.js
with open('src/pages/Writeups.js', 'r') as f:
    content = f.read()

content = content.replace(old_text, new_text)

with open('src/pages/Writeups.js', 'w') as f:
    f.write(content)

print('Writeups.js updated successfully')
