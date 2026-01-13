// List all users in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { email: true, firstName: true, lastName: true, role: true },
  });
  console.log('Users:', users);
  await prisma.$disconnect();
}

listUsers();
