import type { Metadata } from 'next';
import { apiGet, type Doc } from '@/lib/api';
import { s } from '@/lib/css';
import { fileSize, uzDate } from '@/lib/format';
import { DocActions } from './DocActions';

export const metadata: Metadata = {
  title: 'Hujjatlar',
  description:
    "CV va loyihalar portfoliosi — yuklab olish uchun. Portfolio PDF saytdagi loyihalar " +
    "ma'lumotidan avtomatik yasaladi, shuning uchun har doim eng so'nggi holatda bo'ladi.",
  alternates: { canonical: '/docs' },
};

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
            className="wh-doc-row"
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
            <DocActions fileUrl={doc.fileUrl} />
          </div>
        ))}
      </div>
    </section>
  );
}
