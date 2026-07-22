/** Allow only http(s) URLs for rendered links (blocks javascript:, data:, etc.). */
export function isSafeHttpUrl(raw: string | null | undefined): boolean {
  if (!raw || typeof raw !== 'string') return false;
  try {
    const url = new URL(raw, 'https://example.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** react-markdown urlTransform: keep http(s) and in-page anchors only. */
export function safeMarkdownUrl(url: string): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('#') && !trimmed.includes(':')) return trimmed;
  return isSafeHttpUrl(trimmed) ? trimmed : '';
}
