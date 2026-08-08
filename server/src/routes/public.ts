import { Router } from 'express';
import { z } from 'zod';
import { categorySchema } from '../lib/enums.js';
import { ah } from '../lib/http.js';
import { buildPortfolioPdf } from '../lib/portfolioPdf.js';
import {
  serializeComment,
  serializeDocument,
  serializePost,
  serializeProject,
  serializeVideo,
} from '../lib/serialize.js';
import { prisma } from '../prisma.js';

export const publicRouter = Router();

publicRouter.get('/projects', ah(async (req, res) => {
  const parsed = categorySchema.optional().safeParse(req.query.category || undefined);
  if (!parsed.success) return res.status(400).json({ error: 'Kategoriya notoʻgʻri' });

  const projects = await prisma.project.findMany({
    where: parsed.data ? { category: parsed.data } : undefined,
    orderBy: { updatedAt: 'desc' },
  });
  res.json(projects.map(serializeProject));
}));

publicRouter.get('/projects/:slug', ah(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { slug: req.params.slug },
    include: { posts: { orderBy: { createdAt: 'desc' } } },
  });
  if (!project) return res.status(404).json({ error: 'Loyiha topilmadi' });

  res.json({
    ...serializeProject(project),
    posts: project.posts.map((post) => serializePost(post)),
    // The design shows one comment thread per project, so new comments attach
    // to the newest journal entry.
    commentTargetId: project.posts[0]?.id ?? null,
  });
}));

publicRouter.get('/projects/:slug/comments', ah(async (req, res) => {
  const project = await prisma.project.findUnique({ where: { slug: req.params.slug } });
  if (!project) return res.status(404).json({ error: 'Loyiha topilmadi' });

  const comments = await prisma.comment.findMany({
    where: { blogPost: { projectId: project.id } },
    include: { visitor: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(comments.map(serializeComment));
}));

publicRouter.get('/posts', ah(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 3, 50);
  const posts = await prisma.blogPost.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { project: true },
  });
  res.json(posts.map((post) => serializePost(post, post.project)));
}));

publicRouter.get('/posts/:id/comments', ah(async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { blogPostId: req.params.id },
    include: { visitor: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(comments.map(serializeComment));
}));

const newCommentSchema = z.object({
  deviceToken: z.string().min(8).max(200),
  username: z.string().trim().min(1).max(40).optional(),
  text: z.string().trim().min(1).max(2000),
});

publicRouter.post('/posts/:id/comments', ah(async (req, res) => {
  const parsed = newCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Izoh maʼlumotlari notoʻgʻri' });
  const { deviceToken, username, text } = parsed.data;

  const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Yozuv topilmadi' });

  let visitor = await prisma.visitor.findUnique({ where: { deviceToken } });
  if (!visitor) {
    if (!username) return res.status(400).json({ error: 'Ismingizni kiriting', needsUsername: true });
    visitor = await prisma.visitor.create({ data: { deviceToken, username } });
  }

  const comment = await prisma.comment.create({
    data: { blogPostId: post.id, visitorId: visitor.id, text },
    include: { visitor: true },
  });
  res.status(201).json(serializeComment(comment));
}));

publicRouter.get('/visitors/:deviceToken', ah(async (req, res) => {
  const visitor = await prisma.visitor.findUnique({ where: { deviceToken: req.params.deviceToken } });
  if (!visitor) return res.status(404).json({ error: 'Topilmadi' });
  res.json({ deviceToken: visitor.deviceToken, username: visitor.username });
}));

publicRouter.patch('/visitors/:deviceToken', ah(async (req, res) => {
  const parsed = z.object({ username: z.string().trim().min(1).max(40) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ism notoʻgʻri' });

  // Comments reference the visitor, so every past comment picks up the new name.
  const visitor = await prisma.visitor.upsert({
    where: { deviceToken: req.params.deviceToken },
    update: { username: parsed.data.username },
    create: { deviceToken: req.params.deviceToken, username: parsed.data.username },
  });
  res.json({ deviceToken: visitor.deviceToken, username: visitor.username });
}));

/** Always-present entry: built from live project data instead of an uploaded file. */
publicRouter.get('/documents', ah(async (_req, res) => {
  const [documents, projects] = await Promise.all([
    prisma.document.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.project.findMany({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
  ]);

  const portfolio = {
    id: 'generated-portfolio',
    title: 'Loyihalar portfoliosi.pdf',
    fileUrl: '/api/documents/portfolio.pdf',
    type: 'PDF',
    sizeBytes: 0,
    updatedAt: (projects[0]?.updatedAt ?? new Date()).toISOString(),
    generated: true,
    projectCount: projects.length,
  };

  res.json([portfolio, ...documents.map(serializeDocument)]);
}));

publicRouter.get('/documents/portfolio.pdf', ah(async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { posts: { orderBy: { createdAt: 'desc' } } },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="whitehacker-loyihalar-portfoliosi.pdf"');
  const doc = buildPortfolioPdf(projects);
  doc.pipe(res);
  doc.end();
}));

publicRouter.get('/youtube', ah(async (_req, res) => {
  const videos = await prisma.youtubeVideo.findMany({ orderBy: { addedAt: 'desc' } });
  res.json(videos.map(serializeVideo));
}));

publicRouter.get('/stats', ah(async (_req, res) => {
  const [projects, startups, posts, videos, telegramPosts] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { category: 'STARTUP' } }),
    prisma.blogPost.count(),
    prisma.youtubeVideo.count(),
    prisma.blogPost.count({ where: { sentToTelegram: true } }),
  ]);
  res.json({ projects, startups, posts, videos, telegramPosts });
}));
