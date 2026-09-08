import type { Metadata } from 'next';
import { s } from '@/lib/css';
import { DEFAULT_DESCRIPTION, PERSON } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Men haqimda',
  description: `${PERSON.name} (${PERSON.brand}) — dasturchilik yo'lim, o'rgangan texnologiyalarim va dars berish tajribam. ${DEFAULT_DESCRIPTION.slice(0, 80)}`,
  alternates: { canonical: '/about' },
};

// Faqat kursda o'rganilgan va mustaqil yoziladigan texnologiyalar.
// Qolgan hamma narsa AI bilan ishlanadi — bu ikkinchi paragrafda ochiq aytilgan.
const STACK = [
  { name: 'ALGORITM ASOSI', items: ['C++'] },
  { name: 'FRONTEND', items: ['HTML', 'CSS', 'Bootstrap', 'JavaScript', 'React'] },
  { name: 'BACKEND', items: ['Python', 'Django', 'DRF'] },
  { name: 'BAZA', items: ['PostgreSQL'] },
];

const TIMELINE = [
  {
    year: '2026',
    title: "AI bilan ko'p platformali ishlab chiqish",
    text: "O'rgangan asosim ustiga AI'ni qo'shdim — endi faqat web emas, mobil ilovalar ham chiqaraman.",
  },
  {
    year: '2025',
    title: 'Loyiha menejeri',
    text: "Markaz asoschisi ochgan yangi kompaniyada bir muddat PM bo'lib ishladim, shu bilan birga dars berishni davom ettirdim.",
  },
  {
    year: '2024',
    title: "Frontend va backend — bir yilda",
    text: "iFraganus IT o'quv markazida ikkala yo'nalishni birga o'qib tugatdim va o'sha yerda dars bera boshladim.",
  },
  {
    year: '2023',
    title: 'Dasturlashga birinchi qadam',
    text: "15-iyulda boshladim. Dastlabki ikki oy poydevor sifatida C++ va algoritm asoslari.",
  },
];

const BIO = [
  "Men Og'abek Yoqubjonov — WhiteHacker nomi bilan tanilgan Full Stack Web Developer. Dasturlashni 2023-yilning iyulida boshladim. iFraganus IT o'quv markazida frontend va backendni bir vaqtda o'qib, bir yil ichida tugatdim: interfeys tomonda HTML, CSS, Bootstrap, JavaScript va React; server tomonda Python, Django, DRF va PostgreSQL.",
  "Yonimdagi ro'yxat — o'zim o'rganib, tushunib yozadigan narsalarim. Undan tashqaridagi texnologiyalarni AI bilan birga ishlataman: vazifani tavsiflab, kodni birga yozamiz va natijani sinab ko'raman. Shu yo'l bilan web'dan tashqari mobil ilovalar ham chiqardim. Nimani o'zim yozganimni va nimada AI yordam berganini yashirmayman — loyihalar bo'limi ham shunga qarab ajratilgan.",
  "O'sha markazda boshlovchilarga dars beraman: algoritm asoslaridan (C++) frontend va backendgacha to'liq kurs. 2025-yilda markaz asoschisi ochgan yangi kompaniyada bir muddat loyiha menejeri bo'lib ishladim.",
];

export default function AboutPage() {
  return (
    <section style={s('display: flex; flex-direction: column; gap: 48px;')}>
      <div className="wh-split" style={s('display: grid; grid-template-columns: 1.1fr 1fr; gap: 40px;')}>
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
            <div key={item.year} className="wh-row" style={s('display: grid; grid-template-columns: 92px 1fr; gap: 20px; padding-bottom: 26px;')}>
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
