# Implementation deviations

No product or architecture deviations are currently recorded.

Operational note: local development and automated tests can use an isolated in-memory repository when `OPPSCOUT_DATA_MODE=memory`. Production always requires PostgreSQL through Prisma; the adapter does not change the production data model or API contracts.

Phase 3 clarification: the build guide asks shadow scraping to use a staging table, while the master data-model contract forbids tables beyond the seven canonical entities. Shadow candidates therefore use a private Supabase Storage bucket through a provider-neutral adapter. This preserves zero writes to live `Opportunity` rows and avoids changing the master schema.

Phase 4 schema correction: the USSD menu explicitly requires persisted notification frequency, but the Phase 1 end-state `UserProfile` field list omitted it. A `notificationFrequency` field and enum were added to the existing entity; no new entity or frozen interface changed.

Production-readiness schema correction: the matching specification requires enforceable age gates, but the planned `UserProfile` fields omitted a date from which age can be verified. A nullable `dateOfBirth` field was added to the existing entity so age-gated opportunities can pass or fail deterministically instead of permanently excluding every user.
