import type { Metadata } from 'next';
import { Shell } from '@/components/Shell';
import { apiGet, type Project } from '@/lib/api';
import {
  DEFAULT_DESCRIPTION,
  PERSON,
  SITE_URL,
  jsonLdScript,
  personJsonLd,
  websiteJsonLd,
} from '@/lib/seo';
import './globals.css';

const TITLE = `${PERSON.brand} — ${PERSON.name} · ${PERSON.jobTitle}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Ichki sahifalar o'z nomini qo'yadi, oxiriga brend qo'shiladi.
    template: `%s · ${PERSON.brand}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: PERSON.brand,
  authors: [{ name: PERSON.name, url: SITE_URL }],
  creator: PERSON.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    url: SITE_URL,
    siteName: PERSON.brand,
    title: TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Loyiha nomlari Person kartochkasidagi "knowsAbout" ga qo'shiladi.
  const projects = await apiGet<Project[]>('/projects').catch(() => [] as Project[]);
  const names = projects.map((p) => p.title);

  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(personJsonLd(names))}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(websiteJsonLd())} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
