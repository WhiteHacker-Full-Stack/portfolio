import bcrypt from 'bcryptjs';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAdmin, signAdminToken } from '../lib/auth.js';
import { categorySchema, statusSchema } from '../lib/enums.js';
import { ah } from '../lib/http.js';
import {
  serializeComment,
  serializeDocument,
  serializePost,
  serializeProject,
  serializeVideo,
} from '../lib/serialize.js';
import { uniqueSlug } from '../lib/slug.js';
import { fileStore } from '../lib/storage.js';
import { TelegramError, sendProjectUpdateToChannel } from '../lib/telegram.js';
import { extractYoutubeId } from '../lib/youtube.js';
import { prisma } from '../prisma.js';

export const adminRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
const DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

adminRouter.post(
  '/login',
  ah(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Username va parol kerak' });

    const admin = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
    const ok = admin && (await bcrypt.compare(parsed.data.password, admin.passwordHash));
    if (!admin || !ok) return res.status(401).json({ error: 'Login yoki parol notoʻgʻri' });

    res.json({
      token: signAdminToken({ sub: admin.id, username: admin.username }),
      username: admin.username,
    });
  }),
);

adminRouter.use(requireAdmin);

adminRouter.get(
  '/me',
  ah(async (req, res) => {
    res.json({ username: req.admin?.username });
  }),
);

// --- Projects ---

const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: categorySchema,
  status: statusSchema.default('IN_PROGRESS'),
  description: z.string().trim().min(1).max(5000),
  tech: z.string().trim().max(300).optional(),
  repoUrl: z.union([z.string().trim().url(), z.literal('')]).optional(),
});

adminRouter.get(
  '/projects',
  ah(async (_req, res) => {
    const projects = await prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json(projects.map(serializeProject));
  }),
);

adminRouter.post(
  '/projects',
  upload.single('cover'),
  ah(async (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Loyiha maʼlumotlari notoʻgʻri' });
    if (req.file && !IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Cover rasm formati qoʻllab-quvvatlanmaydi' });
    }

    const cover = req.file ? await fileStore.save(req.file) : null;
    const project = await prisma.project.create({
      data: {
        ...parsed.data,
        tech: parsed.data.tech ?? '',
        repoUrl: parsed.data.repoUrl || null,
        slug: await uniqueSlug(parsed.data.title),
        coverImage: cover?.url ?? null,
      },
    });
    res.status(201).json(serializeProject(project));
  }),
);

adminRouter.put(
  '/projects/:id',
  upload.single('cover'),
  ah(async (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Loyiha maʼlumotlari notoʻgʻri' });

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Loyiha topilmadi' });
    if (req.file && !IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Cover rasm formati qoʻllab-quvvatlanmaydi' });
    }

    const cover = req.file ? await fileStore.save(req.file) : null;
    if (cover && existing.coverImage) await fileStore.remove(existing.coverImage);

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        tech: parsed.data.tech ?? '',
        repoUrl: parsed.data.repoUrl || null,
        slug:
          parsed.data.title === existing.title
            ? existing.slug
            : await uniqueSlug(parsed.data.title, existing.id),
        ...(cover ? { coverImage: cover.url } : {}),
      },
    });
    res.json(serializeProject(project));
  }),
);

adminRouter.delete(
  '/projects/:id',
  ah(async (req, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Loyiha topilmadi' });

    await prisma.project.delete({ where: { id: project.id } });
    if (project.coverImage) await fileStore.remove(project.coverImage);
    res.json({ ok: true });
  }),
);

// --- Blog posts ---

const postSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000),
  sendToTelegram: z
    .union([z.boolean(), z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

adminRouter.get(
  '/posts',
  ah(async (_req, res) => {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: { project: true },
    });
    res.json(posts.map((post) => serializePost(post, post.project)));
  }),
);

adminRouter.post(
  '/posts',
  upload.single('image'),
  ah(async (req, res) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Yozuv maʼlumotlari notoʻgʻri' });
    if (req.file && !IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Rasm formati qoʻllab-quvvatlanmaydi' });
    }

    const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
    if (!project) return res.status(404).json({ error: 'Loyiha topilmadi' });

    const image = req.file ? await fileStore.save(req.file) : null;
    let post = await prisma.blogPost.create({
      data: {
        projectId: project.id,
        title: parsed.data.title,
        content: parsed.data.content,
        image: image?.url ?? null,
      },
    });
    // A new journal entry is what "updated" means for a project.
    await prisma.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });

    let telegramError: string | null = null;
    if (parsed.data.sendToTelegram) {
      try {
        await sendProjectUpdateToChannel(post, project);
        post = await prisma.blogPost.update({
          where: { id: post.id },
          data: { sentToTelegram: true },
        });
      } catch (err) {
        telegramError = err instanceof TelegramError ? err.message : 'Telegramga yuborib boʻlmadi';
      }
    }

    res.status(201).json({ ...serializePost(post, project), telegramError });
  }),
);

adminRouter.put(
  '/posts/:id',
  upload.single('image'),
  ah(async (req, res) => {
    const parsed = postSchema.partial({ projectId: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Yozuv maʼlumotlari notoʻgʻri' });

    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Yozuv topilmadi' });
    if (req.file && !IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Rasm formati qoʻllab-quvvatlanmaydi' });
    }

    const image = req.file ? await fileStore.save(req.file) : null;
    if (image && existing.image) await fileStore.remove(existing.image);

    const post = await prisma.blogPost.update({
      where: { id: existing.id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        ...(parsed.data.projectId ? { projectId: parsed.data.projectId } : {}),
        ...(image ? { image: image.url } : {}),
      },
      include: { project: true },
    });
    res.json(serializePost(post, post.project));
  }),
);

adminRouter.delete(
  '/posts/:id',
  ah(async (req, res) => {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Yozuv topilmadi' });

    await prisma.blogPost.delete({ where: { id: post.id } });
    if (post.image) await fileStore.remove(post.image);
    res.json({ ok: true });
  }),
);

adminRouter.post(
  '/posts/:id/send-telegram',
  ah(async (req, res) => {
    const post = await prisma.blogPost.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!post) return res.status(404).json({ error: 'Yozuv topilmadi' });

    try {
      await sendProjectUpdateToChannel(post, post.project);
    } catch (err) {
      const message = err instanceof TelegramError ? err.message : 'Telegramga yuborib boʻlmadi';
      return res.status(502).json({ error: message });
    }

    const updated = await prisma.blogPost.update({
      where: { id: post.id },
      data: { sentToTelegram: true },
    });
    res.json(serializePost(updated, post.project));
  }),
);

// --- Documents ---

adminRouter.post(
  '/documents',
  upload.single('file'),
  ah(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Fayl tanlanmagan' });
    if (![...DOC_TYPES, ...IMAGE_TYPES].includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Fayl formati qoʻllab-quvvatlanmaydi' });
    }

    const title = z.string().trim().min(1).max(200).safeParse(req.body.title);
    const stored = await fileStore.save(req.file);
    const document = await prisma.document.create({
      data: {
        title: title.success ? title.data : req.file.originalname,
        fileUrl: stored.url,
        type: (req.file.originalname.split('.').pop() ?? 'FILE').toUpperCase(),
        sizeBytes: stored.size,
      },
    });
    res.status(201).json(serializeDocument(document));
  }),
);

adminRouter.delete(
  '/documents/:id',
  ah(async (req, res) => {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Hujjat topilmadi' });

    await prisma.document.delete({ where: { id: document.id } });
    await fileStore.remove(document.fileUrl);
    res.json({ ok: true });
  }),
);

// --- YouTube ---

adminRouter.post(
  '/youtube',
  ah(async (req, res) => {
    const parsed = z
      .object({ youtubeUrl: z.string().trim().min(1), title: z.string().trim().max(200).optional() })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Link kerak' });

    const youtubeId = extractYoutubeId(parsed.data.youtubeUrl);
    if (!youtubeId) return res.status(400).json({ error: 'YouTube link tanilmadi' });

    const video = await prisma.youtubeVideo.create({
      data: {
        title: parsed.data.title?.trim() || `Video ${youtubeId}`,
        youtubeUrl: parsed.data.youtubeUrl.trim(),
        youtubeId,
      },
    });
    res.status(201).json(serializeVideo(video));
  }),
);

adminRouter.delete(
  '/youtube/:id',
  ah(async (req, res) => {
    const video = await prisma.youtubeVideo.findUnique({ where: { id: req.params.id } });
    if (!video) return res.status(404).json({ error: 'Video topilmadi' });

    await prisma.youtubeVideo.delete({ where: { id: video.id } });
    res.json({ ok: true });
  }),
);

// --- Comment moderation ---

adminRouter.get(
  '/comments',
  ah(async (_req, res) => {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { visitor: true, blogPost: { include: { project: true } } },
    });
    res.json(
      comments.map((comment) => ({
        ...serializeComment(comment),
        postTitle: comment.blogPost.title,
        projectTitle: comment.blogPost.project.title,
      })),
    );
  }),
);

adminRouter.delete(
  '/comments/:id',
  ah(async (req, res) => {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Izoh topilmadi' });

    await prisma.comment.delete({ where: { id: comment.id } });
    res.json({ ok: true });
  }),
);
