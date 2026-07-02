-- profiles: user extension info
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  department text,
  created_at timestamptz not null default now()
);

-- weekly_reports: weekly work reports
create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  completed_work text not null default '',
  in_progress text not null default '',
  next_week_plan text not null default '',
  issues text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index weekly_reports_user_id_idx on public.weekly_reports (user_id);
create index weekly_reports_week_start_idx on public.weekly_reports (week_start desc);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger weekly_reports_updated_at
  before update on public.weekly_reports
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.weekly_reports enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view own reports"
  on public.weekly_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own reports"
  on public.weekly_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reports"
  on public.weekly_reports for update
  using (auth.uid() = user_id);

create policy "Users can delete own reports"
  on public.weekly_reports for delete
  using (auth.uid() = user_id);
