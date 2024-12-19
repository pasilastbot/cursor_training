#!/usr/bin/env python3

import requests
import argparse
import json
from typing import List, Dict

class WebSearchTool:
    def __init__(self):
        self.search_url = "https://api.duckduckgo.com/"

    def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Perform a web search using DuckDuckGo API

        Args:
            query (str): Search query
            max_results (int): Maximum number of results to return

        Returns:
            List[Dict]: List of search results with title, link, and snippet
        """
        params = {
            'q': query,
            'format': 'json',
            'no_html': 1,
            'no_redirect': 1
        }

        try:
            response = requests.get(self.search_url, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            for result in data.get('RelatedTopics', [])[:max_results]:
                if 'Text' in result and 'FirstURL' in result:
                    results.append({
                        'title': result['Text'].split(' - ')[0],
                        'link': result['FirstURL'],
                        'snippet': result['Text']
                    })
            return results

        except Exception as e:
            print(f"Error performing search: {str(e)}")
            return []

def main():
    parser = argparse.ArgumentParser(description='Web Search Tool')
    parser.add_argument('query', help='Search query')
    parser.add_argument('--max-results', type=int, default=5, help='Maximum number of results (default: 5)')
    parser.add_argument('--json', action='store_true', help='Output results in JSON format')

    args = parser.parse_args()

    search_tool = WebSearchTool()
    results = search_tool.search(args.query, args.max_results)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {result['title']}")
            print(f"URL: {result['link']}")
            print(f"Description: {result['snippet']}")

if __name__ == '__main__':
    main()
