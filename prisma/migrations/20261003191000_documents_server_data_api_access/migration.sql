-- Documents and candidate records use server-authorized service-role access,
-- matching the existing repository tables. Remove inherited browser grants;
-- RLS remains enabled without browser policies.
REVOKE ALL PRIVILEGES ON TABLE
  public."StoredDocument",
  public."SeekerAccessLog",
  public."SeekerPipelineEntry"
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public."StoredDocument",
  public."SeekerAccessLog",
  public."SeekerPipelineEntry"
TO service_role;

NOTIFY pgrst, 'reload schema';
