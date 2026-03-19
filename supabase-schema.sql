-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create the recipes table
create table if not exists public.recipes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  description text,
  category text not null default 'dinner' check (category in ('bakery', 'dinner', 'lunch', 'breakfast', 'dessert', 'snack', 'drink')),
  prep_time integer,
  cook_time integer,
  servings integer,
  ingredients text[] default '{}',
  instructions text[] default '{}',
  notes text,
  is_favorite boolean default false,
  image_url text
);

-- Enable Row Level Security
alter table public.recipes enable row level security;

-- Policy: users can only see their own recipes
create policy "Users can view own recipes" on public.recipes
  for select using (auth.uid() = user_id);

-- Policy: users can insert their own recipes
create policy "Users can insert own recipes" on public.recipes
  for insert with check (auth.uid() = user_id);

-- Policy: users can update their own recipes
create policy "Users can update own recipes" on public.recipes
  for update using (auth.uid() = user_id);

-- Policy: users can delete their own recipes
create policy "Users can delete own recipes" on public.recipes
  for delete using (auth.uid() = user_id);

-- Create an index for faster queries
create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_category_idx on public.recipes(category);
