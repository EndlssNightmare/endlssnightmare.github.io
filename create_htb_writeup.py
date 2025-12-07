#!/usr/bin/env python3
"""
Script to automate HTB writeup creation and removal including:
- Downloading machine avatar image
- Creating cards in Home, Writeups, and Tags pages
- Creating writeup template component
- Adding routes to WriteupDetail
- Removing all writeup-related files and entries

Usage (Create):
    python create_htb_writeup.py <MachineName> --title "Title" --description "Description" --tags "tag1,tag2" --difficulty "Easy" --os "Linux" --ip "10.10.10.10"
    
Usage (Remove):
    python create_htb_writeup.py --remove <MachineName>
    
Example (Create):
    python create_htb_writeup.py Editor --title "Editor Walkthrough" --description "A Linux machine..." --tags "htb,linux,steg" --difficulty "Easy" --os "Linux" --ip "10.129.1.1"
    
Example (Remove):
    python create_htb_writeup.py --remove Editor
    
Note: The current date will be automatically used when creating.
    
The script requires HTB_TOKEN environment variable to be set for creation (not needed for removal).
"""

import argparse
import os
import sys
import re
import requests
from pathlib import Path
from datetime import datetime
from typing import Tuple

# API base URL
HTB_API_BASE = "https://labs.hackthebox.com/api/v4"
HTB_IMAGE_BASE = "https://htb-mp-prod-public-storage.s3.eu-central-1.amazonaws.com"


def get_current_date() -> str:
    """Get current date in format 'Oct 11, 2025'"""
    now = datetime.now()
    return now.strftime("%b %d, %Y")


def download_machine_image(machine_name: str) -> Tuple[bool, str]:
    """
    Download the machine avatar image from HTB.
    
    Args:
        machine_name: Name of the HTB machine
        
    Returns:
        Tuple of (success, image_path)
    """
    # Get token from environment
    token = os.getenv("HTB_TOKEN")
    if not token:
        print("Error: HTB_TOKEN environment variable is not set.", file=sys.stderr)
        print("Set it with: export HTB_TOKEN=your_token", file=sys.stderr)
        return False, ""
    
    # Prepare headers
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    }
    
    # Get machine profile
    api_url = f"{HTB_API_BASE}/machine/profile/{machine_name}"
    print(f"Fetching machine profile: {machine_name}")
    
    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        machine_info = data.get("info", {})
        
        if not machine_info:
            print(f"Error: Machine '{machine_name}' not found or invalid response.", file=sys.stderr)
            return False, ""
        
        # Extract avatar path
        avatar_path = machine_info.get("avatar")
        if not avatar_path:
            print(f"Error: No avatar found for machine '{machine_name}'.", file=sys.stderr)
            return False, ""
        
        # Construct full image URL
        if avatar_path.startswith("http"):
            image_url = avatar_path
        else:
            image_url = f"{HTB_IMAGE_BASE}{avatar_path}"
        
        print(f"Downloading image from: {image_url}")
        
        # Download the image (S3 doesn't need Authorization header for public files)
        img_headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        }
        img_response = requests.get(image_url, headers=img_headers, stream=True)
        img_response.raise_for_status()
        
        # Create directory: public/images/writeups/machinename (lowercase)
        machine_name_lower = machine_name.lower()
        output_dir = Path("public/images/writeups") / machine_name_lower
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Always save as machine.png
        filename = output_dir / "machine.png"
        
        # Save the image
        with open(filename, 'wb') as f:
            for chunk in img_response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        image_path = f"/images/writeups/{machine_name_lower}/machine.png"
        print(f"Image saved successfully: {filename}")
        return True, image_path
        
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}", file=sys.stderr)
        if e.response.status_code == 404:
            print(f"Machine '{machine_name}' not found.", file=sys.stderr)
        elif e.response.status_code == 401:
            print("Authentication failed. Check your HTB_TOKEN.", file=sys.stderr)
        return False, ""
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}", file=sys.stderr)
        return False, ""
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False, ""


def format_tags_for_home(tags: list) -> list:
    """Format tags for Home.js (lowercase)"""
    return [tag.lower() for tag in tags]


def format_tags_for_writeups(tags: list) -> list:
    """Format tags for Writeups.js (capitalized)"""
    return [tag.capitalize() for tag in tags]


def format_tags_for_tags_page(tags: list) -> list:
    """Format tags for Tags.js (lowercase)"""
    return [tag.lower() for tag in tags]


def get_next_id(file_path: Path) -> int:
    """Get the next available ID from a file"""
    try:
        content = file_path.read_text()
        # Find all id: numbers
        ids = re.findall(r'id:\s*(\d+)', content)
        if ids:
            return max(int(id) for id in ids) + 1
        return 1
    except:
        return 1


def add_card_to_home(machine_name: str, title: str, excerpt: str, tags: list, 
                     image_path: str, link: str, os: str, date: str) -> bool:
    """Add card to Home.js"""
    try:
        file_path = Path("src/pages/Home.js")
        content = file_path.read_text()
        
        # Get next ID
        next_id = get_next_id(file_path)
        
        # Format tags for Home
        formatted_tags = format_tags_for_home(tags)
        
        # Create new card entry
        new_card = f"""    {{
      id: {next_id},
      title: '{title}',
      excerpt: '{excerpt.replace("'", "\\'")}',
      date: '{date}',
      category: 'writeup',
      tags: {formatted_tags},
      image: '{image_path}',
      link: '{link}',
      os: '{os}'
    }},"""
        
        # Find the recentPosts array and insert after the opening bracket
        # Look for the pattern: recentPosts = useMemo(() => [
        pattern = r"(recentPosts = useMemo\(\(\) => \[)"
        match = re.search(pattern, content)
        if match:
            # Find the position after the opening bracket and newline
            insert_pos = match.end()
            # Skip any whitespace/newlines after the bracket
            while insert_pos < len(content) and content[insert_pos] in [' ', '\n', '\t']:
                insert_pos += 1
            # Insert the new card with proper formatting
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print(f"✓ Added card to Home.js with id {next_id}")
            return True
        else:
            print("Error: Could not find recentPosts array in Home.js", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Error adding card to Home.js: {e}", file=sys.stderr)
        return False


def add_card_to_writeups(machine_name: str, title: str, excerpt: str, tags: list,
                         image_path: str, link: str, difficulty: str, os: str, date: str) -> bool:
    """Add card to Writeups.js"""
    try:
        file_path = Path("src/pages/Writeups.js")
        content = file_path.read_text()
        
        # Get next ID
        next_id = get_next_id(file_path)
        
        # Format tags for Writeups
        formatted_tags = format_tags_for_writeups(tags)
        
        # Create new card entry
        new_card = f"""    {{
      id: {next_id},
      title: '{title}',
      excerpt: '{excerpt.replace("'", "\\'")}',
      date: '{date}',
      tags: {formatted_tags},
      image: '{image_path}',
      link: '{link}',
      difficulty: '{difficulty}',
      category: 'writeup',
      os: '{os}'
    }},"""
        
        # Find the writeups array
        pattern = r"(writeups = useMemo\(\(\) => \[)"
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            # Skip any whitespace/newlines after the bracket
            while insert_pos < len(content) and content[insert_pos] in [' ', '\n', '\t']:
                insert_pos += 1
            # Insert the new card with proper formatting
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print(f"✓ Added card to Writeups.js with id {next_id}")
            return True
        else:
            print("Error: Could not find writeups array in Writeups.js", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Error adding card to Writeups.js: {e}", file=sys.stderr)
        return False


def add_card_to_tags(machine_name: str, title: str, tags: list) -> bool:
    """Add card to Tags.js"""
    try:
        file_path = Path("src/pages/Tags.js")
        content = file_path.read_text()
        
        # Get next ID
        next_id = get_next_id(file_path)
        
        # Format tags for Tags page (lowercase)
        formatted_tags = format_tags_for_tags_page(tags)
        
        # Create new card entry
        new_card = f"""    {{
      id: {next_id},
      title: '{title}',
      category: 'writeup',
      tags: {formatted_tags}
    }},"""
        
        # Find the allPosts array
        pattern = r"(const allPosts = \[)"
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            # Skip any whitespace/newlines after the bracket
            while insert_pos < len(content) and content[insert_pos] in [' ', '\n', '\t']:
                insert_pos += 1
            # Insert the new card with proper formatting
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print(f"✓ Added card to Tags.js with id {next_id}")
            return True
        else:
            print("Error: Could not find allPosts array in Tags.js", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Error adding card to Tags.js: {e}", file=sys.stderr)
        return False


def add_card_to_tag_detail(machine_name: str, title: str, excerpt: str, tags: list,
                           image_path: str, link: str, date: str, os: str) -> bool:
    """Add card to TagDetail.js"""
    try:
        file_path = Path("src/pages/TagDetail.js")
        content = file_path.read_text()
        
        # Get next ID
        next_id = get_next_id(file_path)
        
        # Format tags for TagDetail (lowercase, same as TagDetail.js expects)
        formatted_tags = format_tags_for_tags_page(tags)
        
        # Create new card entry (TagDetail needs full post data)
        new_card = f"""    {{
      id: {next_id},
      title: '{title}',
      excerpt: '{excerpt.replace("'", "\\'")}',
      date: '{date}',
      tags: {formatted_tags},
      image: '{image_path}',
      link: '{link}',
      category: 'writeup',
      os: '{os}'
    }},"""
        
        # Find the allPosts array
        pattern = r"(const allPosts = \[)"
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            # Skip any whitespace/newlines after the bracket
            while insert_pos < len(content) and content[insert_pos] in [' ', '\n', '\t']:
                insert_pos += 1
            # Insert the new card with proper formatting
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print(f"✓ Added card to TagDetail.js with id {next_id}")
            return True
        else:
            print("Error: Could not find allPosts array in TagDetail.js", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Error adding card to TagDetail.js: {e}", file=sys.stderr)
        return False


def create_writeup_component(machine_name: str, title: str, excerpt: str, tags: list,
                            difficulty: str, os: str, ip: str, date: str, image_path: str) -> bool:
    """Create writeup React component based on tombwatcher template"""
    try:
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        component_dir = Path(f"src/pages/writeups/{machine_name_lower}")
        component_dir.mkdir(parents=True, exist_ok=True)
        
        # Read tombwatcher template
        template_path = Path("src/pages/writeups/tombwatcher/TombwatcherWalkthrough.js")
        template_content = template_path.read_text()
        
        # Replace component name
        template_content = template_content.replace("TombwatcherWalkthrough", component_name)
        template_content = template_content.replace("tombwatcher", machine_name_lower)
        template_content = template_content.replace("TombWatcher", title.replace(" Walkthrough", ""))
        
        # Replace writeup data
        formatted_tags_writeups = format_tags_for_writeups(tags)
        machine_title = title.replace(" Walkthrough", "")
        writeup_data = f"""  const writeup = {{
    id: '{machine_name_lower}-walkthrough',
    title: '{title}',
    excerpt: '{excerpt.replace("'", "\\'")}',
    date: '{date}',
    tags: {formatted_tags_writeups},
    difficulty: '{difficulty}',
    os: '{os}',
    ip: '{ip}',
    content: `# {machine_title}

## Overview
{excerpt}

## Enumeration

## Foothold

## Privilege Escalation

## Conclusion
`}};"""
        
        # Find and replace the writeup data
        # Match from "const writeup = {" to the closing "};" after the template literal
        # Use non-greedy match with proper escaping
        pattern = r"(const writeup = \{[\s\S]*?`\};)"
        template_content = re.sub(pattern, writeup_data, template_content, count=1)
        
        # Additional replacements to ensure all fields are updated
        # Replace date if still old
        date_pattern = r"(date:\s*)'[^']*'"
        template_content = re.sub(date_pattern, f"\\1'{date}'", template_content)
        
        # Replace difficulty if still old
        difficulty_pattern = r"(difficulty:\s*)'[^']*'"
        template_content = re.sub(difficulty_pattern, f"\\1'{difficulty}'", template_content)
        
        # Replace OS if still old
        os_pattern = r"(os:\s*)'[^']*'"
        template_content = re.sub(os_pattern, f"\\1'{os}'", template_content)
        
        # Replace IP if still old
        ip_pattern = r"(ip:\s*)'[^']*'"
        template_content = re.sub(ip_pattern, f"\\1'{ip}'", template_content)
        
        # Replace title if still old
        title_pattern = r"(title:\s*)'[^']*'"
        template_content = re.sub(title_pattern, f"\\1'{title}'", template_content)
        
        # Replace excerpt if still old
        excerpt_pattern = r"(excerpt:\s*)'[^']*'"
        escaped_excerpt = excerpt.replace("'", "\\'")
        template_content = re.sub(excerpt_pattern, f"\\1'{escaped_excerpt}'", template_content)
        
        # Replace tags if still old
        if "['Htb', 'Ad', 'Adcs'" in template_content or "['Htb', 'Ad', 'Adcs', 'Password-Cracking', 'Gmsa'" in template_content:
            # Replace tags directly
            old_tags_pattern = r"tags:\s*\[[^\]]+\]"
            template_content = re.sub(old_tags_pattern, f"tags: {formatted_tags_writeups}", template_content)
        
        # Replace id if still old
        id_pattern = r"(id:\s*)'[^']*'"
        template_content = re.sub(id_pattern, f"\\1'{machine_name_lower}-walkthrough'", template_content)
        
        # Replace image path
        template_content = template_content.replace(
            '/images/writeups/tombwatcher/machine.png',
            image_path
        )
        
        # Write the new component
        component_file = component_dir / f"{component_name}.js"
        component_file.write_text(template_content)
        print(f"✓ Created writeup component: {component_file}")
        
        # Copy CSS file
        css_template = Path("src/pages/writeups/tombwatcher/TombwatcherWalkthrough.css")
        if css_template.exists():
            css_content = css_template.read_text()
            css_content = css_content.replace("TombWatcher", title.replace(" Walkthrough", ""))
            css_file = component_dir / f"{component_name}.css"
            css_file.write_text(css_content)
            print(f"✓ Created CSS file: {css_file}")
        
        return True
    except Exception as e:
        print(f"Error creating writeup component: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def remove_card_from_home(machine_name: str) -> bool:
    """Remove card from Home.js"""
    try:
        file_path = Path("src/pages/Home.js")
        content = file_path.read_text()
        
        machine_name_lower = machine_name.lower()
        link_pattern = f"/writeups/{machine_name_lower}-walkthrough"
        
        # Find and remove the card entry
        # Pattern to match a card object that contains the link (multiline)
        # Match from opening brace to closing brace and comma
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?link:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        matches = list(re.finditer(pattern, content))
        
        for match in matches:
            if link_pattern in match.group(1):
                # Remove the card including whitespace
                content = content[:match.start()] + content[match.end():]
                file_path.write_text(content)
                print(f"✓ Removed card from Home.js")
                return True
        
        print(f"Warning: Card not found in Home.js for {machine_name}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error removing card from Home.js: {e}", file=sys.stderr)
        return False


def remove_card_from_writeups(machine_name: str) -> bool:
    """Remove card from Writeups.js"""
    try:
        file_path = Path("src/pages/Writeups.js")
        content = file_path.read_text()
        
        machine_name_lower = machine_name.lower()
        link_pattern = f"/writeups/{machine_name_lower}-walkthrough"
        
        # Find and remove the card entry (multiline)
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?link:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        matches = list(re.finditer(pattern, content))
        
        for match in matches:
            if link_pattern in match.group(1):
                content = content[:match.start()] + content[match.end():]
                file_path.write_text(content)
                print(f"✓ Removed card from Writeups.js")
                return True
        
        print(f"Warning: Card not found in Writeups.js for {machine_name}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error removing card from Writeups.js: {e}", file=sys.stderr)
        return False


def remove_card_from_tags(machine_name: str) -> bool:
    """Remove card from Tags.js"""
    try:
        file_path = Path("src/pages/Tags.js")
        content = file_path.read_text()
        
        machine_name_lower = machine_name.lower()
        title_pattern = f"{machine_name.capitalize()} Walkthrough"
        
        # Find and remove the card entry (multiline)
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?title:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        matches = list(re.finditer(pattern, content))
        
        for match in matches:
            match_text = match.group(1)
            if title_pattern in match_text or machine_name_lower in match_text.lower():
                content = content[:match.start()] + content[match.end():]
                file_path.write_text(content)
                print(f"✓ Removed card from Tags.js")
                return True
        
        print(f"Warning: Card not found in Tags.js for {machine_name}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error removing card from Tags.js: {e}", file=sys.stderr)
        return False


def remove_card_from_tag_detail(machine_name: str) -> bool:
    """Remove card from TagDetail.js"""
    try:
        file_path = Path("src/pages/TagDetail.js")
        content = file_path.read_text()
        
        machine_name_lower = machine_name.lower()
        link_pattern = f"/writeups/{machine_name_lower}-walkthrough"
        
        # Find and remove the card entry (multiline)
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?link:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        matches = list(re.finditer(pattern, content))
        
        for match in matches:
            if link_pattern in match.group(1):
                content = content[:match.start()] + content[match.end():]
                file_path.write_text(content)
                print(f"✓ Removed card from TagDetail.js")
                return True
        
        print(f"Warning: Card not found in TagDetail.js for {machine_name}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error removing card from TagDetail.js: {e}", file=sys.stderr)
        return False


def remove_route_from_writeup_detail(machine_name: str) -> bool:
    """Remove route from WriteupDetail.js"""
    try:
        file_path = Path("src/pages/WriteupDetail.js")
        content = file_path.read_text()
        
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        route_id = f"{machine_name_lower}-walkthrough"
        
        # Remove import
        import_pattern = f"import {component_name} from './writeups/{machine_name_lower}/{component_name}';"
        if import_pattern in content:
            content = content.replace(import_pattern + "\n", "")
            content = content.replace(import_pattern, "")
        
        # Remove from writeupComponents map
        # Find the exact entry to remove - be very precise
        # Pattern to match the entry line with optional comma and newline
        pattern = rf"(\s*)'{route_id}':\s*{component_name},?\s*\n"
        
        # Find all matches and remove only the one that matches our route_id exactly
        matches = list(re.finditer(pattern, content))
        if matches:
            # Remove the first (and should be only) match
            match = matches[0]
            removed_text = match.group(0)
            
            # Check if the removed entry had a comma
            had_comma = ',' in removed_text
            
            # Remove the entry
            content = content[:match.start()] + content[match.end():]
            
            # Now fix the comma on the new last entry if needed
            # Find the writeupComponents object boundaries
            start_pattern = r"const writeupComponents = \{"
            start_match = re.search(start_pattern, content)
            if start_match:
                start_pos = start_match.end()
                # Find the closing }; of the object
                brace_count = 1
                pos = start_pos
                end_pos = None
                
                while pos < len(content) and brace_count > 0:
                    if content[pos] == '{':
                        brace_count += 1
                    elif content[pos] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            # Found the closing brace, find semicolon
                            semicolon_pos = pos + 1
                            while semicolon_pos < len(content) and content[semicolon_pos] in [' ', '\n', '\t']:
                                semicolon_pos += 1
                            if semicolon_pos < len(content) and content[semicolon_pos] == ';':
                                end_pos = semicolon_pos + 1
                                break
                    pos += 1
                
                if end_pos:
                    # Extract object content
                    object_content = content[start_pos:end_pos-1]  # -1 to exclude };
                    lines = object_content.split('\n')
                    
                    # Find the last entry (non-empty line with key-value pair)
                    last_entry_idx = None
                    for i in range(len(lines) - 1, -1, -1):
                        line = lines[i].strip()
                        if line and "':" in line and not line.startswith('//'):
                            last_entry_idx = i
                            break
                    
                    # If we removed the last entry (no comma), ensure new last entry has no comma
                    # If we removed a middle entry (had comma), ensure new last entry has no comma
                    if last_entry_idx is not None:
                        last_line = lines[last_entry_idx].rstrip()
                        # The last entry should never have a comma
                        if last_line.endswith(','):
                            lines[last_entry_idx] = last_line.rstrip(',')
                            # Reconstruct the object
                            new_object_content = '\n'.join(lines)
                            content = content[:start_pos] + new_object_content + content[end_pos-1:]
        
        file_path.write_text(content)
        print(f"✓ Removed route from WriteupDetail.js")
        return True
    except Exception as e:
        print(f"Error removing route from WriteupDetail.js: {e}", file=sys.stderr)
        return False


def remove_writeup_component(machine_name: str) -> bool:
    """Remove writeup component files"""
    try:
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        component_dir = Path(f"src/pages/writeups/{machine_name_lower}")
        
        # Remove JS file
        js_file = component_dir / f"{component_name}.js"
        if js_file.exists():
            js_file.unlink()
            print(f"✓ Removed {js_file}")
        
        # Remove CSS file
        css_file = component_dir / f"{component_name}.css"
        if css_file.exists():
            css_file.unlink()
            print(f"✓ Removed {css_file}")
        
        # Remove directory if empty
        try:
            if component_dir.exists() and not any(component_dir.iterdir()):
                component_dir.rmdir()
                print(f"✓ Removed directory {component_dir}")
        except:
            pass
        
        return True
    except Exception as e:
        print(f"Error removing writeup component: {e}", file=sys.stderr)
        return False


def remove_machine_image(machine_name: str) -> bool:
    """Remove machine image directory"""
    try:
        machine_name_lower = machine_name.lower()
        image_dir = Path(f"public/images/writeups/{machine_name_lower}")
        
        if image_dir.exists():
            import shutil
            shutil.rmtree(image_dir)
            print(f"✓ Removed image directory {image_dir}")
            return True
        else:
            print(f"Warning: Image directory not found: {image_dir}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"Error removing image directory: {e}", file=sys.stderr)
        return False


def remove_writeup(machine_name: str) -> bool:
    """Remove all writeup-related files and entries"""
    print(f"\n{'='*60}")
    print(f"Removing writeup for: {machine_name}")
    print(f"{'='*60}\n")
    
    success = True
    
    # Remove cards
    print("Step 1: Removing cards from pages...")
    if not remove_card_from_home(machine_name):
        success = False
    
    if not remove_card_from_writeups(machine_name):
        success = False
    
    if not remove_card_from_tags(machine_name):
        success = False
    
    if not remove_card_from_tag_detail(machine_name):
        success = False
    
    # Remove route
    print("\nStep 2: Removing route from WriteupDetail.js...")
    if not remove_route_from_writeup_detail(machine_name):
        success = False
    
    # Remove component
    print("\nStep 3: Removing writeup component...")
    if not remove_writeup_component(machine_name):
        success = False
    
    # Remove image
    print("\nStep 4: Removing machine image...")
    if not remove_machine_image(machine_name):
        success = False
    
    print(f"\n{'='*60}")
    if success:
        print("✓ Writeup removal completed successfully!")
    else:
        print("⚠ Writeup removal completed with some warnings.")
    print(f"{'='*60}")
    
    return success


def add_route_to_writeup_detail(machine_name: str) -> bool:
    """Add route to WriteupDetail.js"""
    try:
        file_path = Path("src/pages/WriteupDetail.js")
        content = file_path.read_text()
        
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        route_id = f"{machine_name_lower}-walkthrough"
        
        # Add import
        import_line = f"import {component_name} from './writeups/{machine_name_lower}/{component_name}';"
        
        # Find the last import before the component
        import_pattern = r"(import DC02Walkthrough from './writeups/dc02/DC02Walkthrough';)"
        match = re.search(import_pattern, content)
        if match:
            insert_pos = match.end()
            content = content[:insert_pos] + "\n" + import_line + content[insert_pos:]
        else:
            # Try to find any import
            import_pattern = r"(import \w+Walkthrough from './writeups/[\w/]+';)"
            matches = list(re.finditer(import_pattern, content))
            if matches:
                last_import = matches[-1]
                insert_pos = last_import.end()
                content = content[:insert_pos] + "\n" + import_line + content[insert_pos:]
            else:
                print("Error: Could not find import section in WriteupDetail.js", file=sys.stderr)
                return False
        
        # Add to writeupComponents map
        # Find the writeupComponents object - be very careful to preserve everything
        # Find the start of the object
        start_pattern = r"const writeupComponents = \{"
        start_match = re.search(start_pattern, content)
        if not start_match:
            print("Error: Could not find writeupComponents declaration in WriteupDetail.js", file=sys.stderr)
            return False
        
        # Find the closing brace of writeupComponents object (not the function)
        # We need to find the }; that closes the object, not the function
        start_pos = start_match.end()
        brace_count = 1
        pos = start_pos
        end_pos = None
        
        while pos < len(content) and brace_count > 0:
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                brace_count -= 1
                if brace_count == 0:
                    # Found the closing brace, now find the semicolon
                    semicolon_pos = pos + 1
                    while semicolon_pos < len(content) and content[semicolon_pos] in [' ', '\n', '\t']:
                        semicolon_pos += 1
                    if semicolon_pos < len(content) and content[semicolon_pos] == ';':
                        end_pos = semicolon_pos + 1
                        break
            pos += 1
        
        if end_pos is None:
            print("Error: Could not find closing brace of writeupComponents in WriteupDetail.js", file=sys.stderr)
            return False
        
        # Extract the object content (everything between { and };)
        # end_pos points to after the semicolon, so we need to go back to find the closing brace
        closing_brace_pos = None
        for i in range(end_pos - 1, start_pos - 1, -1):
            if content[i] == '}':
                closing_brace_pos = i
                break
        
        if closing_brace_pos is None:
            print("Error: Could not find closing brace of writeupComponents in WriteupDetail.js", file=sys.stderr)
            return False
        
        # Extract object content (from after { to before })
        object_content = content[start_pos:closing_brace_pos]
        
        # Find the last entry in the object
        lines = object_content.split('\n')
        last_entry_line_idx = None
        for i in range(len(lines) - 1, -1, -1):
            line = lines[i].strip()
            if line and "':" in line and not line.startswith('//'):
                last_entry_line_idx = i
                break
        
        if last_entry_line_idx is not None:
            # Check if last entry has comma
            last_line = lines[last_entry_line_idx]
            if not last_line.rstrip().endswith(','):
                # Add comma to last entry
                lines[last_entry_line_idx] = last_line.rstrip() + ','
                object_content = '\n'.join(lines)
        
        # Add the new entry (without comma since it will be the last)
        component_entry = f"    '{route_id}': {component_name}"
        
        # Reconstruct: everything before + updated object with new entry + closing }; + everything after
        before_object = content[:start_pos]
        after_object = content[end_pos:]
        new_content = before_object + object_content + "\n" + component_entry + "\n  };" + after_object
        
        file_path.write_text(new_content)
        print(f"✓ Added route to WriteupDetail.js")
        return True
    except Exception as e:
        print(f"Error adding route to WriteupDetail.js: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Automate HTB writeup creation and removal",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create writeup for machine "Editor"
  python create_htb_writeup.py Editor \\
    --title "Editor Walkthrough" \\
    --description "A Linux machine that demonstrates..." \\
    --tags "htb,linux,steg" \\
    --difficulty "Easy" \\
    --os "Linux" \\
    --ip "10.129.1.1"
  
  # Remove writeup for machine "Editor"
  python create_htb_writeup.py --remove Editor
  
  Note: The current date will be automatically used when creating.
  
  # Make sure HTB_TOKEN is set for creation
  export HTB_TOKEN=your_token_here
        """
    )
    
    parser.add_argument(
        "--remove",
        type=str,
        metavar="MACHINE_NAME",
        help="Remove writeup for the specified machine name"
    )
    
    parser.add_argument(
        "machine_name",
        type=str,
        nargs="?",
        help="Name of the HTB machine (required for create mode)"
    )
    
    parser.add_argument(
        "--title",
        type=str,
        help="Title of the writeup (e.g., 'Editor Walkthrough')"
    )
    
    parser.add_argument(
        "--description",
        type=str,
        help="Description/excerpt of the writeup"
    )
    
    parser.add_argument(
        "--tags",
        type=str,
        help="Comma-separated list of tags (e.g., 'htb,linux,steg')"
    )
    
    parser.add_argument(
        "--difficulty",
        type=str,
        choices=["Easy", "Medium", "Hard", "Insane"],
        help="Difficulty level"
    )
    
    parser.add_argument(
        "--os",
        type=str,
        choices=["Linux", "Windows"],
        help="Operating system"
    )
    
    parser.add_argument(
        "--ip",
        type=str,
        help="Machine IP address"
    )
    
    args = parser.parse_args()
    
    # Handle remove mode
    if args.remove:
        success = remove_writeup(args.remove)
        sys.exit(0 if success else 1)
    
    # Validate required arguments for create mode
    if not args.machine_name:
        parser.error("machine_name is required for create mode")
    if not args.title:
        parser.error("--title is required for create mode")
    if not args.description:
        parser.error("--description is required for create mode")
    if not args.tags:
        parser.error("--tags is required for create mode")
    if not args.difficulty:
        parser.error("--difficulty is required for create mode")
    if not args.os:
        parser.error("--os is required for create mode")
    if not args.ip:
        parser.error("--ip is required for create mode")
    
    # Get current date automatically
    current_date = get_current_date()
    
    # Parse tags
    tags = [tag.strip() for tag in args.tags.split(",")]
    
    # Generate link
    machine_name_lower = args.machine_name.lower()
    link = f"/writeups/{machine_name_lower}-walkthrough"
    
    print(f"\n{'='*60}")
    print(f"Creating writeup for: {args.machine_name}")
    print(f"{'='*60}\n")
    
    # Step 1: Download image
    print("Step 1: Downloading machine image...")
    success, image_path = download_machine_image(args.machine_name)
    if not success:
        print("Failed to download image. Exiting.", file=sys.stderr)
        sys.exit(1)
    
    # Step 2: Create writeup component
    print("\nStep 2: Creating writeup component...")
    if not create_writeup_component(
        args.machine_name, args.title, args.description, tags,
        args.difficulty, args.os, args.ip, current_date, image_path
    ):
        print("Failed to create writeup component.", file=sys.stderr)
        sys.exit(1)
    
    # Step 3: Add route
    print("\nStep 3: Adding route to WriteupDetail.js...")
    if not add_route_to_writeup_detail(args.machine_name):
        print("Failed to add route.", file=sys.stderr)
        sys.exit(1)
    
    # Step 4: Add cards
    print("\nStep 4: Adding cards to pages...")
    if not add_card_to_home(args.machine_name, args.title, args.description, tags,
                           image_path, link, args.os, current_date):
        print("Failed to add card to Home.js", file=sys.stderr)
    
    if not add_card_to_writeups(args.machine_name, args.title, args.description, tags,
                                image_path, link, args.difficulty, args.os, current_date):
        print("Failed to add card to Writeups.js", file=sys.stderr)
    
    if not add_card_to_tags(args.machine_name, args.title, tags):
        print("Failed to add card to Tags.js", file=sys.stderr)
    
    if not add_card_to_tag_detail(args.machine_name, args.title, args.description, tags,
                                 image_path, link, current_date, args.os):
        print("Failed to add card to TagDetail.js", file=sys.stderr)
    
    print(f"\n{'='*60}")
    print("✓ Writeup creation completed successfully!")
    print(f"{'='*60}")
    print(f"\nNext steps:")
    print(f"1. Edit the writeup content in: src/pages/writeups/{machine_name_lower}/{args.machine_name.capitalize()}Walkthrough.js")
    print(f"2. Add images to: public/images/writeups/{machine_name_lower}/")
    print(f"3. Test the writeup at: http://localhost:3000{link}")


if __name__ == "__main__":
    main()

