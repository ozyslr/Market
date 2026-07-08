import re
path = r'O:\AI\E-tic 2026\.planning\ROADMAP.md'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Phase 21 section
content = re.sub(
    r'### 🚧 v3\.0 Go Live & Scale[\s\S]*?(?=## Deferred)',
    '''### 🚧 v3.0 Go Live & Scale (Phases 18–20)

#### Phase 18: Live UAT & Go Live
**Goal:** Close all remaining UAT debt, provision infrastructure, and prepare for production launch.
**Requirements:** UAT-01..05

#### Phase 19: ML Fraud Detection
**Goal:** Upgrade rule-based fraud detection to include ML-based anomaly detection and behavioral analysis.
**Requirements:** MLF-01..04

#### Phase 20: Native Mobile App
**Goal:** Launch React Native iOS/Android app with core marketplace flows.
**Requirements:** MOB-01..05

''',
    content
)

# Remove B2B from deferred
content = content.replace('- B2B Wholesale: company accounts, custom catalogs, quote system, net payment terms', '')
content = content.replace('- WMS / warehouse management', '- WMS / warehouse management\n- B2B Wholesale (out of scope — marketplace is B2C focused)')

# Clean double newlines
content = re.sub(r'\n\n\n+', '\n\n', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update requirements
req_path = r'O:\AI\E-tic 2026\.planning\REQUIREMENTS.md'
with open(req_path, 'r', encoding='utf-8') as f:
    req = f.read()

req = re.sub(r'### B2B Wholesale[\s\S]*?(?=## Deferred)', '', req)
req = re.sub(r'Coverage:\*\* 19 requirements.*', '**Coverage:** 14 requirements, 14 mapped to phases (0 unmapped)', req)
# Remove B2B traceability rows
req = re.sub(r'\| B2B-0[1-5].*\n', '', req)

with open(req_path, 'w', encoding='utf-8') as f:
    f.write(req)

# Update PROJECT.md  
proj_path = r'O:\AI\E-tic 2026\.planning\PROJECT.md'
with open(proj_path, 'r', encoding='utf-8') as f:
    proj = f.read()

proj = proj.replace('- B2B Wholesale: company accounts, custom catalogs, quote/negotiation system, net payment terms\n', '')
proj = proj.replace('- [ ] B2B wholesale — şirket hesapları, özel kataloglar, teklif sistemi, net ödeme vadeleri — v3.0\n', '')
proj = proj.replace('Phases 18–21', 'Phases 18–20')

with open(proj_path, 'w', encoding='utf-8') as f:
    f.write(proj)

print('All docs updated — Phase 21 removed')
