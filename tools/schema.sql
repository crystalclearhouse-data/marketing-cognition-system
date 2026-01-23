-- Supabase Schema for Marketing Cognition System

-- Signals Table
create table public.signals (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null, -- 'objection', 'question', 'win', 'loss'
  source text not null,
  text text not null,
  url text,
  github_issue_url text,
  clickup_task_url text,
  notion_page_id text
);

-- Experiments Table
create table public.experiments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  hypothesis text not null,
  metric text not null,
  status text default 'proposed',
  start_date date,
  end_date date,
  outcome text,
  github_issue_url text
);

-- Weekly Reports Table
create table public.weekly_reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  week_start_date date,
  signals_count int,
  experiments_active_count int,
  decisions_summary text,
  notion_report_url text
);
