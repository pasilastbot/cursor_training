#!/usr/bin/env python3
import os
from pathlib import Path
import subprocess
import json
import time

def main():
    # Get the images directory
    images_dir = Path('../frontend/public/images')
    if not images_dir.exists():
        print(f"Error: Directory {images_dir} not found")
        return

    # Process all high-resolution images
    total_renamed = 0
    errors = []

    print("\nProcessing images...")
    for file in sorted(images_dir.iterdir()):
        if file.is_file() and '1920w' in file.name:
            print(f"\nAnalyzing: {file.name}")
            try:
                # Call the image describer with --rename flag
                result = subprocess.run(
                    ['python3', 'image_describer.py', str(file), '--rename', '--json'],
                    capture_output=True,
                    text=True
                )

                if result.returncode == 0:
                    try:
                        analysis = json.loads(result.stdout)
                        if 'renamed_to' in analysis:
                            print(f"✓ Renamed to: {Path(analysis['renamed_to']).name}")
                            total_renamed += 1
                        else:
                            print("✗ No rename information in response")
                            errors.append(f"Failed to rename {file.name}: No rename information")
                    except json.JSONDecodeError:
                        print("✗ Invalid JSON response")
                        errors.append(f"Failed to rename {file.name}: Invalid JSON response")
                else:
                    print(f"✗ Error: {result.stderr.strip()}")
                    errors.append(f"Failed to rename {file.name}: {result.stderr.strip()}")

                # Add a small delay to avoid rate limiting
                time.sleep(1)

            except Exception as e:
                print(f"✗ Error processing {file.name}: {str(e)}")
                errors.append(f"Failed to process {file.name}: {str(e)}")

    # Print summary
    print("\n=== Summary ===")
    print(f"Total files renamed: {total_renamed}")
    if errors:
        print("\nErrors encountered:")
        for error in errors:
            print(f"- {error}")

if __name__ == '__main__':
    main()
