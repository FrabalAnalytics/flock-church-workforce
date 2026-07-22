-- Transactional, validated worker import for Super Admins.

create or replace function public.bulk_import_workers(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  input_row jsonb;
  row_number integer := 0;
  row_count integer;
  inserted_count integer := 0;
  skipped_count integer := 0;
  worker_name text;
  worker_phone text;
  worker_sex text;
  worker_status text;
  worker_department_id uuid;
  worker_joined_at date;
  worker_whatsapp_opt_in boolean;
begin
  if actor_id is null or not public.is_super_admin() then
    raise exception 'Only a super admin can import workers';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'The import payload must be a list of workers';
  end if;

  row_count := jsonb_array_length(p_rows);
  if row_count < 1 or row_count > 500 then
    raise exception 'Import between 1 and 500 workers at a time';
  end if;

  for input_row in select value from jsonb_array_elements(p_rows)
  loop
    row_number := row_number + 1;
    worker_name := nullif(trim(input_row ->> 'full_name'), '');
    worker_phone := nullif(trim(input_row ->> 'phone_number'), '');
    worker_sex := nullif(trim(input_row ->> 'sex'), '');
    worker_status := coalesce(nullif(trim(input_row ->> 'status'), ''), 'Active');

    if worker_name is null or char_length(worker_name) not between 2 and 120 then
      raise exception 'Row %: full_name must contain 2 to 120 characters', row_number;
    end if;
    if worker_phone is not null and char_length(worker_phone) > 40 then
      raise exception 'Row %: phone_number cannot exceed 40 characters', row_number;
    end if;
    if worker_sex is not null and worker_sex not in ('Male', 'Female') then
      raise exception 'Row %: sex must be Male, Female, or blank', row_number;
    end if;
    if worker_status not in ('Active', 'Inactive', 'On Leave') then
      raise exception 'Row %: status must be Active, Inactive, or On Leave', row_number;
    end if;

    begin
      worker_department_id := (input_row ->> 'department_id')::uuid;
    exception when others then
      raise exception 'Row %: department is invalid', row_number;
    end;

    if not exists (
      select 1 from public.departments where id = worker_department_id
    ) then
      raise exception 'Row %: department does not exist', row_number;
    end if;

    begin
      worker_joined_at := coalesce(
        nullif(trim(input_row ->> 'joined_at'), '')::date,
        (now() at time zone 'Africa/Lagos')::date
      );
    exception when others then
      raise exception 'Row %: joined_at must be a valid YYYY-MM-DD date', row_number;
    end;

    if worker_joined_at > (now() at time zone 'Africa/Lagos')::date then
      raise exception 'Row %: joined_at cannot be in the future', row_number;
    end if;

    begin
      worker_whatsapp_opt_in := coalesce(
        (input_row ->> 'whatsapp_opt_in')::boolean,
        false
      );
    exception when others then
      raise exception 'Row %: whatsapp_opt_in must be true or false', row_number;
    end;

    if worker_whatsapp_opt_in and worker_phone is null then
      raise exception 'Row %: phone_number is required for WhatsApp consent', row_number;
    end if;

    if exists (
      select 1 from public.workers
      where department_id = worker_department_id
        and lower(trim(full_name)) = lower(worker_name)
    ) then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    insert into public.workers (
      full_name,
      phone_number,
      sex,
      department_id,
      status,
      joined_at,
      whatsapp_opt_in
    ) values (
      worker_name,
      worker_phone,
      worker_sex,
      worker_department_id,
      worker_status,
      worker_joined_at,
      worker_whatsapp_opt_in
    );
    inserted_count := inserted_count + 1;
  end loop;

  return jsonb_build_object(
    'inserted', inserted_count,
    'skipped', skipped_count,
    'received', row_count
  );
end;
$$;

revoke all on function public.bulk_import_workers(jsonb) from public;
grant execute on function public.bulk_import_workers(jsonb) to authenticated;
