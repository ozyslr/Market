import sys, json
from graphify.extract import collect_files, extract
from pathlib import Path

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
scan_root = Path(detect['scan_root'])

code_files = []
for f in detect.get('files', {}).get('code', []):
    fp = Path(f).resolve()
    code_files.extend(collect_files(fp) if fp.is_dir() else [fp])

print(f'Processing {len(code_files)} code files...')
result = extract(code_files, cache_root=Path('.'))
out = {'nodes': result['nodes'], 'edges': result['edges'], 'input_tokens': 0, 'output_tokens': 0}
Path('graphify-out/.graphify_ast.json').write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
