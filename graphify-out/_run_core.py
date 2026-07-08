import json, sys
from pathlib import Path
from graphify.extract import extract

# Only core project code — skip .claude/skills (3rd party)
core_dirs = [
    Path("src/components"),
    Path("src/context"),
    Path("src/services"),
    Path("src/pages"),
    Path("src/hooks"),
    Path("src/lib"),
    Path("src/data"),
    Path("server/lib"),
    Path("server/routes"),
    Path("server/services"),
    Path("scripts"),
    Path("e2e"),
]
existing = [d for d in core_dirs if d.exists()]
print(f"Processing {len(existing)} core directories...")

# Use collect_files to get individual files
from graphify.extract import collect_files
files = []
for d in existing:
    files.extend(collect_files(d))
print(f"Found {len(files)} source files")

result = extract(files, cache_root=Path("."))
Path("graphify-out/.graphify_ast.json").write_text(
    json.dumps({"nodes": result["nodes"], "edges": result["edges"], "input_tokens": 0, "output_tokens": 0}, indent=2, ensure_ascii=False),
    encoding="utf-8"
)
print(f"AST: {len(result['nodes'])} nodes, {len(result['edges'])} edges")
