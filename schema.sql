-- VMC XTREME FITNESS — Supabase member database
-- Run this file in the Supabase SQL Editor.

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_membership_tier_check check (membership_tier is null or membership_tier in ('Per Day','Per Week','Per Month')),
  constraint profiles_session_type_check check (session_type is null or session_type in ('Single','Double')),
  constraint profiles_payment_channel_check check (payment_channel is null or payment_channel in ('Airtel Money','TNM Mpamba','National Bank','Cash')),
  constraint profiles_payment_status_check check (payment_status in ('Pending Payment Verification','Payment Verified','Payment Rejected'))
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;
grant select, insert, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

create or replace function public.is_vmc_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true);
$$;

revoke all on function public.is_vmc_admin() from public;
grant execute on function public.is_vmc_admin() to authenticated;

drop policy if exists "Members can read their own profile" on public.profiles;
drop policy if exists "Members can create their own profile" on public.profiles;
drop policy if exists "Members can update their own profile" on public.profiles;

create policy "Members can read their own profile" on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.is_vmc_admin()));

create policy "Members can create their own profile" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "Members can update their own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id or (select public.is_vmc_admin()))
with check ((select auth.uid()) = id or (select public.is_vmc_admin()));

create or replace function public.handle_vmc_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id, full_name, date_of_birth, gender, phone_number, emergency_contact,
    membership_tier, session_type, payment_channel, receipt_reference, payment_status
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    coalesce(new.raw_user_meta_data ->> 'phone_number', ''),
    nullif(new.raw_user_meta_data ->> 'emergency_contact', ''),
    nullif(new.raw_user_meta_data ->> 'membership_tier', ''),
    nullif(new.raw_user_meta_data ->> 'session_type', ''),
    nullif(new.raw_user_meta_data ->> 'payment_channel', ''),
    nullif(new.raw_user_meta_data ->> 'receipt_reference', ''),
    'Pending Payment Verification'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_vmc on auth.users;
create trigger on_auth_user_created_vmc after insert on auth.users
for each row execute function public.handle_vmc_new_user();

create or replace function public.protect_vmc_profile_fields()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not (select public.is_vmc_admin()) then
    new.is_admin := old.is_admin;
    new.payment_status := old.payment_status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_vmc_profile_fields on public.profiles;
create trigger protect_vmc_profile_fields before update on public.profiles
for each row execute function public.protect_vmc_profile_fields();

create index if not exists profiles_payment_status_idx on public.profiles(payment_status);
create index if not exists profiles_membership_tier_idx on public.profiles(membership_tier);

comment on table public.profiles is 'VMC Xtreme member profiles linked to Supabase Auth users.';
comment on column public.profiles.is_admin is 'Server-enforced admin flag; never trust client metadata for authorization.';
