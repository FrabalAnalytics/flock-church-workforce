# Flock security checklist

Run this checklist before each production release and after any authorization
or database-policy change.

## Provider accounts

- MFA is enabled for GitHub, Vercel, Supabase, Twilio and the domain registrar.
- At least two trusted owners have recovery access; ordinary work uses
  lower-privilege accounts.
- No secret is stored in Git, screenshots, documentation or a `NEXT_PUBLIC_`
  variable.
- Old, shared or exposed credentials have been rotated.

## Environment configuration

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only
  browser-visible Supabase values.
- `SUPABASE_SECRET_KEY` (or the legacy service-role key), `CRON_SECRET` and
  Twilio credentials exist only in server-side Vercel environment variables.
- `NEXT_PUBLIC_APP_URL` is the exact HTTPS production origin. It is used for
  authentication redirects and signed Twilio callback URLs.
- Preview and production environments do not accidentally share privileged
  credentials.

## Manual authorization test matrix

Use separate test accounts and non-sensitive test records.

| Test | Super admin | Church leader | Department head | Pending |
| --- | --- | --- | --- | --- |
| View all workers | Allow | Allow | Own department only | Deny |
| Add or edit workers | Allow | Deny | Deny | Deny |
| Manage user roles | Allow | Deny | Deny | Deny |
| Edit profile identity/contact | Allow | Deny | Deny | Deny |
| Submit department attendance | Deny | Deny | Own department only | Deny |
| View attendance | All | All | Own department only | Deny |
| Record congregation attendance | Allow | Deny | Deny | Deny |
| View congregation attendance | Allow | Allow | Deny | Deny |
| Edit programmes/templates | Allow | Deny | Deny | Deny |
| View published programmes | Allow | Allow | Allow | Deny |
| Create/revoke programme share links | Allow | Deny | Deny | Deny |
| View a valid shared programme | Allow | Allow | Allow | Token only |
| Export worker report PDF | All | All | Own department only | Deny |
| Export congregation report PDF | Allow | Allow | Deny | Deny |
| Resolve care alerts | Allow | Deny | Own department only | Deny |

Anonymous programme access must remain limited to the
`get_shared_service_programme` function. Keep direct anonymous table grants
revoked. Verify that disabled, replaced, expired, malformed, draft, and unknown
tokens all return no programme data.

For department-head testing, create heads in two departments and confirm that
changing IDs or query-string filters never exposes or modifies the other
department's workers, attendance records or care alerts.

## Database review

- RLS is enabled on every table exposed through the `public` schema.
- Every new table has explicit policies and grants before deployment.
- Every `security definer` function uses an empty or fixed `search_path`, checks
  the caller where needed, and has the narrowest possible EXECUTE grant.
- New foreign-key columns used by RLS or filters have supporting indexes.
- Audit events remain read-only to application users and new high-risk tables
  have an approved audit trigger or a documented reason for exclusion.
- A migration dry run has been reviewed before `db push`.

## Incident response

If a secret or personal-data export is exposed:

1. Revoke or rotate the affected credential immediately.
2. Preserve relevant Vercel and Supabase logs.
3. Determine which records and users were affected.
4. Restore secure operation before resuming normal access.
5. Record what happened and the preventive change made afterward.
