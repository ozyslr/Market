---
phase: 07-reviews-trust
plan: 04
type: summary
requirements: [REV-04]
status: complete
human_verify: pending
---

# 07-04 Summary — Q&A Seller Notifications + Seller-Only Answers

## What was built

Posting a product question now notifies the product's seller via **both** in-app
(`createNotification`) and email (server-resolved), and only that seller (or an
admin) may write the public answer — enforced in Firestore rules.

## Must-Haves — verification

| Truth                                                 | Status | Evidence                                                                                                                                                   |
| ----------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buyer question → seller in-app + email notification   | ✅     | `askQuestion` fires `createNotification(sellerId,'new_question',…)` + fire-and-forget `POST /api/reviews/notify-seller-question` → `sendNewQuestionEmail`. |
| Only the product's seller can write a public answer   | ✅     | `firestore.rules` productQuestions update requires `request.auth.token.sellerId == resource.data.sellerId` or admin. `verify-07-04-rules.mjs`.             |
| Question + seller answer appear on the product page   | ✅     | `QASection`/`QuestionCard` already render questions and answers (answer input gated on `isSeller`; answered state refreshes on answer).                    |
| D-04: seller-only answers + dual-channel notification | ✅     | In-app + email; answers seller-scoped.                                                                                                                     |

## Verification run

- `npx tsc --noEmit` → clean
- `node scripts/verify-07-04-rules.mjs` → OK
- Human checkpoint (Task 3) — **PENDING** user verification in the running app.

## Key files

- Created: `scripts/verify-07-04-rules.mjs`
- Modified: `src/services/notificationService.ts` (+`'new_question'`), `src/types.ts` (`ProductQuestion.sellerId`), `src/services/productQuestionService.ts` (denormalize sellerId + dual notify), `server/routes/reviews.ts` (+`POST /api/reviews/notify-seller-question`), `server/services/emailService.ts` (+`sendNewQuestionEmail`), `server/services/emailTemplates.ts` (+`newQuestionHtml`), `firestore.rules` (productQuestions block), `src/components/layout/NotificationsPanel.tsx` (icon/color for new type)

## Deviations from plan (justified)

1. **`productQuestions` update rule field-guarded.** The plan's seller-or-admin-only update would have broken `voteQuestionHelpful` (any signed-in user updates `helpfulCount`). Added a third clause allowing any signed-in user to update **only if** `sellerId`/`answer`/`answeredBy` are unchanged — preserves helpful-voting while keeping answers seller-only. The required `token.sellerId == resource.data.sellerId` clause is present (and asserted by the verify script).
2. **`QASection.tsx` / `QuestionCard.tsx` not modified** (listed in the plan). They already render answers, gate the answer input on `isSeller`, and refresh answered state after `answerQuestion` — the acceptance criteria were already met, so no change was warranted.
3. **Seller email resolution** tries `sellers/{sellerId}` (email/contactEmail/ownerEmail) then `users/{sellerId}`; the notify endpoint always responds 200 (best-effort) so a missing email never blocks the question (T-07-13).
4. **NotificationsPanel** updated (not in plan) because adding `'new_question'` to the exhaustive `Record<NotificationType,…>` maps was required for the typecheck to pass.

## Self-Check: PASSED (auto tasks) — human-verify pending
