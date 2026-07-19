# Backup and recovery runbook

This runbook protects Flock's current single-church Supabase database without a
paid backup product. It covers logical exports and safe recovery preparation.

## What this protects

The backup script exports:

- database roles;
- the application schema;
- application table data;
- Supabase migration-history schema and records;
- a SHA-256 integrity manifest.

Supabase's CLI intentionally excludes managed schemas such as Auth and Storage
from its normal dump. Therefore this logical backup does **not** contain Auth
passwords/sessions or Storage objects. It supplements Supabase platform backups;
it is not a complete clone of the hosted project.

Flock currently keeps its durable church data in public database tables and does
not use Supabase Storage. User profiles reference Supabase Auth users, so a full
disaster recovery may require restoring the platform backup or recreating users
before importing profile rows.

## Weekly backup procedure

Prerequisites:

1. The repository is linked with `npx supabase link`.
2. Docker Desktop is available because Supabase CLI database dumps use a
   containerized PostgreSQL toolchain.
3. The operator can supply the database password when requested.
4. The destination is on an encrypted, access-controlled device.

Run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-supabase.ps1
```

The default destination is `.backups/flock-<UTC timestamp>`. That directory is
ignored by Git. A custom destination may be used:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-supabase.ps1 -OutputRoot "E:\Encrypted\FlockBackups"
```

Immediately verify the result using the exact path printed by the backup:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-backup.ps1 -BackupDirectory "E:\Encrypted\FlockBackups\flock-YYYYMMDDTHHMMSSZ"
```

Then update a private copy of the backup register using
`docs/BACKUP_REGISTER_TEMPLATE.md`.

## Schedule and retention

- Run weekly while Flock is in active use.
- Run immediately before and after every production database migration.
- Keep at least four verified weekly backups.
- Keep one verified monthly backup for at least six months.
- Store at least one copy away from the development laptop.
- Never email an unencrypted backup or upload it to a public/shared folder.

Deletion of old backups is deliberately manual. Verify the exact directory and
confirm newer backups exist before removing anything.

## Safe recovery process

Recovery is a controlled incident, not a routine command.

1. Stop schema deployments and record the time and reason for recovery.
2. Preserve the damaged production database; do not reset it.
3. Select a verified backup and run `verify-backup.ps1` again.
4. Create or select a disposable recovery Supabase project.
5. Confirm its PostgreSQL version and required extensions are compatible.
6. Restore into the recovery project only, following Supabase's current official
   backup/restore documentation.
7. Restore or recreate Auth users before profile rows when necessary.
8. Verify row counts, login, roles, RLS, attendance totals, programmes and care
   alerts using test accounts.
9. Obtain explicit approval before directing the application at the recovered
   project.
10. Rotate secrets and update Vercel variables if a new project becomes
    production.

Never use `supabase db reset --linked` on production. It drops remote database
objects and data before replaying migrations.

## Recovery acceptance checks

- A super admin can sign in and sees expected totals.
- A church leader has read-only church-wide access.
- Each department head sees only their own department.
- Pending users cannot enter the workspace.
- Worker, service, attendance and programme row counts match the recorded
  backup or an explained difference.
- One non-production attendance submission succeeds atomically.
- CSV exports complete and contain expected headers and rows.
- No production Twilio messages are sent during testing.

## Quarterly rehearsal

At least quarterly, restore the newest verified backup into a disposable project
or local environment. Record duration, missing prerequisites and discrepancies.
Do not call a backup "recoverable" solely because its files and hashes exist.

Official reference: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
