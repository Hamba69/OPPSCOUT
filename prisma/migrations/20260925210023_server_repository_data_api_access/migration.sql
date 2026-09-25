-- Runtime repository calls use the Supabase HTTPS Data API with a server-only
-- service-role key because outbound PostgreSQL connections are unavailable in
-- the app runtime. Keep browser roles denied and RLS enabled on every table.
REVOKE ALL PRIVILEGES ON TABLE
  public."Organization",
  public."UserProfile",
  public."Opportunity",
  public."MatchResult",
  public."SavedOpportunity",
  public."Notification",
  public."EventLog"
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public."Organization",
  public."UserProfile",
  public."Opportunity",
  public."MatchResult",
  public."SavedOpportunity",
  public."Notification",
  public."EventLog"
TO service_role;

NOTIFY pgrst, 'reload schema';
