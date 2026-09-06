/**
 * Koreskill Campaign Studio — servidor mínimo
 *
 * Sirve la app estática. Las rutas de API quedan preparadas para el Sprint 3
 * (Supabase): hoy la app guarda todo en el navegador, así que el server no
 * necesita estado propio.
 */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// Healthcheck — Dokploy lo usa para saber si el contenedor está vivo
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Vista del cliente: /cliente/<id> sirve la misma app.
// La app lee el id de la URL cuando conectes Supabase (Sprint 3).
app.get('/cliente/:id', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

// Todo lo demás va al admin
app.get(/.*/, (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, '0.0.0.0', () =>
  console.log(`Campaign Studio escuchando en http://0.0.0.0:${PORT}`)
);
