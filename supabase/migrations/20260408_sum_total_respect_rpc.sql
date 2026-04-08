-- RPC function for health-snapshot cron: server-side SUM instead of fetching all rows
CREATE OR REPLACE FUNCTION sum_total_respect()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(total_respect), 0) FROM respect_members;
$$;
