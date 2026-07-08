# Pitfalls Research — v2.0 Trust & Scale

## Multi-Currency

| Risk                                 | Mitigation                                           | Phase |
| ------------------------------------ | ---------------------------------------------------- | ----- |
| FX rate mismatch (display vs charge) | Lock rate 15 min at checkout                         | 13    |
| Decimal/subunit confusion            | Stripe format_amount helpers; centralized formatting | 13    |
| Double conversion (TRY→EUR→TRY)      | Store seller prices in TRY; EUR display-only         | 13    |
| Iyzico only supports TRY             | Force Stripe for EUR checkout                        | 13    |

## Typesense

| Risk                              | Mitigation                                             | Phase |
| --------------------------------- | ------------------------------------------------------ | ----- |
| Firestore sync lag (stale index)  | onWrite trigger + retry + admin re-index button        | 12    |
| Initial bootstrap (10K+ products) | Batch import with cursor pagination + progress bar     | 12    |
| Multi-language analyzer mismatch  | Separate collections per language; native speaker test | 12    |
| Firestore read cost for re-index  | Incremental sync only; use Bundles for initial import  | 12    |

## Cross-Border Compliance

| Risk                          | Mitigation                                             | Phase |
| ----------------------------- | ------------------------------------------------------ | ----- |
| GDPR/KVKK data residency      | Consent checkbox; data retention policy                | 14    |
| GPSR rep liability            | Partner with compliance service (ProductIP)            | 14    |
| Wrong HS code → customs fine  | Manual review first listing per category; TARIC lookup | 14    |
| EU VAT complexity (27 states) | Stripe Tax auto-handles; IOSS for <€150                | 14    |

## Seller Trust & Fraud

| Risk                                       | Mitigation                                       | Phase |
| ------------------------------------------ | ------------------------------------------------ | ----- |
| False positive → legitimate seller blocked | Human-in-the-loop; appeal process                | 15    |
| Phone bypass (virtual numbers)             | Twilio lookup API detect VOIP                    | 15    |
| Complaint abuse (competitors)              | Require order proof; rate limit; admin review    | 15    |
| VIES API downtime blocks registration      | Async validation; allow reg, validate background | 15    |
| Image hash false positive (stock photos)   | Whitelist known stock URLs; human review         | 15    |

## Automations

| Risk                          | Mitigation                                            | Phase |
| ----------------------------- | ----------------------------------------------------- | ----- |
| Email lands in spam           | SPF/DKIM/DMARC; SendGrid/Mailgun; warm domain         | 16    |
| E-fatura complexity (e-Belge) | Start with Paraşüt/Logo API; defer direct integration | 16    |
| Wrong tax ID on invoice       | Validate all data before generation; audit trail      | 16    |

## Firebase Storage Fix

| Risk                      | Mitigation                                             | Phase |
| ------------------------- | ------------------------------------------------------ | ----- |
| Over-permissive rules fix | UID match: request.auth.uid == resource.metadata.owner | 12    |

## Prevention Strategy

- Human-in-the-loop for ALL bans/blocks (FRD)
- Incremental sync, not full scan (SRC)
- Rate-lock at checkout, not display (CUR)
- 3rd-party APIs for complex compliance (CROSS/AUT)
- Async validation with background fallback (FRD)
- Manual UAT for final sign-off (UAT)
