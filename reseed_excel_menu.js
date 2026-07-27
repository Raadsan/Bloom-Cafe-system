import fs from 'fs';
import path from 'path';
import prisma from './backend/src/config/db.js';

const baseDir = 'D:/projects/Restaurent/Bloom_cafe/excel_temp/xl';
const sharedXml = fs.readFileSync(path.join(baseDir, 'sharedStrings.xml'), 'utf8');
const siMatches = sharedXml.match(/<si>(.*?)<\/si>/gs) || [];
const strings = siMatches.map(si => {
  const tMatches = si.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
  return tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
});

const sheetXml = fs.readFileSync(path.join(baseDir, 'worksheets/sheet1.xml'), 'utf8');
const rowRegex = /<row r="(\d+)"[^>]*>(.*?)<\/row>/gs;
let match;
const parsedItems = [];

while ((match = rowRegex.exec(sheetXml)) !== null) {
  const rowNum = parseInt(match[1]);
  if (rowNum === 1) continue;
  const rowContent = match[2];
  const cellRegex = /<c r="([A-Z]+)\d+"(?: t="([^"]+)")?[^>]*>(?:<v>(.*?)<\/v>)?/gs;
  let cellMatch;
  const rowData = {};
  while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
    const col = cellMatch[1];
    const type = cellMatch[2];
    const val = cellMatch[3];
    if (val !== undefined) {
      if (type === 's') {
        rowData[col] = strings[parseInt(val)] ?? val;
      } else {
        rowData[col] = val;
      }
    }
  }

  if (Object.keys(rowData).length > 0) {
    const rawName = rowData.A ? (isNaN(rowData.A) ? rowData.A : strings[parseInt(rowData.A)] || rowData.A) : '';
    const rawCat = rowData.D ? (isNaN(rowData.D) ? rowData.D : strings[parseInt(rowData.D)] || rowData.D) : '';
    const name = String(rawName).trim();
    const rawCategory = String(rawCat).trim();
    const price = Math.round((parseFloat(rowData.B || 0) + Number.EPSILON) * 100) / 100;
    const costPrice = Math.round((parseFloat(rowData.C || 0) + Number.EPSILON) * 100) / 100;

    if (name) {
      parsedItems.push({ name, price, costPrice, rawCategory: rawCategory || 'Extras' });
    }
  }
}

function normalizeCategoryName(rawCat) {
  const c = rawCat.trim().toLowerCase();
  if (c === 'coffee') return 'Coffee';
  if (c === 'ice coffee') return 'Ice Coffee';
  if (c === 'matcha') return 'Matcha';
  if (c === 'tea') return 'Tea';
  if (c === 'frappe') return 'Frappe';
  if (c === 'smoothie') return 'Smoothie';
  if (c === 'iced tea') return 'Iced Tea';
  if (c === 'mojito') return 'Mojito';
  if (c === 'cake') return 'Cake';
  if (c === 'waffle' || c === ' waffle') return 'Waffle';
  if (c === 'extras') return 'Extras';
  return rawCat.trim();
}

async function reseed() {
  console.log(`Parsed ${parsedItems.length} menu items from Excel.`);

  // 1. Wipe existing categories and menuitems completely
  console.log('Clearing all existing menu items and categories from database...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE menuitemcomponent;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE menuitembom;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE cartitem;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE discountAdvertisementProduct;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE menuitem;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE category;');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Database tables cleared successfully.');

  // 2. Create Categories
  const categoryNames = Array.from(new Set(parsedItems.map(i => normalizeCategoryName(i.rawCategory))));
  console.log('\nCreating Categories:', categoryNames);

  const categoryMap = new Map();
  for (const catName of categoryNames) {
    const created = await prisma.category.create({
      data: {
        name: catName,
        isActive: true
      }
    });
    categoryMap.set(catName, created.id);
    console.log(`Created Category: "${catName}" (ID: ${created.id})`);
  }

  // 3. Create Menu Items
  console.log('\nCreating Menu Items...');
  let createdCount = 0;
  for (const item of parsedItems) {
    const catName = normalizeCategoryName(item.rawCategory);
    const categoryId = categoryMap.get(catName);

    await prisma.menuitem.create({
      data: {
        name: item.name,
        price: item.price,
        costPrice: item.costPrice > 0 ? item.costPrice : null,
        categoryId: categoryId,
        isAvailable: true,
        isRecommended: false,
        isComposite: false
      }
    });
    createdCount++;
    console.log(`Created [${createdCount}/${parsedItems.length}]: "${item.name}" - $${item.price} (${catName})`);
  }

  console.log('\n========================================');
  console.log(`RE-SEED COMPLETED!`);
  console.log(`Total Categories Created: ${categoryNames.length}`);
  console.log(`Total Menu Items Created: ${createdCount}`);
  console.log('========================================');
}

reseed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
