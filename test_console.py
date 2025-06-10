#!/usr/bin/env python3
import subprocess
import time
import requests

print("Testing Sheep.land site for errors...")
print("-" * 50)

# Check if server is running
try:
    response = requests.get("http://localhost:8080/index.html", timeout=5)
    print(f"✓ Server is running: Status {response.status_code}")
except:
    print("✗ Server is not running on port 8080")
    exit(1)

# Check critical files
files_to_check = [
    "index.html",
    "styles.css", 
    "app.js",
    "feedback.js",
    "wishlist.js",
    "vendor/alpine.min.js",
    "vendor/alpine-collapse.min.js"
]

print("\nChecking file accessibility:")
for file in files_to_check:
    try:
        response = requests.get(f"http://localhost:8080/{file}", timeout=5)
        if response.status_code == 200:
            size = len(response.content)
            print(f"✓ {file:<30} - {size:>10} bytes")
        else:
            print(f"✗ {file:<30} - Status {response.status_code}")
    except Exception as e:
        print(f"✗ {file:<30} - Error: {str(e)}")

# Check for common JavaScript syntax errors in files
print("\nChecking for syntax issues:")
js_files = ["app.js", "feedback.js", "wishlist.js", "admin.js"]

for js_file in js_files:
    try:
        response = requests.get(f"http://localhost:8080/{js_file}", timeout=5)
        if response.status_code == 200:
            content = response.text
            # Check for common minification issues
            issues = []
            if "Unexpected identifier 'شكراً'" in content:
                issues.append("Arabic string syntax error")
            if content.count('{') != content.count('}'):
                issues.append("Mismatched braces")
            if content.count('(') != content.count(')'):
                issues.append("Mismatched parentheses")
            if len(content.splitlines()) == 1 and len(content) > 10000:
                issues.append("File appears to be minified")
            
            if issues:
                print(f"✗ {js_file}: {', '.join(issues)}")
            else:
                print(f"✓ {js_file}: No obvious syntax issues")
        else:
            print(f"✗ {js_file}: Could not load file")
    except Exception as e:
        print(f"✗ {js_file}: Error - {str(e)}")

print("\n" + "-" * 50)
print("Test complete. Open http://localhost:8080 in browser to check for console errors.")