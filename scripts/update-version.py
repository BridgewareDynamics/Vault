#!/usr/bin/env python3
"""
Update package.json version with git commit hash suffix.
Reads current version, appends short commit hash, and updates package.json.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

def get_git_commit_hash():
    """Get short git commit hash."""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error getting git commit hash: {e}", file=sys.stderr)
        sys.exit(1)

def update_version():
    """Update package.json version with commit hash."""
    project_root = Path(__file__).parent.parent
    package_json_path = project_root / 'package.json'
    
    # Read package.json
    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {package_json_path} not found", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing package.json: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Get current version
    current_version = package_data.get('version', '1.0.0-prerelease.0')
    print(f"Current version: {current_version}")
    
    # Get commit hash
    commit_hash = get_git_commit_hash()
    print(f"Git commit hash: {commit_hash}")
    
    # Check if version already has commit hash
    if f"-{commit_hash}" in current_version:
        print(f"Version already includes commit hash: {current_version}")
        new_version = current_version
    else:
        # Append commit hash to version
        new_version = f"{current_version}-{commit_hash}"
        print(f"New version: {new_version}")
        
        # Update package.json
        package_data['version'] = new_version
        try:
            with open(package_json_path, 'w', encoding='utf-8') as f:
                json.dump(package_data, f, indent=2, ensure_ascii=False)
                f.write('\n')  # Add trailing newline
            print(f"Updated {package_json_path} with version: {new_version}")
        except Exception as e:
            print(f"Error writing package.json: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Output version for GitHub Actions using GITHUB_OUTPUT
    github_output = os.environ.get('GITHUB_OUTPUT')
    if github_output:
        try:
            with open(github_output, 'a') as f:
                f.write(f"version={new_version}\n")
        except Exception as e:
            print(f"Warning: Could not write to GITHUB_OUTPUT: {e}", file=sys.stderr)
    
    return new_version

if __name__ == '__main__':
    update_version()

