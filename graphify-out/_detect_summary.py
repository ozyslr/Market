import json
from pathlib import Path
detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
print(f'total_files={detect.get('total_files', 0)}')
print(f'total_words={detect.get('total_words', 0)}')
skipped = detect.get('skipped_sensitive', [])
if skipped: print(f'skipped_sensitive={len(skipped)}')
for cat in ['code', 'document', 'paper', 'image', 'video']:
    files = detect.get('files', {}).get(cat, [])
    if files: print(f'{cat}={len(files)}')
