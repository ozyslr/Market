# Admin & Operasyon - Hızlı Referans Kılavuzu

**Operasyon Ekibi için:** Kritik özellikler, risk kontrol, ve uygulamayı hızlı başlamak için.

---

## 📊 DURUM ÖZETI

| Metrik | Mevcut | Hedef | Gap |
|--------|--------|-------|-----|
| Admin Modülleri | 20 | 25+ | 5 |
| Dashboard Özellikleri | 8 | 25+ | 17 |
| Dispute Çözüm | ❌ | ✅ | Kritik |
| Moderation SLA | ❌ | ✅ | Kritik |
| Fraud Detection | ❌ | ✅ | Kritik |
| Real-time Monitoring | ❌ | ✅ | Kritik |
| Audit Logging | ❌ | ✅ | Kritik |
| **Genel Puan** | **2/50** | **40+/50** | **-38/50** |

---

## 🔴 KRİTİK ÖZELLIKLERI (Eksik)

### 1. Dispute Management System
**Risk Level:** 🔴 KRITIK (Müşteri satisfaction -5-7%)

**Ne Yapmalı:**
- 4-step resolution workflow (customer → negotiation → mediation → final decision)
- SLA tracking (< 10 days target)
- Appeal process (both parties)
- Evidence management (images, chat logs)

**Neden Önemli:**
- Müşteri şikâyetlerini profesyonelce yönetmek
- Chargeback oranını düşürmek (target: 0.25%)
- Satıcı güvenini arttırmak

**Effort:** 4 hafta (backend 2 kişi, frontend 1 kişi)
**Expected ROI:** Müşteri satisfaction +5-7%, Chargeback -30%

---

### 2. Advanced Product Moderation
**Risk Level:** 🔴 KRITIK (Operasyon verimliliği -50%)

**Ne Yapmalı:**
- AI-powered image analysis (fake, low-quality detection)
- Text analysis (policy violations, trademark)
- Auto-approve low-risk items (seller tier + category)
- Priority lanes (critical < 4h, high < 12h, standard < 24h)
- Standardized rejection reasons (20+ categories)

**Neden Önemli:**
- Moderasyon süresi 50% azalması
- Yanlış reddetme 30% azalması
- Satıcı memnuniyeti +10%

**Effort:** 3 hafta (backend 1, frontend 1, ML engineer 0.5)
**Expected ROI:** Operasyon verimliliği +60%

---

### 3. Real-time System Monitoring
**Risk Level:** 🔴 KRITIK (Downtime -40%)

**Ne Yapmalı:**
- API latency, error rate, database health tracking
- Critical alerts + escalation (PagerDuty)
- On-call integration
- SLA dashboard (uptime %, latency p95, p99)
- Anomaly detection (std deviation > 2σ)

**Neden Önemli:**
- Downtime 40% azalması
- Problem bulma süresi 60% azalması
- Müşteri satisfaction +3%

**Effort:** 2 hafta (backend 1, DevOps 1)
**Expected ROI:** Downtime -40%, Support tickets -25%

---

### 4. Automated Risk Scoring
**Risk Level:** 🔴 KRITIK (Fraud 35% azalması)

**Ne Yapmalı:**
- Seller behavioral model (order fraud, chargeback, late shipment)
- Graduated suspension (warning → 1d → 7d → 30d → ban)
- Auto-trigger at threshold (e.g., chargeback ratio > 2%)
- Velocity checking (same card/IP/phone limits)

**Neden Önemli:**
- Fraud cases 35% azalması
- Operasyon team capacity +40%
- Müşteri güvenliği +50%

**Effort:** 3 hafta (backend 1.5, ML engineer 1)
**Expected ROI:** Fraud losses -40%, Chargeback ratio 0.5% → 0.25%

---

### 5. A/B Testing Platform
**Risk Level:** 🟠 YÜKSEK (Product iteration +50%)

**Ne Yapmalı:**
- Experiment dashboard (running, completed, results)
- Statistical significance calculator (p-value)
- Guardrail metrics (prevent negative side effects)
- Multi-armed bandit option (AI-optimized)
- Automatic winner declaration

**Neden Önemli:**
- Product improvements 50% daha hızlı validation
- Revenue per user +2-3%
- Data-driven decision making

**Effort:** 4 hafta (backend 1, frontend 1, data scientist 0.5)
**Expected ROI:** Revenue per user +2-3%, Product velocity +50%

---

## 🟡 YÜKSEK ÖNEMLİ ÖZELLIKLERI

### 6. Comprehensive Audit Logging
- User action tracking (all admins/mods)
- Data change history (before/after)
- 7-year retention (compliance)
- Immutable log (fraud-proof)
- **Effort:** 2 hafta | **Priority:** 2nd month

### 7. Advanced RBAC
- Resource-level permissions (users, products, orders)
- Conditional access (seller_tier, geography, category)
- 2FA enforcement for sensitive roles
- IP whitelisting
- **Effort:** 2-3 hafta | **Priority:** 3rd month

### 8. Financial Controls
- Dual-ledger accounting (seller vs company)
- Chargeback + refund impact tracking
- Reserve management (risk-based)
- Velocity checking (fraud prevention)
- **Effort:** 3-4 hafta | **Priority:** 3rd month

---

## 📋 IMPLEMENTATION TIMELINE

### Month 1 (Weeks 1-4) - Foundation
```
Week 1: [ Dispute Management Start ]
Week 1: [ Moderation Queue Start ]
Week 2: [ Monitoring Dashboard Start ]
Week 3: [ Dispute Management Complete ]
Week 3: [ Risk Scoring Start ]
Week 4: [ All Phase 1 Complete ]

Parallel: Backend (2) + Frontend (1) + DevOps (1)
Cost: ~₺200K
```

### Month 2 (Weeks 5-8) - Intelligence
```
Week 5: [ Risk Scoring Complete ]
Week 5: [ A/B Testing Start ]
Week 6: [ Audit Logging Start ]
Week 7: [ A/B Testing Complete ]
Week 8: [ Audit Logging Complete ]

Parallel: Backend (2) + ML (1) + Frontend (1)
Cost: ~₺250K
```

### Month 3 (Weeks 9-12) - Security
```
Week 9:  [ Advanced RBAC Start ]
Week 9:  [ Financial Controls Start ]
Week 10: [ Notifications Start ]
Week 11: [ RBAC Complete ]
Week 12: [ All Phase 3 Complete ]

Parallel: Backend (2) + Security (1) + Frontend (1)
Cost: ~₺200K
```

### Month 4+ - Optimization
```
Week 13+: [ Advanced Analytics ]
Week 13+: [ Integration Automation ]
Week 13+: [ Performance Tuning ]

Cost: ~₺100K+
```

**Total Timeline:** 12 weeks = 3 months (intensive)
**Total Cost:** ~₺650K
**Expected ROI:** 200-300% (Year 1)

---

## 🎯 QUICK START CHECKLIST

### Week 1 Actions
- [ ] Create project in development environment
- [ ] Set up database schema (audit_logs, disputes, risk_scores, experiments)
- [ ] Create API endpoints specification
- [ ] Assign team members to initiatives
- [ ] Setup monitoring (monitoring dashboard work)

### Week 2 Actions
- [ ] First iteration of Dispute Management backend
- [ ] Moderation Queue mock-up
- [ ] Risk Scoring algorithm sketch
- [ ] Team sync on technical decisions

### Week 3 Actions
- [ ] Dispute Management UI complete
- [ ] Moderation Queue SLA tracking
- [ ] Risk Scoring MVP
- [ ] Internal testing begins

### Week 4 Actions
- [ ] All Phase 1 complete
- [ ] UAT with operations team
- [ ] Bug fixes + optimization
- [ ] Production deployment planning

---

## 💾 DATABASE SCHEMA SUMMARY

### Table: audit_logs
```
id (UUID) | user_id | action | resource_type | resource_id | 
before_value (JSON) | after_value (JSON) | timestamp | ip_address | user_agent

Indexes:
- idx_audit_user_time (user_id, created_at)
- idx_audit_resource (resource_type, resource_id)
```

### Table: disputes
```
id | order_id | customer_id | seller_id | dispute_type | status | 
resolution | amount | created_at | resolved_at | sla_due_at | 
steps (JSON: [ { step, timestamp, moderator_id, notes } ])

Indexes:
- idx_disputes_status (status)
- idx_disputes_sla (sla_due_at)
```

### Table: risk_scores
```
id | entity_type | entity_id | score (0-100) | factors (JSON) | 
auto_action | updated_at

Indexes:
- idx_risk_entity (entity_type, entity_id)
- idx_risk_score (score)
```

### Table: experiments
```
id | name | hypothesis | variant_control | variant_test | 
sample_size | start_date | end_date | status | metrics (JSON) | 
significance | winner | created_by | created_at

Indexes:
- idx_exp_status (status)
- idx_exp_period (start_date, end_date)
```

---

## 🔧 KEY APIs TO IMPLEMENT

### Disputes
```
POST   /api/admin/disputes                      # Create
GET    /api/admin/disputes?status=open&sort=-created
GET    /api/admin/disputes/{id}                 # Get one
PUT    /api/admin/disputes/{id}/mediate         # Mediation step
POST   /api/admin/disputes/{id}/appeal          # Appeal
GET    /api/admin/disputes/{id}/history         # Change log
```

### Risk Scoring
```
GET    /api/admin/risk-scores/seller/{seller_id}
GET    /api/admin/risk-scores/alerts            # High risk
POST   /api/admin/risk-scores/{id}/action       # Apply auto-action
```

### Experiments
```
POST   /api/admin/experiments                   # Create
GET    /api/admin/experiments?status=running
GET    /api/admin/experiments/{id}/results      # Live results
PUT    /api/admin/experiments/{id}/stop
POST   /api/admin/experiments/{id}/declare-winner
```

### Audit Logs
```
GET    /api/admin/audit-logs?limit=50&offset=0
GET    /api/admin/audit-logs/user/{user_id}
GET    /api/admin/audit-logs/resource/{resource_type}/{resource_id}
```

---

## 📊 SUCCESS METRICS (Monitor Weekly)

### Operational Metrics
- [ ] Moderation queue SLA compliance (target: 95%+)
- [ ] Dispute resolution time (target: < 10 days avg)
- [ ] Fraud detection rate (target: 90%+)
- [ ] System uptime (target: 99.9%+)

### Business Metrics
- [ ] Customer satisfaction (CSAT) (target: +5-7%)
- [ ] Chargeback ratio (target: < 0.25%)
- [ ] Refund rate (target: < 3%)
- [ ] Seller retention (target: +10%)

### Technical Metrics
- [ ] API latency p95 (target: < 500ms)
- [ ] Error rate (target: < 0.1%)
- [ ] Database query time (target: < 100ms)
- [ ] Test coverage (target: 80%+)

---

## ⚙️ INTEGRATION CHECKLIST

### Third-party Services
- [ ] Monitoring: Prometheus + Grafana (or DataDog)
- [ ] Logging: ELK Stack or Cloud Logging
- [ ] Alerting: PagerDuty or OpsGenie
- [ ] ML Pipeline: TensorFlow Serving
- [ ] Notifications: SendGrid (email), Twilio (SMS), Slack API

### Internal Services
- [ ] Authentication: OAuth 2.0 + JWT
- [ ] Payment: Stripe + Local gateways (BKM, Enpara)
- [ ] Storage: Firebase/S3 for evidence (disputes)
- [ ] Cache: Redis for rate limiting

---

## 🚨 RISK MITIGATION

### Data Loss
- [ ] Implement daily backups (3-month retention)
- [ ] Test restore procedure weekly
- [ ] Use immutable audit logs (append-only)

### Performance
- [ ] Load test (10K concurrent users)
- [ ] Cache strategy (Redis + CDN)
- [ ] Database optimization (indexes, partitioning)

### Security
- [ ] Penetration testing
- [ ] SSL/TLS for all endpoints
- [ ] Rate limiting + DDoS protection
- [ ] PII encryption (AES-256)

### Compliance
- [ ] GDPR data retention (7 years for audit)
- [ ] KVKK compliance (Turkish privacy law)
- [ ] SOC 2 certification path
- [ ] Tax/VAT reporting

---

## 📞 SUPPORT & ESCALATION

### Daily Operations
- **Queue Management:** 1 moderator (8h)
- **Dispute Resolution:** 1 specialist (8h)
- **Monitoring:** On-call rotation (24/7)

### Weekly Reviews
- [ ] Operasyon meeting (Wed 10am)
- [ ] Metrics review (Fri 3pm)
- [ ] Incident postmortem (if needed)

### Monthly Planning
- [ ] Roadmap review
- [ ] Budget allocation
- [ ] Team capacity planning

---

## 💡 BEST PRACTICES

### Moderation
1. **Auto-approve low-risk:** New sellers (< $5K GMV/month) with approved categories
2. **Priority assignment:** Perishable goods (< 12h SLA), Electronics (< 24h)
3. **Seller education:** Reject with 3 specific improvement points
4. **Resubmission:** Allow unlimited attempts (but track patterns)

### Dispute Resolution
1. **Chat-first:** Encourage negotiation (72 hours)
2. **Evidence weight:** Carrier proof > seller word > customer word
3. **Partial refund:** When both responsible (e.g., delayed + item minor damage)
4. **Appeal:** Only if new evidence or procedural error

### Risk Management
1. **Graduated response:** Warning → 1d suspend → 7d → permanent ban
2. **Appeal process:** Within 30 days, with new evidence
3. **Seller tier review:** After each action (can regain trust)
4. **Communication:** Transparent reasons + improvement path

---

## 🎓 TRAINING REQUIRED

### For Moderators
- [ ] Policy enforcement (2 hours)
- [ ] Appeal handling (1 hour)
- [ ] Tool training (Dispute & Moderation dashboards) (3 hours)
- [ ] Cultural sensitivity (1 hour)

### For Admins
- [ ] System architecture (4 hours)
- [ ] Emergency procedures (2 hours)
- [ ] Data privacy (2 hours)
- [ ] RBAC configuration (2 hours)

### For Developers
- [ ] API standards (2 hours)
- [ ] Testing practices (3 hours)
- [ ] Deployment procedures (2 hours)
- [ ] Incident response (2 hours)

---

## 📈 EXPECTED OUTCOMES (Year 1)

### Customer Impact
- Satisfaction (CSAT): 3.8 → 4.3 (+12%)
- Dispute resolution time: 15+ days → < 10 days (-33%)
- Chargeback ratio: 0.5% → 0.25% (-50%)
- Refund rate: 4% → 3% (-25%)

### Operational Impact
- Moderator productivity: 50 items/day → 80 items/day (+60%)
- Fraud detection: 60% → 90% accuracy (+30%)
- System uptime: 98.5% → 99.9% (+1.4%)
- Support tickets: -25% (fewer issues)

### Financial Impact
- Chargeback costs: -50% (fewer disputes)
- Support cost: -30% (faster resolution)
- Fraud losses: -40% (better detection)
- Total operational cost: -25%
- **Net ROI: 200-300%**

---

**Last Updated:** 24 May 2026  
**Status:** Ready for Implementation  
**Owner:** Operations & Engineering Teams
