# KAB Pharma security audit (October 2026)

Written for the store owner. It covers every server endpoint, the sign-in
and session code, admin and staff access, orders and payment, uploads, the
database files in this project, and the browser security settings.

## What this audit could and could not see

- **Seen:** all the code in this project.
- **Not seen:** your live Supabase database (its rules, functions and
  settings), your Supabase and Vercel dashboards, and the third-party
  services (Sham Cash, NABDA, Resend, OpenAI). Nothing was tested against
  the live site, and no build could be run in the audit workspace.

So the code fixes below are real, but the database part is delivered as two
scripts you run yourself: one that closes doors, one that reports what is
still open. **Until the check script says OK on every row, treat the
database as unverified.**

## Fixed in this update

### 1. The database may accept requests that skip the website (most serious)

The public database key is inside every visitor's browser. Anything that
key is allowed to do can be done by anyone, without your website. The
function that creates orders, the customer list function and several tables
are not defined in this project's files, so their permissions could not be
seen. With Supabase's default permissions a visitor could create a "paid"
order at any price, list customers, or upload files.

**Fix:** `supabase/migrations/202610060005_security_hardening.sql` removes
every permission the website does not use (visitor writes, visitor reads of
private tables, running server-only functions, visitor uploads).
`supabase/audit/security_check.sql` then reports what is left.
Both were tested on a local database set up with default permissions: the
attacks worked before the script and were all blocked after it, while the
admin and the server kept working.

### 2. Sham Cash: 100 SYP less than the total was accepted

A transfer was accepted if it was within 100 SYP of the order total, in
either direction. Anyone who noticed could pay 100 SYP less on every order.
Old transfers could also be attached to a new order.

**Fix:** the transfer must now cover the full total (up to 100 SYP more is
still accepted) and be at most 72 hours old. The three numbers are at the
top of `lib/commerce-config.ts` if you want different limits.

### 3. Email sign-up could be hijacked

- Someone could re-submit the sign-up form with a victim's email and their
  own password while the victim was still entering the code. The victim's
  code then confirmed an account with the attacker's password.
  **Fix:** the code is accepted only together with the password that
  sign-up was started with.
- Someone could attach another person's phone number to their own email
  account. If that person later signed in with a WhatsApp code, both shared
  one account and its orders.
  **Fix:** email accounts store the number in a different form from phone
  accounts, and a WhatsApp code no longer opens an email account.
- The name typed at sign-up was placed in the email as raw HTML, so your
  domain could be used to send links of the sender's choosing.
  **Fix:** the name is escaped.
- Verification codes came from a predictable random source, the limit on
  sending emails was per server (easy to get around), the endpoints
  answered requests from other websites, and database error text was shown
  to the visitor. **Fixed.**
- Email accounts had no "forgot password". **Added** (code by email).

### 4. The assistant could be used without signing in

The chat is shown to signed-in customers only, but its address answered
anyone. A script could have sent it questions all day at your cost.
**Fix:** it now needs a signed-in customer, limited to 40 messages an hour.

### 5. Coupon codes could be guessed without an account

The price endpoint said whether a coupon code exists, to anyone, without
limit. **Fix:** coupons are checked for signed-in customers only, with a
limit on tries.

### 6. Anyone could look up whether a phone number is restricted

The checkout page asked the database directly. **Fix:** the server answers,
only for the signed-in customer's own number.

### 7. Smaller fixes

- An old endpoint that let a signed-in visitor test Sham Cash transaction
  numbers and amounts was still reachable though no page used it. Retired.
- Staff sign-in is now also limited per account, not only per device.
- Email sign-in no longer reveals that an address is registered but
  unverified unless the password is right.
- Two profile endpoints now refuse requests from other websites.
- The archive job's secret is compared in constant time.
- Deleting a customer account also removes orders linked by account id.

## What you need to do

In this order:

1. Deploy this update (run `npm run check` first).
2. Run `supabase/migrations/202610060005_security_hardening.sql` in the
   Supabase SQL editor. **After** the deploy, not before.
3. Run `supabase/audit/security_check.sql`. Send any row that is not OK.
4. **Supabase > Authentication > Sign In / Providers: switch off "Allow new
   users to sign up".** Customers do not use Supabase sign-in; only admins
   do. With sign-ups open, anyone can create a Supabase login.
5. Give the admin login a long unique password and switch on two-step
   verification for the Supabase and Vercel accounts themselves.
6. Change the account deletion code from `0000` (Admin > Users).
7. In Vercel > Environment Variables, check that every name in
   `.env.example` has a value for Production. `CUSTOMER_SESSION_SECRET` and
   `STAFF_SESSION_SECRET` must be two different long random texts.
8. If any key was ever pasted into a chat, a screenshot or a shared file
   (Supabase service role key, Sham Cash token, NABDA key, Resend key,
   OpenAI key), create a new one and replace it.
9. Vercel preview deployments use the same database as the live site.
   Keep previews protected (Vercel > Settings > Deployment Protection).
10. Check that database backups are on for your Supabase plan.
11. On your computer run `npm audit`. This audit could not reach the
    package registry.

## Checked and found sound

- Orders are priced on the server from database prices; nothing the
  browser sends about prices, fees or discounts is trusted.
- A Sham Cash transaction number can be used for one order only.
- Customers can read and cancel only their own orders.
- Customer and staff sessions are signed, HttpOnly, Secure cookies; staff
  accounts are re-checked as active on every request.
- Customer and staff passwords are stored as bcrypt hashes.
- Admin pages and admin endpoints verify the admin on the server.
- Drivers and delivery companies go through the server; they cannot reach
  the database directly.
- Reviews need a delivered purchase. Review and chat text is shown as
  plain text, never as HTML.
- No secret keys are in the project files or in code sent to browsers.
- Sign-in, codes, orders, reviews and the assistant are rate-limited in
  the database, shared by all servers.
- The site sends strict transport, anti-framing and content-type headers
  and a content security policy.

## Known limits, not changed

These are trade-offs rather than holes. None blocks publishing.

- **Sessions last 30 days** and are not ended when a password is changed.
  Changing this signs every customer out, so it was left for you to decide.
- **The content security policy allows inline scripts**, which the site's
  framework needs. A stricter policy is a larger change.
- **Any active delivery company sees all accepted orders**, by design.
- **Someone can annoy a known phone number**: request codes for it (at
  most 6 an hour) or lock its password sign-in for 15 minutes with wrong
  guesses. The WhatsApp-code sign-in still works for the owner.
- **Email sign-up tells whether an email is already registered.** Normal
  for sign-up forms.
- **A restricted customer can come back with another number.**
- **Stock is a yes/no flag**, not a count, so two customers can order the
  last unit.
- **Sham Cash currency is not checked**, only the amount. If your account
  can receive more than one currency, tell me which codes it uses.
