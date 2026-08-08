import { s } from '@/lib/css';

const STACK = [
  { name: 'FRONTEND', items: ['Next.js', 'React', 'Tailwind', 'TypeScript'] },
  { name: 'BACKEND', items: ['Node.js', 'Express', 'Prisma', 'SQLite', 'Postgres'] },
  { name: 'MOBILE', items: ['Capacitor', 'Android build'] },
  { name: 'AI / API', items: ['Gemini API', 'Embeddings', 'Prompt tooling'] },
  { name: 'NETWORKING', items: ['Tailscale', 'Nginx', 'Uy serveri'] },
];

const TIMELINE = [
  {
    year: '2026',
    title: 'EduTrack pilotda',
    text: "Uchta o'quv markazida real foydalanuvchilar bilan ishlayapti.",
  },
  {
    year: '2025',
    title: "Mobil tomonga o'tish",
    text: "Capacitor bilan bitta kodbazadan web va Android chiqarishni o'zlashtirdim.",
  },
  {
    year: '2024',
    title: 'AI ish oqimimga kirdi',
    text: "Prototip va hujjatlashtirishni tezlashtirish uchun model chaqiruvlarini quvurga qo'shdim.",
  },
  {
    year: '2022',
    title: "Birinchi to'liq stack loyiha",
    text: "Node.js va Postgres bilan birinchi ishlab turgan mahsulotni chiqardim.",
  },
];

const BIO = [
  "Men mahsulotni boshidan oxirigacha quraman: interfeys, API, ma'lumotlar bazasi va deploy. Ko'p yillar davomida veb bilan ishlaganimdan keyin mobil tomonga o'tdim — hozir bitta kodbazadan web va Android uchun ilova chiqarish men uchun odatiy ish oqimi.",
  "AI'ni ishimda vosita sifatida ishlataman: prototip, refactoring va hujjatlashtirish uchun. Qo'lda yozgan kodim va AI bilan tezlashtirgan loyihalarimni alohida ajratib ko'rsataman — chunki ikkalasi boshqa-boshqa mahorat.",
  "Bo'sh vaqtimda uy serverimni sozlayman, tarmoq bilan o'ynayman va o'rganganlarimni Telegram kanalimda yozib boraman.",
];

export default function AboutPage() {
  return (
    <section style={s('display: flex; flex-direction: column; gap: 48px;')}>
      <div style={s('display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px;')}>
        <div style={s('display: flex; flex-direction: column; gap: 18px;')}>
          <h1 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 32px;")}>
            Men haqimda
          </h1>
          {BIO.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} style={s('margin: 0; font-size: 15px; line-height: 1.75; color: #8B99A6; text-wrap: pretty;')}>
              {paragraph}
            </p>
          ))}
        </div>
        <div style={s('display: flex; flex-direction: column; gap: 18px;')}>
          <h2 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 15px; letter-spacing: 0.06em; color: #8B99A6;")}>
            TECH STACK
          </h2>
          {STACK.map((group) => (
            <div key={group.name} style={s('display: flex; flex-direction: column; gap: 9px; padding-bottom: 14px; border-bottom: 1px solid #26323D;')}>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4FD1FF; letter-spacing: 0.06em;")}>
                {group.name}
              </span>
              <div style={s('display: flex; flex-wrap: wrap; gap: 7px;')}>
                {group.items.map((tech) => (
                  <span
                    key={tech}
                    style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid #26323D; background: #141C24; color: #E8EDF2; padding: 5px 10px; border-radius: 999px;")}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={s('display: flex; flex-direction: column; gap: 20px;')}>
        <h2 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 18px;")}>
          Yo&apos;l tarixi
        </h2>
        <div style={s('display: flex; flex-direction: column;')}>
          {TIMELINE.map((item) => (
            <div key={item.year} style={s('display: grid; grid-template-columns: 92px 1fr; gap: 20px; padding-bottom: 26px;')}>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6; padding-top: 2px;")}>
                {item.year}
              </span>
              <div style={s('border-left: 1px solid #26323D; padding: 0 0 0 22px; position: relative;')}>
                <span style={s('position: absolute; left: -5px; top: 5px; width: 9px; height: 9px; border-radius: 50%; background: #0B0F14; border: 1px solid #4FD1FF; display: block;')} />
                <div style={s('display: flex; flex-direction: column; gap: 6px;')}>
                  <span style={s('font-size: 15px; font-weight: 600;')}>{item.title}</span>
                  <span style={s('font-size: 14px; line-height: 1.6; color: #8B99A6;')}>{item.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
