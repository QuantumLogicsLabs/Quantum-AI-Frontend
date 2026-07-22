/**
 * Same-origin BFF for Quantum Chat.
 * Strips Origin so Chat CORS cannot turn ai.quantumlogicslimited.com into HTTP 500.
 * Query `p` is the path under /api (e.g. auth/login, health).
 */
const CHAT_API = 'https://quantum-chat-backend.vercel.app/api';

module.exports = async function handler(req, res) {
  const suffix = String(req.query.p || '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  if (!suffix) {
    res.status(404).json({ success: false, error: 'Not found' });
    return;
  }

  const target = new URL(`${CHAT_API}/${suffix}`);
  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === 'p') continue;
    if (Array.isArray(value)) value.forEach((v) => target.searchParams.append(key, String(v)));
    else if (value != null) target.searchParams.set(key, String(value));
  }

  const headers = {};
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;

  const method = req.method || 'GET';
  const init = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    if (typeof req.body === 'string') init.body = req.body;
    else if (req.body != null) {
      init.body = JSON.stringify(req.body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.status(upstream.status).send(text);
  } catch (error) {
    console.error('qc proxy failed:', error);
    res.status(502).json({ success: false, error: 'Auth service unavailable' });
  }
};
