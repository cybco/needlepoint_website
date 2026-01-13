// Script to create admin user
// Run with: npx tsx scripts/create-user.ts

import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcrypt-ts-edge';

const prisma = new PrismaClient();

async function createUser(
  email: string,
  password: string,
  firstName: string,
  role: string = 'admin'
) {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`User already exists: ${email}`);
      // Update password instead
      const hashedPassword = hashSync(password, 12);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log(`Password updated for: ${email}`);
    } else {
      // Create new user
      const hashedPassword = hashSync(password, 12);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          role,
          updatedAt: new Date(),
        },
      });
      console.log(`User created: ${email} (role: ${role})`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Create admin user
createUser('mike@muddyfrog.com', 'Bluepizza22!', 'Mike', 'admin');
