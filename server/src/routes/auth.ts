import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../env.js';
import { ah } from '../lib/http.js';
import { prisma } from '../prisma.js';

export const authRouter = Router();

/**
 * Bitta kirish oynasi ikkalasiga xizmat qiladi: kiritilgan ma'lumot admin hisobiga
 * mos kelsa admin sifatida, aks holda oddiy foydalanuvchi sifatida kiradi.
 * Shu sababli tashqaridan qaralganda "admin" degan narsa ko'rinmaydi.
 */
const credentials = z.object({
  username: z.string().trim().min(3).max(40),
  password: z.string().min(6).max(200),
});

const registration = credentials.extend({
  name: z.string().trim().min(1).max(60),
});

function signUserToken(user: { id: string; username: string }) {
  return jwt.sign({ sub: user.id, username: user.username, kind: 'user' }, env.jwtSecret, {
    expiresIn: '30d',
  });
}

authRouter.post(
  '/register',
  ah(async (req, res) => {
    const parsed = registration.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Ism, foydalanuvchi nomi (3+) va parol (6+) toʻgʻri toʻldirilishi kerak',
      });
    }
    const { username, password, name } = parsed.data;

    // Admin nomi bilan ro'yxatdan o'tishga yo'l qo'ymaymiz.
    const [takenByUser, takenByAdmin] = await Promise.all([
      prisma.siteUser.findUnique({ where: { username } }),
      prisma.adminUser.findUnique({ where: { username } }),
    ]);
    if (takenByUser || takenByAdmin) {
      return res.status(409).json({ error: 'Bu foydalanuvchi nomi band' });
    }

    const user = await prisma.siteUser.create({
      data: { username, name, passwordHash: await bcrypt.hash(password, 10), lastLoginAt: new Date() },
    });
    res.status(201).json({ token: signUserToken(user), name: user.name, username: user.username });
  }),
);

authRouter.post(
  '/login',
  ah(async (req, res) => {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Login yoki parol notoʻgʻri' });
    const { username, password } = parsed.data;

    // Avval admin — u boshqa javob qaytaradi va admin paneliga yo'naltiriladi.
    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
      const token = jwt.sign({ sub: admin.id, username: admin.username }, env.jwtSecret, {
        expiresIn: '7d',
      });
      return res.json({ role: 'admin', token, name: admin.username, username: admin.username });
    }

    const user = await prisma.siteUser.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Login yoki parol notoʻgʻri' });
    }

    await prisma.siteUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    res.json({ role: 'user', token: signUserToken(user), name: user.name, username: user.username });
  }),
);

authRouter.get(
  '/me',
  ah(async (req, res) => {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Kirilmagan' });

    try {
      const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & { kind?: string };
      if (payload.kind !== 'user') return res.status(401).json({ error: 'Foydalanuvchi tokeni emas' });

      const user = await prisma.siteUser.findUnique({ where: { id: String(payload.sub) } });
      if (!user) return res.status(401).json({ error: 'Hisob topilmadi' });
      res.json({ name: user.name, username: user.username });
    } catch {
      res.status(401).json({ error: 'Token yaroqsiz' });
    }
  }),
);
