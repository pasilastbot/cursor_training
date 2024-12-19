#!/usr/bin/env python3

import requests
import argparse
import json
from bs4 import BeautifulSoup
from typing import Dict, Optional

class WebReaderTool:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def read_webpage(self, url: str) -> Dict:
        """
        Read and parse a webpage

        Args:
            url (str): URL of the webpage to read

        Returns:
            Dict: Dictionary containing parsed webpage content
        """
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()

            # Get the title
            title = soup.title.string if soup.title else "No title found"

            # Get the main content
            main_content = soup.find('main') or soup.find('article') or soup.find('body')

            # Extract text content
            text = main_content.get_text(separator='\n', strip=True) if main_content else "No content found"

            # Extract meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc['content'] if meta_desc else "No description found"

            return {
                'title': title,
                'description': description,
                'content': text,
                'url': url
            }

        except Exception as e:
            print(f"Error reading webpage: {str(e)}")
            return {
                'title': "Error",
                'description': "Failed to read webpage",
                'content': str(e),
                'url': url
            }

def main():
    parser = argparse.ArgumentParser(description='Web Reader Tool')
    parser.add_argument('url', help='URL of the webpage to read')
    parser.add_argument('--json', action='store_true', help='Output results in JSON format')
    parser.add_argument('--content-only', action='store_true', help='Output only the main content')

    args = parser.parse_args()

    reader = WebReaderTool()
    result = reader.read_webpage(args.url)

    if args.json:
        print(json.dumps(result, indent=2))
    elif args.content_only:
        print(result['content'])
    else:
        print(f"\nTitle: {result['title']}")
        print(f"\nDescription: {result['description']}")
        print(f"\nContent:\n{result['content']}")

if __name__ == '__main__':
    main()
