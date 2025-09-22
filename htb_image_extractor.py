#!/usr/bin/env python3
"""
HTB Image Extractor Module
Extracts machine photos from HackTheBox API and downloads them for portfolio use.
"""

import os
import sys
import json
import requests
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any

class HTBImageExtractor:
    def __init__(self, htb_token: str = None):
        """
        Initialize the HTB Image Extractor.
        
        Args:
            htb_token (str): HTB API token. If not provided, will try to get from environment.
        """
        self.htb_token = htb_token or os.getenv('HTB_TOKEN')
        if not self.htb_token:
            # Token is optional for local-only operations like card removal
            print("Warning: HTB_TOKEN not set. Network operations may fail; local operations are available.")
        
        self.base_url = "https://labs.hackthebox.com/api/v4"
        self.storage_base_url = "https://htb-mp-prod-public-storage.s3.eu-central-1.amazonaws.com"
        
        # Create directories if they don't exist
        self.public_dir = Path("public")
        self.public_dir.mkdir(exist_ok=True)

    def get_machine_info(self, machine_name: str) -> Optional[Dict[str, Any]]:
        """
        Get machine information from HTB API.
        
        Args:
            machine_name (str): Name of the HTB machine (e.g., 'example-machine')
            
        Returns:
            dict: Machine information or None if not found
        """
        # Sanitize machine_name to avoid path manipulation/SSRF
        import re as _re
        if not _re.fullmatch(r"[A-Za-z0-9_-]+", machine_name or ""):
            print("Invalid machine name format")
            return None
        url = f"{self.base_url}/machine/profile/{machine_name}"
        headers = {
            "Authorization": f"Bearer {self.htb_token}",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://app.hackthebox.com/"
        }
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get('info', {})
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching machine info for '{machine_name}': {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response for '{machine_name}': {e}")
            return None

    def get_machine_avatar_path(self, machine_name: str) -> Optional[str]:
        """
        Get the avatar path for a machine using the HTB API (no shell calls).
        """
        try:
            info = self.get_machine_info(machine_name)
            if not info:
                return None
            avatar_path = info.get('avatar')
            # Basic sanitization to avoid SSRF-style surprises
            if isinstance(avatar_path, str) and avatar_path.startswith('/'):
                # allow only safe chars
                import re
                if re.fullmatch(r"/[a-zA-Z0-9/_\-.]+", avatar_path):
                    return avatar_path
            return None
        except Exception as e:
            print(f"Unexpected error for '{machine_name}': {e}")
            return None

    def download_and_rename_image(self, avatar_path: str, new_filename: str) -> bool:
        """
        Downloads an image from the HTB public storage and saves it with a new name.
        
        Args:
            avatar_path (str): Avatar path from HTB API
            new_filename (str): New filename to save as
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not avatar_path:
            print("No avatar path provided")
            return False
            
        full_url = f"{self.storage_base_url}{avatar_path}"
        
        try:
            response = requests.get(full_url, stream=True)
            response.raise_for_status()
            
            # Ensure the filename has a proper extension
            if not any(new_filename.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']):
                # Try to get extension from content type
                content_type = response.headers.get('content-type', '')
                if 'png' in content_type:
                    new_filename += '.png'
                elif 'jpeg' in content_type or 'jpg' in content_type:
                    new_filename += '.jpg'
                elif 'gif' in content_type:
                    new_filename += '.gif'
                elif 'webp' in content_type:
                    new_filename += '.webp'
                else:
                    new_filename += '.png'  # Default to PNG
            
            # Ensure destination stays within the public directory
            dest_path = Path(new_filename)
            public_root = self.public_dir.resolve()
            try:
                dest_resolved = dest_path.resolve()
                # Ensure parent directories exist
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                # Check traversal
                _ = dest_resolved.relative_to(public_root)
            except Exception:
                print("Refusing to write outside the public directory")
                return False

            # Check if the file already exists to avoid overwriting
            if dest_path.exists():
                print(f"File '{new_filename}' already exists. Skipping download.")
                return True
            
            with open(dest_path, 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)
            
            print(f"Successfully downloaded and saved as '{new_filename}'")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"An error occurred downloading image: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error saving image: {e}")
            return False

    def extract_machine_image(self, machine_name: str, output_filename: str = None, use_writeup_images_dir: bool = True) -> Optional[str]:
        """
        Extract and download machine image from HTB.
        
        Args:
            machine_name (str): Name of the HTB machine
            output_filename (str): Output filename (optional, will auto-generate if not provided)
            use_machine_images_dir (bool): Whether to save in machine-images directory
            
        Returns:
            str: Path to downloaded image or None if failed
        """
        print(f"Extracting image for machine: {machine_name}")
        
        # Get avatar path
        avatar_path = self.get_machine_avatar_path(machine_name)
        if not avatar_path:
            print(f"Could not get avatar path for machine '{machine_name}'")
            return None
        
        print(f"Found avatar path: {avatar_path}")
        
        # Always normalize to lowercase folder and filename used by the site
        output_filename = "machine.png"
        folder_name = machine_name.lower()
        
        # Determine save location
        if use_writeup_images_dir:
            # Save in new per-writeup directory under public/images/writeups/<machine_name>/
            writeup_images_dir = Path("public/images/writeups") / folder_name
            writeup_images_dir.mkdir(parents=True, exist_ok=True)
            output_filename = str(writeup_images_dir / output_filename)
        else:
            # Save in public directory
            if not output_filename.startswith('public/'):
                output_filename = f"public/{output_filename}"
        
        # Download the image
        if self.download_and_rename_image(avatar_path, output_filename):
            # Return web-relative path for use in the React app
            try:
                file_name = Path(output_filename).name
            except Exception:
                file_name = "machine.png"
            web_path = f"/images/writeups/{folder_name}/{file_name}"
            return web_path
        else:
            return None

    # ------------------- Removal helpers for React cards -------------------
    def _remove_entry_from_js_array(self, file_path: Path, array_name: str, machine_name: str) -> bool:
        """
        Remove a writeup card from a JS file supporting both plain and useMemo arrays.
        Returns True if the file was updated or entry did not exist; False on hard failure.
        """
        try:
            if not file_path.exists():
                print(f"Warning: {file_path} not found")
                return False
            content = file_path.read_text()
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return False

        import re
        pattern_plain = rf"const\\s+{array_name}\\s*=\\s*\\[(.*?)\\];"
        pattern_memo = rf"const\\s+{array_name}\\s*=\\s*useMemo\\(\\(\\)\\s*=>\\s*\\[(.*?)\\]\\s*,\\s*\\[\\s*\\]\\s*\\);"
        match_plain = re.search(pattern_plain, content, re.DOTALL)
        match_memo = re.search(pattern_memo, content, re.DOTALL)
        match = match_plain or match_memo
        if not match:
            print(f"Info: Could not find {array_name} array in {file_path.name}")
            return True

        inner = match.group(1)
        entries = re.findall(r"(\{[\s\S]*?\})\s*,?", inner)
        if not entries:
            return True

        machine_lower = machine_name.lower()
        link_fragment = f"/writeups/{machine_lower}-walkthrough"
        kept = []
        removed_any = False
        for e in entries:
            el = e.lower()
            if machine_lower in el or link_fragment in el:
                removed_any = True
                continue
            kept.append(e.strip())

        if not removed_any:
            return True

        if kept:
            new_inner = "\n    " + ",\n    ".join(kept) + "\n  "
        else:
            new_inner = "\n  "

        if match_plain:
            new_content = re.sub(pattern_plain, f"const {array_name} = [{new_inner}];", content, flags=re.DOTALL)
        else:
            new_content = re.sub(pattern_memo, f"const {array_name} = useMemo(() => [{new_inner}], []);", content, flags=re.DOTALL)

        try:
            file_path.write_text(new_content)
            print(f"✓ Removed card from {file_path.name}")
            return True
        except Exception as e:
            print(f"Error writing {file_path}: {e}")
            return False

    def remove_writeup_cards(self, machine_name: str) -> None:
        """
        Remove the writeup cards for a machine from Home.js and Writeups.js.
        """
        src_dir = Path("src/pages")
        home_js = src_dir / "Home.js"
        writeups_js = src_dir / "Writeups.js"
        # Home uses array name recentPosts; Writeups uses writeups
        self._remove_entry_from_js_array(home_js, "recentPosts", machine_name)
        self._remove_entry_from_js_array(writeups_js, "writeups", machine_name)

    def get_machine_details(self, machine_name: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive machine details including image.
        
        Args:
            machine_name (str): Name of the HTB machine
            
        Returns:
            dict: Machine details including image path
        """
        machine_info = self.get_machine_info(machine_name)
        if not machine_info:
            return None
        
        # Extract image
        image_path = self.extract_machine_image(machine_name)
        
        return {
            'name': machine_name,
            'info': machine_info,
            'image_path': image_path
        }

def main():
    """Main function for command line usage."""
    if len(sys.argv) < 2 or sys.argv[1] in ['-h', '--help', 'help']:
        print("HTB Image Extractor")
        print("==================")
        print("Extracts machine images from HackTheBox API and can remove React cards.")
        print()
        print("Usage:")
        print("  python htb_image_extractor.py <machine_name> [output_filename]")
        print("  python htb_image_extractor.py remove-cards <machine_name>")
        print()
        print("Examples:")
        print("  python htb_image_extractor.py example-machine")
        print("  python htb_image_extractor.py remove-cards example-machine")
        print()
        print("Requirements for download:")
        print("- HTB_TOKEN environment variable must be set")
        sys.exit(0)
    
    # Subcommand to remove cards
    if sys.argv[1] == 'remove-cards':
        if len(sys.argv) < 3:
            print("Please provide the machine name to remove cards for.")
            sys.exit(1)
        machine_name = sys.argv[2]
        try:
            extractor = HTBImageExtractor(htb_token=None)
            extractor.remove_writeup_cards(machine_name)
            print("✅ Cards removal completed")
            sys.exit(0)
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            sys.exit(1)
    
    # Default: extract image
    machine_name = sys.argv[1]
    output_filename = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        extractor = HTBImageExtractor()
        result = extractor.extract_machine_image(machine_name, output_filename)
        
        if result:
            print(f"✅ Successfully extracted image: {result}")
        else:
            print(f"❌ Failed to extract image for machine: {machine_name}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
