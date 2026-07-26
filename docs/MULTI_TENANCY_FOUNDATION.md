# Multi-Tenancy Foundation

This repository is still operating as a single-church workspace today, but the
database now has a safe starting point for a hierarchical model:

- `churches` represents the tenant.
- `branches` represents HQ and branch sites within one church.
- `church_settings_by_church` holds church-wide settings per tenant.
- `branch_settings` holds branch-level overrides, including HQ.
- `profiles` now carries `church_id` and `branch_id` so user scope can be
  introduced incrementally.
- Core operational records now carry church and branch ownership columns so
  attendance, follow-up, programmes, and first-timer data can be filtered by
  branch without changing the current single-church workflow yet.

## Current rule

The live application should continue to use the existing single-church
workflow until the app-level queries and RLS policies are updated to read from
the new tenant columns.

## Safe migration path

1. Backfill the existing church into the new `churches` table.
2. Treat the current site as the HQ branch.
3. Move app reads to `church_id` and `branch_id` gradually.
4. Add tenant filters to the remaining operational tables one migration at a
   time.
5. Leave the legacy singleton settings table in place until the app no longer
   depends on it.

This approach avoids destructive changes and keeps the current test and
production data intact while the multi-tenant model is adopted.
