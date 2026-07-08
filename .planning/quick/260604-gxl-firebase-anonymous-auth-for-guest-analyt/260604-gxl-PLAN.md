---
phase: 260604-gxl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/context/AuthContext.tsx
  - firestore.rules
autonomous: false
requirements:
  - ANON-AUTH-01
user_setup:
  - service: firebase-anonymous-auth
    why: 'signInAnonymously throws auth/operation-not-allowed unless the provider is enabled in the console'
    dashboard_config:
      - task: 'Enable Anonymous sign-in provider'
        location: 'Firebase Console → Authentication → Sign-in method → Anonymous → Enable'

must_haves:
  truths:
    - 'Guest (unauthenticated) visitors can write to the `events` collection without console errors'
    - 'Anonymous users are NOT treated as real logged-in users: Navbar shows login/register, ProtectedRoute gates still block'
    - 'Anonymous users cannot write to sensitive collections (users, orders, carts, reviews, etc.)'
    - 'Real (non-anonymous) signed-in users retain full write access to collections they owned before'
    - 'npm run lint passes with no new type errors'
  artifacts:
    - path: 'src/context/AuthContext.tsx'
      provides: 'signInAnonymously on null user; isAnonymous exposed in context; user (UserProfile) stays null for anon'
      contains: 'signInAnonymously'
    - path: 'firestore.rules'
      provides: 'isFullUser() helper; all sensitive collections use isFullUser(); events keeps isSignedIn()'
      contains: 'isFullUser'
  key_links:
    - from: 'src/context/AuthContext.tsx'
      to: 'firebase/auth'
      via: 'signInAnonymously(auth)'
      pattern: 'signInAnonymously'
    - from: 'firestore.rules'
      to: 'events/{eventId}'
      via: 'allow create: if isSignedIn()'
      pattern: 'isSignedIn'
    - from: 'firestore.rules'
      to: 'users/{uid}'
      via: 'allow create: if isFullUser()'
      pattern: 'isFullUser'
---

<objective>
Enable Firebase Anonymous Auth so guest visitors always have a Firebase uid and can write
analytics events to Firestore, while hardening firestore.rules to prevent anonymous users
from writing to any sensitive collection.

Purpose: Guest analytics events are currently lost because isSignedIn() requires a real
auth session. signInAnonymously gives every visitor a uid, satisfying the rule, without
granting any real account privileges.

Output:

- AuthContext wires signInAnonymously on the null-user path; exposes isAnonymous flag
- firestore.rules adds isFullUser() helper; all sensitive collection writes require it
- events collection keeps isSignedIn() (accepts anonymous)
  </objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260604-gxl-firebase-anonymous-auth-for-guest-analyt/260604-gxl-PLAN.md
@.planning/STATE.md
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: Enable Anonymous sign-in in Firebase Console</name>
  <action>
    Without this step, signInAnonymously(auth) throws auth/operation-not-allowed and nothing works.
    No code can do this — it is a console-only action.

    Steps:
    1. Open https://console.firebase.google.com/
    2. Select your project (Benim Olan / Mercora)
    3. Navigate to Authentication → Sign-in method
    4. Find "Anonymous" in the provider list
    5. Toggle it to Enabled
    6. Click Save

  </action>
  <verify>The Anonymous provider row shows "Enabled" in the Firebase Console sign-in method list.</verify>
  <done>Anonymous auth provider is enabled in Firebase Console. Reply "done" to continue.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: AuthContext — wire signInAnonymously and expose isAnonymous</name>
  <files>src/context/AuthContext.tsx</files>
  <action>
    Import signInAnonymously from 'firebase/auth' (add to the existing import line).

    Add isAnonymous: boolean to AuthContextType (after firebaseUser).

    In the onAuthStateChanged callback, change the null-user else branch:
    Instead of just setUser(null), check if there is already an anonymous user to avoid
    a re-trigger loop: if (!fUser) { signInAnonymously(auth).catch(() => setLoading(false)); return; }
    The return prevents setLoading(false) from firing early — it will fire on the next
    onAuthStateChanged callback (when the anon user arrives).

    For the fUser branch, add an early-return guard for anonymous users:
    if (fUser.isAnonymous) { setUser(null); setLoading(false); return; }
    This ensures no Firestore getDoc/setDoc is called for anon users and user (UserProfile)
    stays null, so every consumer treating user != null as "logged in" continues to work correctly.

    Compute isAnonymous from firebaseUser state:
    const isAnonymous = firebaseUser?.isAnonymous ?? false;

    Add isAnonymous to the AuthContext.Provider value object.

    Export shape: AuthContextType gains `isAnonymous: boolean` between `firebaseUser` and `loading`.

    Do NOT change login(), loginWithEmail(), registerWithEmail(), logout(), or refreshUser().
    The logout() flow calls signOut(auth), which triggers onAuthStateChanged(null) which will
    re-fire signInAnonymously — that is correct and intentional (restores guest state after logout).

    Constraint: Do not create a UserProfile doc for anonymous users. The isAnonymous guard
    before the Firestore block ensures this.

  </action>
  <verify>
    <automated>cd "O:/AI/E-tic 2026" && npm run lint 2>&1 | tail -20</automated>
  </verify>
  <done>
    npm run lint passes. AuthContext exports isAnonymous. firebaseUser is set for anon users,
    user (UserProfile) remains null for anon users. No Firestore reads/writes occur for anon users.
  </done>
</task>

<task type="auto">
  <name>Task 3: firestore.rules — add isFullUser() and harden all sensitive collections</name>
  <files>firestore.rules</files>
  <action>
    Add isFullUser() helper directly after isSignedIn() in the HELPERS section:

      function isFullUser() {
        return isSignedIn() && request.auth.token.firebase.sign_in_provider != 'anonymous';
      }

    Then apply the following substitutions throughout the file. The table below lists
    every isSignedIn() occurrence that must change to isFullUser(). isSignedIn() calls
    that stay unchanged are listed as KEEP.

    BLAST-RADIUS TABLE (every isSignedIn() in the file, line by line):

    | Collection              | Existing rule clause                                    | New clause      | Reason |
    |-------------------------|---------------------------------------------------------|-----------------|--------|
    | users / get             | isSignedIn() && (getUserId() == uid || isAdmin())       | isFullUser() && (getUserId() == uid || isAdmin()) | anon must not read own (nonexistent) doc |
    | users / create          | isSignedIn() && uid == getUserId()                      | isFullUser() && uid == getUserId() | no profile doc for anon |
    | users / update          | isSignedIn() && (...)                                   | isFullUser() && (...) | same |
    | sellers / create        | isSignedIn() && (...)                                   | isFullUser() && (...) | KYC-gated |
    | sellers / update        | isSignedIn() && (...)                                   | isFullUser() && (...) | |
    | orderSets / read        | isSignedIn() && (...)                                   | isFullUser() && (...) | orders are real-user data |
    | orderSets / create      | isSignedIn() && (...)                                   | isFullUser() && (...) | |
    | commissionRules / read  | isSignedIn()                                            | isFullUser()    | seller-facing data |
    | dataDeletionRequests / create | isSignedIn()                                      | isFullUser()    | requires identity |
    | carts / *               | isSignedIn() && userId == getUserId()                   | isFullUser() && userId == getUserId() | cart is PII-adjacent |
    | mail / create           | isSignedIn()                                            | isFullUser()    | email requires identity |
    | events / create         | isSignedIn()                                            | KEEP isSignedIn() | THIS IS THE POINT — anon can write |
    | chat_sessions / read    | isSignedIn() && (...)                                   | isFullUser() && (...) | messages are private |
    | chat_sessions / create  | isSignedIn() && (...)                                   | isFullUser() && (...) | |
    | chat_sessions / update  | isSignedIn() && (...)                                   | isFullUser() && (...) | |
    | chat_sessions/messages / read | isSignedIn()                                      | isFullUser()    | |
    | chat_sessions/messages / create | isSignedIn()                                    | isFullUser()    | |
    | activity_logs / create  | isSignedIn()                                            | isFullUser()    | ties to real user action |
    | orders / read           | isSignedIn() && (...)                                   | isFullUser() && (...) | order history = PII |
    | orders / create         | isSignedIn() && (...)                                   | isFullUser() && (...) | |
    | sellerBalances / read   | isSignedIn() && (...)                                   | isFullUser() && (...) | financial data |
    | payoutSchedules / read  | isSignedIn() && (...)                                   | isFullUser() && (...) | financial data |
    | payoutRequests / read   | isSignedIn() && (...)                                   | isFullUser() && (...) | financial data |
    | pushTokens / create     | isSignedIn() && userId == getUserId()                   | isFullUser() && userId == getUserId() | device token tied to real user |
    | pushTokens / update     | isSignedIn() && userId == getUserId()                   | isFullUser() && userId == getUserId() | |
    | pushTokens / delete     | isSignedIn() && userId == getUserId()                   | isFullUser() && userId == getUserId() | |
    | pushMessages / create   | isSignedIn()                                            | isFullUser()    | notification data |
    | reviews / update        | isSignedIn() && (...)                                   | isFullUser() && (...) | review ownership |
    | follows / create        | isSignedIn()                                            | isFullUser()    | social graph = real user |
    | follows / delete        | isSignedIn()                                            | isFullUser()    | |

    NOTE: reviews / create already requires isBuyer() (a custom claim). isBuyer() calls isSignedIn()
    internally. Anonymous users will never have the buyer custom claim so they are already blocked.
    For defense-in-depth, change to isFullUser() && isBuyer() — update isBuyer() helper or the rule.
    Simplest: change the rule to `allow create: if isFullUser() && isBuyer();`.

    After edits, run firebase emulators:exec if the project has a rules test harness.
    Otherwise document the manual verification in the verify block.

  </action>
  <verify>
    <automated>cd "O:/AI/E-tic 2026" && npm run lint 2>&1 | tail -5</automated>
    <human-check>
      Manual rules behavior check (run if Firebase Emulator Suite is available):

      1. Start emulator: firebase emulators:start --only firestore
      2. As anonymous user (sign_in_provider = 'anonymous'), attempt:
         a. addDoc(collection(db, 'events'), {...})  → MUST SUCCEED (200)
         b. addDoc(collection(db, 'orders'), {...})  → MUST FAIL (permission-denied)
         c. addDoc(collection(db, 'users'), {...})   → MUST FAIL (permission-denied)
      3. As real (email/Google) user, attempt:
         a. addDoc(collection(db, 'events'), {...})  → MUST SUCCEED
         b. addDoc(collection(db, 'orders'), {userId: uid, ...}) → MUST SUCCEED
      4. Verify console shows no permission-denied errors on a guest page load
         that calls trackEvent().
    </human-check>

  </verify>
  <done>
    firestore.rules contains isFullUser() helper. All sensitive collection writes use
    isFullUser(). events collection still uses isSignedIn(). npm run lint passes.
    Manual/emulator verification confirms anonymous write to events succeeds and
    anonymous write to orders/users fails.
  </done>
</task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary                     | Description                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Anonymous client → Firestore | Untrusted anonymous uid; write access intentionally limited to events only      |
| Real user client → Firestore | Trusted uid with custom claims (role, sellerId); full access per existing rules |

## STRIDE Threat Register

| Threat ID | Category               | Component                                 | Disposition | Mitigation                                                                                            |
| --------- | ---------------------- | ----------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| T-gxl-01  | Elevation of Privilege | firestore.rules isSignedIn() → anon write | mitigate    | isFullUser() applied to all sensitive collections                                                     |
| T-gxl-02  | Spoofing               | Anonymous uid used to fake user identity  | accept      | user (UserProfile) is null for anon; all business logic gates on UserProfile                          |
| T-gxl-03  | Denial of Service      | Anon users flood events collection        | accept      | events are write-only analytics; no business logic depends on them; rate limiting via Firebase quotas |
| T-gxl-04  | Information Disclosure | Anon user reads own nonexistent users doc | mitigate    | users/get changed to isFullUser()                                                                     |
| T-gxl-SC  | Tampering              | npm/pip/cargo installs                    | accept      | no new packages installed in this plan                                                                |

</threat_model>

<verification>
1. `npm run lint` passes (tsc --noEmit + ESLint) — no new type errors from AuthContextType change
2. AuthContext: firebaseUser is non-null for anonymous visitors; user (UserProfile) is null
3. Navbar/ProtectedRoute: unchanged — they gate on `user` (UserProfile), which stays null for anon
4. analyticsService.trackEvent() succeeds for anonymous visitors (no permission-denied in console)
5. An anonymous user attempting to create an order/cart/review receives permission-denied
6. A real signed-in user retains full access to all collections they had before
</verification>

<success_criteria>

- Guest page loads produce zero Firestore permission-denied errors in the browser console
- trackEvent() writes reach the events collection for anonymous visitors
- Login/register UI elements are unaffected (still visible to anonymous users)
- All protected routes (seller dashboard, account, checkout) still gate correctly
- firestore.rules contains isFullUser() and every sensitive collection write uses it
- npm run lint exits 0
  </success_criteria>

<output>
Create `.planning/quick/260604-gxl-firebase-anonymous-auth-for-guest-analyt/260604-gxl-SUMMARY.md` when done.
</output>
