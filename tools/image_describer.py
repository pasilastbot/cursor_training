#!/usr/bin/env python3
import os
import sys
import argparse
from pathlib import Path
import base64
from openai import OpenAI
from dotenv import load_dotenv
import json
import re

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def clean_markdown_json(text):
    # Remove markdown code blocks if present
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        return match.group(1)
    return text

def describe_image(image_path, api_key):
    client = OpenAI(api_key=api_key)

    # Get original filename without extension and size suffix
    original_name = Path(image_path).stem
    base_name = re.sub(r'-\d+w$', '', original_name)  # Remove size suffix

    # Encode the image
    base64_image = encode_image(image_path)

    # Create message for the API
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"This image has the filename '{base_name}'. Please analyze it and provide:\n1. A detailed description of what you see\n2. A descriptive filename that combines the original name's context with what you observe in the image.\nFormat your response as JSON with 'description' and 'suggested_filename' fields. The filename should be URL-friendly (no spaces, use underscores or hyphens)."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
    )

    # Get the response content and clean it
    content = response.choices[0].message.content
    content = clean_markdown_json(content)

    # Try to parse as JSON
    try:
        # Verify it's valid JSON by parsing and re-stringifying
        return json.dumps(json.loads(content))
    except json.JSONDecodeError:
        # If not valid JSON, create a JSON structure
        return json.dumps({
            "description": content.strip(),
            "suggested_filename": f"{base_name}_analyzed"
        })

def rename_image(image_path, new_name):
    path = Path(image_path)
    # Ensure the new name has the same size suffix as the original
    size_match = re.search(r'-(\d+w)$', path.stem)
    if size_match:
        size_suffix = size_match.group(1)
        new_name = f"{new_name}-{size_suffix}"
    new_path = path.parent / f"{new_name}{path.suffix}"
    os.rename(path, new_path)
    return new_path

def main():
    parser = argparse.ArgumentParser(description='Analyze and rename images using OpenAI Vision API')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('--rename', action='store_true', help='Automatically rename the file based on description')
    parser.add_argument('--json', action='store_true', help='Output in JSON format')
    args = parser.parse_args()

    # Load environment variables
    load_dotenv()
    api_key = os.getenv('OPENAI_API_KEY')

    if not api_key:
        print("Error: OPENAI_API_KEY not found in .env file", file=sys.stderr)
        sys.exit(1)

    try:
        # Get description from OpenAI
        result = describe_image(args.image_path, api_key)

        # Parse the JSON response
        try:
            analysis = json.loads(result)
        except json.JSONDecodeError:
            print("Error: Could not parse response as JSON", file=sys.stderr)
            sys.exit(1)

        if args.rename:
            new_path = rename_image(args.image_path, analysis['suggested_filename'])
            analysis['renamed_to'] = str(new_path)

        if args.json:
            print(json.dumps(analysis, indent=2))
        else:
            print(f"Description: {analysis['description']}")
            print(f"Suggested filename: {analysis['suggested_filename']}")
            if args.rename:
                print(f"File renamed to: {analysis['renamed_to']}")

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
