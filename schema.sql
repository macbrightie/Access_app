-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Create files table
create table public.files (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  file_path text not null,
  edit_token text not null,
  is_public boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for faster lookups
create index idx_files_slug on public.files(slug);
create index idx_files_edit_token on public.files(edit_token);

-- Storage Bucket Setup
-- Note: You must create a public bucket named 'files' in the Supabase Dashboard -> Storage

-- Storage Policies
-- 1. Allow public read access to the 'files' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'files' );

-- 2. Allow upload (insert) for anyone (since we don't have auth, but we want to allow uploads from server actions or client if simplified)
-- Ideally, we use Service Role key for uploads in Server Actions to bypass RLS, 
-- but for MVP client-side upload (if used), we need this. 
-- However, strict requirements say "No Accounts", so we will likely use Server Actions with Service Role or a public insert policy.
-- Let's define a policy that allows insert for anyone for now, or rely on Backend logic.
-- For this MVP, we will use Server Actions with the libraries, so we might not strictly need RLS on Storage if we use Service Role.
-- But standard practice:
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'files' );

-- 3. Allow update/delete only via backend (Service Role) or if we implement RLS logic based on token (harder without Auth).
-- We'll rely on the application logic (Server Actions) using Service Role to handle replacements/deletes.
