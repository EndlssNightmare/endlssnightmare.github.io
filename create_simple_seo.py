#!/usr/bin/env python3
"""
Create simple SEO files with direct names for GitHub Pages
This avoids redirect issues and provides direct access for Discord/crawlers
"""

import os
import shutil

# Mapping of writeup IDs to simple names
writeup_mapping = {
    'tombwatcher-walkthrough': 'tombwatcher',
    'aria-walkthrough': 'aria', 
    'puppy-walkthrough': 'puppy',
    'fluffy-walkthrough': 'fluffy',
    'wcorp-walkthrough': 'wcorp',
    'dc02-walkthrough': 'dc02'
}

def create_simple_seo_files():
    """Create simple SEO files with direct names"""
    
    for writeup_id, simple_name in writeup_mapping.items():
        seo_file = f"public/seo-{writeup_id}.html"
        simple_file = f"public/{simple_name}.html"
        
        if os.path.exists(seo_file):
            # Copy the SEO file with a simple name
            shutil.copy2(seo_file, simple_file)
            print(f"Created: {simple_file}")
        else:
            print(f"Warning: SEO file not found: {seo_file}")
    
    print(f"\nCreated {len(writeup_mapping)} simple SEO files!")
    print("These files will be accessible directly at:")
    for writeup_id, simple_name in writeup_mapping.items():
        print(f"  https://endlssightmare.com/{simple_name}.html")

if __name__ == "__main__":
    create_simple_seo_files()
