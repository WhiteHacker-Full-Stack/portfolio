/**
 * Creates or resets the single admin account without touching any other data.
 * Production uses this instead of `db:seed`, which wipes the database and
 * fills it with demo content.
 *
 *   ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run db:admin
 */
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import '../src/env.js';
import { prisma } from '../src/prisma.js';

const username = process.env.ADMIN_USERNAME?.trim();
if (!username) {
  console.error('ADMIN_USERNAME .env faylda koʻrsatilmagan.');
  process.exit(1);
}

// A generated password is safer than a placeholder that never gets changed.
const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD ?? randomBytes(15).toString('base64url');

const passwordHash = await bcrypt.hash(password, 12);
await prisma.adminUser.upsert({
  where: { username },
  update: { passwordHash },
  create: { username, passwordHash },
});
await prisma.$disconnect();

console.log(`Admin tayyor: ${username}`);
if (generated) {
  console.log(`Parol (faqat shu safar koʻrsatiladi): ${password}`);
}
