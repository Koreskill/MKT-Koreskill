/* =====================================================================
   KORESKILL CAMPAIGN STUDIO — backend v2
   Flujo continuo: marca → productos → plan → producción → entrega.
   ===================================================================== */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_TPM_LIMIT = Math.max(1000, Number.parseInt(process.env.OPENAI_TPM_LIMIT || '30000', 10));
const OPENAI_REQUEST_TOKEN_BUDGET = Math.max(
  5000,
  Math.min(10000, Number.parseInt(process.env.OPENAI_REQUEST_TOKEN_BUDGET || '9000', 10))
);
const OPENAI_TIMEOUT_MS = Math.max(30000, Number.parseInt(process.env.OPENAI_TIMEOUT_MS || '90000', 10));
const OPENAI_MAX_RETRIES = Math.max(0, Math.min(3, Number.parseInt(process.env.OPENAI_MAX_RETRIES || '2', 10)));
const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL = process.env.REPLICATE_MODEL || 'black-forest-labs/flux-1.1-pro';
const REPLICATE_TIMEOUT_MS = Math.max(15000, Number.parseInt(process.env.REPLICATE_TIMEOUT_MS || '45000', 10));
const PORT = process.env.PORT || 3000;

const METODO = `
Sos estratega de Koreskill para negocios locales de Argentina y Uruguay.
Trabajás con la información real del negocio y ordenás un proceso simple:
información → productos y objetivo → plan del mes → producción → revisión y
aprobación → entrega → publicación y consultas → aprendizaje para el próximo mes.

REGLAS:
— No inventes datos, precios, resultados ni casos de éxito.
— Si algo no aparece, escribí PENDIENTE y explicá qué falta.
— Cada pieza tiene una función concreta: atraer, explicar, mostrar, convertir o seguir.
— Escribí en español rioplatense, con voseo, frases cortas y cero jerga innecesaria.
— Separá HECHO, INFERENCIA y PENDIENTE cuando sea útil.
— Koreskill ordena la estrategia, produce los materiales y deja una entrega accionable.
`.trim();

const ETAPAS = {
  marca: `MOMENTO 1 — MARCA Y CONTEXTO (máximo 450 palabras).

Ordená la información disponible en:
1. QUÉ HACE EL NEGOCIO.
2. PARA QUIÉN VENDE.
3. DÓNDE VENDE Y CÓMO RECIBE CONSULTAS.
4. QUÉ LO HACE DIFERENTE, solo si está respaldado por el material.
5. TONO Y ESTILO que conviene usar.
6. QUÉ FALTA CONFIRMAR.

Cerrá con: DIAGNÓSTICO EN UNA FRASE. No armes un avatar extenso ni inventes perfiles.
`,
  productos: `MOMENTO 2 — PRODUCTOS Y OFERTA (máximo 450 palabras).

Ordená los productos o servicios recibidos. Para cada uno indicá:
NOMBRE · QUÉ RESUELVE · PRECIO SI EXISTE · CÓMO SE COMPRA · QUÉ SE PUEDE MOSTRAR.

Después indicá:
PRODUCTO O SERVICIO A IMPULSAR ESTE MES · MOTIVO · DATOS PENDIENTES.
Si no hay datos suficientes, no completes con suposiciones.
`,
  plan: `MOMENTO 3 — PLAN DEL MES (máximo 700 palabras).

Con el objetivo y los productos disponibles armá un plan simple:
1. OBJETIVO DEL MES.
2. MENSAJE CENTRAL.
3. TRES TIPOS DE CONTENIDO: atraer, explicar y convertir.
4. CALENDARIO SUGERIDO de hasta 12 piezas: DÍA · FORMATO · TÍTULO · OBJETIVO · CTA.
5. QUÉ NECESITAMOS QUE ENVÍE EL CLIENTE.
6. QUÉ VAMOS A MEDIR: consultas, ventas u otra métrica disponible.

No prometas una cantidad de ventas. Priorizá claridad y continuidad.
`,
  produccion: `MOMENTO 4 — PRODUCCIÓN (máximo 600 palabras).

Convertí el plan en una lista ejecutable:
1. PIEZAS VISUALES: qué se produce y qué debe mostrar.
2. VIDEOS: gancho, desarrollo y cierre.
3. COPIES: estructura del texto y CTA.
4. RESPUESTAS DE WHATSAPP: saludo, consulta, objeción, seguimiento, cierre y postventa.
5. REVISIÓN: qué tiene que aprobar el cliente antes de publicar.

Todo debe poder entenderlo y usarlo el dueño del negocio.
`,
  entrega: `MOMENTO 5 — ENTREGA Y PRÓXIMO PASO (máximo 450 palabras).

Escribí un resumen operativo para el cliente:
1. QUÉ SE PREPARÓ.
2. QUÉ TIENE QUE REVISAR Y APROBAR.
3. QUÉ RECIBE Y DÓNDE LO ENCUENTRA.
4. QUÉ PUBLICAR PRIMERO.
5. CÓMO RESPONDER LAS CONSULTAS.
6. QUÉ APRENDER PARA EL PRÓXIMO MES.

Frases cortas. Sin lenguaje de agencia.
`
};

const PROMPT_ENGINE = `
Generás prompts de imagen para Koreskill a partir de una marca, sus productos y
un plan mensual. Devolvé únicamente JSON válido con este formato exacto:
{"prompts":[{"n":1,"formato":"1:1","modo":"light","titulo":"","tipo":"","prompt":"","negative":""}]}

Cada prompt debe ser completo, concreto y listo para pegar en un generador. Escribilo
en español rioplatense. Indicá formato, composición, sujeto, iluminación, paleta,
espacio seguro para texto y continuidad visual cuando corresponda. Si incluye texto,
escribilo exactamente y aclaralo. Priorizá negocios reales de barrio, personas
auténticas y productos coherentes con la información recibida. No inventes precios,
marcas ni características del producto. No incluyas botones de CTA dentro de la imagen.
`.trim();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function compactText(value, maxChars) {
  const text = String(value || '')
    .replace(/\0/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n')
    .trim();
  if (text.length <= maxChars) return text;
  const marker = '\n\n[... contenido recortado para respetar el límite ...]\n\n';
  const available = Math.max(0, maxChars - marker.length);
  const head = Math.floor(available * 0.72);
  return text.slice(0, head) + marker + text.slice(-Math.max(0, available - head));
}

function estimateTokens(value) {
  return Math.ceil(String(value || '').length / 3) + 4;
}

function fitMessagesToBudget(messages, inputBudget) {
  const fitted = messages.map(message => ({ ...message, content: String(message.content || '') }));
  let total = fitted.reduce((sum, message) => sum + estimateTokens(message.content), 2);
  if (total <= inputBudget) return fitted;

  const candidates = fitted
    .map((message, index) => ({ index, role: message.role, size: message.content.length }))
    .filter(item => item.role === 'user')
    .sort((a, b) => b.size - a.size);

  for (const candidate of candidates) {
    const current = fitted[candidate.index];
    const others = total - estimateTokens(current.content);
    const allowedTokens = Math.max(500, inputBudget - others);
    current.content = compactText(current.content, allowedTokens * 3);
    total = fitted.reduce((sum, message) => sum + estimateTokens(message.content), 2);
    if (total <= inputBudget) break;
  }
  return fitted;
}

function parseWaitHeader(value) {
  if (!value) return 0;
  if (/^\d+(\.\d+)?$/.test(value)) return Math.ceil(Number(value) * 1000);
  const units = { ms: 1, s: 1000, m: 60000 };
  return [...String(value).matchAll(/(\d+(?:\.\d+)?)(ms|s|m)/g)]
    .reduce((sum, match) => sum + Number(match[1]) * units[match[2]], 0);
}

function retryDelay(response, attempt) {
  const retryAfter = parseWaitHeader(response?.headers?.get('retry-after'));
  const reset = parseWaitHeader(response?.headers?.get('x-ratelimit-reset-tokens'));
  return Math.min(20000, Math.max(retryAfter, reset, 1200 * (2 ** attempt)));
}

const openaiUsageWindow = [];
async function waitForTokenCapacity(expectedTokens) {
  const safeLimit = Math.max(1000, Math.floor(OPENAI_TPM_LIMIT * 0.75));
  while (true) {
    const now = Date.now();
    while (openaiUsageWindow.length && now - openaiUsageWindow[0].at >= 60000) openaiUsageWindow.shift();
    const used = openaiUsageWindow.reduce((sum, item) => sum + item.tokens, 0);
    if (used + expectedTokens <= safeLimit) return;
    await sleep(Math.min(30000, Math.max(500, 60200 - (now - openaiUsageWindow[0].at))));
  }
}

function recordTokenUsage(tokens) {
  openaiUsageWindow.push({ at: Date.now(), tokens: Math.max(1, Number(tokens) || 1) });
}

let openaiQueue = Promise.resolve();
function enqueueOpenAI(task) {
  const queued = openaiQueue.catch(() => {}).then(task);
  openaiQueue = queued.catch(() => {});
  return queued;
}

async function openai(messages, { json = false, maxTokens = 1600 } = {}) {
  if (!OPENAI_KEY) throw new Error('Falta OPENAI_API_KEY en el servidor');

  return enqueueOpenAI(async () => {
    let lastStatus = 0;
    let lastBody = '';
    for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
      const outputBudget = Math.max(500, Math.min(maxTokens, 1600));
      const inputBudget = Math.max(2500, OPENAI_REQUEST_TOKEN_BUDGET - outputBudget);
      const fittedMessages = fitMessagesToBudget(messages, inputBudget);
      const expectedTokens = fittedMessages.reduce((sum, message) => sum + estimateTokens(message.content), 2) + outputBudget;
      await waitForTokenCapacity(expectedTokens);

      let response;
      try {
        response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: fittedMessages,
            temperature: json ? 0 : 0.35,
            max_tokens: outputBudget,
            ...(json ? { response_format: { type: 'json_object' } } : {})
          }),
          signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS)
        });
      } catch (error) {
        if (attempt < OPENAI_MAX_RETRIES && ['TimeoutError', 'AbortError'].includes(error?.name)) {
          await sleep(Math.min(10000, 1200 * (2 ** attempt)));
          continue;
        }
        throw new Error('OpenAI tardó demasiado en responder. Probá de nuevo en unos segundos.');
      }

      lastStatus = response.status;
      if (response.ok) {
        const payload = await response.json();
        recordTokenUsage(payload.usage?.total_tokens || expectedTokens);
        return payload.choices?.[0]?.message?.content || '';
      }

      lastBody = await response.text();
      if ([408, 409, 429, 500, 502, 503, 504].includes(response.status) && attempt < OPENAI_MAX_RETRIES) {
        await sleep(retryDelay(response, attempt));
        continue;
      }
      break;
    }

    console.error(`[OpenAI] status=${lastStatus} ${lastBody.slice(0, 400)}`);
    if (lastStatus === 429) throw new Error('OpenAI está temporalmente al límite. La solicitud ya fue reducida; esperá unos segundos y volvé a intentarlo.');
    if ([401, 403].includes(lastStatus)) throw new Error('La clave de OpenAI no es válida o no tiene acceso al modelo configurado.');
    throw new Error(`OpenAI no pudo completar la generación${lastStatus ? ` (error ${lastStatus})` : ''}.`);
  });
}

function parseJsonOutput(raw) {
  const clean = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? clean.slice(start, end + 1) : clean;
  try { return JSON.parse(candidate); }
  catch { throw new Error('La IA devolvió una respuesta incompleta. Volvé a generar esta sección.'); }
}

function contextFor({ cliente = {}, fuentes = '', previo = '', productos = '', plan = '' } = {}) {
  return [
    `NEGOCIO: ${cliente.nombre || 'Sin nombre'} · RUBRO: ${cliente.rubro || 'Pendiente'} · ${cliente.ciudad || 'Ciudad pendiente'}, ${cliente.pais || 'Argentina'}`,
    `CONTACTO: ${cliente.whatsapp || 'Pendiente'} · INSTAGRAM: ${cliente.instagram || 'Pendiente'} · WEB: ${cliente.web || 'Pendiente'}`,
    `MARCA / CONTEXTO:\n${compactText(previo, 5500)}`,
    `PRODUCTOS:\n${compactText(productos, 4500)}`,
    `PLAN:\n${compactText(plan, 5500)}`,
    `MATERIAL ORIGINAL:\n${compactText(fuentes, 7000)}`
  ].join('\n\n');
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  openai: !!OPENAI_KEY,
  replicate: !!REPLICATE_KEY,
  model: OPENAI_MODEL,
  imgModel: REPLICATE_MODEL
}));

app.post('/api/analyze', async (req, res) => {
  try {
    const { etapa, cliente = {}, previo = '', fuentes = '', productos = [], plan = '' } = req.body;

    if (etapa === 'ficha') {
      const raw = await openai([
        { role: 'system', content: 'Extraé solo datos presentes de un negocio local. Devolvé JSON válido: {"nombre":"","rubro":"","ciudad":"","pais":"Argentina","instagram":"","whatsapp":"","web":"","descripcion":"","diferencial":"","tono":""}. No inventes.' },
        { role: 'user', content: `MATERIAL:\n${compactText(fuentes, 12000)}` }
      ], { json: true, maxTokens: 450 });
      return res.json({ ficha: parseJsonOutput(raw) });
    }

    if (!ETAPAS[etapa]) return res.status(400).json({ error: `momento inválido: "${etapa}"` });
    const prompt = `${contextFor({ cliente, previo, fuentes, productos: JSON.stringify(productos), plan })}\n\n${ETAPAS[etapa]}`;
    const raw = await openai([
      { role: 'system', content: METODO },
      { role: 'user', content: prompt }
    ], { maxTokens: etapa === 'plan' ? 1500 : 1200 });
    res.json({ texto: raw });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/prompts', async (req, res) => {
  try {
    const { cliente = {}, marca = '', productos = [], plan = '', cantidad = 6 } = req.body;
    if (!plan && !productos.length) return res.status(400).json({ error: 'Completá el plan o agregá productos antes de producir.' });
    const raw = await openai([
      { role: 'system', content: PROMPT_ENGINE },
      { role: 'user', content: `${contextFor({ cliente, previo: marca, productos: JSON.stringify(productos), plan })}\n\nGenerá ${Math.min(12, Math.max(1, Number(cantidad) || 6))} prompts variados según el plan.` }
    ], { json: true, maxTokens: 1600 });
    res.json(parseJsonOutput(raw));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/guiones', async (req, res) => {
  try {
    const { cliente = {}, marca = '', productos = [], plan = '', cantidad = 4 } = req.body;
    const raw = await openai([
      { role: 'system', content: 'Generá guiones UGC para negocios locales. Español rioplatense y voseo. JSON válido: {"guiones":[{"n":1,"titulo":"","duracion":"30s","gancho":"","bloques":[{"t":"0-3s","voz":"","imagen":""}],"cierre":""}]}. Cada guion debe tener gancho, desarrollo, prueba o demostración y cierre con próximo paso.' },
      { role: 'user', content: `${contextFor({ cliente, previo: marca, productos: JSON.stringify(productos), plan })}\n\nGenerá ${Math.min(8, Math.max(1, Number(cantidad) || 4))} guiones.` }
    ], { json: true, maxTokens: 1600 });
    res.json(parseJsonOutput(raw));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/copies', async (req, res) => {
  try {
    const { cliente = {}, marca = '', productos = [], plan = '', cantidad = 12 } = req.body;
    const raw = await openai([
      { role: 'system', content: 'Escribí copies de publicaciones para negocios locales argentinos. JSON válido: {"copies":[{"n":1,"formato":"feed|story|reel|carousel","tipo":"atraer|explicar|convertir","gancho":"","cuerpo":"","cta":"","hashtags":""}]}. Voseo, claros, sin promesas inventadas y con CTA a consulta o compra.' },
      { role: 'user', content: `${contextFor({ cliente, previo: marca, productos: JSON.stringify(productos), plan })}\n\nGenerá ${Math.min(18, Math.max(1, Number(cantidad) || 12))} copies.` }
    ], { json: true, maxTokens: 1600 });
    res.json(parseJsonOutput(raw));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/whatsapp', async (req, res) => {
  try {
    const { cliente = {}, marca = '', productos = [], plan = '' } = req.body;
    const raw = await openai([
      { role: 'system', content: 'Escribí respuestas de WhatsApp Business para un negocio local. JSON válido: {"plantillas":[{"n":1,"momento":"","cuando":"","texto":"","porque":""}]}. Nunca respondas solo con precio: agregá contexto y un próximo paso. Incluí saludo, consulta, objeción, seguimiento, cierre y postventa.' },
      { role: 'user', content: `${contextFor({ cliente, previo: marca, productos: JSON.stringify(productos), plan })}` }
    ], { json: true, maxTokens: 1400 });
    res.json(parseJsonOutput(raw));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

/* Imagen queda disponible como herramienta opcional; no es parte del flujo básico. */
app.post('/api/imagen', async (req, res) => {
  try {
    const { prompt, aspect = '1:1' } = req.body;
    if (!REPLICATE_KEY) return res.status(400).json({ error: 'Falta REPLICATE_API_TOKEN' });
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });
    const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REPLICATE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt, aspect_ratio: aspect, output_format: 'jpg', output_quality: 90 } }),
      signal: AbortSignal.timeout(REPLICATE_TIMEOUT_MS)
    });
    if (!create.ok) return res.status(502).json({ error: `No se pudo iniciar la imagen en Replicate (error ${create.status}).` });
    const prediction = await create.json();
    if (prediction.status === 'succeeded' && prediction.output) return res.json({ id: prediction.id, status: 'succeeded', url: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output });
    res.json({ id: prediction.id, status: prediction.status });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/imagen/:id', async (req, res) => {
  try {
    if (!REPLICATE_KEY) return res.status(400).json({ error: 'Falta REPLICATE_API_TOKEN' });
    const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_KEY}` },
      signal: AbortSignal.timeout(REPLICATE_TIMEOUT_MS)
    });
    if (!response.ok) return res.status(502).json({ error: `No se pudo consultar la imagen (error ${response.status}).` });
    const prediction = await response.json();
    res.json({ id: prediction.id, status: prediction.status, url: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output, error: prediction.error });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!/^https?:\/\//i.test(url || '')) return res.status(400).json({ error: 'URL inválida' });
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
    const html = await response.text();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || url).trim().slice(0, 120);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
      .replace(/\s{2,}/g, ' ').trim().slice(0, 50000);
    res.json({ title, text });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`Koreskill Studio en :${PORT} · openai ${OPENAI_KEY ? 'ok' : 'FALTA'} · replicate ${REPLICATE_KEY ? 'ok' : 'FALTA'}`));
