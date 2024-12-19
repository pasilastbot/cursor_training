#!/usr/bin/env python3
import os
from pathlib import Path
import re
from collections import defaultdict
import argparse

def get_base_name(filename):
    # Remove size suffix and extension
    base = re.sub(r'-\d+w\.(png|jpeg|webp)$', '', filename)
    # Remove numbered duplicates
    base = re.sub(r' \(\d+\)$', '', base)
    return base

def should_keep_file(filename):
    # Keep only 1920w versions and prefer WebP format
    if '1920w' not in filename:
        return False
    if filename.endswith('.webp'):
        return True
    # Keep PNG/JPEG only if WebP doesn't exist
    base = get_base_name(filename)
    webp_version = f"{base}-1920w.webp"
    return not Path(webp_version).exists()

def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description='Clean up unnecessary image files')
    parser.add_argument('--force', '-f', action='store_true', help='Delete files without confirmation')
    args = parser.parse_args()

    # Get the images directory
    images_dir = Path('../frontend/public/images')
    if not images_dir.exists():
        print(f"Error: Directory {images_dir} not found")
        return

    # Group files by their base name
    file_groups = defaultdict(list)
    for file in images_dir.iterdir():
        if file.is_file():
            base_name = get_base_name(file.name)
            file_groups[base_name].append(file)

    # Process each group
    files_to_delete = []
    for base_name, files in file_groups.items():
        for file in files:
            if not should_keep_file(file.name):
                files_to_delete.append(file)

    # Print summary
    print(f"\nFound {len(files_to_delete)} files to delete:")
    for file in sorted(files_to_delete):
        print(f"- {file.name}")

    # Delete files if forced or confirmed
    should_delete = args.force
    if not should_delete:
        response = input("\nDo you want to delete these files? (yes/no): ")
        should_delete = response.lower() == 'yes'

    if should_delete:
        for file in files_to_delete:
            try:
                file.unlink()
                print(f"Deleted: {file.name}")
            except Exception as e:
                print(f"Error deleting {file.name}: {e}")
        print("\nCleanup completed!")
    else:
        print("\nOperation cancelled.")

if __name__ == '__main__':
    main()
