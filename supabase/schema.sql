-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Incidents Table (matches code usage)
create table incidents (
  id uuid default uuid_generate_v4() primary key,
  title text not null, -- Added to match code
  description text not null, -- Added to match code
  status text default 'open',
  service text,
  repo_name text, -- Added for filtering
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Commits Table
create table commits (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references incidents(id) on delete cascade not null, -- references incidents now
  sha text not null,
  author text not null,
  message text not null,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Log Patterns Table
create table log_patterns (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references incidents(id) on delete cascade not null,
  error_type text not null,
  count int default 1,
  sample_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI Summaries Table
create table ai_summaries (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references incidents(id) on delete cascade not null,
  root_cause text not null,
  confidence float not null, -- 0.0 to 1.0
  recommended_action text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Actions Taken Table
create table actions_taken (
  id uuid default uuid_generate_v4() primary key,
  alert_id uuid references incidents(id) on delete cascade not null,
  action_type text not null, -- 'rollback', 'scale', 'page', 'logs'
  status text not null, -- 'success', 'failed'
  user_email text,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Incident Reports Table (used in route.ts)
create table incident_reports (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references incidents(id) on delete cascade not null,
  summary text,
  suggested_actions jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Incident Context Table (used in route.ts)
create table incident_context (
    id uuid default uuid_generate_v4() primary key,
    incident_id uuid references incidents(id) on delete cascade not null,
    source_type text not null, -- 'github', 'logs', 'jira'
    content jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
