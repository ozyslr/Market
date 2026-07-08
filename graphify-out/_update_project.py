import re
path = r'O:\AI\E-tic 2026\.planning\PROJECT.md'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update Current State
content = content.replace(
    '**Shipped:** v1.0 Marketplace Core (Phases 1–7) + v1.1 Stabilize & Sharpen (Phases 8–11).',
    '**Shipped:** v1.0 Marketplace Core (Phases 1–7) + v1.1 Stabilize & Sharpen (Phases 8–11) + v2.0 Trust & Scale (Phases 12–17).'
)
content = content.replace(
    '**Codebase:** 65+ sayfa, 55+ servis, 8 React Context, 263 unit test (green), 3 Playwright E2E spec.',
    '**Codebase:** 65+ sayfa, 80+ servis, 9 React Context, 263 unit test (green), 3 Playwright E2E spec.'
)
content = content.replace(
    "Admin panel aktif. Satıcı onboarding KYC'li.",
    "Admin panel RBAC korumalı. EUR/TRY çift para birimi. Typesense arama hazır."
)
content = re.sub(
    r'- \*\*Archives:\*\* .*',
    '- **Archives:** `.planning/milestones/v1.0-ROADMAP.md` · `.planning/milestones/v1.1-ROADMAP.md` · `.planning/milestones/v2.0-ROADMAP.md`',
    content
)
content = content.replace(
    '- **Carried tech debt:** Live UAT sign-off (BUY-05 checklist + E2E specs yazıldı, manuel doğrulama bekliyor)',
    '- **Carried tech debt:** Live UAT sign-off, Typesense server provisioning, e-fatura API keys'
)

# Replace v2.0 milestone section with v3.0
old = '''## Current Milestone — v2.0: Trust & Scale

**Goal:** Scale the marketplace globally (multi-currency, cross-border, Typesense search) while building seller trust through verification, fraud prevention, complaint handling, and workflow automations.

**Target features:**

- Multi-Currency: EUR display, FX rate-locking, TRY/EUR toggle, per-country routing
- Typesense Search: typo-tolerant full-text, event-driven index sync
- Cross-Border Compliance: HS codes, customs docs, total landed cost, EU GPSR
- Seller Trust & Fraud Prevention: phone verification, tax info, product approval workflows, complaint/dispute system, fake listing detection
- Automations: auto invoice generation (e-fatura), auto email notifications (order, shipping, approval)
- Bug Fix: Firebase Storage image upload permission for sellers
- UAT Closure: v1.0 live UAT sign-off (payments/3DS, shipping, reviews)'''

new = '''## Current Milestone — v3.0: Go Live & Scale

**Goal:** Close all remaining UAT debt, provision infrastructure (Typesense, e-fatura), upgrade fraud detection to ML, launch native mobile app, and add B2B wholesale capabilities.

**Target features:**

- Live UAT & Go Live: close BUY-05 UAT, provision Typesense server, configure e-fatura API keys, production readiness
- ML Fraud Detection: upgrade rule-based fraud detection to ML (anomaly detection, behavioral analysis)
- Native Mobile App: React Native iOS/Android app with core marketplace flows
- B2B Wholesale: company accounts, custom catalogs, quote/negotiation system, net payment terms'''

content = content.replace(old, new)

# Update Active requirements
old_reqs = '''### Active

- [ ] Multi-Currency tam desteği (EUR/TRY, FX rate-locking, per-country routing) — v2.0
- [ ] Typesense tam-metin arama (typo-tolerant + event-driven index) — v2.0
- [ ] Cross-Border Compliance (HS codes, customs docs, total landed cost, EU GPSR) — v2.0
- [ ] Satıcı güvenliği & dolandırıcılık önleme (telefon doğrulama, vergi bilgisi, ürün onay, şikayet sistemi) — v2.0
- [ ] Otomasyonlar (otomatik fatura, otomatik e-postalar) — v2.0
- [ ] Firebase Storage resim yükleme izin hatası düzeltmesi — v2.0
- [ ] Live UAT sign-off (BUY-05: payments/3DS, shipping, reviews/Q&A) — v2.0'''

new_reqs = '''### Active

- [ ] Live UAT kapanışı — BUY-05 checklist + Playwright E2E manuel doğrulama + Typesense sunucu kurulumu — v3.0
- [ ] ML tabanlı dolandırıcılık tespiti — anomaly detection + behavioral analysis — v3.0
- [ ] Native mobil uygulama — React Native iOS/Android — v3.0
- [ ] B2B wholesale — şirket hesapları, özel kataloglar, teklif sistemi, net ödeme vadeleri — v3.0
- [ ] E-fatura API entegrasyonu — Paraşüt/Logo API anahtarları — v3.0'''

content = content.replace(old_reqs, new_reqs)

content = re.sub(r'_Last updated:.*', '_Last updated: 2026-06-07 — v2.0 shipped; v3.0 Go Live & Scale started_', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('PROJECT.md updated')
