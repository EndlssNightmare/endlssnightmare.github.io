#!/usr/bin/env python3
"""
Create individual HTML pages for each writeup in the correct GitHub Pages structure
This ensures Discord and other crawlers can access the writeup-specific content directly
"""

import os
import shutil

# List of all writeups
writeups = [
    'tombwatcher-walkthrough',
    'aria-walkthrough', 
    'puppy-walkthrough',
    'fluffy-walkthrough',
    'wcorp-walkthrough',
    'dc02-walkthrough'
]

def create_writeup_pages():
    """Create individual HTML pages for each writeup"""
    
    # Create writeups directory
    os.makedirs("public/writeups", exist_ok=True)
    
    for writeup in writeups:
        seo_file = f"public/seo-{writeup}.html"
        writeup_file = f"public/writeups/{writeup}.html"
        
        if os.path.exists(seo_file):
            # Copy the SEO file to the writeups directory
            shutil.copy2(seo_file, writeup_file)
            print(f"Created: {writeup_file}")
        else:
            print(f"Warning: SEO file not found: {seo_file}")
    
    print(f"\nCreated {len(writeups)} writeup pages!")
    print("These files will be accessible directly at:")
    for writeup in writeups:
        print(f"  https://endlssightmare.com/writeups/{writeup}.html")

if __name__ == "__main__":
    create_writeup_pages()
