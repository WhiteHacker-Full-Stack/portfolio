'use client';

import { useState } from 'react';
import { Overlay } from '@/components/Overlay';
import type { Video } from '@/lib/api';
import { s } from '@/lib/css';
import { uzDate } from '@/lib/format';

export function VideoGrid({ videos }: { videos: Video[] }) {
  const [playing, setPlaying] = useState<Video | null>(null);

  if (videos.length === 0) {
    return (
      <div style={s("border: 1px dashed #26323D; border-radius: 10px; padding: 40px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;")}>
        Hali video qo&apos;shilmagan.
      </div>
    );
  }

  return (
    <>
      <div style={s('display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;')}>
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setPlaying(video)}
            className="f3"
            style={s('all: unset; cursor: pointer; display: flex; flex-direction: column; gap: 12px;')}
          >
            <span
              style={{
                ...s("aspect-ratio: 16/9; border-radius: 10px; border: 1px solid #26323D; display: flex; align-items: center; justify-content: center; background-color: #0F1720; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8B99A6; overflow: hidden;"),
                backgroundImage: `url(${video.thumbnail})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <span style={s('font-size: 14px; font-weight: 600; line-height: 1.5;')}>{video.title}</span>
            <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
              {uzDate(video.addedAt)}
            </span>
          </button>
        ))}
      </div>

      {playing && (
        <Overlay onClose={() => setPlaying(null)}>
          <div style={s('width: min(1000px, 92vw); display: flex; flex-direction: column; gap: 14px;')}>
            <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 16px;')}>
              <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 16px;")}>
                {playing.title}
              </span>
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="h-txt f2"
                style={s("all: unset; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;")}
              >
                yopish ✕
              </button>
            </div>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?autoplay=1`}
              title={playing.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={s('aspect-ratio: 16/9; width: 100%; border: 1px solid #26323D; border-radius: 12px; background: #05080B;')}
            />
          </div>
        </Overlay>
      )}
    </>
  );
}
