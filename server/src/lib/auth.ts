import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

type AdminClaims = { sub: string; username: string };

declare global {
  namespace Express {
    interface Request {
      admin?: AdminClaims;
    }
  }
}

export function signAdminToken(claims: AdminClaims): string {
  return jwt.sign(claims, env.jwtSecret, { expiresIn: '7d' });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & AdminClaims;
    req.admin = { sub: payload.sub as string, username: payload.username };
    next();
  } catch {
    res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
  }
}
