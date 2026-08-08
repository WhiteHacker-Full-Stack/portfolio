import { apiGet, type Doc } from '@/lib/api';
import { s } from '@/lib/css';
import { fileSize, uzDate } from '@/lib/format';

export default async function DocsPage() {
  const documents = await apiGet<Doc[]>('/documents');

  return (
    <section style={s('display: flex; flex-direction: column; gap: 24px;')}>
      <h1 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 32px;")}>
        Hujjatlar
      </h1>
      <div style={s('display: flex; flex-direction: column; gap: 12px; max-width: 760px;')}>
        {documents.length === 0 && (
          <div style={s("border: 1px dashed #26323D; border-radius: 10px; padding: 40px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;")}>
            Hali hujjat yuklanmagan.
          </div>
        )}
        {documents.map((doc) => (
          <div
            key={doc.id}
            style={s('display: flex; align-items: center; gap: 18px; border: 1px solid #26323D; background: #141C24; border-radius: 10px; padding: 16px 18px;')}
          >
            <span style={s("width: 40px; height: 48px; border: 1px solid #26323D; border-radius: 5px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #8B99A6; background: #0F1720;")}>
              {doc.type}
            </span>
            <span style={s('display: flex; flex-direction: column; gap: 5px; flex: 1;')}>
              <span style={s('font-size: 15px; font-weight: 600;')}>{doc.title}</span>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                {doc.generated
                  ? `${doc.type} · ${doc.projectCount} ta loyiha · avtomatik yangilanadi`
                  : `${doc.type} · ${fileSize(doc.sizeBytes)} · yangilangan ${uzDate(doc.updatedAt)}`}
              </span>
            </span>
            <span style={s('display: flex; gap: 10px;')}>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="h-cyan f2"
                style={s("cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid #26323D; padding: 8px 14px; border-radius: 7px; color: #E8EDF2;")}
              >
                Ko&apos;rish
              </a>
              <a
                href={doc.fileUrl}
                download
                className="h-white f2"
                style={s("cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; background: #F5F7FA; color: #0B0F14; padding: 8px 14px; border-radius: 7px;")}
              >
                Yuklab olish
              </a>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
