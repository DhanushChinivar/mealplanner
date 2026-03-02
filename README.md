# mealplanner

## Database commands

- `npm run db:status`: shows Prisma migration state and drift details.
- `npm run db:push`: syncs schema to DB without creating migrations.
- `npm run db:sync:safe`: creates and applies a reconciliation migration without reset by default.

For full drift recovery steps, see [docs/prisma-drift-recovery.md](/Users/dhanushchinivar/Projects/mealplanner/docs/prisma-drift-recovery.md).
