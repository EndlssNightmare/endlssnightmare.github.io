#!/usr/bin/env python3
"""
React Content Generator for Writeups
Generates React components and updates necessary files for new writeups
"""

import os
import sys
import shutil
import re
from datetime import datetime
from pathlib import Path

class WriteupGenerator:
    def __init__(self):
        self.base_dir = Path.cwd()
        self.src_dir = self.base_dir / "src"
        self.public_dir = self.base_dir / "public"
        self.writeups_dir = self.base_dir / "writeups"
        
        # Ensure directories exist
        self.images_dir = self.public_dir / "images" / "writeups"
        self.images_dir.mkdir(exist_ok=True)
        
    def generate(self):
        """Main generation function"""
        try:
            # Get user input
            data = self.get_user_input()
            
            # Copy image if provided
            if data['image_path']:
                image_url = self.copy_image(data['image_path'], data['machine_name'])
                data['image_url'] = image_url
            
            # Ensure image_url always has a valid path
            if not data.get('image_url'):
                data['image_url'] = f"/images/writeups/{data['machine_name'].lower()}/machine.png"
            
            # Generate writeup HTML template (commented out - not used by React)
            # template = self.generate_writeup_template(data)
            # writeup_file = self.writeups_dir / f"{data['machine_name']}-walkthrough.html"
            # 
            # with open(writeup_file, 'w') as f:
            #     f.write(template)
            # 
            # print(f"✓ Created writeup template: {writeup_file}")
            
            # Update React components
            self.update_home_js(data)
            self.update_writeups_js(data)
            self.update_tags_js(data)
            self.update_tag_detail_js(data)
            self.create_writeup_detail_component(data)
            
            print("\n=== Generation Complete! ===")
            print(f"✓ React components updated")
            print(f"✓ Image copied (if provided)")
            print(f"\nNext steps:")
            print(f"1. Add your content to the React component: src/pages/writeups/{data['machine_name']}/{data['machine_name'].replace('-', '').title()}Walkthrough.js")
            print(f"2. Add routing in your App.js if needed")
            print(f"3. Test your new writeup!")
            print(f"\n📁 New structure created:")
            print(f"   └── src/pages/writeups/{data['machine_name']}/")
            print(f"       ├── {data['machine_name'].replace('-', '').title()}Walkthrough.js")
            print(f"       ├── {data['machine_name'].replace('-', '').title()}Walkthrough.css")
            print(f"       └── images/")
            ext_display = Path(data.get('image_path', '')).suffix.lstrip('.') if data.get('image_path') else 'png'
            print(f"           └── machine.{ext_display}")
            print(f"   └── public/images/writeups/")
            print(f"       └── {data['machine_name']}/")
            print(f"           └── machine.{ext_display}")
            
        except KeyboardInterrupt:
            print("\n\nGeneration cancelled by user.")
        except Exception as e:
            print(f"\nError during generation: {e}")
            sys.exit(1)
    
    def get_user_input(self):
        """Get writeup information from user"""
        print("=== Writeup Generator ===\n")
        
        # Basic information
        title = input("Writeup title (e.g., 'Machine Name Walkthrough'): ").strip()
        if not title:
            print("Title is required!")
            sys.exit(1)
            
        machine_name = input("Machine name (for file naming, e.g., 'machine-name'): ").strip()
        if not machine_name:
            machine_name = title.lower().replace(' ', '-').replace('walkthrough', '').strip('-')
            
        excerpt = input("Brief excerpt/description: ").strip()
        if not excerpt:
            excerpt = f"{title} - This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods."
            
        difficulty = input("Difficulty (Easy/Medium/Hard): ").strip().title()
        if difficulty not in ['Easy', 'Medium', 'Hard']:
            difficulty = 'Medium'
            
        os_type = input("Operating System (Windows/Linux/Other): ").strip().title()
        if os_type not in ['Windows', 'Linux', 'Other']:
            os_type = 'Windows'
            
        ip_address = input("Target IP address: ").strip()
        if not ip_address:
            ip_address = "192.168.1.100"
            
        # Tags
        print("\nEnter tags (comma-separated, press Enter when done):")
        tags_input = input("Tags: ").strip()
        if tags_input:
            # Split by comma, but also handle space-separated tags
            if ',' in tags_input:
                tags = [tag.strip() for tag in tags_input.split(',') if tag.strip()]
            else:
                # If no commas, split by spaces
                tags = [tag.strip() for tag in tags_input.split() if tag.strip()]
        else:
            tags = []
        
        # Image handling
        print(f"\nImage file path (will be copied to {self.images_dir}):")
        print("Tip: You can use the HTB image extractor script to download machine images:")
        print("   python3 htb_image_extractor.py <machine_name>")
        image_path = input("Image path (or press Enter to skip): ").strip()
        
        return {
            'title': title,
            'machine_name': machine_name,
            'excerpt': excerpt,
            'difficulty': difficulty,
            'os_type': os_type,
            'ip_address': ip_address,
            'tags': tags,
            'image_path': image_path
        }
    
    def copy_image(self, image_path, machine_name):
        """Copy and rename the machine image"""
        if not image_path:
            return None
        # Normalize paths
        src_path = Path(image_path)
        if not src_path.exists():
            return None
            
        # Determine file extension
        ext = src_path.suffix.lower()
        if ext not in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            print(f"Warning: Unsupported image format {ext}")
            return None
            
        # Create dedicated folder per writeup: public/images/writeups/<machine_name>/machine.ext
        writeup_folder = self.images_dir / machine_name.lower()
        writeup_folder.mkdir(parents=True, exist_ok=True)
        new_filename = f"machine{ext}"
        new_path = writeup_folder / new_filename
        
        try:
            # Avoid copying if source and destination are the same file
            if src_path.resolve() == new_path.resolve():
                print(f"Image already in destination: '{new_path}', skipping copy")
            else:
                shutil.copy2(str(src_path), str(new_path))
            print(f"✓ Main image copied to: {new_path}")
            
            return f"/images/writeups/{machine_name.lower()}/{new_filename}"
        except Exception as e:
            print(f"Error copying image: {e}")
            return None
    
    def generate_writeup_template(self, data):
        """Generate the writeup HTML template"""
        template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{data['title']}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #1a1a1a;
            color: #ffffff;
        }}
        .header {{
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #3D0000, #800000);
            border-radius: 10px;
        }}
        .machine-info {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0;
            padding: 15px;
            background: rgba(61, 0, 0, 0.3);
            border-radius: 8px;
        }}
        .machine-image {{
            max-width: 200px;
            border-radius: 8px;
        }}
        .badge {{
            display: inline-block;
            padding: 5px 10px;
            margin: 2px;
            border-radius: 15px;
            font-size: 0.9em;
            font-weight: bold;
        }}
        .badge.difficulty {{
            background-color: #ff6b6b;
            color: white;
        }}
        .badge.os {{
            background-color: #4ecdc4;
            color: white;
        }}
        .badge.ip {{
            background-color: #45b7d1;
            color: white;
        }}
        h1, h2, h3 {{
            color: #ff6b6b;
            border-bottom: 2px solid #3D0000;
            padding-bottom: 10px;
        }}
        pre {{
            background-color: #2d2d2d;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #ff6b6b;
        }}
        code {{
            background-color: #2d2d2d;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }}
        .image-container {{
            text-align: center;
            margin: 20px 0;
        }}
        .content-image {{
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }}
        .tags {{
            margin: 15px 0;
        }}
        .tag {{
            display: inline-block;
            background-color: #3D0000;
            color: white;
            padding: 5px 12px;
            margin: 3px;
            border-radius: 15px;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{data['title']}</h1>
        <p>{data['excerpt']}</p>
        
        <div class="machine-info">
            <div>
                <h3>Machine Information</h3>
                <span class="badge difficulty">Difficulty: {data['difficulty']}</span>
                <span class="badge os">OS: {data['os_type']}</span>
                <span class="badge ip">IP: {data['ip_address']}</span>
                
                <div class="tags">
                    {''.join([f'<span class="tag">{tag}</span>' for tag in data['tags']])}
                </div>
            </div>
            <div>
                <img src="{data.get('image_url', '/images/writeups/default/machine.png')}" alt="{data['title']}" class="machine-image">
            </div>
        </div>
    </div>

    <h1>Overview</h1>
    <p>Provide a brief overview of the machine, what you discovered, and the overall approach to solving it.</p>

    <h2>Enumeration</h2>
    <p>Document your initial reconnaissance and enumeration steps.</p>
    
    <h3>Port Scanning</h3>
    <p>Start with your nmap scan results:</p>
    <pre><code>nmap -sC -sV -p- [TARGET_IP]</code></pre>
    
    <h3>Service Enumeration</h3>
    <p>Document any specific service enumeration you performed.</p>

    <h2>Exploitation</h2>
    <p>Document your exploitation steps and findings.</p>
    
    <h3>Initial Access</h3>
    <p>How did you gain initial access to the machine?</p>
    
    <h3>User Flag</h3>
    <p>How did you obtain the user flag?</p>

    <h2>Post Exploitation</h2>
    <p>Document privilege escalation and post-exploitation activities.</p>
    
    <h3>Privilege Escalation</h3>
    <p>How did you escalate privileges?</p>
    
    <h3>Root Flag</h3>
    <p>How did you obtain the root flag?</p>

    <h2>Lessons Learned</h2>
    <p>What did you learn from this machine? Any new techniques or tools discovered?</p>

    <h2>Tools Used</h2>
    <ul>
        <li>Nmap - Port scanning and service enumeration</li>
        <li>Add other tools you used...</li>
    </ul>

    <h2>References</h2>
    <ul>
        <li>Add any references, documentation, or resources you used...</li>
    </ul>
</body>
</html>"""
        
        return template
    
    def update_home_js(self, data):
        """Update Home.js to include the new writeup"""
        home_js_path = self.src_dir / "pages" / "Home.js"
        
        if not home_js_path.exists():
            print("Error: Home.js not found!")
            return False
            
        with open(home_js_path, 'r') as f:
            content = f.read()
        
        # Find the recentPosts array (supports both plain and useMemo pattern)
        pattern_plain = r'const\s+recentPosts\s*=\s*\[(.*?)\];'
        pattern_memo = r'const\s+recentPosts\s*=\s*useMemo\(\(\)\s*=>\s*\[(.*?)\]\s*,\s*\[\s*\]\s*\);'
        match = re.search(pattern_plain, content, re.DOTALL) or re.search(pattern_memo, content, re.DOTALL)
        
        if not match:
            print("Error: Could not find recentPosts array in Home.js")
            return False
        
        posts_content = match.group(1)
        
        # Generate new post entry
        new_post = f"""
    {{
      id: {self._get_next_id(posts_content)},
      title: '{data['title']}',
      excerpt: '{data['excerpt']}',
      date: '{datetime.now().strftime('%b %d, %Y')}',
      category: 'writeup',
      tags: {str([tag.lower() for tag in data['tags']])},
      image: '{data['image_url']}',
      link: '/writeups/{data['machine_name']}-walkthrough',
      os: '{data['os_type']}'
    }}"""
        
        # Add the new post to the beginning of the array (newest first)
        if posts_content.strip():
            new_posts_content = new_post + ',\n    ' + posts_content.strip()
        else:
            new_posts_content = new_post + '\n  '
        
        # Replace the content in whichever pattern matched
        if re.search(pattern_plain, content, re.DOTALL):
            new_content = re.sub(pattern_plain, f'const recentPosts = [{new_posts_content}];', content, flags=re.DOTALL)
        else:
            new_content = re.sub(pattern_memo, f'const recentPosts = useMemo(() => [{new_posts_content}], []);', content, flags=re.DOTALL)
        
        with open(home_js_path, 'w') as f:
            f.write(new_content)
        
        print("✓ Updated Home.js")
        return True
    
    def update_writeups_js(self, data):
        """Update Writeups.js to include the new writeup"""
        writeups_js_path = self.src_dir / "pages" / "Writeups.js"
        
        if not writeups_js_path.exists():
            print("Error: Writeups.js not found!")
            return False
            
        with open(writeups_js_path, 'r') as f:
            content = f.read()
        
        # Find the writeups array (supports both patterns)
        pattern_plain = r'const\s+writeups\s*=\s*\[(.*?)\];'
        pattern_memo = r'const\s+writeups\s*=\s*useMemo\(\(\)\s*=>\s*\[(.*?)\]\s*,\s*\[\s*\]\s*\);'
        match = re.search(pattern_plain, content, re.DOTALL) or re.search(pattern_memo, content, re.DOTALL)
        
        if not match:
            print("Error: Could not find writeups array in Writeups.js")
            return False
        
        writeups_content = match.group(1)
        
        # Generate new writeup entry
        new_writeup = f"""
    {{
      id: {self._get_next_id(writeups_content)},
      title: '{data['title']}',
      excerpt: '{data['excerpt']}',
      date: '{datetime.now().strftime('%b %d, %Y')}',
      tags: {str(data['tags'])},
      image: '{data['image_url']}',
      link: '/writeups/{data['machine_name']}-walkthrough',
      difficulty: '{data['difficulty']}',
      category: 'writeup',
      os: '{data['os_type']}'
    }}"""
        
        # Add the new writeup to the beginning of the array (newest first)
        if writeups_content.strip():
            new_writeups_content = new_writeup + ',\n    ' + writeups_content.strip()
        else:
            new_writeups_content = new_writeup + '\n  '
        
        # Replace according to pattern
        if re.search(pattern_plain, content, re.DOTALL):
            new_content = re.sub(pattern_plain, f'const writeups = [{new_writeups_content}];', content, flags=re.DOTALL)
        else:
            new_content = re.sub(pattern_memo, f'const writeups = useMemo(() => [{new_writeups_content}], []);', content, flags=re.DOTALL)
        
        with open(writeups_js_path, 'w') as f:
            f.write(new_content)
        
        print("✓ Updated Writeups.js")
        return True
    
    def update_tags_js(self, data):
        """Update Tags.js to include new tags"""
        tags_js_path = self.src_dir / "pages" / "Tags.js"
        
        if not tags_js_path.exists():
            print("Error: Tags.js not found!")
            return False
            
        with open(tags_js_path, 'r') as f:
            content = f.read()
        
        # Find the allPosts array
        pattern = r'const allPosts = \[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            print("Error: Could not find allPosts array in Tags.js")
            return False
        
        posts_content = match.group(1)
        
        # Generate new post entry for tags
        new_post = f"""
    {{
      id: {self._get_next_id(posts_content)},
      title: '{data['title']}',
      category: 'writeup',
      tags: {str([tag.lower() for tag in data['tags']])}
    }}"""
        
        # Add the new post to the beginning of the array (newest first)
        if posts_content.strip():
            new_posts_content = new_post + ',\n    ' + posts_content.strip()
        else:
            new_posts_content = new_post + '\n  '
        
        # Replace the content
        new_content = re.sub(pattern, f'const allPosts = [{new_posts_content}];', content, flags=re.DOTALL)
        
        # Find the tags array and add new tags
        tags_pattern = r'const tags = \[(.*?)\];'
        tags_match = re.search(tags_pattern, new_content, re.DOTALL)
        
        if tags_match:
            tags_content = tags_match.group(1)
            
            # Add new tags that don't already exist
            for tag in data['tags']:
                tag_lower = tag.lower()
                # Check if tag already exists (case insensitive)
                if not any(f"name: '{tag_lower}'" in line.lower() or f'name: "{tag_lower}"' in line.lower() for line in tags_content.split('\n')):
                    new_tag_entry = f"""
    {{
      name: '{tag_lower}',
      count: 1,
      color: '#3D0000'
    }}"""
                    
                    if tags_content.strip():
                        new_tags_content = tags_content.rstrip() + ',' + new_tag_entry + '\n  '
                    else:
                        new_tags_content = new_tag_entry + '\n  '
                    
                    new_content = re.sub(tags_pattern, f'const tags = [{new_tags_content}];', new_content, flags=re.DOTALL)
                    tags_content = new_tags_content  # Update for next iteration
                else:
                    # Update count for existing tag
                    tag_pattern = rf"name: '{tag_lower}',\s+count: \d+"
                    # Find current count
                    count_match = re.search(tag_pattern, new_content)
                    if count_match:
                        # Extract current count and increment
                        current_count = int(re.search(r'count: (\d+)', count_match.group(0)).group(1))
                        new_count = current_count + 1
                        new_tag_entry = f"name: '{tag_lower}',\n      count: {new_count}"
                        new_content = re.sub(tag_pattern, new_tag_entry, new_content)
        
        with open(tags_js_path, 'w') as f:
            f.write(new_content)
        
        # Recalculate all tag counts based on actual posts
        self.recalculate_tag_counts(tags_js_path)
        
        print("✓ Updated Tags.js")
        return True
    
    def recalculate_tag_counts(self, tags_js_path):
        """Recalculate tag counts based on actual posts"""
        with open(tags_js_path, 'r') as f:
            content = f.read()
        
        # Find the allPosts array
        posts_pattern = r'const allPosts = \[(.*?)\];'
        posts_match = re.search(posts_pattern, content, re.DOTALL)
        
        if not posts_match:
            return False
        
        posts_content = posts_match.group(1)
        
        # Parse all posts and their tags
        post_blocks = re.findall(r'\{[^}]+\}', posts_content)
        all_tags = {}
        
        for block in post_blocks:
            # Extract tags
            tags_match = re.search(r'tags: \[(.*?)\]', block)
            if tags_match:
                tags_str = tags_match.group(1)
                # Extract individual tags
                tags = re.findall(r"'([^']*)'", tags_str)
                for tag in tags:
                    tag_lower = tag.lower()
                    all_tags[tag_lower] = all_tags.get(tag_lower, 0) + 1
        
        # Generate new tags array
        tags_array = []
        for tag_name, count in sorted(all_tags.items()):
            tags_array.append(f"""    {{
      name: '{tag_name}',
      count: {count},
      color: '#3D0000'
    }}""")
        
        new_tags_content = ',\n'.join(tags_array)
        
        # Replace the tags array
        tags_pattern = r'const tags = \[(.*?)\];'
        new_content = re.sub(tags_pattern, f'const tags = [\n{new_tags_content}\n  ];', content, flags=re.DOTALL)
        
        with open(tags_js_path, 'w') as f:
            f.write(new_content)
        
        return True
    
    def update_tag_detail_js(self, data):
        """Update TagDetail.js to include new writeup"""
        tag_detail_js_path = self.src_dir / "pages" / "TagDetail.js"
        
        if not tag_detail_js_path.exists():
            print("Warning: TagDetail.js not found")
            return False
            
        with open(tag_detail_js_path, 'r') as f:
            content = f.read()
        
        # Find the allPosts array
        pattern = r'const allPosts = \[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            print("Error: Could not find allPosts array in TagDetail.js")
            return False
        
        posts_content = match.group(1)
        
        # Check if writeup already exists
        if data['title'] in posts_content:
            print("✓ Writeup already exists in TagDetail.js")
            return True
        
        # Generate new post entry
        new_post = f"""
    {{
      id: {self._get_next_id(posts_content)},
      title: '{data['title']}',
      excerpt: '{data['excerpt']}',
      date: '{datetime.now().strftime('%b %d, %Y')}',
      tags: {str([tag.lower() for tag in data['tags']])},
      image: '{data['image_url']}',
      link: '/writeups/{data['machine_name']}-walkthrough',
      category: 'writeup'
    }}"""
        
        # Add the new post to the beginning of the array (newest first)
        if posts_content.strip():
            new_posts_content = new_post + ',\n    ' + posts_content.strip()
        else:
            new_posts_content = new_post + '\n  '
        
        # Replace the content
        new_content = re.sub(pattern, f'const allPosts = [{new_posts_content}];', content, flags=re.DOTALL)
        
        with open(tag_detail_js_path, 'w') as f:
            f.write(new_content)
        
        print("✓ Updated TagDetail.js")
        return True
    
    def _get_next_id(self, content):
        """Get the next available ID from existing content"""
        ids = re.findall(r'id:\s*(\d+)', content)
        if ids:
            return max(int(id) for id in ids) + 1
        return 1
    
    def create_writeup_detail_component(self, data):
        """Create a new WriteupDetail component for the specific writeup"""
        # Create writeup-specific directory
        writeup_dir = self.src_dir / "pages" / "writeups" / data['machine_name']
        writeup_dir.mkdir(parents=True, exist_ok=True)
        
        # Create images subdirectory
        images_dir = writeup_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        component_name = f"{data['machine_name'].replace('-', '').title()}Walkthrough.js"
        component_path = writeup_dir / component_name
        
        # Generate the component content
        component_content = f"""import React from 'react';
import {{ Link, useNavigate }} from 'react-router-dom';
import {{ motion }} from 'framer-motion';
import {{ FaArrowLeft, FaCalendar, FaServer, FaStar, FaDesktop, FaNetworkWired }} from 'react-icons/fa';
import TableOfContents from '../../../components/TableOfContents';
import './{data['machine_name'].replace('-', '').title()}Walkthrough.css';

const {data['machine_name'].replace('-', '').title()}Walkthrough = () => {{
  const navigate = useNavigate();
  // {data['title']} data
  const writeup = {{
    id: '{data['machine_name']}-walkthrough',
    title: '{data['title']}',
    excerpt: '{data['excerpt']}',
    date: '{datetime.now().strftime('%b %d, %Y')}',
    tags: {str(data['tags'])},
    difficulty: '{data['difficulty']}',
    os: '{data['os_type']}',
    ip: '{data['ip_address']}',
    content: `# {data['title']}

## Overview
This writeup documents the discovery and analysis of vulnerabilities, exploitation techniques, and privilege escalation methods for the {data['title']} machine.

## Initial Reconnaissance

### Port Scanning
Start with your nmap scan results:

\`\`\`bash
nmap -sC -sV -p- [TARGET_IP]
\`\`\`

### Service Enumeration
Document any specific service enumeration you performed.

## Initial Access

### Exploitation
How did you gain initial access to the machine?

### User Flag
How did you obtain the user flag?

## Privilege Escalation

### Escalation Method
How did you escalate privileges?

### Root Flag
How did you obtain the root flag?

## Conclusion
This machine demonstrated various {data['os_type']} exploitation techniques and privilege escalation methods.

## Tools Used
- Nmap - Port scanning and service enumeration
- Add other tools you used...

## References
- Add any references, documentation, or resources you used...`
  }};

  return (
    <motion.div 
      className="writeup-detail-page"
      initial={{{{ opacity: 0, y: 20 }}}}
      animate={{{{ opacity: 1, y: 0 }}}}
      transition={{{{ duration: 0.6 }}}}
    >
      <div className="writeup-header">
        <Link to="/writeups" className="back-button">
          <FaArrowLeft />
          <span>Back to Writeups</span>
        </Link>
        
        <motion.div 
          className="writeup-title-section"
          initial={{{{ opacity: 0, y: 20 }}}}
          animate={{{{ opacity: 1, y: 0 }}}}
          transition={{{{ delay: 0.2, duration: 0.6 }}}}
        >
          <h1>{{writeup.title}}</h1>
          
          <div className="writeup-meta">
            <div className="meta-item">
              <FaCalendar />
              <span>{{writeup.date}}</span>
            </div>
          </div>

          <div className="writeup-tags">
            {{writeup.tags.map((tag, index) => (
              <motion.span
                key={{tag}}
                className="tag-badge"
                initial={{{{ scale: 0, opacity: 0 }}}}
                animate={{{{ scale: 1, opacity: 1 }}}}
                transition={{{{ delay: 0.3 + index * 0.1, duration: 0.3 }}}}
                whileHover={{{{ scale: 1.1 }}}}
                style={{{{ cursor: 'pointer' }}}}
                onClick={{() => navigate(`/tags/${{String(tag).toLowerCase()}}`)}}
              >
                {{tag}}
              </motion.span>
            ))}}
          </div>
          
          <div className="machine-info">
            <div className="machine-info-content">
              <div className="machine-info-left">
                <h6><FaServer /> Machine Information:</h6>
                <div className="machine-info-vertical">
                  <div className="info-item">
                    <FaDesktop /> OS: 
                    <img 
                      src={{`/os-icons/${{writeup.os}}.png`}} 
                      alt={{`${{writeup.os}} Icon`}} 
                      className="os-icon"
                      onError={{(e) => {{
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'inline';
                      }}}}
                    />
                  </div>
                  <div className="info-item">
                    <FaStar /> Difficulty: {{writeup.difficulty}}
                  </div>
                  <div className="info-item">
                    <FaNetworkWired /> IP: {{writeup.ip}}
                  </div>
                </div>
              </div>
              <div className="machine-info-right">
                <img src="{data['image_url']}" alt="{data['title']}" className="machine-image" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="writeup-layout">
        <motion.div 
          className="writeup-content"
          initial={{{{ opacity: 0, y: 20 }}}}
          animate={{{{ opacity: 1, y: 0 }}}}
          transition={{{{ delay: 0.4, duration: 0.6 }}}}
        >
          <div className="markdown-content">
            {{(() => {{
              const lines = writeup.content.split('\\n');
              const elements = [];
              let i = 0;
              
              while (i < lines.length) {{
                const line = lines[i];
                
                if (line.startsWith('# ')) {{
                  elements.push(<h1 key={{i}}>{{line.substring(2)}}</h1>);
                }} else if (line.startsWith('## ')) {{
                  elements.push(<h2 key={{i}}>{{line.substring(3)}}</h2>);
                }} else if (line.startsWith('### ')) {{
                  elements.push(<h3 key={{i}}>{{line.substring(4)}}</h3>);
                }} else if (line.startsWith('```')) {{
                  // Handle code blocks
                  const language = line.substring(3).trim();
                  const codeLines = [];
                  i++;
                  
                  while (i < lines.length && !lines[i].startsWith('```')) {{
                    codeLines.push(lines[i]);
                    i++;
                  }}
                  
                  elements.push(
                    <pre key={{i}}>
                      <code className={{language ? `language-${{language}}` : ''}}>
                        {{codeLines.join('\\n')}}
                      </code>
                    </pre>
                  );
                }} else if (line.startsWith('![')) {{
                  // Handle images
                  const match = line.match(/!\\[(.*?)\\]\\((.*?)\\)/);
                  if (match) {{
                    const [, alt, src] = match;
                    elements.push(
                      <div key={{i}} className="image-container">
                        <img src={{src}} alt={{alt}} className="content-image" />
                      </div>
                    );
                  }}
                }} else if (line.trim()) {{
                  elements.push(<p key={{i}}>{{line}}</p>);
                }} else {{
                  elements.push(<br key={{i}} />);
                }}
                
                i++;
              }}
              
              return elements;
            }})()}}
          </div>
        </motion.div>
        <TableOfContents content={{writeup.content}} />
      </div>
    </motion.div>
  );
}};

export default {data['machine_name'].replace('-', '').title()}Walkthrough;
"""
        
        with open(component_path, 'w') as f:
            f.write(component_content)
        
        # Create CSS file for the writeup
        css_name = f"{data['machine_name'].replace('-', '').title()}Walkthrough.css"
        css_path = writeup_dir / css_name
        
        css_content = f"""/* {data['title']} Writeup Styles */

.writeup-detail-page {{
  max-width: none;
  margin: 0;
  padding: 0;
}}

.writeup-header {{
  margin-bottom: 3rem;
}}

.back-button {{
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}}

.back-button:hover {{
  color: var(--primary-color);
  transform: translateX(-5px);
}}

.writeup-title-section h1 {{
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
  line-height: 1.2;
}}

.writeup-meta {{
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}}

.meta-item {{
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}}

.writeup-tags {{
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}}

.tag-badge {{
  background-color: var(--secondary-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  cursor: pointer;
}}

.tag-badge:hover {{
  background-color: var(--primary-color);
}}

.writeup-layout {{
  display: flex;
  align-items: flex-start;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 1rem;
}}

.writeup-content {{
  flex: 1;
  background-color: var(--bg-card);
  border: 0.5px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  min-width: 0;
  margin-right: 2rem;
  transition: background-color var(--theme-transition), border-color var(--theme-transition);
  opacity: 0.9;
}}

.markdown-content {{
  line-height: 1.7;
  color: var(--text-primary);
}}

.markdown-content h1 {{
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 2rem 0 1rem 0;
  border-bottom: 1px solid var(--primary-color);
  padding-bottom: 0.5rem;
  opacity: 0.8;
}}

.markdown-content h2 {{
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 1.5rem 0 1rem 0;
  border-bottom: 0.5px solid var(--border-color);
  padding-bottom: 0.25rem;
  opacity: 0.6;
}}

.markdown-content h3 {{
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 1.25rem 0 0.75rem 0;
}}

.markdown-content p {{
  margin-bottom: 1rem;
  color: var(--text-secondary);
}}

.markdown-content pre {{
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
}}

.markdown-content code {{
  background-color: var(--bg-primary);
  color: var(--primary-color);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}}

.markdown-content pre code {{
  background-color: transparent;
  color: var(--text-primary);
  padding: 0;
}}

.markdown-content ul,
.markdown-content ol {{
  margin: 1rem 0;
  padding-left: 2rem;
}}

.markdown-content li {{
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}}

.markdown-content blockquote {{
  border-left: 4px solid var(--primary-color);
  padding-left: 1rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--text-secondary);
  background-color: var(--bg-primary);
  padding: 1rem;
  border-radius: 0 8px 8px 0;
}}

.machine-info {{
  margin: 1.5rem 0;
  padding: 1.5rem;
  background-color: var(--bg-card);
  border-radius: 12px;
  border: 0.5px solid var(--border-color);
  margin-right: 2rem;
  transition: background-color var(--theme-transition), border-color var(--theme-transition);
  opacity: 0.8;
}}

.machine-info-content {{
  display: flex;
  align-items: center;
  gap: 2rem;
}}

.machine-info-left {{
  flex: 1;
}}

.machine-info h6 {{
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}}

.machine-info h6 svg {{
  margin-right: 0.5rem;
  color: var(--primary-color);
}}

.machine-info-vertical {{
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}}

.info-item {{
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  background-color: var(--bg-primary);
  border-radius: 6px;
  transition: all 0.3s ease;
  width: fit-content;
  max-width: 200px;
}}

.info-item:hover {{
  background-color: var(--secondary-color);
  color: white;
  transform: translateX(5px);
}}

.info-item svg {{
  color: var(--primary-color);
  font-size: 0.8rem;
}}

.os-icon {{
  width: 20px;
  height: 20px;
  margin-left: 0.5rem;
  vertical-align: middle;
}}

.machine-badges {{
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}}

.machine-badges .badge {{
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 500;
}}

.machine-badges .badge svg {{
  margin-right: 0.25rem;
}}

.machine-info-right {{
  flex-shrink: 0;
  text-align: center;
}}

.machine-image {{
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}}

/* Code block styles */
.code-block {{
  background-color: var(--bg-primary);
  border: 0.5px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.8;
}}

/* Image styles */
.image-container {{
  margin: 0.5rem 0;
  text-align: left;
}}

.content-image {{
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
}}

/* Inline code styling */
.inline-code {{
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
  border: 1px solid var(--border-color);
}}

/* Responsive design */
@media (max-width: 768px) {{
  .writeup-layout {{
    flex-direction: column;
    gap: 1rem;
  }}
  
  .writeup-title-section h1 {{
    font-size: 2rem;
  }}
  
  .writeup-meta {{
    flex-direction: column;
    gap: 1rem;
  }}
  
  .machine-info-content {{
    flex-direction: column;
    gap: 1rem;
  }}
  
  .machine-info-right {{
    order: -1;
  }}
  
  .machine-image {{
    max-width: 250px;
  }}
  
  .writeup-content {{
    padding: 1.5rem;
  }}
  
  .markdown-content h1 {{
    font-size: 1.75rem;
  }}
  
  .markdown-content h2 {{
    font-size: 1.25rem;
  }}
  
  .markdown-content h3 {{
    font-size: 1.1rem;
  }}
  
  .content-image {{
    border-radius: 6px;
  }}
}}

@media (max-width: 480px) {{
  .writeup-detail-page {{
    padding: 0 0.5rem;
  }}
  
  .writeup-content {{
    padding: 1rem;
  }}
  
  .writeup-title-section h1 {{
    font-size: 1.75rem;
  }}
  
  .writeup-tags {{
    gap: 0.5rem;
  }}
  
  .tag-badge {{
    font-size: 0.7rem;
    padding: 0.4rem 0.8rem;
  }}
}}
"""
        
        with open(css_path, 'w') as f:
            f.write(css_content)
        
        print(f"✓ Created writeup detail component: {component_path}")
        print(f"✓ Created writeup CSS file: {css_path}")
        print(f"✓ Created writeup directory: {writeup_dir}")
        print(f"✓ Created images directory: {images_dir}")
        
        # Update WriteupDetail.js to include the new writeup
        self.update_writeup_detail_mapping(data)
        
        return True
    
    def update_writeup_detail_mapping(self, data):
        """Update WriteupDetail.js to include the new writeup in the mapping"""
        writeup_detail_js = self.src_dir / "pages" / "WriteupDetail.js"
        
        if not writeup_detail_js.exists():
            print("Warning: WriteupDetail.js not found")
            return False
        
        with open(writeup_detail_js, 'r') as f:
            content = f.read()
        
        # Add import for the new writeup component
        component_name = f"{data['machine_name'].replace('-', '').title()}Walkthrough"
        import_line = f"import {component_name} from './writeups/{data['machine_name']}/{component_name}';"
        
        # Find the imports section and add the new import
        if import_line not in content:
            # Add import after the existing imports
            content = content.replace(
                "// Import specific writeup components",
                f"// Import specific writeup components\nimport {component_name} from './writeups/{data['machine_name']}/{component_name}';"
            )
        
        # Add the writeup to the mapping (ensure proper comma placement)
        mapping_entry = f"    '{data['machine_name']}-walkthrough': {component_name}"
        
        # Find the writeupComponents object and add the new entry
        if mapping_entry not in content:
            # Find the writeupComponents object
            writeup_components_pattern = r'const writeupComponents = \{(.*?)\};'
            match = re.search(writeup_components_pattern, content, re.DOTALL)
            
            if match:
                components_content = match.group(1).strip()
                
                # Add the new entry with proper comma
                if components_content:
                    new_components_content = f"{components_content.rstrip()},\n  {mapping_entry}"
                else:
                    new_components_content = mapping_entry
                
                # Replace the content
                content = re.sub(
                    writeup_components_pattern,
                    f'const writeupComponents = {{\n  {new_components_content}\n}};',
                    content,
                    flags=re.DOTALL
                )
            else:
                # Fallback: simple replacement
                content = content.replace("};", f",\n  {mapping_entry}\n}};")
        
        with open(writeup_detail_js, 'w') as f:
            f.write(content)
        
        print(f"✓ Updated WriteupDetail.js mapping")
        return True


class WriteupRemover:
    """Class to remove writeups and clean up all related files"""
    
    def __init__(self):
        self.base_dir = Path.cwd()
        self.src_dir = self.base_dir / "src"
        self.images_dir = self.base_dir / "public" / "images" / "writeups"
        self.writeups_dir = self.base_dir / "writeups"
    
    def remove(self):
        """Main removal function"""
        print("=== Writeup Remover ===\n")
        
        # Get machine name from user
        machine_name = self.get_machine_name()
        if not machine_name:
            print("❌ No machine name provided. Exiting.")
            return
        
        print(f"\n🔍 Searching for files related to '{machine_name}'...")
        
        # Find all files to remove
        files_to_remove = self.find_files_to_remove(machine_name)
        
        if not files_to_remove:
            print("❌ No files found for this machine.")
            return
        
        # Show what will be removed
        print(f"\n📋 Files to be removed:")
        for file_path in files_to_remove:
            print(f"   - {file_path}")
        
        # Confirm removal
        confirm = input(f"\n⚠️  Are you sure you want to remove all files for '{machine_name}'? (y/N): ").strip().lower()
        if confirm != 'y':
            print("❌ Removal cancelled.")
            return
        
        # Remove files
        removed_count = 0
        for file_path in files_to_remove:
            try:
                if file_path.is_file():
                    file_path.unlink()
                    print(f"✓ Removed file: {file_path}")
                elif file_path.is_dir():
                    shutil.rmtree(file_path)
                    print(f"✓ Removed directory: {file_path}")
                removed_count += 1
            except Exception as e:
                print(f"❌ Error removing {file_path}: {e}")
        
        # Remove from JS files and any lingering imports/mappings
        self.remove_from_js_files(machine_name)
        self.remove_from_writeup_detail_mapping(machine_name)
        self.remove_from_tag_detail_js(machine_name)
        
        # Recalculate tag counts after removal
        self.recalculate_tag_counts('src/pages/Tags.js')
        
        print(f"\n✅ Successfully removed {removed_count} files/directories for '{machine_name}'")
        
        # Also remove the public images directory for the machine (lowercase)
        lower_dir = self.images_dir / machine_name.lower()
        if lower_dir.exists():
            try:
                shutil.rmtree(lower_dir)
                print(f"✓ Removed directory: {lower_dir}")
            except Exception as e:
                print(f"❌ Error removing {lower_dir}: {e}")
    
    def recalculate_tag_counts(self, tags_js_path):
        """Recalculate tag counts based on actual posts"""
        with open(tags_js_path, 'r') as f:
            content = f.read()
        
        # Find the allPosts array
        posts_pattern = r'const allPosts = \[(.*?)\];'
        posts_match = re.search(posts_pattern, content, re.DOTALL)
        
        if not posts_match:
            return False
        
        posts_content = posts_match.group(1)
        
        # Parse all posts and their tags
        post_blocks = re.findall(r'\{[^}]+\}', posts_content)
        all_tags = {}
        
        for block in post_blocks:
            # Extract tags
            tags_match = re.search(r'tags: \[(.*?)\]', block)
            if tags_match:
                tags_str = tags_match.group(1)
                # Extract individual tags
                tags = re.findall(r"'([^']*)'", tags_str)
                for tag in tags:
                    tag_lower = tag.lower()
                    all_tags[tag_lower] = all_tags.get(tag_lower, 0) + 1
        
        # Generate new tags array
        tags_array = []
        for tag_name, count in sorted(all_tags.items()):
            tags_array.append(f"""    {{
      name: '{tag_name}',
      count: {count},
      color: '#3D0000'
    }}""")
        
        new_tags_content = ',\n'.join(tags_array)
        
        # Replace the tags array
        tags_pattern = r'const tags = \[(.*?)\];'
        new_content = re.sub(tags_pattern, f'const tags = [\n{new_tags_content}\n  ];', content, flags=re.DOTALL)
        
        with open(tags_js_path, 'w') as f:
            f.write(new_content)
        
        return True
    
    def get_machine_name(self):
        """Get machine name from user input"""
        machine_name = input("Enter machine name to remove: ").strip()
        if not machine_name:
            return None
        
        # Keep original case for better matching
        return machine_name
    
    def find_files_to_remove(self, machine_name):
        """Find all files and directories related to the machine"""
        files_to_remove = []
        
        # Convert machine name to different formats for case-insensitive search
        machine_variants = [
            machine_name,
            machine_name.title(),
            machine_name.upper(),
            machine_name.replace('-', ' '),
            machine_name.replace('-', ' ').title()
        ]
        
        # Search for writeup directory
        for variant in machine_variants:
            writeup_dir = self.src_dir / "pages" / "writeups" / variant
            if writeup_dir.exists():
                files_to_remove.append(writeup_dir)
                break
        
        # Search for image directories
        for variant in machine_variants:
            # Main image
            main_image = self.images_dir / f"{variant}-machine.png"
            if main_image.exists():
                files_to_remove.append(main_image)
            
            # Writeup images directory
            writeup_images_dir = self.images_dir / f"{variant}-images"
            if writeup_images_dir.exists():
                files_to_remove.append(writeup_images_dir)
            
            # Alternative image formats
            for ext in ['.jpg', '.jpeg', '.gif', '.webp']:
                alt_image = self.images_dir / f"{variant}-machine{ext}"
                if alt_image.exists():
                    files_to_remove.append(alt_image)
        
        # Search for HTML template
        html_template = self.writeups_dir / f"{machine_name}-walkthrough.html"
        if html_template.exists():
            files_to_remove.append(html_template)
        
        return files_to_remove
    
    def remove_from_js_files(self, machine_name):
        """Remove machine entries from all JS files"""
        # Remove from Home.js
        self.remove_from_js_file(
            self.src_dir / "pages" / "Home.js",
            "recentPosts",
            machine_name
        )
        
        # Remove from Writeups.js
        self.remove_from_js_file(
            self.src_dir / "pages" / "Writeups.js",
            "writeups",
            machine_name
        )
        
        # Remove from Tags.js
        self.remove_from_js_file(
            self.src_dir / "pages" / "Tags.js",
            "allPosts",
            machine_name
        )
        
        # Remove unused tags
        machine_tags = self.get_machine_tags(machine_name)
        if machine_tags:
            self.remove_unused_tags(machine_tags, machine_name)
        
        # Remove from WriteupDetail.js mapping
        self.remove_from_writeup_detail_mapping(machine_name)
        
        # Remove from TagDetail.js
        self.remove_from_tag_detail_js(machine_name)
    
    def remove_from_js_file(self, file_path, array_name, machine_name):
        """Remove machine entry from a JS file array (supports plain and useMemo arrays)."""
        if not file_path.exists():
            print(f"Warning: {file_path.name} not found")
            return False
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Support both plain arrays and useMemo(() => [...], []) forms
        pattern_plain = rf'const\s+{array_name}\s*=\s*\[(.*?)\];'
        pattern_memo = rf'const\s+{array_name}\s*=\s*useMemo\(\(\)\s*=>\s*\[(.*?)\]\s*,\s*\[\s*\]\s*\);'
        match_plain = re.search(pattern_plain, content, re.DOTALL)
        match_memo = re.search(pattern_memo, content, re.DOTALL)
        
        match = match_plain or match_memo
        if not match:
            print(f"Error: Could not find {array_name} array in {file_path.name}")
            return False
        
        array_content = match.group(1)
        
        # Parse the array content to find the machine entry. Consider title/link checks.
        # Keep original line breaks to preserve formatting where possible.
        entries = re.findall(r'(\{[\s\S]*?\})\s*,?', array_content)
        new_entries = []
        removed = False
        machine_name_lower = machine_name.lower()
        link_fragment = f"/writeups/{machine_name_lower}-walkthrough"
        
        for entry in entries:
            entry_lower = entry.lower()
            if (machine_name_lower in entry_lower) or (link_fragment in entry_lower):
                # Skip this entry (remove it)
                removed = True
                continue
            new_entries.append(entry)
        
        if not removed:
            print(f"Info: No entries found for '{machine_name}' in {file_path.name}")
            return True
        
        # Reconstruct inner content with consistent indentation
        if new_entries:
            inner = '\n    ' + ',\n    '.join([e.strip() for e in new_entries]) + '\n  '
        else:
            inner = '\n  '
        
        if match_plain:
            new_content = re.sub(pattern_plain, f'const {array_name} = [{inner}];', content, flags=re.DOTALL)
        else:
            new_content = re.sub(pattern_memo, f'const {array_name} = useMemo(() => [{inner}], []);', content, flags=re.DOTALL)
        
        with open(file_path, 'w') as f:
            f.write(new_content)
        
        print(f"✓ Removed from {file_path.name}")
        return True
    
    def get_machine_tags(self, machine_name):
        """Get tags associated with the machine from Home.js"""
        home_js = self.src_dir / "pages" / "Home.js"
        
        if not home_js.exists():
            return []
        
        with open(home_js, 'r') as f:
            content = f.read()
        
        # Find the machine entry and extract its tags
        pattern = rf"title: '[^']*{re.escape(machine_name)}[^']*'.*?tags: \[(.*?)\]"
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            tags_str = match.group(1)
            # Extract individual tags
            tags = re.findall(r"'([^']*)'", tags_str)
            return tags
        
        return []
    
    def check_tag_usage(self, tag, machine_name):
        """Check if a tag is used by other posts/projects"""
        home_js = self.src_dir / "pages" / "Home.js"
        
        if not home_js.exists():
            return False
        
        with open(home_js, 'r') as f:
            content = f.read()
        
        # Look for tag usage in posts that are NOT the machine being removed
        pattern = rf"tags:.*?{re.escape(tag)}.*?(?!.*{re.escape(machine_name)})"
        return bool(re.search(pattern, content, re.DOTALL | re.IGNORECASE))
    
    def remove_unused_tags(self, machine_tags, machine_name):
        """Remove tags from Tags.js if they're not used by other posts"""
        tags_js = self.src_dir / "pages" / "Tags.js"
        
        if not tags_js.exists():
            return False
        
        with open(tags_js, 'r') as f:
            content = f.read()
        
        for tag in machine_tags:
            if not self.check_tag_usage(tag, machine_name):
                # Remove tag from allPosts array
                pattern = rf"{{[^}}]*title: '[^']*{re.escape(machine_name)}[^']*'[^}}]*}}"
                content = re.sub(pattern, '', content, flags=re.DOTALL)
                
                # Remove tag from tags array
                tag_pattern = rf"{{[^}}]*name: '{re.escape(tag)}'[^}}]*}}"
                content = re.sub(tag_pattern, '', content, flags=re.DOTALL)
                
                print(f"✓ Removed unused tag: {tag}")
        
        # Clean up the file
        content = re.sub(r',\s*,', ',', content)
        content = re.sub(r',\s*];', '];', content)
        
        with open(tags_js, 'w') as f:
            f.write(content)
        
        return True
    
    def remove_from_writeup_detail_mapping(self, machine_name):
        """Remove writeup from WriteupDetail.js mapping"""
        writeup_detail_js = self.src_dir / "pages" / "WriteupDetail.js"
        
        if not writeup_detail_js.exists():
            print("Warning: WriteupDetail.js not found")
            return False
        
        with open(writeup_detail_js, 'r') as f:
            content = f.read()
        
        # Create different variations of the machine name for case-insensitive search
        machine_variants = [
            machine_name,
            machine_name.title(),
            machine_name.upper(),
            machine_name.replace('-', ' '),
            machine_name.replace('-', ' ').title()
        ]
        
        # Split content into lines for safer processing
        lines = content.split('\n')
        new_lines = []
        skip_next = False
        
        for line in lines:
            # Check if this line is an import for the machine we're removing
            should_remove_line = False
            for variant in machine_variants:
                # Try different component name variations
                component_variations = [
                    f"{variant.replace('-', '').replace(' ', '')}Walkthrough",
                    f"{variant.replace('-', '').replace(' ', '').title()}Walkthrough",
                    f"{variant.replace('-', '').replace(' ', '').lower()}Walkthrough"
                ]
                
                for component_name in component_variations:
                    if (f"import {component_name} from './writeups/{variant}" in line or
                        f"import {component_name} from './writeups/{variant.title()}" in line or
                        f"import {component_name} from './writeups/{variant.upper()}" in line):
                        should_remove_line = True
                        break
                
                if should_remove_line:
                    break
            
            if not should_remove_line:
                new_lines.append(line)
        
        content = '\n'.join(new_lines)
        
        # Remove mapping entries for all variations
        for variant in machine_variants:
            component_name = f"{variant.replace('-', '').replace(' ', '')}Walkthrough"
            mapping_patterns = [
                f"    '{variant}-walkthrough': {component_name}",
                f"    '{variant.title()}-walkthrough': {component_name}",
                f"    '{variant.upper()}-walkthrough': {component_name}",
                f"  '{variant}-walkthrough': {component_name}",
                f"  '{variant.title()}-walkthrough': {component_name}",
                f"  '{variant.upper()}-walkthrough': {component_name}"
            ]
            
            for pattern in mapping_patterns:
                content = content.replace(pattern, "")
        
        # Clean up any trailing commas and empty lines
        content = re.sub(r',\s*,', ',', content)
        content = re.sub(r',\s*};', '};', content)
        content = re.sub(r',\s*,\s*};', '};', content)
        
        # Remove only empty lines that were created by our removal
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)  # Remove multiple empty lines
        
        # Ensure the file starts with proper imports
        if not content.strip().startswith('import'):
            # Add back the essential imports if they were accidentally removed
            essential_imports = """import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import './WriteupDetail.css';

"""
            content = essential_imports + content
        
        with open(writeup_detail_js, 'w') as f:
            f.write(content)
        
        print(f"✓ Removed from WriteupDetail.js mapping")
        return True
    
    def remove_from_tag_detail_js(self, machine_name):
        """Remove writeup from TagDetail.js"""
        tag_detail_js = self.src_dir / "pages" / "TagDetail.js"
        
        if not tag_detail_js.exists():
            print("Warning: TagDetail.js not found")
            return False
        
        with open(tag_detail_js, 'r') as f:
            content = f.read()
        
        # Remove the writeup entry from allPosts array
        # Use the same logic as remove_from_js_file but for TagDetail.js
        self.remove_from_js_file(tag_detail_js, "allPosts", machine_name)
        
        print(f"✓ Removed from TagDetail.js")
        return True


class TagManager:
    """Class to manage tags for existing posts and writeups"""
    
    def __init__(self):
        self.base_dir = Path.cwd()
        self.src_dir = self.base_dir / "src"
        self.home_js = self.src_dir / "pages" / "Home.js"
        self.writeups_js = self.src_dir / "pages" / "Writeups.js"
        self.projects_js = self.src_dir / "pages" / "Projects.js"
        self.tags_js = self.src_dir / "pages" / "Tags.js"
        self.tag_detail_js = self.src_dir / "pages" / "TagDetail.js"
    
    def manage_tags(self):
        """Main tag management function"""
        print("=== Tag Manager ===\n")
        
        # Get all posts from different files
        home_posts = self.get_posts_from_file(self.home_js, "recentPosts")
        writeups_posts = self.get_posts_from_file(self.writeups_js, "writeups")
        projects_posts = self.get_posts_from_file(self.projects_js, "projects")
        
        # Combine all posts and deduplicate by title
        all_posts = []
        seen_titles = set()
        
        # Create a mapping to store the most complete version of each post
        post_map = {}
        
        for post in home_posts + writeups_posts + projects_posts:
            title = post['title']
            if title not in post_map:
                post_map[title] = post
            else:
                # Merge with existing post to get the most complete version
                existing = post_map[title]
                merged = existing.copy()
                merged.update(post)
                post_map[title] = merged
        
        all_posts = list(post_map.values())
        
        if not all_posts:
            print("❌ No posts found!")
            return
        
        # Display all posts
        print("📋 Available Posts:")
        for i, post in enumerate(all_posts, 1):
            print(f"  {i}. {post['title']} ({post['category']})")
        
        # Get user selection
        try:
            selection = int(input(f"\nSelect a post (1-{len(all_posts)}): ")) - 1
            if selection < 0 or selection >= len(all_posts):
                print("❌ Invalid selection!")
                return
        except ValueError:
            print("❌ Please enter a valid number!")
            return
        
        selected_post = all_posts[selection]
        print(f"\n✅ Selected: {selected_post['title']}")
        print(f"Current tags: {', '.join(selected_post['tags'])}")
        
        # Ask for action
        print("\nWhat would you like to do?")
        print("1. Add a tag")
        print("2. Remove a tag")
        print("3. Replace all tags")
        
        try:
            action = int(input("Select action (1-3): "))
        except ValueError:
            print("❌ Please enter a valid number!")
            return
        
        if action == 1:
            self.add_tag(selected_post)
        elif action == 2:
            self.remove_tag(selected_post)
        elif action == 3:
            self.replace_tags(selected_post)
        else:
            print("❌ Invalid action!")
            return
    
    def get_posts_from_file(self, file_path, array_name):
        """Extract posts from a JS file"""
        if not file_path.exists():
            return []
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Find the array
        pattern = rf'const {array_name} = \[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            return []
        
        array_content = match.group(1)
        
        # Parse posts from the array content using regex
        posts = []
        post_blocks = re.findall(r'\{[^}]+\}', array_content)
        
        for block in post_blocks:
            post = {}
            
            # Extract title
            title_match = re.search(r"title:\s*['\"]([^'\"]+)['\"]", block)
            if title_match:
                post['title'] = title_match.group(1)
            
            # Extract category
            category_match = re.search(r"category:\s*['\"]([^'\"]+)['\"]", block)
            if category_match:
                post['category'] = category_match.group(1)
            
            # Extract tags
            tags_match = re.search(r'tags:\s*\[(.*?)\]', block)
            if tags_match:
                tags_str = tags_match.group(1)
                tags = re.findall(r"'([^']*)'", tags_str)
                post['tags'] = tags
            
            # Extract other fields
            id_match = re.search(r'id:\s*(\d+)', block)
            if id_match:
                post['id'] = int(id_match.group(1))
            
            excerpt_match = re.search(r"excerpt:\s*['\"]([^'\"]+)['\"]", block)
            if excerpt_match:
                post['excerpt'] = excerpt_match.group(1)
            
            date_match = re.search(r"date:\s*['\"]([^'\"]+)['\"]", block)
            if date_match:
                post['date'] = date_match.group(1)
            
            image_match = re.search(r"image:\s*['\"]([^'\"]+)['\"]", block)
            if image_match:
                post['image'] = image_match.group(1)
            
            link_match = re.search(r"link:\s*['\"]([^'\"]+)['\"]", block)
            if link_match:
                post['link'] = link_match.group(1)
            
            # Only add posts that have at least title and tags
            if post.get('title') and post.get('tags') is not None:
                posts.append(post)
        
        return posts
    
    def extract_value(self, line):
        """Extract value from a key-value line"""
        # Remove quotes and commas
        value = line.split(':', 1)[1].strip()
        value = value.rstrip(',').strip()
        if value.startswith("'") and value.endswith("'"):
            value = value[1:-1]
        elif value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        return value
    
    def extract_tags(self, line):
        """Extract tags from a tags line"""
        # Find the tags array
        tags_match = re.search(r'tags:\s*\[(.*?)\]', line)
        if not tags_match:
            return []
        
        tags_str = tags_match.group(1)
        # Extract individual tags
        tags = re.findall(r"'([^']*)'", tags_str)
        return tags
    
    def add_tag(self, post):
        """Add a tag to a post"""
        new_tag = input("Enter new tag: ").strip().lower()
        if not new_tag:
            print("❌ Tag cannot be empty!")
            return
        
        if new_tag in post['tags']:
            print("❌ Tag already exists!")
            return
        
        # Add tag to post
        post['tags'].append(new_tag)
        
        # Update all files
        self.update_post_in_all_files(post)
        
        print(f"✅ Added tag '{new_tag}' to '{post['title']}'")
    
    def remove_tag(self, post):
        """Remove a tag from a post"""
        if not post['tags']:
            print("❌ No tags to remove!")
            return
        
        print("\nCurrent tags:")
        for i, tag in enumerate(post['tags'], 1):
            print(f"  {i}. {tag}")
        
        try:
            selection = int(input(f"\nSelect tag to remove (1-{len(post['tags'])}): ")) - 1
            if selection < 0 or selection >= len(post['tags']):
                print("❌ Invalid selection!")
                return
        except ValueError:
            print("❌ Please enter a valid number!")
            return
        
        removed_tag = post['tags'].pop(selection)
        
        # Update all files
        self.update_post_in_all_files(post)
        
        print(f"✅ Removed tag '{removed_tag}' from '{post['title']}'")
    
    def replace_tags(self, post):
        """Replace all tags for a post"""
        print("Enter new tags (comma-separated):")
        new_tags_input = input("Tags: ").strip()
        
        if not new_tags_input:
            print("❌ Tags cannot be empty!")
            return
        
        # Parse new tags
        new_tags = [tag.strip().lower() for tag in new_tags_input.split(',') if tag.strip()]
        
        # Replace tags
        post['tags'] = new_tags
        
        # Update all files
        self.update_post_in_all_files(post)
        
        print(f"✅ Replaced tags for '{post['title']}' with: {', '.join(new_tags)}")
    
    def update_post_in_all_files(self, post):
        """Update the post in all relevant files"""
        # Update Home.js
        self.update_post_in_file(self.home_js, "recentPosts", post)
        
        # Update Writeups.js
        self.update_post_in_file(self.writeups_js, "writeups", post)
        
        # Update Projects.js
        self.update_post_in_file(self.projects_js, "projects", post)
        
        # Update Tags.js
        self.update_post_in_file(self.tags_js, "allPosts", post)
        
        # Update TagDetail.js
        self.update_post_in_file(self.tag_detail_js, "allPosts", post)
        
        # Recalculate tag counts
        self.recalculate_tag_counts()
        
        print("✅ Updated all files")
    
    def update_post_in_file(self, file_path, array_name, updated_post):
        """Update a specific post in a file"""
        if not file_path.exists():
            return False
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Find the array
        pattern = rf'const {array_name} = \[(.*?)\];'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            return False
        
        array_content = match.group(1)
        
        # Find the specific post block and replace it
        post_blocks = re.findall(r'(\{[^}]+\})', array_content)
        new_blocks = []
        post_found = False
        
        for block in post_blocks:
            # Check if this is the target post
            title_match = re.search(r"title:\s*['\"]([^'\"]+)['\"]", block)
            if title_match and title_match.group(1) == updated_post['title']:
                # Replace with updated post
                new_block = self.format_post_for_file(updated_post, array_name)
                new_blocks.append(new_block)
                post_found = True
            else:
                # Keep original block
                new_blocks.append(block)
        
        if not post_found:
            return False
        
        # Reconstruct the array content
        new_array_content = ',\n    '.join(new_blocks)
        
        # Replace the array content
        new_content = re.sub(pattern, f'const {array_name} = [\n    {new_array_content}\n  ];', content, flags=re.DOTALL)
        
        with open(file_path, 'w') as f:
            f.write(new_content)
        
        return True
    
    def format_post_for_file(self, post, array_name):
        """Format a post for insertion into a specific file"""
        if array_name == "recentPosts":
            return f"""{{
      id: {post.get('id', 1)},
      title: '{post['title']}',
      excerpt: '{post.get('excerpt', '')}',
      date: '{post.get('date', '')}',
      category: '{post['category']}',
      tags: {str(post['tags'])},
      image: '{post.get('image', '')}',
      link: '{post.get('link', '')}'
    }}"""
        elif array_name == "writeups":
            return f"""{{
      id: {post.get('id', 1)},
      title: '{post['title']}',
      excerpt: '{post.get('excerpt', '')}',
      date: '{post.get('date', '')}',
      tags: {str(post['tags'])},
      image: '{post.get('image', '')}',
      link: '{post.get('link', '')}',
      difficulty: '{post.get('difficulty', 'Medium')}',
      category: '{post['category']}'
    }}"""
        elif array_name == "projects":
            return f"""{{
      id: {post.get('id', 1)},
      title: '{post['title']}',
      excerpt: '{post.get('excerpt', '')}',
      date: '{post.get('date', '')}',
      tags: {str(post['tags'])},
      image: '{post.get('image', '')}',
      link: '{post.get('link', '')}',
      github: '{post.get('github', '')}',
      demo: {post.get('demo', 'null')},
      category: '{post['category']}'
    }}"""
        else:  # allPosts
            return f"""{{
      id: {post.get('id', 1)},
      title: '{post['title']}',
      excerpt: '{post.get('excerpt', '')}',
      date: '{post.get('date', '')}',
      tags: {str(post['tags'])},
      image: '{post.get('image', '')}',
      link: '{post.get('link', '')}',
      category: '{post['category']}'
    }}"""
    
    def recalculate_tag_counts(self):
        """Recalculate tag counts in Tags.js"""
        if not self.tags_js.exists():
            return False
        
        with open(self.tags_js, 'r') as f:
            content = f.read()
        
        # Find the allPosts array
        posts_pattern = r'const allPosts = \[(.*?)\];'
        posts_match = re.search(posts_pattern, content, re.DOTALL)
        
        if not posts_match:
            return False
        
        posts_content = posts_match.group(1)
        
        # Parse all posts and their tags
        post_blocks = re.findall(r'\{[^}]+\}', posts_content)
        all_tags = {}
        
        for block in post_blocks:
            # Extract tags
            tags_match = re.search(r'tags: \[(.*?)\]', block)
            if tags_match:
                tags_str = tags_match.group(1)
                # Extract individual tags
                tags = re.findall(r"'([^']*)'", tags_str)
                for tag in tags:
                    tag_lower = tag.lower()
                    all_tags[tag_lower] = all_tags.get(tag_lower, 0) + 1
        
        # Generate new tags array
        tags_array = []
        for tag_name, count in sorted(all_tags.items()):
            tags_array.append(f"""    {{
      name: '{tag_name}',
      count: {count},
      color: '#3D0000'
    }}""")
        
        new_tags_content = ',\n'.join(tags_array)
        
        # Replace the tags array
        tags_pattern = r'const tags = \[(.*?)\];'
        new_content = re.sub(tags_pattern, f'const tags = [\n{new_tags_content}\n  ];', content, flags=re.DOTALL)
        
        with open(self.tags_js, 'w') as f:
            f.write(new_content)
        
        return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 generate_react_content.py <module>")
        print("Available modules:")
        print("  writeup - Generate a new writeup")
        print("  remove  - Remove all files for a machine")
        print("  tags    - Manage tags for existing posts")
        print("  project - Generate a new project (coming soon)")
        print("  help    - Show this help message")
        sys.exit(1)
    
    module = sys.argv[1].lower()
    
    if module == "writeup":
        generator = WriteupGenerator()
        generator.generate()
    elif module == "remove":
        remover = WriteupRemover()
        remover.remove()
    elif module == "tags":
        tag_manager = TagManager()
        tag_manager.manage_tags()
    elif module == "help":
        print("Usage: python3 generate_react_content.py <module>")
        print("Available modules:")
        print("  writeup - Generate a new writeup")
        print("  remove  - Remove all files for a machine")
        print("  tags    - Manage tags for existing posts")
        print("  project - Generate a new project (coming soon)")
        print("  help    - Show this help message")
    elif module == "project":
        print(f"Module '{module}' is not yet implemented. Coming soon!")
        sys.exit(1)
    else:
        print(f"Unknown module: {module}")
        print("Available modules:")
        print("  writeup - Generate a new writeup")
        print("  remove  - Remove all files for a machine")
        print("  tags    - Manage tags for existing posts")
        print("  project - Generate a new project (coming soon)")
        print("  help    - Show this help message")
        sys.exit(1)

if __name__ == "__main__":
    main()
