import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiGet, apiGetOrNull, type Comment, type ProjectDetail } from '@/lib/api';
import { s } from '@/lib/css';
import { STATUS_COLOR, STATUS_LABEL, uzDate } from '@/lib/format';
import { PERSON, jsonLdScript, projectJsonLd } from '@/lib/seo';
import { Comments } from './Comments';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await apiGetOrNull<ProjectDetail>(`/projects/${slug}`);
  if (!project) return { title: 'Loyiha topilmadi' };

  const description = project.description.slice(0, 300);
  return {
    title: project.title,
    description,
    keywords: [project.title, ...project.tech, PERSON.brand, PERSON.name],
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: 'article',
      title: `${project.title} · ${PERSON.brand}`,
      description,
      url: `/projects/${slug}`,
      publishedTime: project.createdAt,
      modifiedTime: project.updatedAt,
      authors: [PERSON.name],
      ...(project.coverImage ? { images: [project.coverImage] } : {}),
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await apiGetOrNull<ProjectDetail>(`/projects/${slug}`);
  if (!project) notFound();

  const comments = await apiGet<Comment[]>(`/projects/${slug}/comments`);
  const status = STATUS_COLOR[project.status] ?? STATUS_COLOR.ARCHIVED;

  return (
    <section style={s('display: flex; flex-direction: column; gap: 36px;')}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(projectJsonLd(project))} />
      <div style={s('display: flex; flex-direction: column; gap: 16px;')}>
        <Link
          href="/projects"
          className="h-cyan f2"
          style={s("cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;")}
        >
          ← cd ../projects
        </Link>
        <div style={s('display: flex; align-items: center; gap: 14px; flex-wrap: wrap;')}>
          <h1 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 34px;")}>
            {project.title}
          </h1>
          <span style={s(`font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 4px 10px; border-radius: 999px; color: ${status.color}; background: ${status.bg};`)}>
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
        </div>
        <div style={s('display: flex; gap: 7px; flex-wrap: wrap;')}>
          {project.tech.map((tech) => (
            <span
              key={tech}
              style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid #26323D; padding: 5px 10px; border-radius: 999px; color: #E8EDF2;")}
            >
              {tech}
            </span>
          ))}
        </div>
        <p style={s('margin: 0; max-width: 680px; font-size: 15px; line-height: 1.75; color: #8B99A6; text-wrap: pretty;')}>
          {project.description}
        </p>
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="h-cyan f2"
            style={s("cursor: pointer; align-self: flex-start; font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid #26323D; padding: 8px 14px; border-radius: 7px; color: #E8EDF2;")}
          >
            Kodni ko&apos;rish — GitHub →
          </a>
        )}
      </div>

      <div style={s('display: flex; flex-direction: column; gap: 20px;')}>
        <h2 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 18px;")}>
          Loyiha jurnali
        </h2>
        {project.posts.length === 0 ? (
          <div style={s('font-size: 14px; color: #8B99A6;')}>Hali yozuv yo&apos;q.</div>
        ) : (
          <div style={s('display: flex; flex-direction: column;')}>
            {project.posts.map((post) => (
              <div key={post.id} style={s('display: grid; grid-template-columns: 104px 1fr; gap: 20px; padding-bottom: 28px;')}>
                <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6; padding-top: 3px;")}>
                  {uzDate(post.createdAt)}
                </span>
                <div style={s('border-left: 1px solid #26323D; padding-left: 22px; position: relative; display: flex; flex-direction: column; gap: 10px;')}>
                  <span style={s('position: absolute; left: -5px; top: 6px; width: 9px; height: 9px; border-radius: 50%; background: #0B0F14; border: 1px solid #4FD1FF; display: block;')} />
                  <span style={s('font-size: 16px; font-weight: 600;')}>{post.title}</span>
                  <span style={s('font-size: 14px; line-height: 1.7; color: #8B99A6; white-space: pre-wrap;')}>
                    {post.content}
                  </span>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(`${process.env.SITE_URL ?? 'http://localhost:3000'}/projects/${project.slug}`)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-cyan f2"
                    style={s("cursor: pointer; align-self: flex-start; font-family: 'IBM Plex Mono', monospace; font-size: 11px; border: 1px solid #26323D; padding: 6px 11px; border-radius: 6px; color: #8B99A6;")}
                  >
                    Telegram&apos;da ulashish
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Comments slug={slug} targetPostId={project.commentTargetId} initialComments={comments} />
    </section>
  );
}
