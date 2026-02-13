-- Add repo_name column to incidents table to allow filtering by repository
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS repo_name text;
