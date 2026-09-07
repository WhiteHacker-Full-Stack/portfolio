export const SITE_URL = (process.env.SITE_URL ?? 'https://whitehacker-portfolio.duckdns.org').replace(/\/$/, '');

export const PERSON = {
  name: "Og'abek Yoqubjonov",
  brand: 'WhiteHacker',
  jobTitle: 'Full Stack Web Developer',
  /**
   * Ismning yozilish variantlari. Qidiruv tizimlari bu ro'yxatni JSON-LD orqali
   * o'qiydi — matnga takrorlab yozish (keyword stuffing) o'rniga to'g'ri usul shu.
   */
  alternateNames: [
    'WhiteHacker',
    'White Hacker',
    'whitehacker',
    "Og'abek Yoqubjonov",
    'Ogabek Yoqubjonov',
    "Og'abek Yakubjonov",
    'Ogabek Yakubjonov',
    'Ogabek Yoqubjonov WhiteHacker',
  ],
  telegram: 'https://t.me/whitehackerstudio',
  youtube: 'https://www.youtube.com/@WhiteHacker-studio',
  github: 'https://github.com/WhiteHacker-Full-Stack',
  skills: [
    'HTML', 'CSS', 'Bootstrap', 'JavaScript', 'React',
    'Python', 'Django', 'Django REST Framework', 'PostgreSQL', 'C++',
  ],
};

export const DEFAULT_DESCRIPTION =
  "Og'abek Yoqubjonov (WhiteHacker) — Full Stack Web Developer. React, Python va Django bilan " +
  "ishlayman, AI bilan barcha qurilmalar uchun ilova yarataman va iFraganus IT o'quv markazida " +
  'dasturlashdan dars beraman. Loyihalarim, hujjatlarim va videolarim shu yerda.';

/** Google "Person" kartochkasi uchun strukturali ma'lumot. */
export function personJsonLd(projectNames: string[] = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PERSON.name,
    alternateName: PERSON.alternateNames,
    jobTitle: PERSON.jobTitle,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    sameAs: [PERSON.telegram, PERSON.youtube, PERSON.github],
    knowsAbout: [...PERSON.skills, ...projectNames].slice(0, 40),
    worksFor: {
      '@type': 'Organization',
      name: "iFraganus IT o'quv markazi",
    },
    nationality: { '@type': 'Country', name: 'Uzbekistan' },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${PERSON.brand} — ${PERSON.name}`,
    alternateName: PERSON.alternateNames,
    url: SITE_URL,
    inLanguage: 'uz',
    author: { '@type': 'Person', name: PERSON.name },
  };
}

export function projectJsonLd(p: {
  title: string;
  description: string;
  slug: string;
  tech: string[];
  repoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: p.title,
    description: p.description,
    url: `${SITE_URL}/projects/${p.slug}`,
    codeRepository: p.repoUrl ?? undefined,
    programmingLanguage: p.tech,
    dateCreated: p.createdAt,
    dateModified: p.updatedAt,
    author: { '@type': 'Person', name: PERSON.name, alternateName: PERSON.brand },
  };
}

/** JSON-LD ni sahifaga qo'shish uchun. */
export function jsonLdScript(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  };
}
