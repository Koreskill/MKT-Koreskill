/* =====================================================================
   KORESKILL CAMPAIGN STUDIO v2
   El sistema es un organizador inteligente, no un generador automático.
   Benja hace el trabajo creativo con Claude.ai.
   El sistema estructura, visualiza y almacena.
   ===================================================================== */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

/* ── health ── */
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, version: 'v2', ts: Date.now() }));

/* ── fetch url server-side (para leer instagram/web del cliente) ── */
app.post('/api/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!/^https?:\/\//i.test(url || ''))
      return res.status(400).json({ error: 'URL inválida' });
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000)
    });
    const html = await r.text();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || url).trim().slice(0, 120);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ').trim().slice(0, 60000);
    res.json({ title, text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () =>
  console.log(`Koreskill Studio v2 en :${PORT}`));
