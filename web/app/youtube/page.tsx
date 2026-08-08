import { apiGet, type Video } from '@/lib/api';
import { s } from '@/lib/css';
import { VideoGrid } from './VideoGrid';

export default async function YoutubePage() {
  const videos = await apiGet<Video[]>('/youtube');

  return (
    <section style={s('display: flex; flex-direction: column; gap: 26px;')}>
      <h1 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 32px;")}>
        YouTube
      </h1>
      <div style={s('border: 1px solid #26323D; border-radius: 12px; background: #0F1720; padding: 26px 28px; display: flex; align-items: center; justify-content: space-between; gap: 24px;')}>
        <div style={s('display: flex; flex-direction: column; gap: 8px;')}>
          <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 20px;")}>
            @WhiteHacker-studio
          </span>
          <span style={s('font-size: 14px; color: #8B99A6;')}>
            Har hafta bitta amaliy video: stack, debug va real loyiha ustidagi ish.
          </span>
        </div>
        <a
          href="https://www.youtube.com/@WhiteHacker-studio"
          target="_blank"
          rel="noreferrer"
          className="h-white-link"
          style={s("background: #F5F7FA; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; padding: 13px 22px; border-radius: 8px; white-space: nowrap;")}
        >
          Kanalga obuna bo&apos;lish
        </a>
      </div>
      <VideoGrid videos={videos} />
    </section>
  );
}
