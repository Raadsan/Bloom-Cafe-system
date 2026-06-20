import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { persistMenuImageUrl } from '../src/utils/menuImageStorage.js';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.menuitem.findMany({
    select: { id: true, name: true, imageUrl: true },
  });

  let migrated = 0;
  for (const item of items) {
    if (!item.imageUrl?.startsWith('data:')) continue;
    const persisted = await persistMenuImageUrl(item.imageUrl, item.id);
    if (persisted) {
      await prisma.menuitem.update({
        where: { id: item.id },
        data: { imageUrl: persisted },
      });
      migrated += 1;
      console.log(`  ${item.name} -> ${persisted}`);
    }
  }

  console.log(`\nMigrated ${migrated} menu image(s) to /uploads/menu/`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
