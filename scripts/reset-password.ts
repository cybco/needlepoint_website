// Script to reset user password
// Run with: npx tsx scripts/reset-password.ts

import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcrypt-ts-edge';

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = hashSync(newPassword, 12);

    // Update the password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    console.log(`Password reset successfully for: ${email}`);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetPassword('mike@muddyfrog.com', 'Bluepizza22!');
