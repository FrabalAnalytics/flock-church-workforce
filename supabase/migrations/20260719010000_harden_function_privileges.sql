-- Trigger functions are executed by PostgreSQL triggers. Browser-facing roles
-- do not need direct EXECUTE privileges on them.
revoke all on function public.handle_new_user() from public;
revoke all on function public.protect_profile_privileges() from public;
revoke all on function public.prepare_worker_messaging_preference() from public;
revoke all on function public.prepare_service() from public;
revoke all on function public.prepare_attendance_log() from public;
revoke all on function public.process_worker_absence() from public;
revoke all on function public.resolve_followup_for_unavailable_worker() from public;
