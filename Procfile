web: sh -c "(test -d backend && cd backend || true) && npx prisma db push --accept-data-loss && npx ts-node --transpile-only prisma/seed.ts && npx ts-node --transpile-only src/server.ts"
