import type { BlogPost, Project } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { env } from '../env.js';
import { CATEGORIES, type Category } from './enums.js';

type ProjectWithPosts = Project & { posts: BlogPost[] };

const CATEGORY_TITLE: Record<Category, string> = {
  MANUAL: "QO'LDA QILINGAN",
  AI: 'AI BILAN',
  STARTUP: 'STARTAPLAR',
};

const STATUS_LABEL: Record<string, string> = {
  LIVE: 'Live',
  IN_PROGRESS: 'Ishlab chiqilmoqda',
  ARCHIVED: 'Arxiv',
};

const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

const INK = '#111827';
const MUTED = '#6B7280';
const ACCENT = '#0E7490';
const RULE = '#D1D5DB';

function uzDate(date: Date): string {
  return `${date.getDate()}-${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * pdfkit's built-in fonts are WinAnsi-only, so typographic punctuation that the
 * site uses (curly quotes, okina, em dash) is folded down to ASCII.
 */
function ascii(text: string): string {
  return text
    .replace(/[‘’ʻʼ′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '');
}

export function buildPortfolioPdf(projects: ProjectWithPosts[]): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 56, right: 56 },
    info: {
      Title: 'WhiteHacker - Loyihalar portfoliosi',
      Author: 'WhiteHacker',
      Subject: 'Loyihalar portfoliosi',
    },
  });

  const right = doc.page.width - doc.page.margins.right;
  const width = right - doc.page.margins.left;

  // --- Sarlavha ---
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(9).text('>_ WHITEHACKER');
  doc.moveDown(0.4);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(26).text('Loyihalar portfoliosi');
  doc.moveDown(0.5);
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(9.5)
    .text(
      ascii(
        `${projects.length} ta loyiha  -  ${uzDate(new Date())} holatiga  -  ${env.siteUrl.replace(/^https?:\/\//, '')}`,
      ),
    );
  doc.moveDown(0.4);
  doc
    .fillColor(MUTED)
    .fontSize(9)
    .text(
      ascii(
        'Bu hujjat saytdagi loyihalar ma’lumotidan avtomatik yaratiladi, shuning uchun har doim eng so’nggi holatni ko’rsatadi.',
        ),
      { width },
    );
  doc.moveDown(0.8);
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(right, doc.y).strokeColor(RULE).lineWidth(1).stroke();
  doc.moveDown(1.2);

  for (const category of CATEGORIES) {
    const group = projects.filter((project) => project.category === category);
    if (group.length === 0) continue;

    ensureSpace(doc, 90);
    doc
      .fillColor(ACCENT)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`${CATEGORY_TITLE[category]}  (${group.length})`, { characterSpacing: 0.8 });
    doc.moveDown(0.7);

    for (const project of group) {
      renderProject(doc, project, width);
    }
    doc.moveDown(0.4);
  }

  if (projects.length === 0) {
    doc.fillColor(MUTED).font('Helvetica').fontSize(11).text('Hali loyiha qo’shilmagan.');
  }

  return doc;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

function renderProject(doc: PDFKit.PDFDocument, project: ProjectWithPosts, width: number) {
  ensureSpace(doc, 130);

  const top = doc.y;
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(14).text(ascii(project.title), { continued: false });

  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(8.5)
    .text(
      ascii(
        `${STATUS_LABEL[project.status] ?? project.status}  -  yangilangan ${uzDate(project.updatedAt)}`,
      ),
    );

  const tech = project.tech.split(',').map((t) => t.trim()).filter(Boolean);
  if (tech.length > 0) {
    doc.moveDown(0.25);
    doc.fillColor(ACCENT).font('Helvetica').fontSize(9).text(ascii(tech.join('  ·  ')), { width });
  }

  doc.moveDown(0.35);
  doc.fillColor(INK).font('Helvetica').fontSize(10).text(ascii(project.description), {
    width,
    align: 'left',
    lineGap: 1.5,
  });

  if (project.posts.length > 0) {
    doc.moveDown(0.45);
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(8.5).text('LOYIHA JURNALI');
    doc.moveDown(0.2);
    for (const post of project.posts.slice(0, 5)) {
      ensureSpace(doc, 30);
      doc
        .fillColor(INK)
        .font('Helvetica')
        .fontSize(9.5)
        .text(ascii(`${uzDate(post.createdAt)}  —  ${post.title}`), { width, indent: 8 });
    }
    if (project.posts.length > 5) {
      doc
        .fillColor(MUTED)
        .fontSize(9)
        .text(ascii(`va yana ${project.posts.length - 5} ta yozuv`), { width, indent: 8 });
    }
  }

  doc.moveDown(0.35);
  const url = `${env.siteUrl}/projects/${project.slug}`;
  doc.fillColor(ACCENT).font('Helvetica').fontSize(9).text(ascii(url), { width, link: url, underline: false });

  // Chap chekkadagi ingichka chiziq — har bir loyihani ajratib turadi.
  doc
    .moveTo(doc.page.margins.left - 14, top + 2)
    .lineTo(doc.page.margins.left - 14, doc.y)
    .strokeColor(RULE)
    .lineWidth(2)
    .stroke();

  doc.moveDown(1.1);
}
