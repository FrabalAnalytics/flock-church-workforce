# Database migrations

`schema.sql` is the readable snapshot of the current database. The authoritative
deployment history now lives in `supabase/migrations`, where files are applied
once in timestamp order by the Supabase CLI.

## Existing production project: one-time baseline

The first migration is an exact copy of the schema already installed in the
production project. Do not push it to that project as an unapplied migration.
Instead, link the repository, confirm the live schema matches `schema.sql`, and
record the baseline as already applied:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list
npx supabase migration repair --linked --status applied 20260719000000
npx supabase migration list
```

`migration repair` only updates Supabase's migration-history table; it does not
execute the baseline SQL or alter application data.

Before repairing the history, use `npx supabase db pull` if the live project has
received SQL changes that are not present in this repository. Review and commit
the generated migration rather than overwriting it.

## Every future database change

1. Create a migration:

   ```powershell
   npx supabase migration new short_change_name
   ```

2. Put only the new forward change in the generated SQL file. Do not edit an
   older migration after it has been applied anywhere.
3. Test it against a disposable local database:

   ```powershell
   npx supabase start
   npx supabase db reset --local
   ```

4. Preview production without changing it:

   ```powershell
   npx supabase db push --linked --dry-run
   ```

5. Back up production, then apply the reviewed migration:

   ```powershell
   npx supabase db push --linked
   ```

6. Update `schema.sql` to remain a current readable snapshot of the resulting
   schema.

Never run `supabase db reset --linked` against production: it deletes the remote
database contents before replaying migrations.

## Migration safety rules

- Prefer additive changes first: add nullable columns, backfill data, then add
  constraints in a later reviewed step.
- Make data migrations deterministic and safe to retry where practical.
- Do not place secrets in migration files.
- Do not make production schema changes directly in the Supabase SQL Editor
  after the baseline. Emergency changes must immediately be captured as a new
  migration.
- Keep development seed data separate from production migrations.
