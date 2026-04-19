# Ecommerce CFO Skill

A fractional CFO operating system for Amazon, Shopify, and hybrid ecommerce sellers doing $500K–$30M in revenue. Built for AI agents and human operators.

## Repository Structure

```
ecom-cfo-skill/
├── README.md              # You're here
├── TRIAGE.md              # ⭐ Start here — 10-minute diagnostic (1 page)
├── DEFINITIONS.md         # Canonical term definitions
├── THRESHOLDS.md          # Single source of truth for all benchmarks
├── COMMON_FAILURES.md     # Pattern recognition — common problems & fixes
├── SKILL.md               # Full operating system (human + agent)
├── LICENSE                # MIT
└── references/
    ├── ecom-benchmarks.md    # Industry benchmarks by category
    └── case-studies.md       # Anonymized real examples
```

## Quick Start

**If you have 10 minutes:** Read [TRIAGE.md](TRIAGE.md) — the CFO triage card.

**If you're diagnosing a specific problem:** Check [COMMON_FAILURES.md](COMMON_FAILURES.md).

**If you need exact thresholds:** Reference [THRESHOLDS.md](THRESHOLDS.md).

**If you're building an AI agent:** Use [SKILL.md](SKILL.md) as your system prompt or skill file.

## Core Frameworks

### The Waterfall Diagnostic

Read the P&L top to bottom. Each line depends on the one above it.

```
1. COGS Consistency    → If broken, STOP. Fix books first.
2. COGS %              → If > 33%, sourcing/pricing problem.
3. Fulfillment %       → If > 25%, packaging/channel/pricing problem.
4. Storage %           → If > 4%, overstock problem.
5. = Gross Margin      → Must be > 30% to have room for ads + profit.
6. Ad Spend %          → If > 25%, ad dependency problem.
7. = Contribution Margin → Must be > 15% to survive, > 20% to thrive.
8. OpEx %              → If above threshold, overhead problem.
9. = Net Profit        → The result, not the target. Fix upstream.
```

### The Hierarchy

Most founders chase: Revenue → Growth → Profit

Reality: **Cash > Profit > Revenue**

- Revenue is vanity
- Profit is sanity  
- Cash is reality

### Contribution Margin Thresholds

| CM% | Reality |
|-----|---------|
| > 25% | Healthy. Room to invest, absorb shocks, pay yourself. |
| 20-25% | Acceptable. Tight but sustainable. |
| 15-20% | Warning. One bad month breaks you. |
| < 15% | Danger. You're subsidizing someone else's platform. |

> **The 15% floor:** Below 15% CM, you don't have a business — you have a job that could disappear.

## Who This Is For

- **Ecommerce founders** who want to understand their numbers (not just look at them)
- **Fractional CFOs** who want to codify their diagnostic process
- **AI developers** building financial tools for ecommerce
- **Bookkeepers/accountants** serving ecommerce clients

## How to Use

### With Claude Code / AI Agents
Drop the `ecom-cfo-skill` folder into your project. Claude Code will detect and use it when you ask financial questions about ecommerce.

### As a Human Operator
Start with [TRIAGE.md](TRIAGE.md). Use [THRESHOLDS.md](THRESHOLDS.md) as your reference card. Read [SKILL.md](SKILL.md) for the full framework.

### For Client Deployments
See Section 15 of [SKILL.md](SKILL.md) for **Client Atlas** — a read-only financial copilot architecture for per-client deployment.

## Key Principles

> "Revenue hides mistakes. Cash exposes them."

> "Monthly = autopsy. Weekly = coaching. Daily = steering."

> "Never diagnose net profit directly. Walk the waterfall to find where the leak is."

> "The product isn't a spreadsheet. It's peace of mind."

## About

Built by [Jeff DeBolt](https://museminded.com), CPA and fractional CFO for ecommerce sellers.

Based on real client engagements across hundreds of ecommerce brands. Thresholds and benchmarks reflect patterns from my client set — your mileage may vary by category, AOV, and channel mix.

## License

MIT — use it, modify it, build on it. Attribution appreciated but not required.

---

*Questions or feedback? Open an issue or PR.*
