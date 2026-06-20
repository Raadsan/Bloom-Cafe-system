import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Bloom Cafe menu — categories and items from menu spreadsheet */
const MENU_DATA = [
  {
    category: 'Coffee',
    items: [
      { name: 'Espresso', price: 1.5 },
      { name: 'Americano', price: 1.5 },
      { name: 'Cappuccino', price: 2.1 },
      { name: 'Macchiato', price: 2.1 },
      { name: 'Latte', price: 2.1 },
      { name: 'Cortado', price: 2.1 },
      { name: 'Spanish Latte', price: 2.63 },
    ],
  },
  {
    category: 'Tea',
    items: [
      { name: 'Somali Coffee', price: 1.5 },
      { name: 'Somali Tea', price: 1.05 },
      { name: 'Masala Tea', price: 1.5 },
      { name: 'Qaxwa Somali', price: 1.5 },
      { name: 'Dawa Tea', price: 2.1 },
      { name: 'Camel Tea', price: 1.5 },
    ],
  },
  {
    category: 'Ice Coffee',
    items: [
      { name: 'Iced Latte', price: 2.1 },
      { name: 'Iced Matcha', price: 2.9 },
      { name: 'Iced Spanish Latte', price: 2.63 },
      { name: 'Ice Vanilla', price: 2.63 },
      { name: 'Ice Caramel', price: 2.63 },
    ],
  },
  {
    category: 'Iced Tea',
    items: [
      { name: 'Peach Iced Tea', price: 2.98 },
      { name: 'Strawberry Iced Tea', price: 2.9 },
      { name: 'Passion Fruit Iced Tea', price: 2.9 },
      { name: 'Raspberry Iced Tea', price: 2.9 },
      { name: 'Iced Green Apple Tea', price: 2.9 },
    ],
  },
  {
    category: 'Frappe',
    items: [
      { name: 'Caramel Frappe', price: 3.15 },
      { name: 'Chocolate Frappe', price: 3.15 },
      { name: 'Lotus Frappe', price: 4.2 },
      { name: 'Matcha Frappe', price: 3.15 },
      { name: 'Bloom Coffee', price: 3.6 },
      { name: 'Mango Frappe', price: 3.6 },
      { name: 'Oreo Frappe', price: 3.31 },
    ],
  },
  {
    category: 'Mojito',
    items: [
      { name: 'Passion Fruit Mojito', price: 3.15 },
      { name: 'Strawberry Mojito', price: 3.15 },
      { name: 'Mango Mojito', price: 3.15 },
      { name: 'Peach Mojito', price: 3.15 },
    ],
  },
  {
    category: 'Matcha',
    items: [
      { name: 'Ice Matcha', price: 3.15 },
      { name: 'Strawberry Matcha', price: 3.68 },
      { name: 'Mango Matcha', price: 3.68 },
    ],
  },
  {
    category: 'Smoothie',
    items: [
      { name: 'Strawberry Smoothie', price: 3.15 },
      { name: 'Peach Smoothie', price: 3.15 },
      { name: 'Passion Fruit Smoothie', price: 3.15 },
    ],
  },
  {
    category: 'Cake',
    items: [
      { name: 'Basbuuso', price: 3.15 },
      { name: 'Lattoska Cheesecake', price: 3.8 },
      { name: 'Karmel Cake', price: 3.65 },
      { name: 'Donut Cake', price: 2.1 },
      { name: 'Strawberry Cake', price: 3.2 },
      { name: 'Chocolate Cake', price: 3.5 },
      { name: 'Croissant Almond', price: 2.1 },
      { name: 'Cinnamon Roll', price: 2.6 },
      { name: 'Baqlaawa', price: 3.5 },
      { name: 'Red Velvet Cake', price: 3.15 },
      { name: 'Baller', price: 2.15 },
      { name: 'Chocolate Caramel Cake', price: 4.41 },
    ],
  },
  {
    category: 'Extras',
    items: [
      { name: 'Vanilla', price: 0.5 },
      { name: 'Hazelnut', price: 0.5 },
      { name: 'Honey', price: 0.5 },
      { name: 'Caramel', price: 0.5 },
      { name: 'Sprite', price: 0.5 },
      { name: 'Sandwich', price: 3.6 },
      { name: 'Sandwich Quesadilla', price: 3.6 },
      { name: 'Croissant', price: 4.19 },
      { name: 'Malawax iyo Suugo', price: 3.5 },
      { name: 'Caafi', price: 0.25 },
    ],
  },
];

async function clearMenuData() {
  console.log('Clearing existing menu data...');

  await prisma.discountAdvertisementProduct.deleteMany();
  await prisma.menuitembom.deleteMany();
  await prisma.orderitem.deleteMany();
  await prisma.menuitem.deleteMany();
  await prisma.category.deleteMany();

  // Reset MySQL auto-increment so IDs start from 1 again
  await prisma.$executeRawUnsafe('ALTER TABLE menuitem AUTO_INCREMENT = 1');
  await prisma.$executeRawUnsafe('ALTER TABLE category AUTO_INCREMENT = 1');

  console.log('Cleared categories, menu items, and reset IDs to start at 1.');
}

async function seedMenu() {
  let itemCount = 0;

  for (const group of MENU_DATA) {
    const category = await prisma.category.create({
      data: {
        name: group.category,
        isActive: true,
        updatedAt: new Date(),
      },
    });

    for (const item of group.items) {
      await prisma.menuitem.create({
        data: {
          name: item.name,
          price: item.price,
          categoryId: category.id,
          isAvailable: true,
          updatedAt: new Date(),
        },
      });
      itemCount += 1;
    }

    console.log(`  ${group.category}: ${group.items.length} items`);
  }

  return itemCount;
}

async function main() {
  console.log('Bloom Cafe menu seed\n');

  await clearMenuData();
  const count = await seedMenu();

  console.log(`\nDone — ${MENU_DATA.length} categories, ${count} menu items.`);
}

main()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
