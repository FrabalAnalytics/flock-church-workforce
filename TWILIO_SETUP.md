# WhatsApp delivery setup

Flock sends proactive care messages through approved Twilio Content templates.
Free-form WhatsApp messages are not used because these automated messages can
be sent outside the 24-hour customer-service window.

## 1. Apply the queue upgrade

Re-run `supabase/schema.sql` in the Supabase SQL Editor. This adds the
`processing` delivery state and the service-role-only atomic queue claim RPC.

## 2. Create two approved Twilio templates

Create and submit these templates in Twilio Content Template Builder. Keep the
variable order aligned with the integration:

- Soft message: variable `1` is the worker name; variable `2` is the department.
- Urgent message: variable `1` is the worker name; variable `2` is the department.

Suggested wording:

```text
Hi {{1}}, we missed you at church and wanted to check that you're doing well.
Your {{2}} team hopes to see you soon. — TREM
```

```text
Hi {{1}}, we have missed you at several services and wanted to reach out
personally. Please let your {{2}} leader know how you are doing. You are
important to us. — TREM
```

Copy the approved `HX...` Content SIDs into the corresponding environment
variables.

## 3. Configure server secrets

Copy the server-side variables from `.env.example` into `.env.local` for local
testing and into the production hosting environment. Never expose the Supabase
secret key or Twilio Auth Token with a `NEXT_PUBLIC_` prefix.

`NEXT_PUBLIC_APP_URL` must be the exact public HTTPS origin Twilio calls, because
Twilio webhook signature validation includes the complete callback URL.

## 4. Schedule queue processing

Invoke this endpoint periodically with the cron secret:

```text
GET /api/cron/followups
Authorization: Bearer <CRON_SECRET>
```

The dispatcher claims at most 25 queued events atomically, rechecks worker
consent and phone availability, sends the approved template, and records the
Twilio Message SID.

Twilio delivery callbacks are sent to `/api/twilio/status`. The callback route
validates `X-Twilio-Signature` before updating delivery state.
