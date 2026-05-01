import os
import re

api_import = "import { API_URL } from '@/lib/api';\n"

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if "API_URL" not in content:
        return

    # If "use client" is below the import, swap them
    if content.startswith(api_import) and '"use client";' in content:
        content = content.replace(api_import, '')
        content = content.replace('"use client";', '"use client";\n' + api_import)
        with open(filepath, 'w') as f:
            f.write(content)

for root, dirs, files in os.walk('frontend/src'):
    for name in files:
        if name.endswith('.tsx') or name.endswith('.ts'):
            process_file(os.path.join(root, name))

print("Fixed imports")
