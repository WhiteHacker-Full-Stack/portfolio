import type { CSSProperties } from 'react';

const cache = new Map<string, CSSProperties>();

/**
 * Turns a CSS declaration string into a React style object so the markup can
 * keep the design file's inline styles verbatim instead of hand-translating them.
 */
export function s(css: string): CSSProperties {
  const cached = cache.get(css);
  if (cached) return cached;

  const style: Record<string, string> = {};
  for (const declaration of css.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!property || !value) continue;
    const key = property.startsWith('--')
      ? property
      : property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    style[key] = value;
  }

  const result = style as CSSProperties;
  cache.set(css, result);
  return result;
}
