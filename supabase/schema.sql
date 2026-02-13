-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Alerts Table (replaces Incidents)
create table alerts (
  id uuid default uuid_generate_v4() primary key,
  alert_id text not null, -- External ID (e.g. PagerDuty)
  service text not null,
  severity text not null, -- 'critical', 'warning', 'info'
  message text not null,
  affected_users int,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Commits Table
create table commits (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references alerts(id) on delete cascade not null,
  sha text not null,
  author text not null,
  message text not null,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Log Patterns Table
create table log_patterns (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references alerts(id) on delete cascade not null,
  error_type text not null,
  count int default 1,
  sample_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI Summaries Table
create table ai_summaries (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references alerts(id) on delete cascade not null,
  root_cause text not null,
  confidence float not null, -- 0.0 to 1.0
  recommended_action text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Actions Taken Table
create table actions_taken (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references alerts(id) on delete cascade not null,
  action_type text not null, -- 'rollback', 'scale', 'page', 'logs'
  status text not null, -- 'success', 'failed'
  user_email text,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
