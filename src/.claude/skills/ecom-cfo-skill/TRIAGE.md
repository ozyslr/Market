# CFO Triage Card

The 10-minute P&L diagnostic. One page. Use this first.

---

## Step 0: Trust Check

**Is COGS % consistent month-over-month?**

| Variance | Verdict |
|----------|---------|
| < 2% | ✅ Proceed |
| 2-5% | ⚠️ Note it, proceed |
| > 5% | 🛑 STOP — fix books first |

> If COGS swings wildly, nothing else on the P&L is reliable.

---

## Step 1: The Five Vital Signs

| Metric | ✅ Healthy | ⚠️ Watch | 🔴 Danger |
|--------|-----------|----------|-----------|
| COGS % | < 27% | 27-33% | > 33% |
| Fulfillment % | < 20% | 20-25% | > 25% |
| Storage % | < 2% | 2-4% | > 4% |
| Ad Spend % | < 15% | 15-25% | > 25% |
| OpEx % | < 15% (AMZ) / < 25% (Shop) | At threshold | Above |

*See [THRESHOLDS.md](THRESHOLDS.md) for full context and modifiers.*

---

## Step 2: Contribution Margin

**Does the engine work?**

| CM % | Verdict |
|------|---------|
| > 25% | ✅ Healthy — optimize, don't overhaul |
| 20-25% | ⚠️ Tight but sustainable |
| 15-20% | ⚠️ One bad month breaks you |
| < 15% | 🔴 Not a business — fix immediately |

**The killer combo:** Ad spend > 25% + CM < 15% = losing money on every sale.

---

## Step 3: Cash Reality Check

Profitable ≠ cash healthy. Check:

- [ ] Current bank balance vs [cash floor](THRESHOLDS.md#cash-thresholds)
- [ ] Upcoming inventory POs (next 60 days)
- [ ] Credit card / loan balances (debt masking shortfall?)
- [ ] Amazon reserve holds

> Profit is an opinion. Cash is a fact.

---

## Step 4: First Action

Find the **highest-leverage fix** — one thing, not five.

| If... | Then... |
|-------|---------|
| COGS swinging | Fix books (inventory accounting) |
| COGS % > 33% | Fix sourcing or raise prices |
| Fulfillment % > 25% | Resize packaging or reprice |
| Storage % > 4% | Liquidate overstock |
| Ad spend > 25% | Cut ads, test organic |
| CM < 15% | Combination of above |
| OpEx too high | Cut team/software |
| Cash < floor | Pause distributions, delay POs |

---

## Quick Diagnostic Tree

```
Is net profit > 5%?
│
├─ NO → Is gross margin > 30%?
│       ├─ NO → COGS or fulfillment problem
│       └─ YES → Is CM > 20%?
│                ├─ NO → Ads eating the margin
│                └─ YES → Fixed costs problem
│
└─ YES → Is CM > 25%?
         ├─ YES → Healthy. Optimize.
         └─ NO → Margin compression. Check trend.
```

---

## Common Failure Modes

| Symptom | Likely Cause |
|---------|--------------|
| "Profitable but no cash" | Inventory timing + debt principal payments |
| COGS % swinging wildly | Inventory purchases hitting expense, not asset |
| Ad spend "fine" but CM collapsing | Fee creep + price compression |
| Shopify gross looks great, profit sucks | Team/software sprawl |
| Revenue up, profit down | Volume hiding margin erosion |
| Can't pay yourself despite growth | Cash cycle > growth rate |

---

## Next Steps

After triage, go deeper:

- **[THRESHOLDS.md](THRESHOLDS.md)** — Full threshold tables with context
- **[DEFINITIONS.md](DEFINITIONS.md)** — Canonical term definitions
- **[SKILL.md](SKILL.md)** — Complete diagnostic logic for AI agents
- **[OPERATING_SYSTEM.md](OPERATING_SYSTEM.md)** — Full human-readable framework

---

*This is the signature "CFO triage card." Bookmark it.*
