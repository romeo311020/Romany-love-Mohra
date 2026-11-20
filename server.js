'use strict';

// Tiny dependency-free server: serves public/, stores answers, optional phone notification via ntfy.sh.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const NTFY_TOPIC = process.env.NTFY_TOPIC || '';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ANSWERS_FILE = path.join(DATA_DIR, 'answers.jsonl');
const PUBLIC_DIR = path.join(__dirname, 'public');

const CHOICES = {
  yes: 'موافقة',
  think: 'عايزة تفكر',
  no: 'مش حاسة بنفس الشعور'
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'"
].join('; ');

function baseHeaders(extra) {
  return Object.assign({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': CSP
  }, extra || {});
}

function send(res, status, body, headers) {
  res.writeHead(status, baseHeaders(headers));
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
}

// Simple per-IP limit: 10 answers per hour.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 3600 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 10;
}

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket.remoteAddress || 'unknown';
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function keyOk(given) {
  if (!ADMIN_KEY || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(ADMIN_KEY).digest();
  return crypto.timingSafeEqual(a, b);
}

function readAnswers() {
  try {
    return fs.readFileSync(ANSWERS_FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch (e) {
    return [];
  }
}

async function notify(entry) {
  if (!NTFY_TOPIC) return;
  try {
    await fetch('https://ntfy.sh/' + encodeURIComponent(NTFY_TOPIC), {
      method: 'POST',
      headers: { Title: 'Mohra answered', Priority: 'high', Tags: 'heart' },
      body: 'الاختيار: ' + CHOICES[entry.choice] + (entry.message ? '\n\n' + entry.message : '')
    });
  } catch (e) {
    console.error('ntfy failed:', e.message);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function handleAnswer(req, res) {
  if (limited(clientIp(req))) return sendJson(res, 429, { ok: false, error: 'too_many' });

  let data;
  try {
    data = JSON.parse(await readBody(req, 4096));
  } catch (e) {
    return sendJson(res, 400, { ok: false, error: 'bad_request' });
  }

  const choice = data && data.choice;
  if (!Object.prototype.hasOwnProperty.call(CHOICES, choice)) {
    return sendJson(res, 400, { ok: false, error: 'bad_choice' });
  }
  const message = typeof data.message === 'string' ? data.message.trim().slice(0, 500) : '';

  const entry = { at: new Date().toISOString(), choice, message };
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(ANSWERS_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('save failed:', e.message);
    await notify(entry);
    return sendJson(res, 500, { ok: false, error: 'save_failed' });
  }
  await notify(entry);
  sendJson(res, 200, { ok: true });
}

function handleAdmin(req, res, url) {
  if (!ADMIN_KEY) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  if (!keyOk(url.searchParams.get('key'))) return send(res, 401, 'Unauthorized', { 'Content-Type': 'text/plain; charset=utf-8' });

  const rows = readAnswers().reverse().map(a =>
    '<tr><td>' + escapeHtml(new Date(a.at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })) + '</td>' +
    '<td><b>' + escapeHtml(CHOICES[a.choice] || a.choice) + '</b></td>' +
    '<td>' + escapeHtml(a.message || '') + '</td></tr>'
  ).join('');

  const html = '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>الردود</title>' +
    '<style>body{font:16px/1.7 system-ui,sans-serif;margin:0;padding:1rem;background:#0d1130;color:#ecebf7}' +
    'table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #2a2f66;padding:.6rem;text-align:start;vertical-align:top}' +
    '.wrap{overflow-x:auto}</style>' +
    '<h1>الردود</h1><div class="wrap"><table><tr><th>الوقت</th><th>الاختيار</th><th>الرسالة</th></tr>' +
    (rows || '<tr><td colspan="3">مفيش ردود لسه.</td></tr>') +
    '</table></div></html>';
  send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
}

function handleStatic(req, res, url) {
  let rel;
  try {
    rel = decodeURIComponent(url.pathname);
  } catch (e) {
    return send(res, 400, 'Bad request', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  if (rel === '/') rel = '/index.html';
  const file = path.join(PUBLIC_DIR, path.normalize(rel));
  if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + path.sep)) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    send(res, 200, buf, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/answer' && req.method === 'POST') return handleAnswer(req, res);
  if (url.pathname === '/admin' && req.method === 'GET') return handleAdmin(req, res, url);
  if (req.method === 'GET' || req.method === 'HEAD') return handleStatic(req, res, url);
  send(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
});

server.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
  if (!ADMIN_KEY) console.log('ADMIN_KEY is not set: /admin is disabled.');
  if (!NTFY_TOPIC) console.log('NTFY_TOPIC is not set: no phone notification.');
});
