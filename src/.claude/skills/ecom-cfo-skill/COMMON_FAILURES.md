# Common Failure Modes

Patterns I see repeatedly across ecommerce businesses. If you recognize your situation here, you're not alone — and the fix is usually straightforward.

---

## "Profitable on paper, but no cash"

**What it looks like:**
- P&L shows $10K net profit
- Bank account is flat or declining
- Can't take distributions despite "making money"

**Likely causes:**
1. **Inventory timing:** You paid for inventory 60-90 days ago. Profit recognizes COGS when sold; cash left when purchased.
2. **Debt principal payments:** Loan payments hit cash, not P&L. That $5K/month loan payment is invisible on the income statement.
3. **Growth eating cash:** Scaling from $100K to $150K/mo requires buying 50% more inventory BEFORE seeing 50% more revenue.
4. **Amazon holds:** Reserve balances, return allowances, and 14-day payment cycles mean you don't get paid when you "earn" revenue.
5. **Tax timing:** You owe taxes on profit you haven't collected yet.

**The fix:** Run a 13-week cash forecast. Understand CCC. Stop looking at profit as a proxy for cash.

> See [DEFINITIONS.md](DEFINITIONS.md): Cash Conversion Cycle

---

## "COGS swinging wildly month-to-month"

**What it looks like:**
- COGS as % of revenue: 22% → 31% → 18% → 28%
- Margin looks great one month, terrible the next
- Can't trust any other number on the P&L

**Likely causes:**
1. **Inventory purchases hitting expense:** No inventory asset account. COGS = what you bought, not what you sold.
2. **No landed cost method:** Inconsistent treatment of freight, duties, tariffs.
3. **Finaloop or auto-categorization errors:** AI bookkeeping guessing wrong.
4. **Returns processed incorrectly:** Credits not offsetting COGS properly.
5. **No perpetual inventory system:** COGS calculated backward from ending inventory, which is often wrong.

**The fix:** Set up proper inventory accounting. COGS should track units sold × landed cost. Period.

> See [TRIAGE.md](TRIAGE.md): Step 0 — Trust Check

---

## "Ad spend looks fine but CM is collapsing"

**What it looks like:**
- Ad spend % stable at 15-18%
- But contribution margin dropped from 25% to 15% over 12 months
- "We didn't change anything"

**Likely causes:**
1. **Fee creep:** Amazon raised fees 1%+ (they do this every year). That's real margin.
2. **Price compression:** Competitors forced you to lower prices. Fulfillment % goes UP when prices go down.
3. **COGS drift:** Supplier quietly raised prices. Shipping costs crept up. You didn't notice.
4. **Mix shift:** Your high-margin SKUs slowed down. Low-margin SKUs are a bigger share.

**The fix:** Audit every line between gross revenue and CM. The leak is there. Often it's fulfillment + COGS + small fee increases = death by 1,000 cuts.

> See [THRESHOLDS.md](THRESHOLDS.md): Fulfillment % + COGS %

---

## "Shopify gross margin looks amazing, but profit sucks"

**What it looks like:**
- Gross margin: 55-65% (no Amazon referral fee!)
- Net profit: 2% or negative
- "We should be crushing it"

**Likely causes:**
1. **Team sprawl:** You hired 4-6 people to replace what Amazon does for 15%. Brand manager, creative, social, ads person, customer support, ops.
2. **Software creep:** Klaviyo + Attentive + Triple Whale + Gorgias + 12 other tools = $5-10K/month in SaaS.
3. **Ad efficiency:** Meta/Google ads running 25-35% of revenue vs 15% on Amazon.
4. **Returns:** DTC return rates often higher (especially apparel).
5. **3PL complexity:** Multiple warehouses, carrier negotiations, nobody optimizing it.

**The fix:** Calculate OpEx % of revenue. If it's >25% on Shopify, you've built a team that eats your margin advantage. Either cut or scale revenue to leverage the fixed costs.

> See [THRESHOLDS.md](THRESHOLDS.md): OpEx %

---

## "Revenue up, profit down"

**What it looks like:**
- Top line grew 30%
- Bottom line shrank 40%
- Everyone's confused

**Likely causes:**
1. **Volume hiding margin erosion:** Growth feels good but covered up a rotting margin structure.
2. **Promotional dependency:** You grew by discounting. Revenue up, margin % down.
3. **Fixed cost deleveraging:** You hired ahead of revenue, then growth slowed.
4. **Channel mix shift:** Amazon (higher margin) → Shopify (lower margin after OpEx) or vice versa depending on your cost structure.

**The fix:** Stop celebrating revenue. Watch contribution margin trends. A business shrinking at 25% CM is healthier than one growing at 8% CM.

---

## "Can't pay myself despite growth"

**What it looks like:**
- Revenue doubled in 2 years
- Profit exists on paper
- Owner comp: $0 or near-zero

**Likely causes:**
1. **Cash cycle > growth rate:** You're funding inventory for future revenue with today's cash. Forever.
2. **Debt service:** Loans from the growth phase eating all free cash.
3. **No distribution discipline:** Never formalized "pay yourself first" from the cash that does exist.
4. **Tax surprises:** Estimated taxes due, nothing set aside.

**The fix:** Calculate your [cash floor](THRESHOLDS.md#cash-thresholds). Fund it. Set a distribution schedule. Pay yourself BEFORE the next inventory order, not after.

---

## "Amazon suspended my listing and I'm screwed"

**What it looks like:**
- 80%+ of revenue from one SKU or one channel
- Sudden policy change, listing takedown, or account issue
- Revenue goes to zero overnight

**Likely causes:**
1. **Concentration risk:** Never diversified.
2. **No contingency:** Didn't build a DTC hedge or secondary channel.
3. **Compliance gaps:** Cutting corners on listing accuracy, reviews, or restricted products.

**The fix (for next time):** No single SKU >25% of profit. No single channel >70% of profit. Build the hedge before you need it.

---

## "We keep running out of our best sellers"

**What it looks like:**
- A-grade SKUs stockout repeatedly
- Lose rank, lose sales, lose momentum
- "We can't seem to get inventory right"

**Likely causes:**
1. **Cash constraints:** Can't afford to order enough because cash is tied up in slow movers.
2. **Lead time denial:** Ordering based on 30-day lead times when reality is 90+.
3. **No safety stock:** Ordering exactly what you need, no buffer.
4. **Forecasting by gut:** Not using velocity data to project demand.

**The fix:** Grade your SKUs (A/B/C). Prioritize cash toward A-grade reorders. Liquidate C-grade to free up cash. Build 30 days of safety stock on top performers.

> See [THRESHOLDS.md](THRESHOLDS.md): Months of Supply

---

*These patterns repeat across hundreds of businesses. You're not uniquely broken. The fix is usually simpler than you think.*
