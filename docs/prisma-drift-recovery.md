# Prisma Drift Recovery (Non-Destructive First)

Use this when `npx prisma migrate dev` says schema drift was detected and wants a reset.

## Why this happens

- A migration file was changed after it was already applied.
- Database schema was changed manually or with `db push`.
- Migration history table and actual schema are no longer aligned.

## Safe recovery flow

1. Ensure your `.env` has the correct `DATABASE_URL`.
2. Check migration state:

```bash
npm run db:status
```

3. Run safe sync:

```bash
npm run db:sync:safe
```

What this does:
- Generates a new reconciliation migration from current DB to `prisma/schema.prisma`.
- Blocks if destructive SQL is detected (drop/truncate/delete).
- Applies SQL without resetting.
- Marks that migration as applied.

## If destructive SQL is expected

Review generated SQL first in `prisma/migrations/<timestamp>_reconcile_dev_schema/migration.sql`.

Then run:

```bash
ALLOW_DESTRUCTIVE=1 npm run db:sync:safe
```

Only do this after backing up data.

## Going forward

- Do not edit old migration files after applying them.
- For shared dev DBs, prefer:

```bash
npm run db:push
```

- Use `migrate dev` when you are creating migration history intentionally.
