# Line-by-Line Audit — Findings & Fixes

This pass reviewed every file in the project (all 66 backend files, all 40
frontend files) line by line, cross-checking model schemas against the
code that uses them, checking every route's auth/role protection, and
verifying every notification/status value actually exists where it's
consumed. Below is what was found, in order of severity, and what was
fixed. Nothing here adds new features — every change restores behavior
the code already clearly intended.

## Confirmed bugs (fixed)

**1. Notification history endpoint crashed on every call.**
`notification.controller.js` referenced `page` and `limit` without ever
reading them from the request — a guaranteed `ReferenceError` on every
single request to `GET /notifications`. Fixed by adding the missing
`const { page, limit } = req.query;` line.
*(Note: no page in the current UI actually calls this endpoint yet, so
this wasn't visible during normal use — but it was broken the moment
anything called it, including the Swagger docs "try it out" button.)*

**2. Removing an accepted student silently failed.**
When a business removes an accepted student before the job start date,
the removal itself saved correctly, but the follow-up notification used
`type: "APPLICATION_REMOVED"`, which wasn't in the `Notification` model's
allowed list. Saving that notification threw a validation error, which
bubbled up and made the *entire request* fail — so the business saw an
error message even though the removal had already gone through. Fixed by
adding `"APPLICATION_REMOVED"` to the model's allowed notification types.

**3. Confirming payment silently failed on the final step.**
Same root cause as #2: once both parties confirm payment,
`payment.controller.js` sends a notification with
`type: "PAYMENT_COMPLETED"`, which also wasn't in the allowed list. This
is the platform's core "we both agree the job is done and paid" moment —
both users would see a failure error right after successfully confirming
payment. Fixed by adding `"PAYMENT_COMPLETED"` to the model.

**4. Password reset email had no way to actually reset your password.**
The reset email contained only the raw token as plain text
(`Your password reset token is abc123...`) with no link. Meanwhile the
reset-password page only reads a token from the page's URL
(`?token=...`) and has no field to type one in manually. So a user who
requested a password reset had no working path to complete it. Fixed by
having the email build and send a real clickable link
(`{CLIENT_URL}/reset-password?token=...`), matching what the frontend
page already expects.

**5. New student/business accounts could silently register in the wrong city.**
If someone typed an address that the geocoding lookup couldn't find
(typo, unusual formatting, etc.), both registration pages quietly fell
back to a hardcoded Bangalore coordinate with no warning — permanently
skewing that person's "jobs near me" matching until they manually fixed
their profile location later. The job-posting page already handled this
correctly (it blocks submission and asks the user to fix the address).
Fixed both registration pages to match that same safe behavior.

## Things noted but *not* changed (by design, or too small to matter)

- A few endpoints use raw strings like `"verified"` instead of importing
  the shared constant — values match correctly today, just a style
  inconsistency, not a bug.
- One admin endpoint (`listAllJobs`) validates its `page`/`limit` input
  slightly less strictly than every other paginated endpoint. It won't
  crash, just less consistent.
- The real-time notification pipeline (backend emits → socket connects →
  frontend stores the data) works correctly end-to-end, but no page in
  the UI actually displays it yet — no bell icon, no toast, no badge.
  This is a genuinely unfinished feature, not a bug — building that UI
  would be new functionality, so it was left as-is per your instruction.
- The business-side "view student profile" modal has a phone/email
  section that can never render, because the public profile endpoint it
  calls doesn't return those fields (possibly intentional privacy
  design). Flagging this for your awareness rather than guessing at
  intent and changing it.

## Verified after every fix

- Backend: every file re-passes a syntax check, `npm audit` still shows
  **0 vulnerabilities**, and the server boots cleanly.
- Frontend: `npm run lint` → **0 errors**, `npm run build` → succeeds.
