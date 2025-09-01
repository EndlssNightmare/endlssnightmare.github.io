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
            raise ValueError("HTB_TOKEN not provided and not found in environment variables")
        
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
        url = f"{self.base_url}/machine/profile/{machine_name}"
        headers = {"Authorization": f"Bearer {self.htb_token}"}
        
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
        Get the avatar path for a machine using curl and jq.
        
        Args:
            machine_name (str): Name of the HTB machine
            
        Returns:
            str: Avatar path or None if not found
        """
        try:
            # Use curl and jq to extract the avatar path
            cmd = [
                'curl', '-sH', f'Authorization: Bearer {self.htb_token}',
                f'{self.base_url}/machine/profile/{machine_name}',
                '|', 'jq', '-r', '.info.avatar'
            ]
            
            # Join the command properly for subprocess
            if '|' in cmd:
                # Handle pipe in command
                curl_cmd = cmd[:cmd.index('|')]
                jq_cmd = cmd[cmd.index('|')+1:]
                
                curl_process = subprocess.Popen(curl_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                jq_process = subprocess.Popen(jq_cmd, stdin=curl_process.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                curl_process.stdout.close()
                output, error = jq_process.communicate()
                
                if jq_process.returncode != 0:
                    print(f"Error executing jq: {error.decode()}")
                    return None
                
                avatar_path = output.decode().strip()
                return avatar_path if avatar_path != 'null' else None
                
            else:
                # No pipe, direct execution
                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"Error executing curl: {result.stderr}")
                    return None
                
                avatar_path = result.stdout.strip()
                return avatar_path if avatar_path != 'null' else None
                
        except subprocess.SubprocessError as e:
            print(f"Error executing command for '{machine_name}': {e}")
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
            
            # Check if the file already exists to avoid overwriting
            if os.path.exists(new_filename):
                print(f"File '{new_filename}' already exists. Skipping download.")
                return True
            
            with open(new_filename, 'wb') as file:
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
        
        # Generate output filename if not provided
        if not output_filename:
            output_filename = f"{machine_name}-machine.png"
        
        # Determine save location
        if use_writeup_images_dir:
            # Save in writeup-images directory
            writeup_images_dir = Path("public/writeup-images")
            writeup_images_dir.mkdir(parents=True, exist_ok=True)
            output_filename = str(writeup_images_dir / output_filename)
        else:
            # Save in public directory
            if not output_filename.startswith('public/'):
                output_filename = f"public/{output_filename}"
        
        # Download the image
        if self.download_and_rename_image(avatar_path, output_filename):
            return output_filename
        else:
            return None

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
        print("Extracts machine images from HackTheBox API")
        print()
        print("Usage: python htb_image_extractor.py <machine_name> [output_filename]")
        print("Example: python htb_image_extractor.py example-machine")
        print("Example: python htb_image_extractor.py example-machine my-machine.png")
        print()
        print("Requirements:")
        print("- HTB_TOKEN environment variable must be set")
        print("- curl and jq must be installed")
        print()
        print("Setup:")
        print("export HTB_TOKEN='your_htb_token_here'")
        sys.exit(0)
    
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
            
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        print("Please set the HTB_TOKEN environment variable:")
        print("export HTB_TOKEN='your_htb_token_here'")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
