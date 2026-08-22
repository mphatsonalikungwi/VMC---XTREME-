-- VMC Xtreme: security, onboarding and renewal-choice migration
alter table public.profiles add column if not exists must_change_password boolean not null default false;
alter table public.profiles add column if not exists security_action_required boolean not null default false;
alter table public.profiles add column if not exists security_notice text;
alter table public.profiles add column if not exists security_notice_created_at timestamptz;
alter table public.profiles add column if not exists security_notice_read_at timestamptz;
alter table public.profiles add column if not exists rules_accepted boolean not null default false;
alter table public.profiles add column if not exists rules_version text;
create index if not exists profiles_attention_idx on public.profiles(account_role,security_action_required,must_change_password);

create or replace function private.handle_vmc_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  role_value text := coalesce(new.raw_user_meta_data ->> 'account_role','member');
  tier_value text := nullif(new.raw_user_meta_data ->> 'membership_tier','');
  session_value text := nullif(new.raw_user_meta_data ->> 'session_type','');
  payment_value text := nullif(new.raw_user_meta_data ->> 'payment_channel','');
  amount_value integer := nullif(new.raw_user_meta_data ->> 'membership_amount','')::integer;
  registration_value text := case when role_value='member' then 'Pending Approval' else 'Approved' end;
  rules_value boolean := coalesce((new.raw_user_meta_data ->> 'rules_accepted')::boolean,false);
  rules_ver text := nullif(new.raw_user_meta_data ->> 'rules_version','');
begin
  insert into public.profiles(id,full_name,date_of_birth,gender,phone_number,emergency_contact,membership_tier,session_type,payment_channel,receipt_reference,payment_status,account_role,account_status,registration_status,membership_amount,must_change_password,security_action_required,rules_accepted,rules_version)
  values(new.id,coalesce(new.raw_user_meta_data ->> 'full_name',''),nullif(new.raw_user_meta_data ->> 'date_of_birth','')::date,nullif(new.raw_user_meta_data ->> 'gender',''),coalesce(new.raw_user_meta_data ->> 'phone_number',''),nullif(new.raw_user_meta_data ->> 'emergency_contact',''),tier_value,session_value,payment_value,nullif(new.raw_user_meta_data ->> 'receipt_reference',''),'Pending Payment Verification',role_value,'active',registration_value,amount_value,false,false,rules_value,rules_ver)
  on conflict(id) do update set full_name=excluded.full_name,phone_number=excluded.phone_number,account_role=excluded.account_role,registration_status=excluded.registration_status,membership_amount=excluded.membership_amount,membership_tier=excluded.membership_tier,session_type=excluded.session_type,payment_channel=excluded.payment_channel,rules_accepted=excluded.rules_accepted,rules_version=excluded.rules_version;
  return new;
end; $$;

create or replace function private.vmc_protect_profile_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'role','');
  system_job text := coalesce(current_setting('vmc.system_job',true),'');
begin
  if system_job <> 'true' and jwt_role <> 'service_role' and not (select private.is_vmc_admin()) then
    new.is_admin:=old.is_admin;
    new.account_role:=old.account_role;
    new.account_status:=old.account_status;
    new.registration_status:=old.registration_status;
    new.membership_amount:=old.membership_amount;
    new.membership_start_date:=old.membership_start_date;
    new.membership_expiry_date:=old.membership_expiry_date;
    new.payment_status:=old.payment_status;
    new.must_change_password:=old.must_change_password;
    new.security_action_required:=old.security_action_required;
    new.security_notice:=old.security_notice;
    new.security_notice_created_at:=old.security_notice_created_at;
    new.security_notice_read_at:=old.security_notice_read_at;
    new.rules_accepted:=old.rules_accepted;
    new.rules_version:=old.rules_version;
  end if;
  new.updated_at:=now();
  return new;
end; $$;
