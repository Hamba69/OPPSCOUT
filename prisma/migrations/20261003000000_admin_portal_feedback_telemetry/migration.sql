BEGIN;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
CREATE TYPE "FeedbackCategory" AS ENUM ('idea', 'bug', 'matching_quality', 'speed', 'other');
CREATE TYPE "FeedbackStatus" AS ENUM ('new', 'reviewed', 'planned', 'shipped', 'dismissed');
CREATE TYPE "DeviceClass" AS ENUM ('mobile', 'tablet', 'desktop');
CREATE TYPE "RequestKind" AS ENUM ('api', 'ussd');
CREATE TYPE "VitalMetric" AS ENUM ('LCP', 'INP', 'CLS', 'FCP', 'TTFB');
CREATE TYPE "VitalRating" AS ENUM ('good', 'needs-improvement', 'poor');
CREATE TYPE "MatchRunEngine" AS ENUM ('orbit', 'rules', 'ai');
CREATE TYPE "MatchRunTrigger" AS ENUM ('feed', 'profile_update', 'notification_run', 'api');
CREATE TYPE "UnmatchedKind" AS ENUM ('skill', 'field', 'location', 'interest');
CREATE TYPE "AdminAccessEvent" AS ENUM ('unlock_success', 'unlock_failure', 'export', 'feedback_update');
CREATE TABLE "Feedback" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "category" "FeedbackCategory" NOT NULL,
  "rating" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "contactEmail" TEXT,
  "userId" UUID REFERENCES "UserProfile"("id") ON DELETE SET NULL,
  "visitorHash" TEXT NOT NULL UNIQUE,
  "ipHash" TEXT NOT NULL,
  "deviceClass" "DeviceClass" NOT NULL,
  "appVersion" TEXT,
  "status" "FeedbackStatus" NOT NULL DEFAULT 'new',
  "adminNote" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback" ("status", "createdAt");
CREATE INDEX "Feedback_category_createdAt_idx" ON "Feedback" ("category", "createdAt");
CREATE INDEX "Feedback_ipHash_createdAt_idx" ON "Feedback" ("ipHash", "createdAt");
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "Feedback" FROM anon, authenticated;
GRANT ALL ON "Feedback" TO service_role;
CREATE TABLE "RequestMetric" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "kind" "RequestKind" NOT NULL,
  "route" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "status" INTEGER NOT NULL,
  "ok" BOOLEAN NOT NULL,
  "durationMs" INTEGER NOT NULL
);
CREATE INDEX "RequestMetric_createdAt_idx" ON "RequestMetric" ("createdAt");
CREATE INDEX "RequestMetric_route_createdAt_idx" ON "RequestMetric" ("route", "createdAt");
ALTER TABLE "RequestMetric" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "RequestMetric" FROM anon, authenticated;
GRANT ALL ON "RequestMetric" TO service_role;
CREATE TABLE "WebVitalSample" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "route" TEXT NOT NULL,
  "metric" "VitalMetric" NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "rating" "VitalRating" NOT NULL,
  "deviceClass" "DeviceClass" NOT NULL
);
CREATE INDEX "WebVitalSample_metric_createdAt_idx" ON "WebVitalSample" ("metric", "createdAt");
CREATE INDEX "WebVitalSample_route_metric_idx" ON "WebVitalSample" ("route", "metric");
CREATE INDEX "WebVitalSample_createdAt_idx" ON "WebVitalSample" ("createdAt");
ALTER TABLE "WebVitalSample" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "WebVitalSample" FROM anon, authenticated;
GRANT ALL ON "WebVitalSample" TO service_role;
CREATE TABLE "MatchRun" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" UUID REFERENCES "UserProfile"("id") ON DELETE SET NULL,
  "engine" "MatchRunEngine" NOT NULL,
  "engineVersion" TEXT NOT NULL,
  "trigger" "MatchRunTrigger" NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "candidatesConsidered" INTEGER NOT NULL,
  "gateExcluded" INTEGER NOT NULL,
  "scored" INTEGER NOT NULL,
  "aboveThreshold" INTEGER NOT NULL,
  "topScore" INTEGER,
  "scoreHistogram" JSONB NOT NULL,
  "gateExclusionReasons" JSONB NOT NULL,
  "topMissingFactors" JSONB NOT NULL
);
CREATE INDEX "MatchRun_createdAt_idx" ON "MatchRun" ("createdAt");
CREATE INDEX "MatchRun_engine_createdAt_idx" ON "MatchRun" ("engine", "createdAt");
ALTER TABLE "MatchRun" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "MatchRun" FROM anon, authenticated;
GRANT ALL ON "MatchRun" TO service_role;
CREATE TABLE "UnmatchedTerm" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind" "UnmatchedKind" NOT NULL,
  "term" VARCHAR(80) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "UnmatchedTerm_kind_term_idx" ON "UnmatchedTerm" ("kind", "term");
ALTER TABLE "UnmatchedTerm" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "UnmatchedTerm" FROM anon, authenticated;
GRANT ALL ON "UnmatchedTerm" TO service_role;
CREATE TABLE "AdminAccessLog" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "event" "AdminAccessEvent" NOT NULL,
  "ipHash" TEXT NOT NULL,
  "userAgent" VARCHAR(200) NOT NULL,
  "detail" JSONB NOT NULL
);
CREATE INDEX "AdminAccessLog_createdAt_idx" ON "AdminAccessLog" ("createdAt");
ALTER TABLE "AdminAccessLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "AdminAccessLog" FROM anon, authenticated;
GRANT ALL ON "AdminAccessLog" TO service_role;
CREATE TABLE "MetricRollup" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "day" DATE NOT NULL,
  "metric" TEXT NOT NULL,
  "dimension" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "samples" INTEGER NOT NULL
);
CREATE UNIQUE INDEX "MetricRollup_day_metric_dimension_idx" ON "MetricRollup" ("day", "metric", "dimension");
ALTER TABLE "MetricRollup" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "MetricRollup" FROM anon, authenticated;
GRANT ALL ON "MetricRollup" TO service_role;
CREATE UNIQUE INDEX "Feedback_userId_unique" ON "Feedback" ("userId") WHERE "userId" IS NOT NULL;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_rating_check" CHECK (rating BETWEEN 1 AND 5), ADD CONSTRAINT "Feedback_message_check" CHECK (char_length(message) BETWEEN 10 AND 2000);
ALTER TABLE "UnmatchedTerm" ADD CONSTRAINT "UnmatchedTerm_normalized" CHECK (term = lower(btrim(term)) AND char_length(term) BETWEEN 1 AND 80);
ALTER TABLE "MatchRun" ADD CONSTRAINT "MatchRun_histogram_check" CHECK (jsonb_typeof("scoreHistogram") = 'array' AND jsonb_array_length("scoreHistogram") = 10);

-- Source appended to migration.sql by the implementation; kept as a readable query reference.
CREATE FUNCTION public.admin_data_page(dataset text, options jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE spec jsonb; tbl text; datekey text; sortkey text; direction text; filterkey text; predicate text; source text; result jsonb;
BEGIN
  spec := CASE dataset
    WHEN 'users' THEN '{"table":"UserProfile","date":"createdAt","search":"name","sorts":["name","createdAt","profileCompletenessScore"],"filters":["location","educationLevel","fieldOfStudy","preferredChannel"]}'::jsonb
    WHEN 'organizations' THEN '{"table":"Organization","date":"createdAt","search":"name","sorts":["name","createdAt","verificationStatus"],"filters":["verificationStatus","sector"]}'::jsonb
    WHEN 'opportunities' THEN '{"table":"Opportunity","date":"publicationDate","search":"title","sorts":["title","publicationDate","deadline","status"],"filters":["category","status","source","origin","verificationStatus"]}'::jsonb
    WHEN 'matches' THEN '{"table":"MatchResult","date":"createdAt","search":"userName","sorts":["createdAt","score","userName","opportunityTitle"],"filters":["generatedBy","userId","opportunityId"]}'::jsonb
    WHEN 'saved' THEN '{"table":"SavedOpportunity","date":"createdAt","search":"userId","sorts":["createdAt","status"],"filters":["status","userId"]}'::jsonb
    WHEN 'events' THEN '{"table":"EventLog","date":"timestamp","search":"userId","sorts":["timestamp","eventType"],"filters":["eventType","userId","opportunityId"]}'::jsonb
    WHEN 'notifications' THEN '{"table":"Notification","date":"sentAt","search":"message","sorts":["sentAt","channel","status"],"filters":["channel","status","userId"]}'::jsonb
    WHEN 'feedback' THEN '{"table":"Feedback","date":"createdAt","search":"message","sorts":["createdAt","rating","category","status"],"filters":["category","rating","status","identity"]}'::jsonb
    WHEN 'match-runs' THEN '{"table":"MatchRun","date":"createdAt","search":"engine","sorts":["createdAt","durationMs","topScore"],"filters":["engine","trigger"]}'::jsonb
    WHEN 'unmatched-terms' THEN '{"table":"UnmatchedTerm","date":"lastSeenAt","search":"term","sorts":["count","kind","term","firstSeenAt","lastSeenAt"],"filters":["kind"]}'::jsonb
    WHEN 'request-metrics' THEN '{"table":"RequestMetric","date":"createdAt","search":"route","sorts":["createdAt","durationMs","route","status"],"filters":["kind","route","status"]}'::jsonb
    WHEN 'web-vitals' THEN '{"table":"WebVitalSample","date":"createdAt","search":"route","sorts":["createdAt","value","route","metric"],"filters":["metric","rating","deviceClass","route"]}'::jsonb
    WHEN 'access-log' THEN '{"table":"AdminAccessLog","date":"createdAt","search":"event","sorts":["createdAt","event"],"filters":["event"]}'::jsonb
    ELSE NULL END;
  IF spec IS NULL THEN RAISE EXCEPTION 'Unknown dataset'; END IF;
  tbl := spec->>'table'; datekey := spec->>'date'; sortkey := COALESCE(options->>'sort', datekey);
  IF NOT (spec->'sorts' ? sortkey) THEN sortkey := datekey; END IF;
  direction := CASE WHEN options->>'direction' = 'asc' THEN 'ASC' ELSE 'DESC' END;
  source := format('public.%I r', tbl);
  IF dataset = 'matches' THEN source := '(SELECT m.*, u.name AS "userName", o.title AS "opportunityTitle" FROM public."MatchResult" m JOIN public."UserProfile" u ON u.id=m."userId" JOIN public."Opportunity" o ON o.id=m."opportunityId") r'; END IF;
  IF dataset = 'organizations' THEN source := '(SELECT o.*, (SELECT count(*) FROM public."Opportunity" p WHERE p."organizationId"=o.id) AS "listingCount" FROM public."Organization" o) r'; END IF;
  predicate := format('($1->>''from'' IS NULL OR r.%I >= ($1->>''from'')::date) AND ($1->>''to'' IS NULL OR r.%I < ($1->>''to'')::date + interval ''1 day'') AND (COALESCE($1->>''search'', '''') = '''' OR strpos(lower(COALESCE(r.%I::text, '''')), lower($1->>''search'')) > 0)', datekey, datekey, spec->>'search');
  FOR filterkey IN SELECT jsonb_array_elements_text(spec->'filters') LOOP
    IF filterkey = 'identity' THEN
      predicate := predicate || ' AND (COALESCE($1->''filters''->>''identity'', '''') = '''' OR (($1->''filters''->>''identity'' = ''signed-in'') = (r."userId" IS NOT NULL)))';
    ELSE
      predicate := predicate || format(' AND ($1->''filters''->>%L IS NULL OR r.%I::text = $1->''filters''->>%L)', filterkey, filterkey, filterkey);
    END IF;
  END LOOP;
  EXECUTE format('SELECT count(*) FROM %s WHERE %s', source, predicate) INTO result USING options;
  IF options ? 'cursor' THEN
    predicate := predicate || format(' AND (CASE WHEN $1->''cursor''->''value'' = ''null''::jsonb THEN r.%1$I IS NULL AND r.id > ($1->''cursor''->>''id'')::uuid ELSE r.%1$I IS NULL OR to_jsonb(r.%1$I) %2$s $1->''cursor''->''value'' OR (to_jsonb(r.%1$I) = $1->''cursor''->''value'' AND r.id > ($1->''cursor''->>''id'')::uuid) END)', sortkey, CASE WHEN direction='ASC' THEN '>' ELSE '<' END);
  END IF;
  EXECUTE format('SELECT jsonb_build_object(''total'', $2, ''rows'', COALESCE(jsonb_agg(to_jsonb(p)), ''[]''::jsonb)) FROM (SELECT r.* FROM %s WHERE %s ORDER BY r.%I %s NULLS LAST, r.id ASC LIMIT $3 OFFSET $4) p', source, predicate, sortkey, direction)
    INTO result USING options, result, CASE WHEN options->>'export' = 'true' THEN 1000 ELSE LEAST(100,GREATEST(1,COALESCE((options->>'size')::int,25))) END,
      CASE WHEN options->>'export' = 'true' THEN 0 ELSE GREATEST(0,COALESCE((options->>'page')::int,1)-1)*LEAST(100,GREATEST(1,COALESCE((options->>'size')::int,25))) END;
  RETURN result;
END $$;

CREATE FUNCTION public.admin_write(operation text, payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE x jsonb; t jsonb;
BEGIN
  CASE operation
    WHEN 'feedback_exists' THEN RETURN to_jsonb(EXISTS(SELECT 1 FROM "Feedback" WHERE "visitorHash"=payload->>'visitorHash' OR "userId"=(payload->>'userId')::uuid));
    WHEN 'feedback' THEN
      -- Serialize a shared-network daily allowance; unique constraints handle visitor/user races.
      PERFORM pg_advisory_xact_lock(hashtextextended(payload->>'ipHash', 0));
      IF EXISTS(SELECT 1 FROM "Feedback" WHERE "visitorHash"=payload->>'visitorHash' OR "userId"=(payload->>'userId')::uuid) THEN RAISE unique_violation USING MESSAGE='Feedback already submitted'; END IF;
      IF (SELECT count(*) FROM "Feedback" WHERE "ipHash"=payload->>'ipHash' AND "createdAt">=CURRENT_TIMESTAMP-interval '1 day')>=10 THEN RAISE EXCEPTION 'FEEDBACK_DAILY_LIMIT'; END IF;
      INSERT INTO "Feedback" (category,rating,message,"contactEmail","userId","visitorHash","ipHash","deviceClass","appVersion") VALUES ((payload->>'category')::"FeedbackCategory",(payload->>'rating')::int,payload->>'message',payload->>'contactEmail',(payload->>'userId')::uuid,payload->>'visitorHash',payload->>'ipHash',(payload->>'deviceClass')::"DeviceClass",payload->>'appVersion');
    WHEN 'feedback_update' THEN
      UPDATE "Feedback" SET status=(payload->>'status')::"FeedbackStatus", "adminNote"=payload->>'adminNote', "updatedAt"=CURRENT_TIMESTAMP WHERE id=(payload->>'id')::uuid;
      IF NOT FOUND THEN RAISE EXCEPTION 'FEEDBACK_NOT_FOUND'; END IF;
    WHEN 'request' THEN INSERT INTO "RequestMetric" (kind,route,method,status,ok,"durationMs") VALUES ((payload->>'kind')::"RequestKind",payload->>'route',payload->>'method',(payload->>'status')::int,(payload->>'ok')::boolean,(payload->>'durationMs')::int);
    WHEN 'vitals' THEN
      FOR x IN SELECT * FROM jsonb_array_elements(payload) LOOP INSERT INTO "WebVitalSample" (route,metric,value,rating,"deviceClass") VALUES (x->>'route',(x->>'metric')::"VitalMetric",(x->>'value')::double precision,(x->>'rating')::"VitalRating",(x->>'deviceClass')::"DeviceClass"); END LOOP;
    WHEN 'match_run' THEN
      x := payload->'run';
      INSERT INTO "MatchRun" ("userId",engine,"engineVersion",trigger,"durationMs","candidatesConsidered","gateExcluded",scored,"aboveThreshold","topScore","scoreHistogram","gateExclusionReasons","topMissingFactors") VALUES ((x->>'userId')::uuid,(x->>'engine')::"MatchRunEngine",x->>'engineVersion',(x->>'trigger')::"MatchRunTrigger",(x->>'durationMs')::int,(x->>'candidatesConsidered')::int,(x->>'gateExcluded')::int,(x->>'scored')::int,(x->>'aboveThreshold')::int,(x->>'topScore')::int,x->'scoreHistogram',x->'gateExclusionReasons',x->'topMissingFactors');
      FOR t IN SELECT DISTINCT value FROM jsonb_array_elements(payload->'terms') LOOP
        INSERT INTO "UnmatchedTerm" (kind,term) VALUES ((t->>'kind')::"UnmatchedKind",lower(btrim(left(t->>'term',80)))) ON CONFLICT (kind,term) DO UPDATE SET count="UnmatchedTerm".count+1,"lastSeenAt"=CURRENT_TIMESTAMP;
      END LOOP;
    WHEN 'access' THEN INSERT INTO "AdminAccessLog" (event,"ipHash","userAgent",detail) VALUES ((payload->>'event')::"AdminAccessEvent",payload->>'ipHash',left(payload->>'userAgent',200),payload->'detail');
    ELSE RAISE EXCEPTION 'Unknown operation';
  END CASE;
  RETURN 'null'::jsonb;
END $$;

CREATE FUNCTION public.admin_snapshot(start_at timestamp, end_at timestamp) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
WITH e AS (SELECT * FROM "EventLog" WHERE timestamp >= start_at AND timestamp < end_at),
f AS (SELECT * FROM "Feedback" WHERE "createdAt" >= start_at AND "createdAt" < end_at),
r AS (SELECT * FROM "RequestMetric" WHERE "createdAt" >= start_at AND "createdAt" < end_at),
v AS (SELECT * FROM "WebVitalSample" WHERE "createdAt" >= start_at AND "createdAt" < end_at),
m AS (SELECT * FROM "MatchRun" WHERE "createdAt" >= start_at AND "createdAt" < end_at),
repeat_org AS (SELECT "organizationId",count(*) n FROM "Opportunity" WHERE origin='organization' GROUP BY 1),
h AS (SELECT jsonb_build_object(
 'users',(SELECT count(*) FROM "UserProfile" WHERE "createdAt"<end_at),
 'newUsers',(SELECT count(*) FROM "UserProfile" WHERE "createdAt">=start_at AND "createdAt"<end_at),
 'activeUsers',(SELECT count(DISTINCT "userId") FROM e),
 'completeProfiles',(SELECT count(*) FROM "UserProfile" WHERE "profileCompletenessScore">=80 AND "createdAt"<end_at),
 'opportunities',(SELECT count(*) FROM "Opportunity"),
 'verifiedOpportunities',(SELECT count(*) FROM "Opportunity" WHERE "verificationStatus"='verified'),
 'openVerified',(SELECT count(*) FROM "Opportunity" WHERE "verificationStatus"='verified' AND status IN ('open','closing_soon') AND (deadline IS NULL OR deadline>=end_at)),
 'matches',(SELECT count(*) FROM "MatchResult"),
 'matchesGenerated',COALESCE((SELECT sum(scored) FROM m),0),
 'views',(SELECT count(*) FROM e WHERE "eventType"='view'),
 'saves',(SELECT count(*) FROM e WHERE "eventType"='save'),
 'clicks',(SELECT count(*) FROM e WHERE "eventType"='click'),
 'applyIntents',(SELECT count(*) FROM e WHERE "eventType"='apply_intent'),
 'saved',(SELECT count(*) FROM "SavedOpportunity"),
 'decidedSaves',(SELECT count(*) FROM "SavedOpportunity" s JOIN "Opportunity" o ON o.id=s."opportunityId" WHERE s.status='applied' OR o.deadline<end_at),
 'appliedSaves',(SELECT count(*) FROM "SavedOpportunity" WHERE status='applied'),
 'notifications',(SELECT count(*) FROM "Notification"),
 'delivered',(SELECT count(*) FROM "Notification" WHERE status IN ('sent','delivered')),
 'notificationClicks',(SELECT count(*) FROM e WHERE "eventType"='click' AND metadata->>'source'='notification'),
 'ussdActive',(SELECT count(*) FROM "UserProfile" WHERE "preferredChannel"='ussd' AND id IN (SELECT "userId" FROM e)),
 'postingOrganizations',(SELECT count(*) FROM repeat_org),
 'repeatOrganizations',(SELECT count(*) FROM repeat_org WHERE n>1),
 'feedback',(SELECT count(*) FROM f), 'averageRating',(SELECT avg(rating) FROM f),
 'apiSamples',(SELECT count(*) FROM r WHERE kind='api'), 'apiOk',(SELECT count(*) FROM r WHERE kind='api' AND ok),
 'p95Api',(SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY "durationMs") FROM r WHERE kind='api'),
 'apiErrorRate',(SELECT 100.0*count(*) FILTER(WHERE NOT ok)/NULLIF(count(*),0) FROM r WHERE kind='api'),
 'ussdSamples',(SELECT count(*) FROM r WHERE kind='ussd'), 'ussdOk',(SELECT count(*) FROM r WHERE kind='ussd' AND ok),
 'reviewed',(SELECT count(*) FROM "Opportunity" WHERE "reviewedAt" IS NOT NULL),
 'reviewHours',(SELECT avg(extract(epoch FROM ("reviewedAt"-"publicationDate"))/3600) FROM "Opportunity" WHERE "reviewedAt" IS NOT NULL),
 'fresh',(SELECT count(*) FROM "Opportunity" WHERE CASE WHEN deadline<=end_at THEN status IN ('closed','removed') WHEN "checkedAt"<end_at-CASE WHEN source='scraped' THEN interval '14 days' ELSE interval '30 days' END THEN status='stale' ELSE status IN ('open','closing_soon') END),
 'runs',(SELECT count(*) FROM m), 'aboveThreshold',COALESCE((SELECT sum("aboveThreshold") FROM m),0), 'scored',COALESCE((SELECT sum(scored) FROM m),0),
 'runAverageMs',(SELECT avg("durationMs") FROM m),'runP95Ms',(SELECT percentile_cont(.95) WITHIN GROUP(ORDER BY "durationMs") FROM m), 'candidatesPerRun',(SELECT avg("candidatesConsidered") FROM m),
 'topThreeEngagement',(SELECT count(*) FROM e WHERE "eventType" IN ('save','click','apply_intent') AND CASE WHEN metadata->>'rank' ~ '^[0-9]+$' THEN (metadata->>'rank')::int BETWEEN 1 AND 3 ELSE false END)
) value),
points AS (
 SELECT 'signups'::text AS "group", "createdAt"::date::text label,count(*)::double precision value,count(*)::bigint samples,NULL::double precision p50,NULL::double precision p95,NULL::double precision p99 FROM "UserProfile" WHERE "createdAt">=start_at AND "createdAt"<end_at GROUP BY 2
 UNION ALL SELECT 'active',timestamp::date::text,count(DISTINCT "userId"),count(*),NULL,NULL,NULL FROM e GROUP BY 2
 UNION ALL SELECT 'events:'||"eventType",timestamp::date::text,count(*),count(*),NULL,NULL,NULL FROM e GROUP BY 1,2
 UNION ALL SELECT 'funnel',"eventType"::text,count(*),count(*),NULL,NULL,NULL FROM e GROUP BY 2
 UNION ALL SELECT 'completeness',CASE WHEN "profileCompletenessScore">=80 THEN '80–100' WHEN "profileCompletenessScore">=50 THEN '50–79' ELSE '0–49' END,count(*),count(*),NULL,NULL,NULL FROM "UserProfile" GROUP BY 2
 UNION ALL SELECT 'location',COALESCE(location,'Not recorded'),count(*),count(*),NULL,NULL,NULL FROM "UserProfile" GROUP BY 2
 UNION ALL SELECT 'education',COALESCE("educationLevel",'Not recorded'),count(*),count(*),NULL,NULL,NULL FROM "UserProfile" GROUP BY 2
 UNION ALL SELECT 'field',COALESCE("fieldOfStudy",'Not recorded'),count(*),count(*),NULL,NULL,NULL FROM "UserProfile" GROUP BY 2
 UNION ALL SELECT 'channel',"preferredChannel"::text,count(*),count(*),NULL,NULL,NULL FROM "UserProfile" GROUP BY 2
 UNION ALL SELECT 'languages',l,count(*),count(*),NULL,NULL,NULL FROM "UserProfile",unnest(languages) l GROUP BY 2
 UNION ALL SELECT 'opportunity:type',category,count(*),count(*),NULL,NULL,NULL FROM "Opportunity" GROUP BY 2
 UNION ALL SELECT 'opportunity:status',status::text,count(*),count(*),NULL,NULL,NULL FROM "Opportunity" GROUP BY 2
 UNION ALL SELECT 'opportunity:source',source::text,count(*),count(*),NULL,NULL,NULL FROM "Opportunity" GROUP BY 2
 UNION ALL SELECT 'opportunity:origin',origin::text,count(*),count(*),NULL,NULL,NULL FROM "Opportunity" GROUP BY 2
 UNION ALL SELECT 'opportunity:verification',"verificationStatus"::text,count(*),count(*),NULL,NULL,NULL FROM "Opportunity" GROUP BY 2
 UNION ALL SELECT 'opportunity:freshness',CASE WHEN "checkedAt">=end_at-interval '7 days' THEN 'Checked within 7 days' ELSE 'Older check' END,count(*),count(*),NULL,NULL,NULL FROM "Opportunity" GROUP BY 2
 UNION ALL SELECT 'organization:verification',"verificationStatus"::text,count(*),count(*),NULL,NULL,NULL FROM "Organization" GROUP BY 2
 UNION ALL SELECT 'top:'||e."eventType",o.title,count(*),count(*),NULL,NULL,NULL FROM e JOIN "Opportunity" o ON o.id=e."opportunityId" WHERE e."eventType" IN ('view','save','apply_intent') GROUP BY 1,2
 UNION ALL SELECT 'type:'||e."eventType",o.category,count(*),count(*),NULL,NULL,NULL FROM e JOIN "Opportunity" o ON o.id=e."opportunityId" GROUP BY 1,2
 UNION ALL SELECT 'matchesPerUser',n::text,count(*),count(*),NULL,NULL,NULL FROM (SELECT u.id,count(m.id) n FROM "UserProfile" u LEFT JOIN "MatchResult" m ON m."userId"=u.id GROUP BY u.id) d GROUP BY n
 UNION ALL SELECT 'scores',(LEAST(9,score/10)*10)::text,count(*),count(*),NULL,NULL,NULL FROM "MatchResult" GROUP BY 2
 UNION ALL SELECT 'latency',route,avg("durationMs"),count(*),percentile_cont(.5) WITHIN GROUP(ORDER BY "durationMs"),percentile_cont(.95) WITHIN GROUP(ORDER BY "durationMs"),percentile_cont(.99) WITHIN GROUP(ORDER BY "durationMs") FROM r WHERE kind='api' GROUP BY route
 UNION ALL SELECT 'requests',"createdAt"::date::text,count(*),count(*),NULL,NULL,NULL FROM r WHERE kind='api' GROUP BY 2
 UNION ALL SELECT 'errors',"createdAt"::date::text,100.0*count(*) FILTER(WHERE NOT ok)/NULLIF(count(*),0),count(*),NULL,NULL,NULL FROM r WHERE kind='api' GROUP BY 2
 UNION ALL SELECT 'vitals:'||metric,route,avg(value),count(*),percentile_cont(.5) WITHIN GROUP(ORDER BY value),percentile_cont(.95) WITHIN GROUP(ORDER BY value),percentile_cont(.99) WITHIN GROUP(ORDER BY value) FROM v GROUP BY metric,route
 UNION ALL SELECT 'vitals-device:'||metric,"deviceClass"::text,avg(value),count(*),percentile_cont(.5) WITHIN GROUP(ORDER BY value),percentile_cont(.95) WITHIN GROUP(ORDER BY value),percentile_cont(.99) WITHIN GROUP(ORDER BY value) FROM v GROUP BY metric,"deviceClass"
 UNION ALL SELECT 'vitals-rating:'||metric||':'||"deviceClass",rating::text,count(*),count(*),NULL,NULL,NULL FROM v GROUP BY metric,"deviceClass",rating
 UNION ALL SELECT 'feedback:rating',rating::text,count(*),count(*),NULL,NULL,NULL FROM f GROUP BY rating
 UNION ALL SELECT 'feedback:category',category::text,count(*),count(*),NULL,NULL,NULL FROM f GROUP BY category
 UNION ALL SELECT 'feedback:status',status::text,count(*),count(*),NULL,NULL,NULL FROM f GROUP BY status
 UNION ALL SELECT 'feedback:weekly',date_trunc('week',"createdAt")::date::text,count(*),count(*),NULL,NULL,NULL FROM f GROUP BY 2
 UNION ALL SELECT 'notifications:channel',channel::text,count(*),count(*),NULL,NULL,NULL FROM "Notification" WHERE "sentAt">=start_at AND "sentAt"<end_at GROUP BY channel
 UNION ALL SELECT 'notifications:status',status::text,count(*),count(*),NULL,NULL,NULL FROM "Notification" WHERE "sentAt">=start_at AND "sentAt"<end_at GROUP BY status
 UNION ALL SELECT 'notifications:delivery',channel::text,100.0*count(*) FILTER(WHERE status IN ('sent','delivered'))/NULLIF(count(*),0),count(*),NULL,NULL,NULL FROM "Notification" WHERE "sentAt">=start_at AND "sentAt"<end_at GROUP BY channel
 UNION ALL SELECT 'notifications:daily',"sentAt"::date::text,count(*),count(*),NULL,NULL,NULL FROM "Notification" WHERE "sentAt">=start_at AND "sentAt"<end_at GROUP BY 2
 UNION ALL SELECT 'runs',"createdAt"::date::text,count(*),count(*),NULL,NULL,NULL FROM m GROUP BY 2
 UNION ALL SELECT 'runScores',((j.ordinality-1)*10)::text,sum(j.value::int),sum(j.value::int)::bigint,NULL,NULL,NULL FROM m,jsonb_array_elements_text("scoreHistogram") WITH ORDINALITY j GROUP BY 2
 UNION ALL SELECT 'gates',j.key,sum(j.value::int),sum(j.value::int)::bigint,NULL,NULL,NULL FROM m,jsonb_each_text("gateExclusionReasons") j GROUP BY 2
 UNION ALL SELECT 'missing',j.key,sum(j.value::int),sum(j.value::int)::bigint,NULL,NULL,NULL FROM m,jsonb_each_text("topMissingFactors") j GROUP BY 2
 UNION ALL SELECT 'matchMissing',j->>'label',count(*),count(*),NULL,NULL,NULL FROM "MatchResult",jsonb_array_elements("missingFactors") j GROUP BY 2
 UNION ALL SELECT 'history:'||metric,day::text||' '||dimension,value,samples,NULL,NULL,NULL FROM "MetricRollup" WHERE day>=start_at::date AND day<end_at::date
), ranked AS (SELECT *, row_number() OVER(PARTITION BY "group" ORDER BY CASE WHEN "group" LIKE 'top:%' OR "group" IN ('missing','matchMissing','location','field','languages') THEN value ELSE 0 END DESC,label) rn FROM points)
SELECT jsonb_build_object('headlines',(SELECT value FROM h),'series',COALESCE((SELECT jsonb_agg(to_jsonb(ranked)-'rn' ORDER BY "group",rn) FROM ranked WHERE rn<=400),'[]'::jsonb));
$$;

CREATE FUNCTION public.retain_telemetry(at_time timestamp) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('oppscout_retention',0));
 -- Aggregate and delete in the same transaction. Whole UTC days avoid partial-day overwrites.
 INSERT INTO "MetricRollup" (day,metric,dimension,value,samples)
 SELECT "createdAt"::date,'request:volume',kind||':'||route,count(*),count(*) FROM "RequestMetric" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'request:errors',kind||':'||route,count(*) FILTER(WHERE NOT ok),count(*) FROM "RequestMetric" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'request:mean',kind||':'||route,avg("durationMs"),count(*) FROM "RequestMetric" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'request:p95',kind||':'||route,percentile_cont(.95) WITHIN GROUP(ORDER BY "durationMs"),count(*) FROM "RequestMetric" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'vital:p95',metric||':'||route||':'||"deviceClass",percentile_cont(.95) WITHIN GROUP(ORDER BY value),count(*) FROM "WebVitalSample" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'vital:rating',metric||':'||route||':'||"deviceClass"||':'||rating,count(*),count(*) FROM "WebVitalSample" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'match:runs',engine::text,count(*),count(*) FROM "MatchRun" WHERE "createdAt"<date_trunc('day',at_time)-interval '180 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'match:scored',engine::text,sum(scored),count(*) FROM "MatchRun" WHERE "createdAt"<date_trunc('day',at_time)-interval '180 days' GROUP BY 1,3
 UNION ALL SELECT "createdAt"::date,'match:aboveThreshold',engine::text,sum("aboveThreshold"),count(*) FROM "MatchRun" WHERE "createdAt"<date_trunc('day',at_time)-interval '180 days' GROUP BY 1,3
 ON CONFLICT (day,metric,dimension) DO UPDATE SET value=EXCLUDED.value,samples=EXCLUDED.samples;
 DELETE FROM "RequestMetric" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days';
 DELETE FROM "WebVitalSample" WHERE "createdAt"<date_trunc('day',at_time)-interval '30 days';
 DELETE FROM "MatchRun" WHERE "createdAt"<date_trunc('day',at_time)-interval '180 days';
END $$;
REVOKE ALL ON FUNCTION public.admin_data_page(text,jsonb), public.admin_write(text,jsonb), public.admin_snapshot(timestamp,timestamp), public.retain_telemetry(timestamp) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_data_page(text,jsonb), public.admin_write(text,jsonb), public.admin_snapshot(timestamp,timestamp), public.retain_telemetry(timestamp) TO service_role;
COMMIT;
