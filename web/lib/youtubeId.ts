const PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
  /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com\/(?:embed|v|shorts|live)\/)([A-Za-z0-9_-]{11})/,
];

/** Client-side twin of the server extractor, used only for the thumbnail preview. */
export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return /^[A-Za-z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}
