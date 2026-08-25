ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_reference text;

UPDATE public.profiles SET payment_reference = receipt_reference WHERE payment_reference IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_management_username_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL AND account_role IN ('owner','manager','staff');

CREATE INDEX IF NOT EXISTS profiles_management_phone_idx
  ON public.profiles (phone_number_normalized)
  WHERE account_role IN ('owner','manager','staff') AND phone_number_normalized IS NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_member_emergency_contact_required;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_member_emergency_contact_required
  CHECK (account_role <> 'member' OR (emergency_contact IS NOT NULL AND btrim(emergency_contact) <> ''));

-- The live database contains the complete function definition deployed by the
-- migration runner. Keep the schema change here as the source-of-truth record;
-- deployment is handled through Supabase migrations.
