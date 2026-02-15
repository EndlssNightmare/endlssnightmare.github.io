#!/usr/bin/env python3
"""
Unified script: download HTB machine image + create/remove writeup.

Combines:
- Download machine avatar from HTB API (same as download_htb_machine_image.py)
- Create/remove writeup: cards (Home, Writeups, Tags, TagDetail), component, route, image

Usage (Create):
  python htb_writeup.py <MachineName> --title "Title" --description "Description" \\
    --tags "tag1,tag2" --difficulty "Easy" --os "Linux" --ip "10.10.10.10"

Usage (Remove):
  python htb_writeup.py --remove <MachineName>

Example (Create):
  python htb_writeup.py Active --title "Active Walkthrough" \\
    --description "Temporary description for testing." \\
    --tags "htb,linux" --difficulty "Medium" --os "Linux" --ip "10.10.10.100"

Example (Remove):
  python htb_writeup.py --remove Active

Requires: HTB_TOKEN environment variable for create (not for remove).
Template: EditorWalkthrough (current site format — ## Overview, id="writeup-title", TableOfContents with title).
"""

import argparse
import os
import re
import sys
import requests
from pathlib import Path
from datetime import datetime
from typing import Tuple

HTB_API_BASE = "https://labs.hackthebox.com/api/v4"
HTB_IMAGE_BASE = "https://htb-mp-prod-public-storage.s3.eu-central-1.amazonaws.com"


def get_current_date() -> str:
    return datetime.now().strftime("%b %d, %Y")


def download_machine_image(machine_name: str) -> Tuple[bool, str]:
    """Download machine avatar from HTB. Returns (success, image_path)."""
    token = os.getenv("HTB_TOKEN")
    if not token:
        print("Error: HTB_TOKEN environment variable is not set.", file=sys.stderr)
        print("Set it with: export HTB_TOKEN=your_token", file=sys.stderr)
        return False, ""

    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    }
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
        avatar_path = machine_info.get("avatar")
        if not avatar_path:
            print(f"Error: No avatar found for machine '{machine_name}'.", file=sys.stderr)
            return False, ""
        image_url = avatar_path if avatar_path.startswith("http") else f"{HTB_IMAGE_BASE}{avatar_path}"
        print(f"Downloading image from: {image_url}")
        img_response = requests.get(
            image_url,
            headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
            stream=True,
        )
        img_response.raise_for_status()
        machine_name_lower = machine_name.lower()
        output_dir = Path("public/images/writeups") / machine_name_lower
        output_dir.mkdir(parents=True, exist_ok=True)
        filename = output_dir / "machine.png"
        with open(filename, "wb") as f:
            for chunk in img_response.iter_content(chunk_size=8192):
                f.write(chunk)
        image_path = f"/images/writeups/{machine_name_lower}/machine.png"
        print(f"Image saved: {filename}")
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
    return [tag.lower() for tag in tags]


def format_tags_for_writeups(tags: list) -> list:
    return [tag.capitalize() for tag in tags]


def format_tags_for_tags_page(tags: list) -> list:
    return [tag.lower() for tag in tags]


def get_next_id(file_path: Path) -> int:
    try:
        content = file_path.read_text()
        ids = re.findall(r"id:\s*(\d+)", content)
        return max(int(i) for i in ids) + 1 if ids else 1
    except Exception:
        return 1


def add_card_to_home(machine_name: str, title: str, excerpt: str, tags: list,
                     image_path: str, link: str, os: str, date: str) -> bool:
    try:
        file_path = Path("src/pages/Home.js")
        content = file_path.read_text()
        next_id = get_next_id(file_path)
        formatted_tags = format_tags_for_home(tags)
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
        pattern = r"(recentPosts = useMemo\(\(\) => \[)"
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            while insert_pos < len(content) and content[insert_pos] in " \n\t":
                insert_pos += 1
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print("✓ Added card to Home.js")
            return True
        return False
    except Exception as e:
        print(f"Error adding card to Home.js: {e}", file=sys.stderr)
        return False


def add_card_to_writeups(machine_name: str, title: str, excerpt: str, tags: list,
                         image_path: str, link: str, difficulty: str, os: str, date: str) -> bool:
    try:
        file_path = Path("src/pages/Writeups.js")
        content = file_path.read_text()
        next_id = get_next_id(file_path)
        formatted_tags = format_tags_for_writeups(tags)
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
        pattern = r"(writeups = useMemo\(\(\) => \[)"
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            while insert_pos < len(content) and content[insert_pos] in " \n\t":
                insert_pos += 1
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print("✓ Added card to Writeups.js")
            return True
        return False
    except Exception as e:
        print(f"Error adding card to Writeups.js: {e}", file=sys.stderr)
        return False


def add_card_to_tags(machine_name: str, title: str, tags: list) -> bool:
    try:
        file_path = Path("src/pages/Tags.js")
        content = file_path.read_text()
        next_id = get_next_id(file_path)
        formatted_tags = format_tags_for_tags_page(tags)
        new_card = f"""    {{
      id: {next_id},
      title: '{title}',
      category: 'writeup',
      tags: {formatted_tags}
    }},"""
        pattern = r"(const allPosts = \[)"
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            while insert_pos < len(content) and content[insert_pos] in " \n\t":
                insert_pos += 1
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print("✓ Added card to Tags.js")
            return True
        return False
    except Exception as e:
        print(f"Error adding card to Tags.js: {e}", file=sys.stderr)
        return False


def add_card_to_tag_detail(machine_name: str, title: str, excerpt: str, tags: list,
                           image_path: str, link: str, date: str, os: str) -> bool:
    try:
        file_path = Path("src/pages/TagDetail.js")
        content = file_path.read_text()
        next_id = get_next_id(file_path)
        formatted_tags = format_tags_for_tags_page(tags)
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
        pattern = r"(const allPosts = \[)"
        match = re.search(pattern, content)
        if match:
            insert_pos = match.end()
            while insert_pos < len(content) and content[insert_pos] in " \n\t":
                insert_pos += 1
            content = content[:insert_pos] + "\n" + new_card + content[insert_pos:]
            file_path.write_text(content)
            print("✓ Added card to TagDetail.js")
            return True
        return False
    except Exception as e:
        print(f"Error adding card to TagDetail.js: {e}", file=sys.stderr)
        return False


def create_writeup_component(machine_name: str, title: str, excerpt: str, tags: list,
                             difficulty: str, os: str, ip: str, date: str, image_path: str) -> bool:
    """Create writeup React component from EditorWalkthrough template (current site format)."""
    try:
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        component_dir = Path(f"src/pages/writeups/{machine_name_lower}")
        component_dir.mkdir(parents=True, exist_ok=True)

        template_path = Path("src/pages/writeups/editor/EditorWalkthrough.js")
        template_content = template_path.read_text()

        machine_title = title.replace(" Walkthrough", "")
        formatted_tags_writeups = format_tags_for_writeups(tags)
        escaped_excerpt = excerpt.replace("'", "\\'")

        # New format: content starts with ## Overview (no # Title line), TOC uses title prop
        writeup_data = f"""  const writeup = {{
    id: '{machine_name_lower}-walkthrough',
    title: '{title}',
    excerpt: '{escaped_excerpt}',
    date: '{date}',
    tags: {formatted_tags_writeups},
    difficulty: '{difficulty}',
    os: '{os}',
    ip: '{ip}',
    content: `## Overview
{excerpt}

## Enumeration

## Foothold

## Privilege Escalation

## Conclusion
`}};"""

        # Match writeup block: from "const writeup = {" to closing backtick (not escaped) + "};"
        pattern = r"const writeup = \{[\s\S]*?(?<!\\)`\s*\}\;"
        template_content = re.sub(pattern, writeup_data, template_content, count=1)

        # Component and path names (Editor -> new machine)
        template_content = template_content.replace("EditorWalkthrough", component_name)
        template_content = template_content.replace("editor", machine_name_lower)
        template_content = template_content.replace("Editor", machine_title)

        # Image paths and alt
        template_content = template_content.replace(
            "/images/writeups/editor/machine.png",
            image_path,
        )
        template_content = template_content.replace(
            "alt=\"Editor\"",
            f"alt=\"{machine_title}\"",
        )

        component_file = component_dir / f"{component_name}.js"
        component_file.write_text(template_content)
        print(f"✓ Created writeup component: {component_file}")

        css_template = Path("src/pages/writeups/editor/EditorWalkthrough.css")
        if css_template.exists():
            css_content = css_template.read_text()
            css_content = css_content.replace("Editor", machine_title)
            css_file = component_dir / f"{component_name}.css"
            css_file.write_text(css_content)
            print(f"✓ Created CSS: {css_file}")

        return True
    except Exception as e:
        print(f"Error creating writeup component: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


def add_route_to_writeup_detail(machine_name: str) -> bool:
    try:
        file_path = Path("src/pages/WriteupDetail.js")
        content = file_path.read_text()
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        route_id = f"{machine_name_lower}-walkthrough"
        import_line = f"import {component_name} from './writeups/{machine_name_lower}/{component_name}';"

        import_pattern = r"(import \w+Walkthrough from './writeups/[\w/]+';)"
        matches = list(re.finditer(import_pattern, content))
        if matches:
            last_import = matches[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + "\n" + import_line + content[insert_pos:]
        else:
            print("Error: Could not find import section in WriteupDetail.js", file=sys.stderr)
            return False

        start_pattern = r"const writeupComponents = \{"
        start_match = re.search(start_pattern, content)
        if not start_match:
            print("Error: Could not find writeupComponents in WriteupDetail.js", file=sys.stderr)
            return False
        start_pos = start_match.end()
        brace_count = 1
        pos = start_pos
        end_pos = None
        while pos < len(content) and brace_count > 0:
            if content[pos] == "{":
                brace_count += 1
            elif content[pos] == "}":
                brace_count -= 1
                if brace_count == 0:
                    semicolon_pos = pos + 1
                    while semicolon_pos < len(content) and content[semicolon_pos] in " \n\t":
                        semicolon_pos += 1
                    if semicolon_pos < len(content) and content[semicolon_pos] == ";":
                        end_pos = semicolon_pos + 1
                        break
            pos += 1
        if end_pos is None:
            return False
        closing_brace_pos = None
        for i in range(end_pos - 1, start_pos - 1, -1):
            if content[i] == "}":
                closing_brace_pos = i
                break
        if closing_brace_pos is None:
            return False
        object_content = content[start_pos:closing_brace_pos]
        lines = object_content.split("\n")
        last_entry_line_idx = None
        for i in range(len(lines) - 1, -1, -1):
            line = lines[i].strip()
            if line and "':" in line and not line.startswith("//"):
                last_entry_line_idx = i
                break
        if last_entry_line_idx is not None:
            last_line = lines[last_entry_line_idx]
            if not last_line.rstrip().endswith(","):
                lines[last_entry_line_idx] = last_line.rstrip() + ","
                object_content = "\n".join(lines)
        component_entry = f"    '{route_id}': {component_name}"
        before_object = content[:start_pos]
        after_object = content[end_pos:]
        new_content = before_object + object_content + "\n" + component_entry + "\n  };" + after_object
        file_path.write_text(new_content)
        print("✓ Added route to WriteupDetail.js")
        return True
    except Exception as e:
        print(f"Error adding route: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False


# ---- Remove functions (same logic as create_htb_writeup.py) ----

def remove_card_from_home(machine_name: str) -> bool:
    try:
        file_path = Path("src/pages/Home.js")
        content = file_path.read_text()
        link_pattern = f"/writeups/{machine_name.lower()}-walkthrough"
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?link:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        for match in re.finditer(pattern, content):
            if link_pattern in match.group(1):
                content = content[: match.start()] + content[match.end() :]
                file_path.write_text(content)
                print("✓ Removed card from Home.js")
                return True
        return False
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_card_from_writeups(machine_name: str) -> bool:
    try:
        file_path = Path("src/pages/Writeups.js")
        content = file_path.read_text()
        link_pattern = f"/writeups/{machine_name.lower()}-walkthrough"
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?link:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        for match in re.finditer(pattern, content):
            if link_pattern in match.group(1):
                content = content[: match.start()] + content[match.end() :]
                file_path.write_text(content)
                print("✓ Removed card from Writeups.js")
                return True
        return False
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_card_from_tags(machine_name: str) -> bool:
    try:
        file_path = Path("src/pages/Tags.js")
        content = file_path.read_text()
        title_pattern = f"{machine_name.capitalize()} Walkthrough"
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?title:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        for match in re.finditer(pattern, content):
            if title_pattern in match.group(1) or machine_name.lower() in match.group(1).lower():
                content = content[: match.start()] + content[match.end() :]
                file_path.write_text(content)
                print("✓ Removed card from Tags.js")
                return True
        return False
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_card_from_tag_detail(machine_name: str) -> bool:
    try:
        file_path = Path("src/pages/TagDetail.js")
        content = file_path.read_text()
        link_pattern = f"/writeups/{machine_name.lower()}-walkthrough"
        pattern = r"(\s*\{\s*id:\s*\d+,[\s\S]*?link:\s*'[^']*',[\s\S]*?\},?\s*\n)"
        for match in re.finditer(pattern, content):
            if link_pattern in match.group(1):
                content = content[: match.start()] + content[match.end() :]
                file_path.write_text(content)
                print("✓ Removed card from TagDetail.js")
                return True
        return False
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_route_from_writeup_detail(machine_name: str) -> bool:
    try:
        file_path = Path("src/pages/WriteupDetail.js")
        content = file_path.read_text()
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        route_id = f"{machine_name_lower}-walkthrough"
        import_pattern = f"import {component_name} from './writeups/{machine_name_lower}/{component_name}';"
        content = content.replace(import_pattern + "\n", "").replace(import_pattern, "")
        pattern = rf"(\s*)'{route_id}':\s*{component_name},?\s*\n"
        matches = list(re.finditer(pattern, content))
        if matches:
            content = content[: matches[0].start()] + content[matches[0].end() :]
            start_pattern = r"const writeupComponents = \{"
            start_match = re.search(start_pattern, content)
            if start_match:
                start_pos = start_match.end()
                brace_count = 1
                pos = start_pos
                end_pos = None
                while pos < len(content) and brace_count > 0:
                    if content[pos] == "{":
                        brace_count += 1
                    elif content[pos] == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            semicolon_pos = pos + 1
                            while semicolon_pos < len(content) and content[semicolon_pos] in " \n\t":
                                semicolon_pos += 1
                            if semicolon_pos < len(content) and content[semicolon_pos] == ";":
                                end_pos = semicolon_pos + 1
                                break
                    pos += 1
                if end_pos:
                    object_content = content[start_pos : end_pos - 1]
                    lines = object_content.split("\n")
                    for i in range(len(lines) - 1, -1, -1):
                        if lines[i].strip() and "':" in lines[i] and not lines[i].strip().startswith("//"):
                            if lines[i].rstrip().endswith(","):
                                lines[i] = lines[i].rstrip()[:-1]
                                content = content[:start_pos] + "\n".join(lines) + content[end_pos - 1 :]
                            break
        file_path.write_text(content)
        print("✓ Removed route from WriteupDetail.js")
        return True
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_writeup_component(machine_name: str) -> bool:
    try:
        machine_name_lower = machine_name.lower()
        component_name = f"{machine_name.capitalize()}Walkthrough"
        component_dir = Path(f"src/pages/writeups/{machine_name_lower}")
        for name in [f"{component_name}.js", f"{component_name}.css"]:
            f = component_dir / name
            if f.exists():
                f.unlink()
                print(f"✓ Removed {f}")
        if component_dir.exists() and not any(component_dir.iterdir()):
            component_dir.rmdir()
            print(f"✓ Removed directory {component_dir}")
        return True
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_machine_image(machine_name: str) -> bool:
    try:
        import shutil
        image_dir = Path(f"public/images/writeups/{machine_name.lower()}")
        if image_dir.exists():
            shutil.rmtree(image_dir)
            print(f"✓ Removed image directory {image_dir}")
            return True
        return False
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False


def remove_writeup(machine_name: str) -> bool:
    print(f"\n{'='*60}\nRemoving writeup: {machine_name}\n{'='*60}\n")
    success = True
    if not remove_card_from_home(machine_name):
        success = False
    if not remove_card_from_writeups(machine_name):
        success = False
    if not remove_card_from_tags(machine_name):
        success = False
    if not remove_card_from_tag_detail(machine_name):
        success = False
    if not remove_route_from_writeup_detail(machine_name):
        success = False
    if not remove_writeup_component(machine_name):
        success = False
    if not remove_machine_image(machine_name):
        success = False
    print("✓ Writeup removal completed." if success else "⚠ Completed with warnings.")
    return success


def main():
    parser = argparse.ArgumentParser(
        description="Download HTB machine image + create/remove writeup (unified)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--remove", type=str, metavar="MACHINE", help="Remove writeup for machine")
    parser.add_argument("machine_name", type=str, nargs="?", help="Machine name (for create)")
    parser.add_argument("--title", type=str, help="Writeup title (e.g. 'Active Walkthrough')")
    parser.add_argument("--description", type=str, help="Description/excerpt")
    parser.add_argument("--tags", type=str, help="Comma-separated tags")
    parser.add_argument("--difficulty", type=str, choices=["Easy", "Medium", "Hard", "Insane"])
    parser.add_argument("--os", type=str, choices=["Linux", "Windows"])
    parser.add_argument("--ip", type=str, help="Machine IP")
    args = parser.parse_args()

    if args.remove:
        sys.exit(0 if remove_writeup(args.remove) else 1)

    if not args.machine_name:
        parser.error("machine_name required for create")
    for attr in ("title", "description", "tags", "difficulty", "os", "ip"):
        if not getattr(args, attr, None):
            parser.error(f"--{attr} required for create")

    current_date = get_current_date()
    tags = [t.strip() for t in args.tags.split(",")]
    machine_name_lower = args.machine_name.lower()
    link = f"/writeups/{machine_name_lower}-walkthrough"

    print(f"\n{'='*60}\nCreating writeup: {args.machine_name}\n{'='*60}\n")

    print("Step 1: Downloading machine image...")
    success, image_path = download_machine_image(args.machine_name)
    if not success:
        sys.exit(1)

    print("\nStep 2: Creating writeup component...")
    if not create_writeup_component(
        args.machine_name, args.title, args.description, tags,
        args.difficulty, args.os, args.ip, current_date, image_path,
    ):
        sys.exit(1)

    print("\nStep 3: Adding route...")
    if not add_route_to_writeup_detail(args.machine_name):
        sys.exit(1)

    print("\nStep 4: Adding cards...")
    add_card_to_home(args.machine_name, args.title, args.description, tags, image_path, link, args.os, current_date)
    add_card_to_writeups(args.machine_name, args.title, args.description, tags, image_path, link, args.difficulty, args.os, current_date)
    add_card_to_tags(args.machine_name, args.title, tags)
    add_card_to_tag_detail(args.machine_name, args.title, args.description, tags, image_path, link, current_date, args.os)

    print(f"\n{'='*60}\n✓ Writeup creation completed.\n{'='*60}")
    print(f"Edit: src/pages/writeups/{machine_name_lower}/{args.machine_name.capitalize()}Walkthrough.js")
    print(f"Images: public/images/writeups/{machine_name_lower}/")
    print(f"URL: http://localhost:3000{link}")


if __name__ == "__main__":
    main()
