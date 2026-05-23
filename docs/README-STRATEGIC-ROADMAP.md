# MERCORA STRATEGIC ROADMAP — DOCUMENT INDEX
**Master Repository for CEO Phase 1 Execution Plan**

---

## QUICK REFERENCE

**Objective**: Move Mercora from 4.8/10 → 8.5/10 by closing 17 P0 critical gaps  
**Timeline**: 12 months (4 phases), Phase 1: 8 weeks (0-2 months)  
**Revenue Target Year 1**: $180k/month (ads + subscriptions + loyalty)  
**Team Size**: 11 people Phase 1, scaling to 15+ Phase 2+  
**Budget Phase 1**: $150k  

---

## DOCUMENT MAP

### 📋 EXECUTIVE SUMMARIES (Read First)

#### 1. **00-executive-summary-roadmap.md** (1 page)
**For**: All stakeholders (board, team, investors)  
**Contains**:
- 3 critical missing revenue engines (CPC ads, seller subs, loyalty)
- 4-phase timeline snapshot
- 17 P0 items prioritized by impact/effort
- Key metrics and approval checklist
- Dependencies and risk mitigation

**Reading time**: 5 minutes  
**Use case**: "Share with board" or "onboard new team member quickly"

---

#### 2. **ceo-decisions-checklist.md** (Sign-off document)
**For**: CEO approval  
**Contains**:
- Financial approvals needed ($150k budget, pricing decisions)
- Technical partnerships (payment gateways, SMS providers)
- Team assignments (Engineering Lead, 9 Tech Leads)
- Success criteria (Week 8 targets: 18% conversion, 50 paid sellers, $10k/mo ads)
- Timeline and contingency thresholds

**Reading time**: 10 minutes  
**Use case**: "Approve and sign off before Week 1 starts"

---

### 📊 STRATEGIC DOCUMENTS (For Leadership)

#### 3. **01-strategic-roadmap-ceo.md** (Comprehensive Master Plan)
**For**: CEO, Engineering Lead, Product Lead  
**Contains**:
- Full P0 prioritization matrix (17 items ranked by impact × effort)
- Phase 1-4 detailed breakdown (MVP features, success metrics)
- Risk matrix (HIGH: CPC complexity, payment failures; MEDIUM: churn, moderation)
- Resource allocation (11-person team, $150k budget)
- Executive decision requirements (immediate vs Phase 2)
- Competitor benchmarks (Mercora 4.8 → 6.0 vs Hepsiburada 8.2, Trendyol 8.8)

**Reading time**: 20 minutes  
**Use case**: "Strategic planning, board presentations, quarterly reviews"

---

### ⚙️ EXECUTION DOCUMENTS (For Engineering)

#### 4. **phase1-sprint-breakdown.md** (8-week Implementation Detail)
**For**: Engineering Lead, 9 Tech Leads, developers  
**Contains**:
- Sprint 1-2 (Weeks 1-4): 5 parallel work streams
  - Stream A: Payment gateways (Apple Pay, Google Pay, COD)
  - Stream B: Checkout optimization (guest, phone, social login)
  - Stream C: Reliability & security (error pages, bot protection, CDN)
  - Stream D: Seller subscriptions (3-tier model, billing)
  - Stream E: Auth expansion (phone + social)
- Sprint 3-4 (Weeks 5-8): 5 parallel work streams
  - Stream F: CPC ad engine MVP
  - Stream G: Buyer loyalty program
  - Stream H: Review automation
  - Stream I: Price comparison / Buybox
- Per-stream task breakdown (weeks, dev-weeks, success criteria, risks)
- Budget allocation per stream
- Risk register with mitigations
- Weekly success metrics

**Reading time**: 30 minutes (one-time), then reference as needed  
**Use case**: "Daily execution, sprint planning, team coordination"

---

## RECOMMENDED READING ORDER

### **For CEO (Total: ~35 minutes)**
1. Read: `00-executive-summary-roadmap.md` (5 min)
2. Read: `01-strategic-roadmap-ceo.md` (20 min)
3. Sign: `ceo-decisions-checklist.md` (10 min)
4. Skim: `phase1-sprint-breakdown.md` (reference only)

### **For Engineering Lead (Total: ~40 minutes)**
1. Read: `00-executive-summary-roadmap.md` (5 min)
2. Read: `01-strategic-roadmap-ceo.md` — sections 2, 6, 7 (10 min)
3. Read: `phase1-sprint-breakdown.md` (25 min)
4. Reference: `ceo-decisions-checklist.md` for team assignments

### **For 9 Tech Leads (Total: ~30 minutes per stream)**
1. Skim: `00-executive-summary-roadmap.md` (3 min)
2. Read: Your assigned stream in `phase1-sprint-breakdown.md` (20 min)
3. Reference: Risk mitigation from `01-strategic-roadmap-ceo.md` (7 min)

### **For Developers (Total: ~15 minutes)**
1. Skim: `00-executive-summary-roadmap.md` (3 min)
2. Read: Your assigned task in `phase1-sprint-breakdown.md` (12 min)
3. Ask: Tech Lead for context

---

## KEY METRICS TO TRACK WEEKLY

### **Week 4 Checkpoint (End of Sprint 1-2)**
- Checkout conversion: 12% → **18%** ✓ or ✗
- Guest checkout: **8%** of orders ✓ or ✗
- Seller subscriptions: **50 Pro accounts** ✓ or ✗
- Payment success: **>95%** ✓ or ✗
- Uptime: **99.9%** ✓ or ✗
- Mercora score: 4.8 → **5.2/10** ✓ or ✗

### **Week 8 Checkpoint (End of Sprint 3-4)**
- CPC ad revenue: **$10k/month** ✓ or ✗
- CPC impressions: **10k/day** ✓ or ✗
- Loyalty enrollment: **30%** of active users ✓ or ✗
- Review requests: **80% delivery, 40% completion** ✓ or ✗
- Buybox: **80% of products** ✓ or ✗
- Mercora score: 5.2 → **6.0/10** ✓ or ✗

---

## CRITICAL PATH (Must Not Slip)

```
WEEK 1-2: Database Schema + Stripe Integration
     ↓
WEEK 3: Seller Subscription Model
     ↓
WEEK 5-6: CPC Ad Engine (depends on seller subs)
     ↓
WEEK 8: Phase 1 Complete (target: $10k/month ads + subscriptions)
```

**If any of these slip >1 week, Phase 1 timeline extends.**

---

## DEPENDENCIES BETWEEN DOCUMENTS

```
00-executive-summary (HIGH-LEVEL)
    ├─→ ceo-decisions-checklist (APPROVALS)
    ├─→ 01-strategic-roadmap (DETAILED STRATEGY)
    │   └─→ phase1-sprint-breakdown (EXECUTION)
    │       └─→ Jira/Asana (DAILY TASKS)
    └─→ Sell to Board / Investors
```

---

## WHO OWNS WHAT

| Document | Owner | Audience | Update Frequency |
|----------|-------|----------|-----------------|
| 00-executive-summary | CEO | All stakeholders | Monthly |
| ceo-decisions-checklist | CEO | CEO + Board | One-time (sign-off) |
| 01-strategic-roadmap | CEO | C-level + leads | Quarterly |
| phase1-sprint-breakdown | Eng Lead | Engineering | Weekly (sprint updates) |

---

## WHAT'S NEXT

### **Immediate (This Week)**
1. CEO reviews all 4 documents
2. CEO signs off on `ceo-decisions-checklist`
3. CFO approves $150k budget
4. HR begins hiring Engineering Lead
5. Schedule Week 1 kickoff meeting

### **Week 1 (Kickoff)**
1. Engineering Lead starts
2. Announce roadmap to all-hands
3. Seller summit invitations sent
4. Vendor contracts (Stripe, Twilio, etc.) signed
5. Database schema designed
6. 9 Tech Leads assigned to streams

### **Week 2-8 (Execution)**
- Development proceeds in parallel across 5 + 5 work streams
- Weekly metrics tracked (Monday dashboards)
- Mid-phase review (Week 4: Are we on track?)
- Sprint retrospectives every 2 weeks

### **Week 9 (Phase 1 Review)**
- Evaluate Phase 1 outcomes vs targets
- Decide: Proceed to Phase 2 or course-correct?
- Announce Phase 1 wins to market

---

## SUPPORT & QUESTIONS

**If you have questions about:**
- **Strategy** → Read `01-strategic-roadmap-ceo.md` or ask CEO
- **Execution** → Read `phase1-sprint-breakdown.md` or ask Engineering Lead
- **Your specific task** → Ask your Tech Lead or stream owner
- **Budget/Resources** → Ask CFO
- **Timeline/Risk** → Ask CEO or Engineering Lead

---

## APPENDIX: PHASE 2-4 AT A GLANCE

| Phase | Timeline | Score Target | Revenue Target | Key Features |
|-------|----------|:------------:|:---------------:|--------------|
| **Phase 1** | 0-2 mo | 4.8 → **6.0** | **$15k/mo** | CPC MVP, Subs MVP, Checkout |
| **Phase 2** | 2-4 mo | 6.0 → **7.0** | **$45k/mo** | CPC scaling, API, Mobile app |
| **Phase 3** | 4-8 mo | 7.0 → **7.5** | **$85k/mo** | Video, Brand ads, 2FA |
| **Phase 4** | 8-12+ mo | 7.5 → **8.5+** | **$180k/mo** | Native apps, Live shopping |

*Full roadmaps for Phase 2-4 will be created after Phase 1 success validation.*

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-05-23 | Initial creation (4 documents) | CEO Agent |
| - | - | - | - |

---

**Last Updated**: 2026-05-23  
**Next Review**: 2026-06-23 (Post-Sprint 2)  
**Questions?** → Email: [CEO email] or Slack: #mercora-roadmap

---

**THIS IS THE MASTER DOCUMENT FOR ALL PHASE 1 EXECUTION**

Print, bookmark, and reference daily.
