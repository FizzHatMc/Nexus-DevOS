import os
import glob
import re

api_import = "import { API_URL } from '@/lib/api';\n"

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "http://localhost:8000" not in content:
        return

    # Add import
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('import '):
            continue
        # Insert import after last import
        lines.insert(i, api_import)
        break
    
    content = '\n'.join(lines)

    # Replace "http://localhost:8000/..." with `${API_URL}/...`
    # Replace `http://localhost:8000/...` with `${API_URL}/...`
    
    content = re.sub(r'"http://localhost:8000([^"]*)"', r'`${API_URL}\1`', content)
    content = re.sub(r"'http://localhost:8000([^']*)'", r'`${API_URL}\1`', content)
    content = re.sub(r'http://localhost:8000', r'${API_URL}', content)

    with open(filepath, 'w') as f:
        f.write(content)

os.makedirs('frontend/src/lib', exist_ok=True)
with open('frontend/src/lib/api.ts', 'w') as f:
    f.write('''export const API_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000";\n''')

for root, dirs, files in os.walk('frontend/src'):
    for name in files:
        if name.endswith('.tsx') or name.endswith('.ts'):
            process_file(os.path.join(root, name))

print("Fixed URLs")
