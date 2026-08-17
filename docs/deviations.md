# Implementation deviations

No product or architecture deviations are currently recorded.

Operational note: local development and automated tests can use an isolated in-memory repository when `OPPSCOUT_DATA_MODE=memory`. Production always requires PostgreSQL through Prisma; the adapter does not change the production data model or API contracts.
