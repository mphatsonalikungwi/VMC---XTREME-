-- VMC XTREME FITNESS — production Supabase schema
-- Browser clients use only the publishable key. Secrets remain in Supabase Edge Functions.

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  gender text,
  phone_number text not null,
  emergency_contact text,
  membership_tier text,
  session_type text,
  payment_channel text,
  receipt_reference text,
  payment_status text not null default 'Pending Payment Verification',
  is_admin boolean not null default false,
  account_role text not null default 'member',
  account_status text not null default 'active',
  registration_status text not null default 'Pending Approval',
  membership_amount integer,
  membership_start_date date,
  membership_expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_membership_tier_check check (membership_tier is null or membership_tier in ('Per Day','Per Week','Per Month')),
  constraint profiles_session_type_check check (session_type is null or session_type in ('Single','Double')),
  constraint profiles_payment_channel_check check (payment_channel is null or payment_channel in ('Airtel Money','TNM Mpamba','National Bank','Cash')),
  constraint profiles_payment_status_check check (payment_status in ('Pending Payment Verification','Payment Verified','Payment Rejected')),
  constraint profiles_account_role_check check (account_role in ('member','owner','manager','staff')),
  constraint profiles_account_status_check check (account_status in ('active','inactive','suspended')),
  constraint profiles_registration_status_check check (registration_status in ('Pending Approval','Approved','Rejected'))
);

create table if not exists public.member_memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  membership_tier text not null check (membership_tier in ('Per Day','Per Week','Per Month')),
  session_type text not null check (session_type in ('Single','Double')),
  amount integer not null check (amount >= 0),
  payment_channel text not null check (payment_channel in ('Airtel Money','TNM Mpamba','National Bank','Cash')),
  receipt_reference text,
  payment_status text not null default 'Pending Payment Verification' check (payment_status in ('Pending Payment Verification','Payment Verified','Payment Rejected')),
  registration_status text not null default 'Pending Approval' check (registration_status in ('Pending Approval','Approved','Rejected')),
  membership_status text not null default 'pending' check (membership_status in ('pending','active','expired','cancelled')),
  start_date date,
  expiry_date date,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.member_memberships enable row level security;
revoke all on table public.profiles from anon;
revoke all on table public.member_memberships from anon;
grant select, insert, update on table public.profiles to authenticated;
grant select on table public.member_memberships to authenticated;
grant all on table public.profiles to service_role;
grant all on table public.member_memberships to service_role;

create or replace function private.is_vmc_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true and p.account_status = 'active');
$$;

create or replace function private.vmc_is_dashboard_user()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.account_status = 'active'
      and (p.is_admin = true or p.account_role in ('owner','manager','staff'))
  );
$$;

create or replace function private.handle_vmc_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  role_value text := coalesce(new.raw_user_meta_data ->> 'account_role', 'member');
  tier_value text := nullif(new.raw_user_meta_data ->> 'membership_tier', '');
  session_value text := nullif(new.raw_user_meta_data ->> 'session_type', '');
  payment_value text := nullif(new.raw_user_meta_data ->> 'payment_channel', '');
  amount_value integer := nullif(new.raw_user_meta_data ->> 'membership_amount', '')::integer;
  registration_value text := case when role_value = 'member' then 'Pending Approval' else 'Approved' end;
begin
  insert into public.profiles (
    id, full_name, date_of_birth, gender, phone_number, emergency_contact,
    membership_tier, session_type, payment_channel, receipt_reference, payment_status,
    account_role, account_status, registration_status, membership_amount
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    coalesce(new.raw_user_meta_data ->> 'phone_number', ''),
    nullif(new.raw_user_meta_data ->> 'emergency_contact', ''),
    tier_value, session_value, payment_value,
    nullif(new.raw_user_meta_data ->> 'receipt_reference', ''),
    'Pending Payment Verification', role_value, 'active', registration_value, amount_value
  ) on conflict (id) do update set
    full_name = excluded.full_name,
    phone_number = excluded.phone_number,
    account_role = excluded.account_role,
    registration_status = excluded.registration_status,
    membership_amount = excluded.membership_amount;

  if role_value = 'member' and tier_value is not null and session_value is not null and payment_value is not null then
    insert into public.member_memberships (
      member_id, membership_tier, session_type, amount, payment_channel, receipt_reference,
      payment_status, registration_status
    ) values (
      new.id, tier_value, session_value, coalesce(amount_value, 0), payment_value,
      nullif(new.raw_user_meta_data ->> 'receipt_reference', ''),
      'Pending Payment Verification', 'Pending Approval'
    );
  end if;
  return new;
end;
$$;

create or replace function private.protect_vmc_profile_fields()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' and not (select private.is_vmc_admin()) then
    new.is_admin := old.is_admin;
    new.account_role := old.account_role;
    new.account_status := old.account_status;
    new.registration_status := old.registration_status;
    new.membership_amount := old.membership_amount;
    new.membership_start_date := old.membership_start_date;
    new.membership_expiry_date := old.membership_expiry_date;
    new.payment_status := old.payment_status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.is_vmc_admin() from public;
revoke all on function private.vmc_is_dashboard_user() from public;
revoke all on function private.handle_vmc_new_user() from public;
revoke all on function private.protect_vmc_profile_fields() from public;

drop policy if exists "Members can read their own profile" on public.profiles;
drop policy if exists "Members can create their own profile" on public.profiles;
drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can read their own profile" on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select private.is_vmc_admin()));
create policy "Members can create their own profile" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "Members can update their own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id or (select private.is_vmc_admin()))
with check ((select auth.uid()) = id or (select private.is_vmc_admin()));

drop policy if exists "Members can read own memberships" on public.member_memberships;
drop policy if exists "Admins can manage memberships" on public.member_memberships;
create policy "Members can read own memberships" on public.member_memberships for select to authenticated
using ((select auth.uid()) = member_id or (select private.is_vmc_admin()));
create policy "Admins can manage memberships" on public.member_memberships for all to authenticated
using ((select private.is_vmc_admin()))
with check ((select private.is_vmc_admin()));

drop trigger if exists on_auth_user_created_vmc on auth.users;
create trigger on_auth_user_created_vmc after insert on auth.users
for each row execute function private.handle_vmc_new_user();

drop trigger if exists protect_vmc_profile_fields on public.profiles;
create trigger protect_vmc_profile_fields before update on public.profiles
for each row execute function private.protect_vmc_profile_fields();

create index if not exists profiles_payment_status_idx on public.profiles(payment_status);
create index if not exists profiles_membership_tier_idx on public.profiles(membership_tier);
create index if not exists profiles_role_idx on public.profiles(account_role);
create index if not exists profiles_registration_status_idx on public.profiles(registration_status);
create index if not exists member_memberships_member_id_idx on public.member_memberships(member_id);
create index if not exists member_memberships_payment_status_idx on public.member_memberships(payment_status);
create index if not exists member_memberships_expiry_idx on public.member_memberships(expiry_date);

comment on table public.profiles is 'VMC Xtreme member and staff profiles linked to Supabase Auth.';
comment on table public.member_memberships is 'VMC membership and renewal history; one row per registration or renewal.';
comment on column public.profiles.is_admin is 'Primary VMC administrator flag. Never set from browser code.';
comment on column public.profiles.account_role is 'member, owner, manager or staff. Authorization is enforced server-side.';
