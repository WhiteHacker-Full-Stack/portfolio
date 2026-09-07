import type { BlogPost, Comment, Document, Project, Visitor, YoutubeVideo } from '@prisma/client';
import { thumbnailUrl } from './youtube.js';

export function serializeProject(project: Project) {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    category: project.category,
    status: project.status,
    description: project.description,
    tech: project.tech.split(',').map((t) => t.trim()).filter(Boolean),
    repoUrl: project.repoUrl,
    coverImage: project.coverImage,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export function serializePost(post: BlogPost, project?: Pick<Project, 'title' | 'slug'>) {
  return {
    id: post.id,
    projectId: post.projectId,
    title: post.title,
    content: post.content,
    image: post.image,
    sentToTelegram: post.sentToTelegram,
    createdAt: post.createdAt.toISOString(),
    ...(project ? { projectTitle: project.title, projectSlug: project.slug } : {}),
  };
}

export function serializeComment(comment: Comment & { visitor: Visitor }) {
  return {
    id: comment.id,
    blogPostId: comment.blogPostId,
    text: comment.text,
    username: comment.visitor.username,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function serializeDocument(doc: Document) {
  return {
    id: doc.id,
    title: doc.title,
    fileUrl: doc.fileUrl,
    type: doc.type,
    sizeBytes: doc.sizeBytes,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function serializeVideo(video: YoutubeVideo) {
  return {
    id: video.id,
    title: video.title,
    youtubeUrl: video.youtubeUrl,
    youtubeId: video.youtubeId,
    thumbnail: thumbnailUrl(video.youtubeId),
    addedAt: video.addedAt.toISOString(),
  };
}
