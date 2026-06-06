# Stack Research — v2.0 Trust & Scale

## Stack Additions

### Typesense Search

| Package                           | Version | Purpose                                        |
| --------------------------------- | ------- | ---------------------------------------------- |
| `typesense`                       | 3.0.6   | Official JS client (TypeScript types built-in) |
| `typesense-instantsearch-adapter` | latest  | Connects Typesense to InstantSearch UI widgets |

- **Hosting:** Typesense Cloud (~$36/mo) OR self-hosted on small VPS ($5-10/mo Hetzner)
- **Sync strategy:** Firestore `onWrite` triggers → Express webhook → Typesense upsert (eventual consistency, < 5s lag)
- **Index schema:** Per-language collections (`products_tr`, `products_en`, `products_de`, `products_ar`)

### Multi-Currency

| Package              | Version | Purpose                             |
| -------------------- | ------- | ----------------------------------- |
| `exchange-rates-api` | latest  | Daily FX rate fetch (ECB free tier) |
| `stripe` (existing)  | 22.1.1  | Presentment currency + conversion   |

- **FX Strategy:** Cache ECB rates daily in Firestore; use cached rate for display, Stripe rate for actual charge
- **Price storage:** Store base in TRY; compute EUR display with daily rate

### Cross-Border Compliance

- **Stripe Tax:** Auto-calculates VAT based on buyer location; ~0.5% per transaction
- **GPSR:** EU Authorized Representative + product safety doc upload per listing
- **HS Codes:** Static JSON lookup per category in Firestore

### Seller Trust & Fraud Prevention

| Package             | Version | Purpose                              |
| ------------------- | ------- | ------------------------------------ |
| `libphonenumber-js` | latest  | Phone number validation + formatting |
| `twilio`            | latest  | SMS OTP verification                 |
| `sharp` (existing)  | —       | Image metadata + perceptual hashing  |

- **Phone:** Twilio Verify API (~$0.05/SMS) or Firebase Phone Auth
- **Tax ID:** EU VIES API (free SOAP); TR Vergi No format regex
- **Image similarity:** Perceptual hashing to detect duplicate/copied product images

### Automations

| Package      | Version | Purpose                |
| ------------ | ------- | ---------------------- |
| `nodemailer` | latest  | Email sending          |
| `pdfkit`     | latest  | Invoice PDF generation |

- **E-fatura:** TR requires Paraşüt/Logo API or direct e-Belge integration (start with 3rd party)
- **Email:** SendGrid/Mailgun free tier for transactional; Resend for modern API

### Bug Fix

- Firebase Storage rules: add seller UID match or custom claims check

## Integration Points

1. Typesense ↔ Firestore: Express webhook watches product changes → upsert to Typesense
2. FX Rates: Cron fetches ECB rates daily at 16:00 CET → Firestore cache
3. Stripe Tax: Enable in Dashboard; pass `automatic_tax[enabled]=true` on PaymentIntent
4. Twilio Verify: Trigger SMS during seller KYC onboarding step

## What NOT to Add

- **Elasticsearch:** Typesense is lighter, cheaper, better InstantSearch
- **Full ML fraud:** Start with rule-based heuristics; ML pipeline is v3
- **Custom FX engine:** Stripe handles conversion; let provider own rate risk
- **Kafka/RabbitMQ:** Firestore triggers + webhooks sufficient for this scale

## Deferred Stack Decisions

- ML-based fake listing detection → v3
- Custom e-Belge integration → start with Paraşüt/Logo API
- Real-time FX streaming → not needed at this scale
