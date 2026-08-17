# Implementation deviations

No product or architecture deviations are currently recorded.

Operational note: local development and automated tests can use an isolated in-memory repository when `OPPSCOUT_DATA_MODE=memory`. Production always requires PostgreSQL through Prisma; the adapter does not change the production data model or API contracts.

Phase 3 clarification: the build guide asks shadow scraping to use a staging table, while the master data-model contract forbids tables beyond the seven canonical entities. Shadow candidates therefore use a private Supabase Storage bucket through a provider-neutral adapter. This preserves zero writes to live `Opportunity` rows and avoids changing the master schema.
