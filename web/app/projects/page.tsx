import type { Metadata } from 'next';
import Link from 'next/link';
import { apiGet, type Project } from '@/lib/api';
import { s } from '@/lib/css';
import { STATUS_COLOR, STATUS_LABEL, uzDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Loyihalar',
  description:
    "Qo'lda yozilgan, AI bilan qilingan va startap loyihalarim: React, Django, Python, " +
    'Flutter va Capacitor asosidagi ishlar. Har birida GitHub havolasi va loyiha jurnali bor.',
  alternates: { canonical: '/projects' },
};

const TABS = [
  { id: 'manual', label: "Qo'lda qilingan", category: 'MANUAL' },
  { id: 'ai', label: 'AI bilan', category: 'AI' },
  { id: 'startups', label: 'Startaplar', category: 'STARTUP' },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const active = TABS.find((tab) => tab.id === cat) ?? TABS[0];
  const projects = await apiGet<Project[]>(`/projects?category=${active.category}`);

  return (
    <section style={s('display: flex; flex-direction: column; gap: 26px;')}>
      <h1 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 32px;")}>
        Loyihalar
      </h1>
      <div style={s('display: flex; gap: 4px; border-bottom: 1px solid #26323D;')}>
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/projects?cat=${tab.id}`}
            className="h-txt f2"
            style={s(`cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 11px 16px; border-bottom: 2px solid transparent; color: ${tab.id === active.id ? '#4FD1FF' : '#8B99A6'}; border-bottom-color: ${tab.id === active.id ? '#4FD1FF' : 'transparent'};`)}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {active.id === 'startups' && (
        <div style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #FFB454; display: flex; align-items: center; gap: 8px;")}>
          <span style={s('width: 6px; height: 6px; border-radius: 50%; background: #FFB454; display: block;')} />
          Startaplar doimiy yangilanadi — bu bo&apos;limdagi yozuvlar tugamaydi.
        </div>
      )}

      {projects.length === 0 ? (
        <div style={s("border: 1px dashed #26323D; border-radius: 10px; padding: 40px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;")}>
          Bu bo&apos;limda hali loyiha yo&apos;q.
        </div>
      ) : (
        <div className="wh-grid-3" style={s('display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;')}>
          {projects.map((project) => {
            const status = STATUS_COLOR[project.status] ?? STATUS_COLOR.ARCHIVED;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="h-card f2"
                style={s('cursor: pointer; display: flex; flex-direction: column; border: 1px solid #26323D; background: #141C24; border-radius: 10px; overflow: hidden;')}
              >
                <span
                  style={{
                    ...s("height: 132px; display: flex; align-items: center; justify-content: center; background-color: #0F1720; background-image: repeating-linear-gradient(135deg, rgba(79,209,255,0.10) 0 6px, transparent 6px 14px); font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8B99A6; letter-spacing: 0.08em;"),
                    ...(project.coverImage
                      ? {
                          backgroundImage: `url(${project.coverImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : {}),
                  }}
                >
                  {project.coverImage ? '' : project.title.toLowerCase()}
                </span>
                <span style={s('padding: 16px 16px 18px; display: flex; flex-direction: column; gap: 10px;')}>
                  <span style={s('display: flex; align-items: center; justify-content: space-between; gap: 10px;')}>
                    <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 15px; color: #F5F7FA; min-width: 0; overflow-wrap: anywhere;")}>
                      {project.title}
                    </span>
                    <span style={s(`flex: 0 0 auto; white-space: nowrap; font-family: 'IBM Plex Mono', monospace; font-size: 10px; padding: 3px 8px; border-radius: 999px; color: ${status.color}; background: ${status.bg};`)}>
                      {STATUS_LABEL[project.status] ?? project.status}
                    </span>
                  </span>
                  <span style={s('font-size: 13px; line-height: 1.6; color: #8B99A6;')}>
                    {project.description}
                  </span>
                  <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #4a5764;")}>
                    yangilangan {uzDate(project.updatedAt)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
