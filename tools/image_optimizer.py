#!/usr/bin/env python3

import argparse
import os
from PIL import Image
import sys
from pathlib import Path

def optimize_image(input_path, output_dir, breakpoints=None, quality=85):
    """
    Optimize and scale images for web use.

    Args:
        input_path: Path to input image
        output_dir: Directory to save optimized images
        breakpoints: List of widths to generate (default: [640, 1024, 1920])
        quality: Output image quality (0-100)
    """
    if breakpoints is None:
        breakpoints = [640, 1024, 1920]  # Mobile, Tablet, Desktop

    try:
        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # Open and process image
        with Image.open(input_path) as img:
            # Get original format and filename
            original_format = img.format
            filename = Path(input_path).stem

            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # Generate scaled versions
            for width in breakpoints:
                # Calculate height maintaining aspect ratio
                ratio = width / img.width
                height = int(img.height * ratio)

                # Resize image
                resized = img.resize((width, height), Image.Resampling.LANCZOS)

                # Save as WebP
                webp_path = os.path.join(output_dir, f"{filename}-{width}w.webp")
                resized.save(webp_path, 'WEBP', quality=quality, optimize=True)

                # Save in original format as fallback
                orig_path = os.path.join(output_dir, f"{filename}-{width}w.{original_format.lower()}")
                resized.save(orig_path, original_format, quality=quality, optimize=True)

                print(f"Generated {width}px version: {webp_path}")
                print(f"Generated {width}px fallback: {orig_path}")

    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}", file=sys.stderr)
        return False

    return True

def main():
    parser = argparse.ArgumentParser(description='Optimize images for web use')
    parser.add_argument('input', help='Input image path')
    parser.add_argument('--output-dir', '-o', default='optimized',
                      help='Output directory (default: optimized)')
    parser.add_argument('--breakpoints', '-b', type=int, nargs='+',
                      help='Width breakpoints (default: 640 1024 1920)')
    parser.add_argument('--quality', '-q', type=int, default=85,
                      help='Output quality (0-100, default: 85)')

    args = parser.parse_args()

    if optimize_image(args.input, args.output_dir, args.breakpoints, args.quality):
        print("Image optimization completed successfully!")
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()
