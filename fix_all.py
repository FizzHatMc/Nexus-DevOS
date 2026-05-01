import os
import re

api_import = "import { API_URL } from '@/lib/api';\\n"

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    if "http://localhost:8000" in content:
        # Add import
        lines = content.split('\n')
        # Check if already imported
        already_imported = False
        for line in lines:
            if "import { API_URL } from '@/lib/api'" in line:
                already_imported = True
                break
        
        if not already_imported:
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    continue
                # Insert import after last import
                lines.insert(i, api_import)
                break
            content = '\n'.join(lines)

        # Replace "http://localhost:8000/..." with `${API_URL}/...`
        content = re.sub(r'"http://localhost:8000([^"]*)"', r'`${API_URL}\1`', content)
        content = re.sub(r"'http://localhost:8000([^']*)'", r'`${API_URL}\1`', content)

    # If "use client" is below the import, swap them
    if '"use client";' in content and api_import in content:
        content = content.replace(api_import, '')
        content = content.replace('"use client";', '"use client";\n' + api_import)
    
    # Replace any `http://${window.location.hostname}:8000` with `${API_URL}`
    content = content.replace("`http://${window.location.hostname}:8000`", "`${API_URL}`")


    if original_content != content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {filepath}")

os.makedirs('frontend/src/lib', exist_ok=True)
with open('frontend/src/lib/api.ts', 'w') as f:
    f.write('export const API_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://backend:8000";\n')

for root, dirs, files in os.walk('frontend/src'):
    for name in files:
        if name.endswith('.tsx') or name.endswith('.ts'):
            process_file(os.path.join(root, name))

print("Fixed URLs")
