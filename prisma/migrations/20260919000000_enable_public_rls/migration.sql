-- Prisma uses the privileged database role. Supabase public API roles have no
-- policies here, so enabling RLS denies direct table access by default.
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Opportunity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MatchResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedOpportunity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventLog" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('UserProfile', 'Organization', 'Opportunity', 'MatchResult', 'Notification', 'SavedOpportunity', 'EventLog')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END
$$;
