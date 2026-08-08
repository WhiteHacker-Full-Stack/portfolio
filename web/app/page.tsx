import Link from 'next/link';
import { apiGet, type Post, type Stats, type Video } from '@/lib/api';
import { s } from '@/lib/css';
import { uzDate } from '@/lib/format';

export default async function HomePage() {
  const [recentPosts, stats, videos] = await Promise.all([
    apiGet<Post[]>('/posts?limit=3'),
    apiGet<Stats>('/stats'),
    apiGet<Video[]>('/youtube'),
  ]);
  const latestPost = recentPosts[0];
  const latestVideo = videos[0];

  return (
    <section style={s('display: flex; flex-direction: column; gap: 54px;')}>
      <div style={s('border: 1px solid #26323D; border-radius: 12px; background: #0F1720; overflow: hidden;')}>
        <div style={s('display: flex; align-items: center; gap: 8px; padding: 11px 14px; border-bottom: 1px solid #26323D; background: #141C24;')}>
          <span style={s('width: 10px; height: 10px; border-radius: 50%; background: #26323D; display: block;')} />
          <span style={s('width: 10px; height: 10px; border-radius: 50%; background: #26323D; display: block;')} />
          <span style={s('width: 10px; height: 10px; border-radius: 50%; background: #26323D; display: block;')} />
          <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6; margin-left: 8px;")}>
            bash — whoami
          </span>
        </div>
        <div style={s('padding: 34px 34px 40px; display: flex; flex-direction: column; gap: 22px;')}>
          <div style={s("font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #8B99A6;")}>
            <span style={s('color: #39FF88;')}>$ </span>whoami
          </div>
          <h1 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 46px; line-height: 1.1; letter-spacing: -0.01em; color: #F5F7FA;")}>
            Men WhiteHacker —<br />Full Stack Web Developer<br />va Wibe Coder
          </h1>
          <p style={s('margin: 0; max-width: 620px; font-size: 16px; line-height: 1.7; color: #8B99A6; text-wrap: pretty;')}>
            2023-yil 15-iyulda dasturlashni boshladim — avval C++, keyin bir yilda frontend va
            backend. O&apos;shandan beri dars beraman va loyihalar qilaman; so&apos;nggi oylarda AI bilan
            barcha qurilmalar uchun ilova yarata oldim.
          </p>
          <div style={s('display: flex; gap: 12px; flex-wrap: wrap; padding-top: 6px;')}>
            <Link
              href="/projects"
              className="h-white f3"
              style={s("cursor: pointer; background: #F5F7FA; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; padding: 13px 22px; border-radius: 8px;")}
            >
              Loyihalarni ko&apos;rish
            </Link>
            <Link
              href="/docs"
              className="h-cyan f3"
              style={s("cursor: pointer; border: 1px solid #26323D; color: #E8EDF2; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 12px 22px; border-radius: 8px;")}
            >
              CV yuklab olish
            </Link>
          </div>
        </div>
      </div>

      <div style={s('display: flex; flex-direction: column; gap: 18px;')}>
        <div style={s('display: flex; align-items: baseline; justify-content: space-between; gap: 16px;')}>
          <h2 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 18px; letter-spacing: 0.02em;")}>
            So&apos;nggi faoliyat
          </h2>
          <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
            oxirgi {recentPosts.length} yozuv
          </span>
        </div>
        <div style={s('display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;')}>
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/projects/${post.projectSlug}`}
              className="h-card f2"
              style={s('cursor: pointer; display: flex; flex-direction: column; gap: 10px; border: 1px solid #26323D; background: #141C24; border-radius: 10px; padding: 18px;')}
            >
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4FD1FF;")}>
                {post.projectTitle}
              </span>
              <span style={s('font-size: 15px; font-weight: 600; line-height: 1.4; color: #E8EDF2;')}>
                {post.title}
              </span>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                {uzDate(post.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div style={s('display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #26323D; border-radius: 10px; overflow: hidden; background: #0F1720;')}>
        {[
          { value: stats.projects, label: 'LOYIHA' },
          { value: stats.startups, label: 'STARTAP' },
          { value: stats.posts, label: 'BLOG-YOZUV' },
          { value: stats.videos, label: 'VIDEO' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={s('padding: 22px 20px; border-right: 1px solid #26323D; display: flex; flex-direction: column; gap: 6px;')}
          >
            <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 28px; color: #F5F7FA;")}>
              {stat.value}
            </span>
            <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6; letter-spacing: 0.04em;")}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <div style={s('display: flex; flex-direction: column; gap: 18px;')}>
        <h2 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 18px;")}>
          Ijtimoiy tarmoqlarda kuzatib boring
        </h2>
        <div style={s('display: grid; grid-template-columns: 1fr 1fr; gap: 16px;')}>
          <div style={s('border: 1px solid #26323D; background: #141C24; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px;')}>
            <div style={s('display: flex; align-items: center; justify-content: space-between;')}>
              <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 14px;")}>
                Telegram kanal
              </span>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                {stats.telegramPosts} yozuv yuborilgan
              </span>
            </div>
            <p style={s('margin: 0; font-size: 14px; line-height: 1.6; color: #8B99A6;')}>
              {latestPost ? `“${latestPost.title}”` : 'Hali yozuv yoʻq.'}
            </p>
            <a href="https://t.me/whitehackerstudio" target="_blank" rel="noreferrer" style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px;")}>
              t.me/whitehackerstudio →
            </a>
          </div>
          <div style={s('border: 1px solid #26323D; background: #141C24; border-radius: 10px; padding: 20px; display: flex; flex-direction: column; gap: 14px;')}>
            <div style={s('display: flex; align-items: center; justify-content: space-between;')}>
              <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 14px;")}>
                YouTube kanal
              </span>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                {stats.videos} video
              </span>
            </div>
            <p style={s('margin: 0; font-size: 14px; line-height: 1.6; color: #8B99A6;')}>
              {latestVideo ? `Oxirgi video: “${latestVideo.title}”` : 'Hali video qoʻshilmagan.'}
            </p>
            <Link href="/youtube" className="h-txt f2" style={s("cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4FD1FF;")}>
              Barcha videolar →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
