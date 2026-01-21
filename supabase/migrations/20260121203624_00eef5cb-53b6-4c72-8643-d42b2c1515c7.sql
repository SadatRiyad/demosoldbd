-- 1) Roles enum
create type public.app_role as enum ('admin', 'moderator', 'user');

-- 2) Profiles (separate from roles; no roles stored here)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read/update their own profile
create policy "Profiles: users can read own"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "Profiles: users can insert own"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Profiles: users can update own"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 3) user_roles (separate table; avoids privilege escalation)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- 4) Security definer role check (prevents recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Users can view their own roles; admins can manage
create policy "User roles: users can read own"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

create policy "User roles: admins can read all"
on public.user_roles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "User roles: admins can insert"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "User roles: admins can update"
on public.user_roles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "User roles: admins can delete"
on public.user_roles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 5) Brand/site content settings (single-tenant)
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'sold.bd',
  brand_tagline text not null default 'Bangladesh’s Flash Deals Marketplace',
  header_kicker text not null default 'Live drops • Limited stock',
  hero_h1 text not null default 'Get it Before it’s Sold — Bangladesh’s Flash Deals Marketplace',
  hero_subtitle text not null default 'Limited-stock drops from local sellers. Miss it, it’s gone forever.',
  whatsapp_phone_e164 text not null default '+8801700000000',
  whatsapp_default_message text not null default 'Hi sold.bd! I want early access and updates about upcoming flash drops.',
  next_drop_at timestamptz,
  -- JSON for flexible sections (features list, social proof quotes, footer copy, etc.)
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Public can read site settings
create policy "Site settings: public read"
on public.site_settings
for select
to anon, authenticated
using (true);

-- Only admins can modify
create policy "Site settings: admins insert"
on public.site_settings
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Site settings: admins update"
on public.site_settings
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Site settings: admins delete"
on public.site_settings
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 6) Early access email capture (optional)
create table if not exists public.early_access_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  -- prevent spam duplicates
  unique (email)
);

alter table public.early_access_signups enable row level security;

-- Anyone can insert (email capture), nobody can read except admins
create policy "Early access: public insert"
on public.early_access_signups
for insert
to anon, authenticated
with check (char_length(email) <= 255);

create policy "Early access: admins read"
on public.early_access_signups
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 7) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- 8) Storage buckets for uploads
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('brand', 'brand', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('deals', 'deals', true)
on conflict (id) do nothing;

-- Storage policies (RLS on storage.objects)
-- Public read for all three buckets
create policy "Storage: public read avatars"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Storage: public read brand"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'brand');

create policy "Storage: public read deals"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'deals');

-- Authenticated users can upload/update/delete ONLY their own avatar path: <user_id>/...
create policy "Storage: users upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Storage: users update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Storage: users delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin-only write access for brand + deals assets
create policy "Storage: admins upload brand"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'brand' and public.has_role(auth.uid(), 'admin'));

create policy "Storage: admins update brand"
on storage.objects
for update
to authenticated
using (bucket_id = 'brand' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'brand' and public.has_role(auth.uid(), 'admin'));

create policy "Storage: admins delete brand"
on storage.objects
for delete
to authenticated
using (bucket_id = 'brand' and public.has_role(auth.uid(), 'admin'));

create policy "Storage: admins upload deals"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'deals' and public.has_role(auth.uid(), 'admin'));

create policy "Storage: admins update deals"
on storage.objects
for update
to authenticated
using (bucket_id = 'deals' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'deals' and public.has_role(auth.uid(), 'admin'));

create policy "Storage: admins delete deals"
on storage.objects
for delete
to authenticated
using (bucket_id = 'deals' and public.has_role(auth.uid(), 'admin'));