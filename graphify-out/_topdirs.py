import json
from pathlib import Path
from collections import Counter
detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
scan_root = Path(detect['scan_root'])
all_files = []
for cat in ['code', 'document', 'paper', 'image', 'video']:
    for f in detect.get('files', {}).get(cat, []):
        all_files.append(Path(f))
counts = Counter()
for f in all_files:
    try:
        rel = f.relative_to(scan_root)
        first = rel.parts[0] if rel.parts else '(root)'
    except:
        first = '(root)'
    if first == 'graphify-out': continue
    counts[first] += 1
for d, c in counts.most_common(8):
    print(f'{d}: {c} files')
