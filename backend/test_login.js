import prisma from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function testLogin() {
  try {
    const email = 'muzamil@gmail.com';
    const password = 'password123'; // Assuming this is the password

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.email);
    console.log('Role:', user.role.name);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

  } catch (error) {
    console.error('Test Login Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
