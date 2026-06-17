import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || '';
  if (!url) return url;

  // Remote/shared MySQL often has very low max_connections.
  // Keep the dev pool tiny so nodemon restarts do not exhaust the server.
  const isDev = process.env.NODE_ENV !== 'production';
  const defaultLimit = isDev ? '1' : '5';

  const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  if (!params.has('connection_limit')) params.set('connection_limit', defaultLimit);
  if (!params.has('pool_timeout')) params.set('pool_timeout', '30');

  const base = url.split('?')[0];
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  });
}

const prisma = globalForPrisma.prisma;

process.on('beforeExit', async () => {
  await prisma.$disconnect().catch(() => {});
});

export default prisma;
