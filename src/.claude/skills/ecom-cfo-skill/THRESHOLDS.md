# Thresholds

Single source of truth for all diagnostic thresholds. Reference this file from other documents.

> **Disclaimer:** Ranges based on my client set across hundreds of ecommerce businesses. Actual thresholds vary by category, AOV, catalog size, and channel mix. Use as starting points, not absolute rules.

---

## COGS Consistency (Check First)

Before reading any P&L, verify COGS as % of revenue is stable month-over-month.

| Variance | Assessment | Action |
|----------|------------|--------|
| < 2% swing | ✅ Healthy | Books are reliable. Proceed. |
| 2-5% swing | ⚠️ Minor | Likely promo/returns noise. Note it. |
| > 5% swing | 🔴 Problem | Books wrong OR inventory accounting broken. |
| Roller coaster | 🛑 Stop | Fix books before any other analysis. |

---

## COGS % of Net Revenue

| COGS % | Assessment | Notes |
|--------|------------|-------|
| < 25% | ✅ Excellent | Strong sourcing or premium pricing |
| 25-30% | ✅ Healthy | Typical for well-run brands |
| 30-35% | ⚠️ Acceptable | Monitor, optimize if possible |
| > 35% | 🔴 Investigate | Sourcing problem or catalog mix issue |

*Context: Higher AOV products often run higher COGS % but healthy absolute margins.*

---

## Fulfillment % of Net Revenue (Amazon FBA)

| Fulfillment % | Assessment | Notes |
|---------------|------------|-------|
| < 15% | ✅ Excellent | Compact/lightweight products, strong pricing |
| 15-20% | ✅ Healthy | Typical range |
| 20-25% | ⚠️ Warning | Fee creep or price pressure |
| > 25% | 🔴 Danger | Size/weight issue OR price too low |

*Critical insight: Fulfillment is a static dollar amount per unit. When prices drop, this % rises even if fees don't change. Double squeeze.*

---

## Storage % of Net Revenue

| Storage % | Assessment | Notes |
|-----------|------------|-------|
| < 2% | ✅ Healthy | Good inventory turnover |
| 2-4% | ⚠️ Warning | Overstock building or slow movers |
| > 4% | 🔴 Danger | Severe overstock or oversized problem |

*Q4 note: Amazon storage rates spike 3-4× from Oct-Dec. Budget accordingly.*

---

## Ad Spend % of Net Revenue

| Ad Spend % | Assessment | Notes |
|------------|------------|-------|
| < 15% | ✅ Healthy | Ads supporting growth, not driving it |
| 15-20% | ⚠️ Watch | Acceptable if CM > 20% |
| 20-25% | ⚠️ Warning | Ad-dependent. Monitor closely. |
| 25-30% | 🔴 Danger | One algorithm change kills you |
| > 30% | 🛑 Critical | Buying revenue, not building business |

**The killer combo:** Ad spend > 25% AND CM < 15% = you're losing money on every sale.

*Trend note: In my client set, I've seen ad spend drift from ~14% (2021-era) toward mid-teens, and higher in competitive categories.*

---

## Contribution Margin % (Business-Level)

| CM % | Assessment | Reality |
|------|------------|---------|
| > 30% | ✅ Excellent | Room for investment, shocks, distributions |
| 25-30% | ✅ Healthy | Sustainable with discipline |
| 20-25% | ⚠️ Acceptable | Tight but workable if OpEx controlled |
| 15-20% | ⚠️ Warning | One bad month breaks you |
| < 15% | 🔴 Danger | Subsidizing platforms with your labor |

> **The 15% floor:** Below 15% CM, you don't have a business — you have a job that could disappear.

---

## Contribution Margin % (SKU-Level)

| SKU CM % | Assessment | Action |
|----------|------------|--------|
| > 30% | ✅ Healthy | Scale, invest in ads |
| 20-30% | ✅ Acceptable | Monitor, optimize costs |
| 15-20% | ⚠️ Warning | Audit fees, COGS, ad spend |
| < 15% | 🔴 Danger | Raise price, cut ads, or kill SKU |

*Context modifier: Volume matters. A 15% CM at 200 units/day may generate more absolute profit than 40% CM at 5 units/day.*

---

## Operating Expenses % of Net Revenue

| Channel | Healthy | Warning | Danger |
|---------|---------|---------|--------|
| Amazon | < 12% | 12-15% | > 15% |
| Shopify | < 20% | 20-25% | > 25% |
| Hybrid | Weighted average by channel revenue |

*Why Shopify is higher: You trade Amazon's 15% referral fee for team costs (brand, social, creative, ads management, support, 3PL coordination). The margin structure looks better, but fixed costs are dramatically higher.*

---

## Net Profit %

| Net Profit % | Assessment | Notes |
|--------------|------------|-------|
| > 15% | ✅ Excellent | Rare and valuable |
| 10-15% | ✅ Healthy | Strong business |
| 5-10% | ⚠️ Acceptable | Typical for growth-mode |
| 0-5% | ⚠️ Warning | Thin margins, vulnerable |
| < 0% | 🔴 Loss | Fix upstream (don't optimize net profit directly) |

> **Never diagnose net profit directly.** It's a symptom, not a disease. Walk the waterfall to find where the leak is.

---

## Inventory Thresholds

### Months of Supply

| Months | Status | Action |
|--------|--------|--------|
| < 1 | 🔴 Stockout risk | Emergency reorder if A/B grade |
| 1-2 | ⚠️ Low | Reorder within 1 week |
| 2-4 | ✅ Healthy | Monitor |
| 4-6 | ⚠️ Overstocked | Promotion plan required |
| 6-12 | 🔴 Severe overstock | Aggressive liquidation |
| > 12 | 🛑 Dead stock | Write off, remove, liquidate |

*Context modifier: Adjust for lead time. If China = 90 days, then 3 months isn't overstocked — it's minimum safety stock.*

### SKU Kill Thresholds

Kill a SKU when:
- Optimal reorder cycle exceeds 365 days
- CM% < 15% AND velocity in bottom quartile
- Storage fees exceed contribution margin
- 12+ months supply with no velocity improvement after promotions

---

## Cash Thresholds

### Cash Floor Calculation

```
Hard Floor = (Monthly Fixed Costs × 2) + Next Inventory Order Deposit
Soft Floor = Hard Floor × 1.15 to 1.25
```

### Distribution Safety Rules

Before any owner distribution:
1. Cash balance after distribution ≥ soft floor
2. Next 4 weeks cash flow forecasted positive
3. No inventory POs due within 30 days that would breach floor
4. Tax reserve fully funded (20% of CM or 40% of net profit)

---

## Returns Thresholds

| Returns % | Assessment | Notes |
|-----------|------------|-------|
| < 2% | ✅ Excellent | Strong product-market fit |
| 2-5% | ✅ Healthy | Normal range |
| 5-8% | ⚠️ Elevated | Investigate listing accuracy, quality |
| > 8% | 🔴 Problem | Product issue or listing misrepresentation |

*Category note: Apparel runs higher (10-15%+ is common). Adjust expectations.*

---

*Last updated: 2026-02-05*
