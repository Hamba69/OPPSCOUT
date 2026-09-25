-- Keep RLS enabled and grant the server-only service role only the table access
-- needed for profile setup and organization-role lookup over Supabase HTTPS.
GRANT USAGE ON SCHEMA public TO service_role;
REVOKE ALL PRIVILEGES ON TABLE public."Organization" FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public."UserProfile" FROM anon, authenticated;
GRANT SELECT ON TABLE public."Organization" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."UserProfile" TO service_role;

NOTIFY pgrst, 'reload schema';
