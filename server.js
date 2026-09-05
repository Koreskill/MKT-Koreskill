/* =====================================================================
   KORESKILL CAMPAIGN STUDIO — backend v1
   Sistema de producción de campañas de marketing para negocios locales.
   6 etapas · OpenAI para análisis · Replicate para imágenes · Supabase opcional
   ===================================================================== */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const OPENAI_KEY    = process.env.OPENAI_API_KEY;
const OPENAI_MODEL  = process.env.OPENAI_MODEL || 'gpt-4.1';
const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN;
const REPLICATE_MODEL = process.env.REPLICATE_MODEL || 'black-forest-labs/flux-1.1-pro';
const PORT = process.env.PORT || 3000;

/* =====================================================================
   MÉTODO — el sistema de trabajo que guía todas las etapas
   ===================================================================== */
const METODO = `
Sos el estratega de Koreskill, una agencia de contenido para negocios locales
de Argentina y Uruguay. Trabajás con panaderías, dietéticas, ferreterías,
peluquerías, veterinarias, marcas artesanales.

REGLAS DEL MÉTODO:
— Separá HECHO / INFERENCIA / SUPUESTO. Si un dato no está, decilo.
— No inventes números ni resultados. Nunca prometas cifras.
— Todo lo que escribas tiene que ser accionable para un dueño de negocio
  que no sabe de marketing.
— El contenido sin objetivo no sirve. Cada pieza tiene que tener una función.
— El enemigo del cliente no es la competencia: es publicar sin sistema.
— Escribí en español rioplatense. Voseo. Texto plano, sin markdown decorativo.
— Títulos cortos en MAYÚSCULA. Cero preámbulos, cero disclaimers.
— Un negocio local no necesita ser una marca global. Necesita ser
  la primera opción de su barrio.
`.trim();

/* =====================================================================
   LAS 6 ETAPAS DEL SISTEMA
   ===================================================================== */
const ETAPAS = {

  e1: `ETAPA 1 — IDENTIDAD DE MARCA (máx 600 palabras).

QUÉ ES EL NEGOCIO · HISTORIA (cómo empezó, quién lo lleva, cuánto hace) ·
UBICACIÓN Y ALCANCE (barrio, ciudad, ¿envía a todo el país?) ·
PERSONALIDAD DE MARCA (cómo habla, qué tono usa, formal o cercano) ·
DIFERENCIAL REAL (qué hace distinto de verdad, no lo que dice el folleto) ·
LO QUE NO ES (qué tipo de negocio NO quiere ser) ·
ACTIVOS ACTUALES (¿tiene logo? ¿colores? ¿fotos? ¿redes activas?) ·
NIVEL DIGITAL (de 0 a 5: cero presencia / publica a veces / publica con sistema).

Cerrá con: EN UNA FRASE — quién es este negocio y para quién existe.`,

  e2: `ETAPA 2 — PRODUCTO Y OFERTA (máx 600 palabras).

PRODUCTO PRINCIPAL (el que más se vende o el que más margen deja) ·
PRODUCTOS SECUNDARIOS (qué más ofrece) ·
PRECIOS Y TICKET PROMEDIO ·
CÓMO SE COMPRA (mostrador / WhatsApp / delivery / envío nacional) ·
QUÉ HACE ESPECIAL AL PRODUCTO (ingredientes, proceso, tiempo, origen) ·
PRUEBA VISUAL (¿el producto se ve bien en foto? ¿qué se puede mostrar?) ·
ESTACIONALIDAD (¿hay picos? ¿fechas clave?) ·
CAPACIDAD (¿puede absorber más demanda? ¿cuánto?).

Cerrá con: EL PRODUCTO A IMPULSAR ESTE MES — uno solo, con el motivo.`,

  e3: `ETAPA 3 — AVATAR Y DOLORES (máx 800 palabras).

AVATAR PRIMARIO (demografía + situación de vida + momento de compra) ·
AVATAR SECUNDARIO (el segundo grupo que compra) ·

DOLORES JERARQUIZADOS (5, del más intenso al menos):
1. Emocional — qué siente que le falta
2. Funcional — qué problema práctico tiene
3. Social — qué le preocupa de cómo lo ven
4. Económico — qué alternativa está evaluando
5. Identidad — qué historia se cuenta a sí mismo

SUEÑOS Y RESULTADOS (qué quiere lograr, en sus propias palabras) ·
OBJECIONES (5 razones por las que NO compra hoy) ·
DÓNDE ESTÁ (qué redes usa, a qué hora, qué consume) ·
DISPARADORES DE COMPRA (qué situación lo hace comprar hoy y no mañana).

Cerrá con: LA CONEXIÓN — cómo este producto resuelve el dolor #1 de este avatar.`,

  e4: `ETAPA 4 — ESTRATEGIA DE CONTENIDO (máx 900 palabras).

LOS 3 ÁNGULOS DE COMUNICACIÓN:
Para cada uno: NOMBRE · A QUIÉN LE HABLA · QUÉ DICE · QUÉ ACCIÓN BUSCA.
Ángulo A — emocional (conecta con el dolor)
Ángulo B — comercial (muestra el producto y el precio)
Ángulo C — educativo (enseña algo útil, genera autoridad)

DISTRIBUCIÓN DEL MES:
Cuántas piezas de cada ángulo y por qué esa proporción.

CALENDARIO SUGERIDO:
12 publicaciones. Para cada una: DÍA · FORMATO (feed/reel/story) ·
ÁNGULO · TEMA · OBJETIVO CONCRETO.

EMBUDO:
TOFU (qué contenido para quien no conoce) ·
MOFU (qué contenido para quien ya vio) ·
BOFU (qué contenido para quien está por comprar).

MÉTRICA DE ÉXITO:
Qué número hay que mirar este mes y cuál es un resultado razonable.`,

  e5: `ETAPA 5 — PLAN DE PRODUCCIÓN (máx 900 palabras).

IMÁGENES A PRODUCIR:
Lista de 12 piezas. Para cada una:
NÚMERO · FORMATO (1:1 / 4:5 / 9:16) · ÁNGULO · CONCEPTO EN UNA LÍNEA ·
QUÉ TIENE QUE MOSTRAR.

VIDEOS A PRODUCIR:
Lista de 4 videos. Para cada uno:
NÚMERO · DURACIÓN · GANCHO (primeros 3 segundos) · ESTRUCTURA · CIERRE.

COPIES:
Estructura de los textos: qué gancho usar, cuánto texto, qué CTA.

WHATSAPP:
5 plantillas de respuesta: saludo, consulta de precio, objeción,
seguimiento, cierre.

QUÉ NECESITAMOS DEL CLIENTE:
Lista concreta de qué fotos, datos o materiales tiene que mandar.`,

  e6: `ETAPA 6 — BRIEF DE ENTREGA (máx 600 palabras).

RESUMEN EJECUTIVO (3 líneas: qué se hizo y para qué) ·
EL ÁNGULO ELEGIDO (cuál se aprobó y por qué) ·
QUÉ RECIBE EL CLIENTE (lista de entregables con cantidad) ·
CALENDARIO DE PUBLICACIÓN (qué publicar y cuándo) ·
CÓMO USAR EL CONTENIDO (instrucciones simples, sin jerga) ·
QUÉ MEDIR (2 o 3 números concretos) ·
PRÓXIMO MES (qué recomendamos hacer después).

Escribí esto para que lo lea el dueño del negocio, no un marketer.
Cero jerga. Frases cortas.`
};

/* =====================================================================
   SISTEMA DE PROMPTS DE IMAGEN — basado en ads-image-architect
   ===================================================================== */
const PROMPT_ENGINE = `
Generás prompts de imagen para Meta Ads siguiendo el método Koreskill.

REGLAS DE ORO:
— El prompt va en INGLÉS. Los textos incrustados en la imagen van en
  ESPAÑOL RIOPLATENSE.
— NUNCA incluyas botones CTA dentro de la imagen. Meta los pone aparte.
— Siempre incluí una sección ANTI-AI RULES al final con reglas concretas
  que eviten el look de stock photo o render 3D.
— Los formatos disponibles: 1:1 (feed), 4:5 (feed vertical), 9:16 (stories/reels).
— Especificá SIEMPRE: formato, modo (light/dark), paleta con HEX,
  composición por zonas, tipografía si lleva texto.

FORMATOS DE LA BIBLIOTECA (elegí el que corresponda al ángulo):
1. Before/After editorial — comparación visual de un resultado
2. Raw selfie + caption — UGC auténtico estilo Instagram
3. Chat iMessage — conversación entre dos personas
4. Noticiero digital — artículo de prensa ficticio
5. Notes app — reflexión personal nocturna
6. Data card — métricas y números sobre fondo oscuro
7. Reddit thread — testimonio orgánico con caveat honesto
8. Ticket/recibo — la oferta como comprobante de papel
9. Tipografía dramática — problema vs solución, puro texto
10. POV del local — primera persona desde el negocio

ANTI-AI RULES OBLIGATORIAS EN CADA PROMPT:
— Personas: deben verse reales del país objetivo, NO modelos de stock
— Locales: deben verse como negocios reales de barrio, NO showrooms
— Carteles de precio: escritos a mano en cartón, NO gráficos digitales
— Interfaces: genéricas, NUNCA logos reales de apps
— Iluminación: natural o práctica del lugar, NO estudio
— Sin gradientes decorativos, sin neones, sin efectos

Devolvés SIEMPRE un JSON con este esquema exacto:
{"prompts":[{"n":1,"formato":"1:1","modo":"dark","titulo":"","angulo":"","prompt":"","negative":""}]}
`.trim();

/* =====================================================================
   HELPERS
   ===================================================================== */
async function openai(messages, { json = false, maxTokens = 3000 } = {}) {
  if (!OPENAI_KEY) throw new Error('Falta OPENAI_API_KEY en el servidor');
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: json ? 0 : 0.4,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {})
    })
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`OpenAI ${r.status}: ${t.slice(0, 300)}`); }
  return (await r.json()).choices?.[0]?.message?.content || '';
}

/* =====================================================================
   ENDPOINTS
   ===================================================================== */

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  openai: !!OPENAI_KEY,
  replicate: !!REPLICATE_KEY,
  model: OPENAI_MODEL,
  imgModel: REPLICATE_MODEL
}));

/* ---- ANALYZE — corre una etapa del sistema ---- */
app.post('/api/analyze', async (req, res) => {
  try {
    const { etapa, cliente = {}, previo = {}, fuentes = '' } = req.body;

    /* Autocompletar la ficha del cliente desde las fuentes */
    if (etapa === 'ficha') {
      const raw = await openai([
        { role: 'system', content:
          'Extraés datos de identificación de un negocio local a partir de textos, ' +
          'links o notas. Devolvés SOLO JSON: ' +
          '{"nombre":"","rubro":"","ciudad":"","pais":"Argentina","instagram":"","whatsapp":"","web":""}. ' +
          'rubro: categoría específica (panadería, dietética, ferretería, etc). ' +
          'Si un dato no aparece, dejá el campo vacío. No inventes.' },
        { role: 'user', content: `Extraé la ficha del negocio:\n\n${fuentes}` }
      ], { json: true, maxTokens: 400 });
      return res.json({ ficha: JSON.parse(raw) });
    }

    if (!ETAPAS[etapa]) return res.status(400).json({ error: `etapa inválida: "${etapa}"` });

    const ctx = `NEGOCIO: ${cliente.nombre || '?'} · RUBRO: ${cliente.rubro || '—'} · ` +
                `CIUDAD: ${cliente.ciudad || '—'}, ${cliente.pais || 'Argentina'}`;

    /* Cada etapa recibe el contexto de las anteriores */
    const orden = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'];
    const idx = orden.indexOf(etapa);
    const contextoPrevio = orden.slice(0, idx)
      .map(k => previo[k] ? `--- ${k.toUpperCase()} ---\n${previo[k]}` : '')
      .filter(Boolean).join('\n\n').slice(0, 14000);

    const prev = contextoPrevio ? `\n\n=== ETAPAS ANTERIORES ===\n${contextoPrevio}` : '';

    const texto = await openai([
      { role: 'system', content: METODO },
      { role: 'user', content: `${ctx}\n\n${ETAPAS[etapa]}${prev}\n\n=== MATERIAL DEL CLIENTE ===\n${fuentes}` }
    ], { maxTokens: 3400 });

    res.json({ texto });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- PROMPTS — genera los prompts de imagen desde la estrategia ---- */
app.post('/api/prompts', async (req, res) => {
  try {
    const { cliente = {}, estrategia = '', produccion = '', cantidad = 6, paleta = '' } = req.body;

    if (!estrategia && !produccion)
      return res.status(400).json({ error: 'Necesito la etapa de estrategia o producción primero.' });

    const raw = await openai([
      { role: 'system', content: PROMPT_ENGINE },
      { role: 'user', content:
        `NEGOCIO: ${cliente.nombre || ''} · ${cliente.rubro || ''} · ${cliente.ciudad || ''}, ${cliente.pais || 'Argentina'}\n` +
        `PALETA: ${paleta || '#FF7970 salmón · #202020 tinta · #F0EDE8 crema'}\n\n` +
        `ESTRATEGIA:\n${estrategia.slice(0, 8000)}\n\n` +
        `PLAN DE PRODUCCIÓN:\n${produccion.slice(0, 8000)}\n\n` +
        `Generá ${cantidad} prompts de imagen. Variá los formatos de la biblioteca. ` +
        `Cada prompt tiene que ser completo y listo para pegar en un generador.` }
    ], { json: true, maxTokens: 4000 });

    res.json(JSON.parse(raw));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- GUIONES — genera guiones de video desde la estrategia ---- */
app.post('/api/guiones', async (req, res) => {
  try {
    const { cliente = {}, estrategia = '', cantidad = 4 } = req.body;

    const raw = await openai([
      { role: 'system', content:
        'Generás guiones de video UGC para negocios locales argentinos. ' +
        'Formato vertical 9:16, entre 20 y 45 segundos. ' +
        'Estructura obligatoria: GANCHO (3s) / AGITACIÓN / SOLUCIÓN / CIERRE. ' +
        'Español rioplatense, voseo, lenguaje de dueño de negocio real. ' +
        'SOLO JSON: {"guiones":[{"n":1,"titulo":"","duracion":"","gancho":"","bloques":[{"t":"0-3s","voz":"","imagen":""}],"cierre":""}]}' },
      { role: 'user', content:
        `NEGOCIO: ${cliente.nombre || ''} · ${cliente.rubro || ''}\n\n` +
        `ESTRATEGIA:\n${estrategia.slice(0, 8000)}\n\n` +
        `Generá ${cantidad} guiones distintos, uno por ángulo de comunicación.` }
    ], { json: true, maxTokens: 3500 });

    res.json(JSON.parse(raw));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- COPIES — genera los textos de las publicaciones ---- */
app.post('/api/copies', async (req, res) => {
  try {
    const { cliente = {}, estrategia = '', cantidad = 12 } = req.body;

    const raw = await openai([
      { role: 'system', content:
        'Escribís copies para publicaciones de Instagram de negocios locales argentinos. ' +
        'Cada copy: gancho fuerte en la primera línea, cuerpo corto, CTA claro a WhatsApp. ' +
        'Español rioplatense, voseo, sin jerga de marketing, sin emojis excesivos (máximo 2). ' +
        'SOLO JSON: {"copies":[{"n":1,"formato":"feed|story|reel","angulo":"","gancho":"","cuerpo":"","cta":"","hashtags":""}]}' },
      { role: 'user', content:
        `NEGOCIO: ${cliente.nombre || ''} · ${cliente.rubro || ''} · ${cliente.ciudad || ''}\n\n` +
        `ESTRATEGIA:\n${estrategia.slice(0, 8000)}\n\n` +
        `Generá ${cantidad} copies siguiendo el calendario de la estrategia.` }
    ], { json: true, maxTokens: 4000 });

    res.json(JSON.parse(raw));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- WHATSAPP — genera las plantillas de conversación ---- */
app.post('/api/whatsapp', async (req, res) => {
  try {
    const { cliente = {}, avatar = '', producto = '' } = req.body;

    const raw = await openai([
      { role: 'system', content:
        'Escribís plantillas de WhatsApp Business para negocios locales argentinos. ' +
        'Cada plantilla resuelve un momento concreto de la conversación de venta. ' +
        'Nunca mandar solo el precio: siempre dar contexto y próximo paso. ' +
        'Español rioplatense, voseo, cercano pero profesional. ' +
        'SOLO JSON: {"plantillas":[{"n":1,"momento":"","cuando":"","texto":"","porque":""}]}' },
      { role: 'user', content:
        `NEGOCIO: ${cliente.nombre || ''} · ${cliente.rubro || ''}\n\n` +
        `AVATAR:\n${avatar.slice(0, 5000)}\n\nPRODUCTO:\n${producto.slice(0, 5000)}\n\n` +
        `Generá 6 plantillas: saludo inicial, consulta de precio, objeción de precio, ` +
        `seguimiento a las 24h, cierre de venta, post-venta.` }
    ], { json: true, maxTokens: 2500 });

    res.json(JSON.parse(raw));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- REPLICATE — genera una imagen a partir de un prompt ---- */
app.post('/api/imagen', async (req, res) => {
  try {
    const { prompt, negative = '', aspect = '1:1' } = req.body;
    if (!REPLICATE_KEY) return res.status(400).json({ error: 'Falta REPLICATE_API_TOKEN' });
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

    const create = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REPLICATE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: aspect,
          output_format: 'jpg',
          output_quality: 90,
          safety_tolerance: 2,
          prompt_upsampling: false
        }
      })
    });

    if (!create.ok) {
      const t = await create.text();
      return res.status(500).json({ error: `Replicate ${create.status}: ${t.slice(0, 300)}` });
    }

    const pred = await create.json();

    /* Si Prefer:wait devolvió el resultado directo */
    if (pred.status === 'succeeded' && pred.output) {
      const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      return res.json({ url, id: pred.id, status: 'succeeded' });
    }

    /* Si sigue procesando, devolvemos el id para hacer polling */
    res.json({ id: pred.id, status: pred.status, urls: pred.urls });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- REPLICATE POLLING — consulta el estado de una generación ---- */
app.get('/api/imagen/:id', async (req, res) => {
  try {
    if (!REPLICATE_KEY) return res.status(400).json({ error: 'Falta REPLICATE_API_TOKEN' });
    const r = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_KEY}` }
    });
    const j = await r.json();
    const url = Array.isArray(j.output) ? j.output[0] : j.output;
    res.json({ id: j.id, status: j.status, url, error: j.error });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ---- FETCH — lee una URL server-side ---- */
app.post('/api/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!/^https?:\/\//i.test(url || '')) return res.status(400).json({ error: 'URL inválida' });
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
    const html = await r.text();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || url).trim().slice(0, 120);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
      .replace(/\s{2,}/g, ' ').trim().slice(0, 100000);
    res.json({ title, text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Koreskill Studio en :${PORT} · openai ${OPENAI_KEY ? 'ok' : 'FALTA'} · replicate ${REPLICATE_KEY ? 'ok' : 'FALTA'}`));
