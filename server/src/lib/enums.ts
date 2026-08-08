import { z } from 'zod';

export const CATEGORIES = ['MANUAL', 'AI', 'STARTUP'] as const;
export const STATUSES = ['LIVE', 'IN_PROGRESS', 'ARCHIVED'] as const;

export const categorySchema = z.enum(CATEGORIES);
export const statusSchema = z.enum(STATUSES);

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
