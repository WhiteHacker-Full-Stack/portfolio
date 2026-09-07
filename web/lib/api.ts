const BASE = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  description: string;
  tech: string[];
  repoUrl: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Post = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  image: string | null;
  sentToTelegram: boolean;
  createdAt: string;
  projectTitle?: string;
  projectSlug?: string;
};

export type ProjectDetail = Project & { posts: Post[]; commentTargetId: string | null };

export type Comment = {
  id: string;
  blogPostId: string;
  text: string;
  username: string;
  createdAt: string;
  postTitle?: string;
  projectTitle?: string;
};

export type Doc = {
  id: string;
  title: string;
  fileUrl: string;
  type: string;
  sizeBytes: number;
  updatedAt: string;
  /** True for the portfolio PDF the API builds from live project data. */
  generated?: boolean;
  projectCount?: number;
};

export type Video = {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnail: string;
  addedAt: string;
};

export type Stats = {
  projects: number;
  startups: number;
  posts: number;
  videos: number;
  telegramPosts: number;
};

/** Server-side fetch against the Express API. Never cached — the admin panel edits this data. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiGetOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${BASE}/api${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}
