import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;
  const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  if (!params.has('connection_limit')) params.set('connection_limit', '10');
  if (!params.has('pool_timeout')) params.set('pool_timeout', '20');
  const base = url.split('?')[0];
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
