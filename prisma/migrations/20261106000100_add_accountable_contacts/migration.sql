ALTER TABLE "Organization"
ADD COLUMN "accountableContacts" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Organization"
SET "accountableContacts" =
  CASE
    WHEN NULLIF(BTRIM("accountableContact"), '') IS NULL
      AND NULLIF(BTRIM("additionalAccountableContact"), '') IS NULL
      AND NULLIF(BTRIM("additionalAccountableContactPhone"), '') IS NULL
    THEN '[]'::jsonb
    ELSE
      (CASE
        WHEN NULLIF(BTRIM("accountableContact"), '') IS NULL THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('name', "accountableContact", 'phone', ''))
      END)
      ||
      (CASE
        WHEN NULLIF(BTRIM("additionalAccountableContact"), '') IS NULL
          AND NULLIF(BTRIM("additionalAccountableContactPhone"), '') IS NULL
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object(
          'name', COALESCE("additionalAccountableContact", ''),
          'phone', COALESCE("additionalAccountableContactPhone", '')
        ))
      END)
  END;
