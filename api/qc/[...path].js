/**
 * Same-origin BFF for Quantum Chat auth.
 * Browser POSTs include Origin: https://ai.quantumlogicslimited.com; a plain
 * Vercel rewrite forwards that header and Chat's CORS middleware was turning
 * disallowed origins into HTTP 500. Proxy here without forwarding Origin.
 */
const CHAT_API = 'https://quantum-chat-backend.vercel.app/api';

function pathFromQuery(query) {
  const raw = query?.path;
  if (Array.isArray(raw)) return raw.map(encodeURIComponent).join('/');
  if (typeof raw === 'string' && raw.length) return raw.split('/').map(encodeURIComponent).join('/');
  return '';
}

export default async function handler(req, res) {
  const suffix = pathFromQuery(req.query);
  if (!suffix) {
    res.status(404).json({ success: false, error: 'Not found' });
    return;
  }

  const target = new URL(`${CHAT_API}/${suffix}`);
  // Preserve query string from the incoming request (excluding the catch-all path).
  for (const [key, value] of Object.entries(req.query ?? {})) {
    if (key === 'path') continue;
    if (Array.isArray(value)) value.forEach((v) => target.searchParams.append(key, String(v)));
    else if (value != null) target.searchParams.set(key, String(value));
  }

  const headers = {};
  const contentType = req.headers['content-type'];
  if (contentType) headers['Content-Type'] = contentType;
  const authorization = req.headers.authorization;
  if (authorization) headers.Authorization = authorization;

  const method = req.method || 'GET';
  /** @type {RequestInit} */
  const init = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    if (typeof req.body === 'string') {
      init.body = req.body;
    } else if (req.body != null) {
      init.body = JSON.stringify(req.body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) res.setHeader('Content-Type', upstreamType);
    res.status(upstream.status).send(text);
  } catch (error) {
    console.error('qc-api proxy failed:', error);
    res.status(502).json({ success: false, error: 'Auth service unavailable' });
  }
}
