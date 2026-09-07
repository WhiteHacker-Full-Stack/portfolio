'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthPanel } from '@/components/AuthPanel';
import { s } from '@/lib/css';

const CY = '#4FD1FF';
const DIM = '#8B99A6';
const TXT = '#E8EDF2';

type NavItem = {
  label: string;
  href: string;
  branch: string;
  indent?: string;
  cat?: string;
};

const NAV: NavItem[] = [
  { label: '~/home', href: '/', branch: '├─' },
  { label: '~/about', href: '/about', branch: '├─' },
  { label: '~/projects', href: '/projects', branch: '├─' },
  { label: 'manual/', href: '/projects?cat=manual', branch: '│', indent: '14px', cat: 'manual' },
  { label: 'ai/', href: '/projects?cat=ai', branch: '│', indent: '14px', cat: 'ai' },
  { label: 'startups/', href: '/projects?cat=startups', branch: '│', indent: '14px', cat: 'startups' },
  { label: '~/docs', href: '/docs', branch: '├─' },
  { label: '~/youtube', href: '/youtube', branch: '└─' },
];

function promptFor(pathname: string): { path: string; cmd: string } {
  if (pathname === '/') return { path: '~', cmd: 'whoami' };
  if (pathname === '/about') return { path: '~/about', cmd: 'cat about.md' };
  if (pathname === '/projects') return { path: '~/projects', cmd: 'ls -la' };
  if (pathname.startsWith('/projects/')) {
    return { path: `~/projects/${pathname.slice('/projects/'.length)}`, cmd: 'git log --oneline' };
  }
  if (pathname === '/docs') return { path: '~/docs', cmd: 'ls *.pdf' };
  if (pathname === '/youtube') return { path: '~/youtube', cmd: 'ls videos/' };
  if (pathname.startsWith('/admin')) return { path: '~/admin', cmd: 'sudo su' };
  return { path: '~', cmd: '' };
}

function PromptLine() {
  const pathname = usePathname();
  const { path, cmd } = promptFor(pathname);
  const fullPrompt = `whitehacker@portfolio:${path}$ `;
  const total = fullPrompt.length + cmd.length;
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    setTyped(0);
    const timer = setInterval(() => {
      setTyped((prev) => {
        if (prev >= total) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 26);
    return () => clearInterval(timer);
  }, [total, pathname]);

  const shown = Math.min(typed, total);
  return (
    <div style={s("font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #8B99A6; padding-bottom: 26px; border-bottom: 1px solid #26323D; margin-bottom: 34px;")}>
      <span style={s('color: #39FF88;')}>{fullPrompt.slice(0, shown)}</span>
      <span style={s('color: #E8EDF2;')}>
        {shown > fullPrompt.length ? cmd.slice(0, shown - fullPrompt.length) : ''}
      </span>
      <span style={s('display: inline-block; width: 7px; height: 13px; background: #4FD1FF; vertical-align: -2px; animation: blink 1s steps(1) infinite;')} />
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const cat = useSearchParams().get('cat') ?? 'manual';

  return (
    <aside style={s('width: 268px; flex: 0 0 268px; border-right: 1px solid #26323D; background: rgba(15,23,32,0.72); padding: 26px 18px 20px; display: flex; flex-direction: column; gap: 26px; position: sticky; top: 0; height: 100vh;')}>
      <Link href="/" style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 15px; letter-spacing: 0.06em; display: flex; align-items: center; gap: 2px; color: #F5F7FA;")}>
        <span style={s('color: #4FD1FF;')}>&gt;_</span>WhiteHacker
        <span style={s('display: inline-block; width: 8px; height: 15px; background: #4FD1FF; animation: blink 1.1s steps(1) 3;')} />
      </Link>

      <nav style={s('display: flex; flex-direction: column; gap: 1px;')}>
        <div style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6; letter-spacing: 0.08em; padding: 0 8px 10px;")}>
          whitehacker@portfolio
        </div>
        {NAV.map((item) => {
          const active = item.cat
            ? pathname === '/projects' && cat === item.cat
            : pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="h-nav f2"
              style={s(`cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 7px 8px; border-radius: 6px; border-left: 2px solid transparent; color: ${active ? TXT : DIM}; background: ${active ? '#1B2530' : 'transparent'}; border-left-color: ${active ? CY : 'transparent'};`)}
            >
              <span style={s('color: #26323D; font-size: 12px;')}>{item.branch}</span>
              <span style={s(`padding-left: ${item.indent ?? '0px'};`)}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={s('margin-top: auto; display: flex; flex-direction: column; gap: 14px;')}>
        <div style={s('display: flex; gap: 10px;')}>
          <a
            href="https://t.me/whitehackerstudio"
            target="_blank"
            rel="noreferrer"
            className="h-cyan"
            style={s("width: 36px; height: 36px; border: 1px solid #26323D; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}
          >
            TG
          </a>
          <a
            href="https://www.youtube.com/@WhiteHacker-studio"
            target="_blank"
            rel="noreferrer"
            className="h-cyan"
            style={s("width: 36px; height: 36px; border: 1px solid #26323D; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}
          >
            YT
          </a>
        </div>
        <AuthPanel />
      </div>
    </aside>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={s('min-height: 100vh; display: flex; background: #0B0F14; background-image: linear-gradient(rgba(79,209,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(79,209,255,0.05) 1px, transparent 1px), radial-gradient(circle at 18% 22%, rgba(79,209,255,0.06), transparent 45%); background-size: 46px 46px, 46px 46px, 100% 100%; color: #E8EDF2; font-family: Inter, system-ui, sans-serif;')}>
      <Suspense>
        <Sidebar />
      </Suspense>
      <main style={s('flex: 1; min-width: 0; padding: 30px 44px 90px; max-width: 1180px;')}>
        <Suspense>
          <PromptLine />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
