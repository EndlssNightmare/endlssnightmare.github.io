#!/usr/bin/env python3
"""
Script to download Hack The Box machine avatar images.

Usage:
    python download_htb_machine_image.py <MachineName>
    
Example:
    python download_htb_machine_image.py Editor
    
The script will:
- Create a folder in public/images/writeups/<machinename> (lowercase)
- Download and save the image as machine.png in that folder

The script requires HTB_TOKEN environment variable to be set.
"""

import argparse
import os
import sys
import requests
from pathlib import Path

# API base URL
HTB_API_BASE = "https://labs.hackthebox.com/api/v4"
HTB_IMAGE_BASE = "https://htb-mp-prod-public-storage.s3.eu-central-1.amazonaws.com"


def download_machine_image(machine_name: str) -> bool:
    """
    Download the machine avatar image from HTB.
    
    Args:
        machine_name: Name of the HTB machine
        
    Returns:
        True if successful, False otherwise
    """
    # Get token from environment
    token = os.getenv("HTB_TOKEN")
    if not token:
        print("Error: HTB_TOKEN environment variable is not set.", file=sys.stderr)
        print("Set it with: export HTB_TOKEN=your_token", file=sys.stderr)
        return False
    
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
            return False
        
        # Extract avatar path
        avatar_path = machine_info.get("avatar")
        if not avatar_path:
            print(f"Error: No avatar found for machine '{machine_name}'.", file=sys.stderr)
            return False
        
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
        
        print(f"Image saved successfully: {filename}")
        return True
        
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}", file=sys.stderr)
        if e.response.status_code == 404:
            print(f"Machine '{machine_name}' not found.", file=sys.stderr)
        elif e.response.status_code == 401:
            print("Authentication failed. Check your HTB_TOKEN.", file=sys.stderr)
        return False
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Download HTB machine avatar image",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download image for machine named "Editor"
  # Creates: public/images/writeups/editor/machine.png
  python download_htb_machine_image.py Editor
  
  # Make sure HTB_TOKEN is set
  export HTB_TOKEN=your_token_here
  python download_htb_machine_image.py Editor
        """
    )
    
    parser.add_argument(
        "machine_name",
        type=str,
        help="Name of the HTB machine"
    )
    
    args = parser.parse_args()
    
    success = download_machine_image(args.machine_name)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
