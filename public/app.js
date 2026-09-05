/* =====================================================================
   KORESKILL CAMPAIGN STUDIO v2 — app.js
   El sistema NUNCA genera automáticamente. Benja trabaja con Claude.ai.
   El sistema: estructura los datos, genera prompts contextuales, visualiza.
   ===================================================================== */

/* ── utils ── */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"]/g,
  m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));

let toastT;
const toast = m => {
  const t = $('#toast');
  t.textContent = m; t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2500);
};

const copy = async txt => {
  await navigator.clipboard.writeText(txt);
  toast('Copiado al portapapeles');
};

const imgToB64 = file => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

/* ── tabs del sistema ── */
const TABS = [
  { id:'identidad',  n:1, nom:'Identidad'  },
  { id:'producto',   n:2, nom:'Producto'   },
  { id:'estrategia', n:3, nom:'Estrategia' },
  { id:'produccion', n:4, nom:'Producción' },
  { id:'entrega',    n:5, nom:'Entrega'    },
  { id:'calendario', n:6, nom:'Calendario' },
];

/* ── estado y persistencia ── */
const SK = 'ks.v2.db';
let DB = { clientes: [], activo: null, theme: 'light' };
let TAB = 'identidad';

function loadDB() {
  try { const r = localStorage.getItem(SK); if (r) DB = { ...DB, ...JSON.parse(r) }; } catch(e){}
  if (!DB.clientes.length) { const c = mkCli(); DB.clientes = [c]; DB.activo = c.id; }
  if (!DB.activo || !DB.clientes.find(c => c.id === DB.activo))
    DB.activo = DB.clientes[0]?.id || null;
  document.documentElement.dataset.theme = DB.theme || 'light';
}
const save = () => { try { localStorage.setItem(SK, JSON.stringify(DB)); } catch(e){} };
const cli  = () => DB.clientes.find(c => c.id === DB.activo);

function mkCli() {
  return {
    id: uid(),
    identidad: {
      nombre:'', rubro:'', ciudad:'', pais:'Argentina', web:'', instagram:'',
      descripcion:'', diferencial:'', tono:'',
      colores:[], tipografia:'', tipografia2:'',
      logo:'', banner:'',
      respuesta:'', // lo que pegó de Claude.ai
    },
    productos: [],   // [{id, nombre, descripcion, precio, tipo, publico, foto, respuesta}]
    estrategia: {
      respuesta:'',  // texto pegado de Claude.ai
      semanas:[],    // [{sem, dias:[{dia, formato, angulo, tema}]}]
    },
    produccion: {
      respuesta:'',  // texto pegado de Claude.ai
    },
    entrega: {
      lotes:[],      // [{dia, titulo, items:[], estado}]
    },
    calendario: [],  // [{id, dia, tipo:'org'|'pago', titulo, img, angulo, comentarios:[]}]
    creado: Date.now()
  };
}

/* ── progreso de un cliente ── */
function calcProg(c) {
  let n = 0;
  if (c.identidad.respuesta || c.identidad.nombre) n++;
  if (c.productos.length)   n++;
  if (c.estrategia.respuesta) n++;
  if (c.produccion.respuesta) n++;
  if (c.entrega.lotes.length) n++;
  if (c.calendario.length)  n++;
  return n;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GENERADORES DE PROMPTS — el corazón del sistema
   Nunca llaman a una API. Solo arman el texto contextual.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function promptIdentidad(c) {
  const id = c.identidad;
  const campos = [
    id.nombre       && `Nombre del negocio: ${id.nombre}`,
    id.rubro        && `Rubro: ${id.rubro}`,
    id.ciudad       && `Ciudad: ${id.ciudad}, ${id.pais}`,
    id.web          && `Web: ${id.web}`,
    id.instagram    && `Instagram: ${id.instagram}`,
    id.descripcion  && `Descripción: ${id.descripcion}`,
    id.diferencial  && `Diferencial: ${id.diferencial}`,
    id.tono         && `Tono de comunicación: ${id.tono}`,
    id.colores.length && `Colores de marca: ${id.colores.join(', ')}`,
    id.tipografia   && `Tipografía principal: ${id.tipografia}`,
    id.tipografia2  && `Tipografía secundaria: ${id.tipografia2}`,
  ].filter(Boolean).join('\n');

  return `Sos un estratega de branding para negocios locales de Argentina y Uruguay.

Analizo la identidad de este negocio y necesito que me devuelvas un TABLERO DE MARCA estructurado y completo. El objetivo es tener toda la información organizada para usarla como base de una estrategia de contenido y publicidad en Meta.

DATOS DEL NEGOCIO:
${campos || '(completar con info del negocio)'}

ESTRUCTURÁ el tablero con estas secciones:
1. IDENTIDAD — quién es, qué hace, dónde opera
2. PERSONALIDAD — tono de comunicación, valores, cómo habla
3. DIFERENCIAL REAL — qué tiene que no tiene la competencia
4. ACTIVOS DE MARCA — colores (con HEX), tipografías, descripción de logo y banner
5. PRESENCIA DIGITAL — estado actual (de 0 a 5) y oportunidades
6. EN UNA FRASE — la frase que define este negocio para quién existe

Formato: texto plano, títulos en MAYÚSCULA, sin markdown decorativo. Máximo 600 palabras.`;
}

function promptProducto(c, prod) {
  const id = c.identidad;
  return `Sos un estratega de producto y contenido para negocios locales de Argentina y Uruguay.

MARCA:
${id.nombre} · ${id.rubro} · ${id.ciudad}, ${id.pais}
${id.diferencial ? 'Diferencial: ' + id.diferencial : ''}

PRODUCTO A ANALIZAR:
Nombre: ${prod.nombre || '?'}
Descripción: ${prod.descripcion || '?'}
Precio: ${prod.precio || '?'}
Tipo: ${prod.tipo || 'producto físico'}
Público: ${prod.publico || 'a definir'}

ANALIZÁ este producto y devolvé:
1. QUÉ ES — descripción clara para alguien que no lo conoce
2. QUÉ LO HACE ESPECIAL — diferencial concreto, no genérico
3. QUIÉN LO COMPRA — avatar primario y secundario
4. POR QUÉ LO COMPRA — dolor que resuelve o sueño que cumple
5. POR QUÉ NO LO COMPRA — 3 objeciones reales
6. CÓMO SE MUESTRA — qué foto, video o formato lo representa mejor
7. ÁNGULO RECOMENDADO — un ángulo de comunicación para este mes

Texto plano, títulos en MAYÚSCULA. Máximo 400 palabras.`;
}

function promptEstrategia(c) {
  const id = c.identidad;
  const prods = c.productos.map((p, i) =>
    `Producto ${i+1}: ${p.nombre} — ${p.descripcion || ''} — $${p.precio || '?'}
${p.respuesta ? 'Análisis: ' + p.respuesta.slice(0, 300) + '...' : ''}`
  ).join('\n\n');

  return `Sos un estratega de contenido y publicidad para negocios locales de Argentina y Uruguay.

TABLERO DE MARCA:
${id.respuesta || `${id.nombre} · ${id.rubro} · ${id.ciudad}, ${id.pais}\n${id.descripcion || ''}\nDiferencial: ${id.diferencial || '?'}`}

PRODUCTOS:
${prods || '(sin productos cargados aún)'}

CREÁ la estrategia de contenido para este mes con:

1. LOS 3 ÁNGULOS DE COMUNICACIÓN
Para cada uno: nombre · a quién le habla · qué dice · qué acción busca · formato recomendado

2. DISTRIBUCIÓN DEL MES
Cuántas piezas de cada ángulo y por qué esa proporción.

3. CALENDARIO DE 30 DÍAS
Para cada semana (4 semanas), definí 3 publicaciones:
DÍA · FORMATO (feed/reel/story) · ÁNGULO · TEMA CONCRETO · OBJETIVO

4. PRODUCTO A IMPULSAR
Uno solo. Por qué este mes. Qué resultado esperar.

5. MÉTRICAS
Qué dos números mirar este mes para saber si está funcionando.

Texto plano, títulos en MAYÚSCULA. Directo y accionable.`;
}

function promptProduccion(c) {
  const id = c.identidad;
  const paleta = id.colores.length ? id.colores.join(' · ') : 'definida en el tablero de marca';

  return `Sos un especialista en producción de contenido visual y publicidad en Meta para negocios locales de Argentina y Uruguay.

MARCA:
${id.respuesta ? id.respuesta.slice(0, 500) : `${id.nombre} · ${id.rubro} · ${id.ciudad}, ${id.pais}`}
Paleta: ${paleta}
${id.tipografia ? 'Tipografía: ' + id.tipografia : ''}

ESTRATEGIA DEL MES:
${c.estrategia.respuesta ? c.estrategia.respuesta.slice(0, 1200) : '(estrategia no cargada)'}

CREÁ el plan de producción completo con:

1. IMÁGENES A PRODUCIR (12 piezas)
Para cada una:
N° · FORMATO (1:1 / 4:5 / 9:16) · ÁNGULO · CONCEPTO EN UNA LÍNEA · QUÉ MUESTRA

2. VIDEOS A PRODUCIR (4 piezas)
Para cada uno:
N° · DURACIÓN · GANCHO (primeros 3 segundos) · QUÉ PASA EN EL VIDEO · CIERRE

3. PROMPTS DE IMAGEN (para los 12)
Para cada imagen, un prompt en INGLÉS listo para pegar en Ideogram o Flux.
Incluí: composición, iluminación, paleta, estilo, qué texto aparece en la imagen (en español), ANTI-AI RULES al final.

4. QUÉ NECESITO DEL CLIENTE
Lista concreta: qué fotos sacar, qué datos conseguir, qué aprobar.

Formato: texto plano, títulos en MAYÚSCULA. Sin markdown decorativo.`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PARSERS — estructuran lo que pegó Benja
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function parseEstrategiaToBoard(texto) {
  /* Intenta extraer el calendario en semanas desde el texto pegado */
  const semanas = [];
  const angulos = {
    emocional: /emocional|emoción|sentimiento|historia/i,
    comercial:  /comercial|venta|precio|oferta/i,
    educativo:  /educativo|tip|consejo|cómo/i,
  };

  const lineas = texto.split('\n').filter(l => l.trim());
  let semActual = null;
  let semN = 0;

  for (const l of lineas) {
    const trimmed = l.trim();
    if (/semana\s*\d/i.test(trimmed)) {
      if (semActual) semanas.push(semActual);
      semN++;
      semActual = { sem: semN, titulo: trimmed, dias: [] };
    } else if (semActual && /^(?:día|dia|d[íi]a?)?\s*\d{1,2}/i.test(trimmed)) {
      const m = trimmed.match(/\d{1,2}/);
      if (!m) continue;
      const dia = parseInt(m[0]);
      let angulo = 'comercial';
      for (const [k, rx] of Object.entries(angulos)) {
        if (rx.test(trimmed)) { angulo = k; break; }
      }
      const tema = trimmed.replace(/^.*?[·\-–:]\s*/, '').slice(0, 60);
      const formato = /reel/i.test(trimmed) ? 'reel' : /stor/i.test(trimmed) ? 'story' : 'feed';
      semActual.dias.push({ dia, angulo, tema: tema || 'Publicación', formato });
    }
  }
  if (semActual && semActual.dias.length) semanas.push(semActual);

  /* fallback: si no parseó nada, generar 4 semanas vacías */
  if (!semanas.length) {
    for (let s = 1; s <= 4; s++) {
      semanas.push({ sem: s, titulo: `Semana ${s}`, dias: [
        { dia: (s-1)*7+2,  angulo:'emocional', tema:'Contenido de conexión', formato:'feed' },
        { dia: (s-1)*7+4,  angulo:'comercial',  tema:'Publicación de producto', formato:'reel' },
        { dia: (s-1)*7+6,  angulo:'educativo',  tema:'Contenido educativo', formato:'story' },
      ]});
    }
  }
  return semanas;
}

function buildEntregaDefault(c) {
  const lotes = [
    { dia:1,  titulo:'Brief estratégico', estado:'pendiente',
      items:['Tablero de marca', 'Análisis de avatar', 'Los 3 ángulos'] },
    { dia:5,  titulo:'Aprobación de dirección visual', estado:'pendiente',
      items:['3 referencias visuales', 'Paleta confirmada', 'Tono de comunicación'] },
    { dia:8,  titulo:'Primer lote de contenido', estado:'pendiente',
      items:['6 imágenes con IA', '6 copies', '2 videos'] },
    { dia:15, titulo:'Segundo lote', estado:'pendiente',
      items:['6 imágenes restantes', '4 copies', '2 videos', 'Calendario del mes'] },
    { dia:22, titulo:'Entrega final', estado:'pendiente',
      items:['Todo el contenido organizado', 'Plantillas de WhatsApp', 'Video de cierre 10 min'] },
  ];
  return lotes;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RENDER SHELL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderShell() {
  /* Rail */
  const cl = $('#colist');
  if (!cl) return;
  const c = cli();
  cl.innerHTML = DB.clientes.map(x => {
    const p = calcProg(x);
    return `<button class="co" data-id="${x.id}" aria-current="${x.id === DB.activo}">
      <span class="co-dot ${p > 0 ? 'on' : ''}"></span>
      <span style="flex:1;min-width:0">
        <span class="co-nm">${esc(x.identidad.nombre || 'Sin nombre')}</span>
        <span class="co-sub">${esc([x.identidad.rubro, x.identidad.ciudad].filter(Boolean).join(' · ') || 'sin datos')}</span>
      </span>
      <span class="co-prog">${p}/6</span>
    </button>`;
  }).join('');
  $$('#colist .co').forEach(b => b.onclick = () => {
    DB.activo = b.dataset.id; save(); render();
  });

  /* Tabs */
  const tb = $('#tabs');
  if (!tb || !c) return;
  const progMap = {
    identidad:  !!(c.identidad.respuesta || c.identidad.nombre),
    producto:   c.productos.length > 0,
    estrategia: !!c.estrategia.respuesta,
    produccion: !!c.produccion.respuesta,
    entrega:    c.entrega.lotes.length > 0,
    calendario: c.calendario.length > 0,
  };
  tb.innerHTML = TABS.map(t => `
    <button class="tab ${progMap[t.id] ? 'done' : ''}" role="tab"
      aria-selected="${TAB === t.id}" data-tab="${t.id}">
      <span class="tn">${progMap[t.id] ? '✓' : t.n}</span>${t.nom}
    </button>`).join('');
  $$('#tabs .tab').forEach(b => b.onclick = () => { TAB = b.dataset.tab; render(); });

  /* ctx */
  const cx = $('#ctx');
  if (cx && c) cx.textContent = c.identidad.nombre;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   RENDER PANEL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function render() {
  renderShell();
  const c = cli();
  const panel = $('#panel');
  if (!panel) return;
  if (!c) { panel.innerHTML = `<div class="note" style="padding:40px;text-align:center">Creá un cliente para empezar.</div>`; return; }

  switch (TAB) {
    case 'identidad':   return renderIdentidad(c, panel);
    case 'producto':    return renderProducto(c, panel);
    case 'estrategia':  return renderEstrategia(c, panel);
    case 'produccion':  return renderProduccion(c, panel);
    case 'entrega':     return renderEntrega(c, panel);
    case 'calendario':  return renderCalendario(c, panel);
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 1 — IDENTIDAD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderIdentidad(c, panel) {
  const id = c.identidad;
  panel.innerHTML = `

  <!-- PASO 1: datos del negocio -->
  <div class="step ${id.nombre ? 'active' : ''}" id="step-datos">
    <div class="step-head" onclick="toggleStep('step-datos')">
      <div class="step-n">1</div>
      <div class="step-ttl">Datos del negocio</div>
      <span class="step-badge ${id.nombre ? 'sb-done' : 'sb-pending'}">${id.nombre ? 'Completo' : 'Pendiente'}</span>
    </div>
    <div class="step-body ${id.nombre ? '' : 'hidden'}">
      <div class="step-desc">Información base de la marca. Completá lo que tenés — no hace falta tener todo.</div>
      <div class="g4" style="gap:10px;margin-bottom:10px">
        ${[ ['nombre','Nombre del negocio','text'],
            ['rubro','Rubro','text'],
            ['ciudad','Ciudad','text'],
            ['pais','País','text'],
            ['web','Sitio web','url'],
            ['instagram','Instagram','text'],
          ].map(([k,l,t])=>`
          <div><label class="lab">${l}</label>
            <input class="field" data-idf="${k}" type="${t}" value="${esc(id[k]||'')}">
          </div>`).join('')}
      </div>
      <div style="margin-bottom:10px">
        <label class="lab">Descripción del negocio (cómo surgió, quién lo lleva, historia)</label>
        <textarea class="field" data-idf="descripcion" rows="3">${esc(id.descripcion||'')}</textarea>
      </div>
      <div class="g2" style="gap:10px;margin-bottom:10px">
        <div>
          <label class="lab">Diferencial real (qué hacen distinto de verdad)</label>
          <textarea class="field" data-idf="diferencial" rows="2">${esc(id.diferencial||'')}</textarea>
        </div>
        <div>
          <label class="lab">Tono de comunicación (cercano / formal / técnico / amigable…)</label>
          <textarea class="field" data-idf="tono" rows="2">${esc(id.tono||'')}</textarea>
        </div>
      </div>

      <!-- Colores -->
      <div style="margin-bottom:10px">
        <label class="lab">Colores de marca (HEX)</label>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap" id="color-row">
          ${id.colores.map((col, i) => `
            <div style="display:flex;align-items:center;gap:5px">
              <span class="color-swatch" style="background:${esc(col)};width:32px;height:32px;border-radius:7px;border:1px solid var(--line2);display:inline-block" title="${esc(col)}"></span>
              <span class="mono" style="font-size:11px">${esc(col)}</span>
              <button class="btn xs ghost" data-rmcol="${i}">×</button>
            </div>`).join('')}
          <input class="field" id="colorInput" placeholder="#FF7970" style="width:110px;font-family:'IBM Plex Mono',monospace;font-size:12px">
          <button class="btn sm" id="addColor">+ Color</button>
        </div>
      </div>

      <!-- Tipografías -->
      <div class="g2" style="gap:10px;margin-bottom:10px">
        <div>
          <label class="lab">Tipografía principal</label>
          <input class="field" data-idf="tipografia" value="${esc(id.tipografia||'')}">
        </div>
        <div>
          <label class="lab">Tipografía secundaria</label>
          <input class="field" data-idf="tipografia2" value="${esc(id.tipografia2||'')}">
        </div>
      </div>

      <!-- Logo y Banner -->
      <div class="g2" style="gap:10px;margin-bottom:14px">
        <div>
          <label class="lab">Logo</label>
          ${id.logo
            ? `<div style="display:flex;align-items:center;gap:8px">
                <img src="${id.logo}" style="width:60px;height:60px;object-fit:contain;border-radius:8px;background:var(--p2);border:1px solid var(--line)">
                <button class="btn xs ghost" id="rmLogo">Quitar</button>
               </div>`
            : `<div class="drop" id="dropLogo"><big>Subir logo</big><small>PNG, SVG, JPG</small>
               <input type="file" id="fileLogoInp" accept="image/*" class="hidden"></div>`}
        </div>
        <div>
          <label class="lab">Banner / fondo de marca</label>
          ${id.banner
            ? `<div style="display:flex;align-items:center;gap:8px">
                <img src="${id.banner}" style="width:120px;height:40px;object-fit:cover;border-radius:8px;background:var(--p2);border:1px solid var(--line)">
                <button class="btn xs ghost" id="rmBanner">Quitar</button>
               </div>`
            : `<div class="drop" id="dropBanner"><big>Subir banner</big><small>PNG, JPG — proporción 3:1</small>
               <input type="file" id="fileBannerInp" accept="image/*" class="hidden"></div>`}
        </div>
      </div>

      <div class="row">
        <button class="btn pri" id="saveDatos">Guardar datos</button>
      </div>
    </div>
  </div>

  <!-- PASO 2: generar prompt -->
  <div class="step ${id.nombre ? '' : 'hidden'}" id="step-prompt-id">
    <div class="step-head" onclick="toggleStep('step-prompt-id')">
      <div class="step-n">2</div>
      <div class="step-ttl">Generar prompt para Claude.ai</div>
      <span class="step-badge sb-active">Acción requerida</span>
    </div>
    <div class="step-body">
      <div class="step-desc">Copiá este prompt, pegalo en Claude.ai y traé la respuesta.</div>
      <div class="prompt-box">
        <div class="prompt-box-head">
          <span class="prompt-box-icon">📋</span>
          <span class="prompt-box-ttl">Prompt de identidad de marca</span>
          <button class="btn sm pri" id="copyPromptId">Copiar prompt</button>
        </div>
        <div class="prompt-box-body">
          <pre class="prompt-pre" id="promptIdPre"></pre>
        </div>
      </div>
    </div>
  </div>

  <!-- PASO 3: pegar respuesta y ver tablero -->
  <div class="step ${id.nombre ? '' : 'hidden'}" id="step-resp-id">
    <div class="step-head" onclick="toggleStep('step-resp-id')">
      <div class="step-n">3</div>
      <div class="step-ttl">Pegar respuesta → Tablero de marca</div>
      <span class="step-badge ${id.respuesta ? 'sb-done' : 'sb-pending'}">${id.respuesta ? 'Tablero listo' : 'Esperando respuesta'}</span>
    </div>
    <div class="step-body ${id.respuesta ? '' : 'hidden'}">
      <div class="step-desc">Pegá lo que te respondió Claude.ai. El sistema lo va a estructurar en el tablero.</div>
      <textarea class="field" id="respIdTa" rows="8"
        placeholder="Pegá acá la respuesta completa de Claude.ai…">${esc(id.respuesta)}</textarea>
      <div class="row" style="margin-top:10px">
        <button class="btn pri" id="saveRespId">Estructurar tablero</button>
        <span class="note" id="respIdNote"></span>
      </div>
    </div>
  </div>

  <!-- TABLERO DE MARCA -->
  ${id.respuesta ? `
  <div style="margin-top:20px">
    <div style="font-size:14px;font-weight:600;margin-bottom:12px">Tablero de marca</div>
    ${renderBrandBoard(c)}
  </div>` : ''}
  `;

  /* bindings */
  $$('[data-idf]').forEach(i => i.oninput = () => {
    id[i.dataset.idf] = i.value; save();
  });

  const addC = $('#addColor');
  if (addC) addC.onclick = () => {
    const v = $('#colorInput')?.value?.trim();
    if (!v) return;
    if (!id.colores.includes(v)) id.colores.push(v);
    save(); render();
  };
  $$('[data-rmcol]').forEach(b => b.onclick = () => {
    id.colores.splice(+b.dataset.rmcol, 1); save(); render();
  });

  const rmLogo = $('#rmLogo');
  if (rmLogo) rmLogo.onclick = () => { id.logo = ''; save(); render(); };
  const rmBanner = $('#rmBanner');
  if (rmBanner) rmBanner.onclick = () => { id.banner = ''; save(); render(); };

  const dropLogo = $('#dropLogo');
  const fileLogoInp = $('#fileLogoInp');
  if (dropLogo && fileLogoInp) {
    dropLogo.onclick = () => fileLogoInp.click();
    fileLogoInp.onchange = async () => {
      const f = fileLogoInp.files[0]; if (!f) return;
      id.logo = await imgToB64(f); save(); render();
    };
  }
  const dropBanner = $('#dropBanner');
  const fileBannerInp = $('#fileBannerInp');
  if (dropBanner && fileBannerInp) {
    dropBanner.onclick = () => fileBannerInp.click();
    fileBannerInp.onchange = async () => {
      const f = fileBannerInp.files[0]; if (!f) return;
      id.banner = await imgToB64(f); save(); render();
    };
  }

  $('#saveDatos')?.addEventListener('click', () => {
    save(); toast('Datos guardados');
    document.getElementById('step-prompt-id')?.classList.remove('hidden');
    document.getElementById('step-resp-id')?.classList.remove('hidden');
    updatePromptId(c);
    openStep('step-prompt-id');
  });

  updatePromptId(c);

  $('#copyPromptId')?.addEventListener('click', () => {
    copy(promptIdentidad(c));
    openStep('step-resp-id');
    document.getElementById('step-resp-id')?.querySelector('.step-body')?.classList.remove('hidden');
  });

  $('#saveRespId')?.addEventListener('click', () => {
    const ta = $('#respIdTa');
    if (!ta?.value.trim()) return toast('Pegá la respuesta primero');
    id.respuesta = ta.value.trim(); save(); render();
    toast('Tablero de marca listo');
  });

  /* export */
  $('#exportBtn')?.removeEventListener('click', exportData);
  $('#exportBtn')?.addEventListener('click', exportData);
}

function updatePromptId(c) {
  const pre = $('#promptIdPre');
  if (pre) pre.textContent = promptIdentidad(c);
}

function renderBrandBoard(c) {
  const id = c.identidad;
  return `
  <div class="brand-board">
    ${id.logo || id.banner ? `
    <div class="bb-card" style="grid-column:1/-1">
      <div class="bb-head">Identidad visual</div>
      <div class="bb-body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        ${id.logo ? `<img src="${id.logo}" class="brand-img-sq" alt="logo">` : ''}
        ${id.banner ? `<img src="${id.banner}" style="flex:1;min-width:200px;max-width:400px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--line)" alt="banner">` : ''}
      </div>
    </div>` : ''}

    ${id.colores.length ? `
    <div class="bb-card">
      <div class="bb-head">Paleta de colores</div>
      <div class="bb-body">
        <div class="color-row">
          ${id.colores.map(col => `
            <div style="text-align:center">
              <span style="width:44px;height:44px;border-radius:10px;display:block;background:${esc(col)};border:1px solid var(--line2);margin-bottom:5px"></span>
              <span class="mono" style="font-size:10px">${esc(col)}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>` : ''}

    ${id.tipografia ? `
    <div class="bb-card">
      <div class="bb-head">Tipografía</div>
      <div class="bb-body">
        <div class="font-preview" style="font-family:'${esc(id.tipografia)}',Inter,sans-serif">Aa Bb 123</div>
        <div class="font-name">${esc(id.tipografia)} · principal</div>
        ${id.tipografia2 ? `
          <div style="margin-top:10px">
            <div class="font-preview" style="font-size:15px;font-family:'${esc(id.tipografia2)}',Inter,sans-serif">Aa Bb 123</div>
            <div class="font-name">${esc(id.tipografia2)} · secundaria</div>
          </div>` : ''}
      </div>
    </div>` : ''}

    <div class="bb-card" style="grid-column:1/-1">
      <div class="bb-head">Análisis de identidad</div>
      <div class="bb-body" style="white-space:pre-wrap;font-size:13px;line-height:1.7;color:var(--ink2);max-height:280px;overflow-y:auto">${esc(id.respuesta)}</div>
    </div>
  </div>`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 2 — PRODUCTO
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderProducto(c, panel) {
  const prods = c.productos;
  panel.innerHTML = `
  <div class="row" style="margin-bottom:16px">
    <div style="flex:1">
      <div style="font-size:18px;font-weight:600;letter-spacing:-.02em">Productos</div>
      <div class="note">Cargá cada producto manualmente. El sistema genera el prompt de análisis para cada uno.</div>
    </div>
    <button class="btn pri" id="addProd">+ Agregar producto</button>
  </div>

  ${prods.length === 0 ? `
    <div class="card" style="text-align:center;padding:40px 20px">
      <div style="font-size:24px;margin-bottom:8px">📦</div>
      <div class="note">Todavía no hay productos. Agregá el primero.</div>
    </div>` : prods.map((p, i) => `

  <div class="step ${p.nombre ? 'done' : ''}" id="step-prod-${i}">
    <div class="step-head" onclick="toggleStep('step-prod-${i}')">
      <div class="step-n">${i+1}</div>
      <div class="step-ttl">${esc(p.nombre || 'Producto sin nombre')}</div>
      <span class="step-badge ${p.respuesta ? 'sb-done' : p.nombre ? 'sb-active' : 'sb-pending'}">
        ${p.respuesta ? 'Analizado' : p.nombre ? 'Sin analizar' : 'Incompleto'}
      </span>
      <button class="btn xs ghost" data-rmprod="${i}" style="margin-left:4px">Eliminar</button>
    </div>
    <div class="step-body">
      <div class="g4" style="gap:9px;margin-bottom:10px">
        <div><label class="lab">Nombre</label>
          <input class="field" data-pf="${i}" data-pk="nombre" value="${esc(p.nombre||'')}"></div>
        <div><label class="lab">Precio</label>
          <input class="field" data-pf="${i}" data-pk="precio" value="${esc(p.precio||'')}"></div>
        <div><label class="lab">Tipo</label>
          <select class="field" data-pf="${i}" data-pk="tipo">
            ${['Producto físico','Producto digital','Servicio','Combo','Artesanal'].map(t =>
              `<option ${p.tipo===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div><label class="lab">Público objetivo</label>
          <input class="field" data-pf="${i}" data-pk="publico" value="${esc(p.publico||'')}"></div>
      </div>
      <div style="margin-bottom:10px">
        <label class="lab">Descripción del producto</label>
        <textarea class="field" data-pf="${i}" data-pk="descripcion" rows="3">${esc(p.descripcion||'')}</textarea>
      </div>
      <div style="margin-bottom:12px">
        <label class="lab">Foto del producto</label>
        ${p.foto
          ? `<div style="display:flex;align-items:center;gap:8px">
              <img src="${p.foto}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">
              <button class="btn xs ghost" data-rmpfoto="${i}">Quitar</button></div>`
          : `<div class="drop" id="dropProd-${i}" style="padding:12px">
              <big style="font-size:12px">Subir foto</big><small>PNG, JPG</small>
              <input type="file" id="fileProd-${i}" accept="image/*" class="hidden">
            </div>`}
      </div>

      <!-- prompt del producto -->
      <div class="prompt-box" style="margin-bottom:12px">
        <div class="prompt-box-head">
          <span class="prompt-box-icon">📋</span>
          <span class="prompt-box-ttl">Prompt de análisis — ${esc(p.nombre||'este producto')}</span>
          <button class="btn sm pri" data-copypromptprod="${i}">Copiar prompt</button>
        </div>
        <div class="prompt-box-body">
          <pre class="prompt-pre">${esc(promptProducto(c, p))}</pre>
        </div>
      </div>

      <!-- respuesta -->
      <div>
        <label class="lab">Pegar respuesta de Claude.ai</label>
        <textarea class="field" data-pf="${i}" data-pk="respuesta" rows="5"
          placeholder="Pegá acá la respuesta del análisis del producto…">${esc(p.respuesta||'')}</textarea>
        <button class="btn sm" data-saveprod="${i}" style="margin-top:7px">Guardar análisis</button>
      </div>
    </div>
  </div>`).join('')}
  `;

  /* bindings */
  $('#addProd')?.addEventListener('click', () => {
    c.productos.push({ id:uid(), nombre:'', descripcion:'', precio:'', tipo:'Producto físico', publico:'', foto:'', respuesta:'' });
    save(); render();
  });

  $$('[data-rmprod]').forEach(b => b.onclick = () => {
    c.productos.splice(+b.dataset.rmprod, 1); save(); render();
  });
  $$('[data-pf]').forEach(inp => inp.oninput = () => {
    const i = +inp.dataset.pf; const k = inp.dataset.pk;
    if (c.productos[i]) c.productos[i][k] = inp.value; save();
  });
  $$('[data-saveprod]').forEach(b => b.onclick = () => {
    save(); toast('Análisis guardado'); renderShell();
  });
  $$('[data-copypromptprod]').forEach(b => b.onclick = () => {
    copy(promptProducto(c, c.productos[+b.dataset.copypromptprod]));
  });
  $$('[data-rmpfoto]').forEach(b => b.onclick = () => {
    c.productos[+b.dataset.rmpfoto].foto = ''; save(); render();
  });
  c.productos.forEach((p, i) => {
    const drop = $(`#dropProd-${i}`);
    const inp = $(`#fileProd-${i}`);
    if (drop && inp) {
      drop.onclick = () => inp.click();
      inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        p.foto = await imgToB64(f); save(); render();
      };
    }
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 3 — ESTRATEGIA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderEstrategia(c, panel) {
  const est = c.estrategia;
  const ready = c.identidad.nombre && c.productos.length;
  panel.innerHTML = `
  <div style="font-size:18px;font-weight:600;letter-spacing:-.02em;margin-bottom:4px">Estrategia del mes</div>
  <div class="note" style="margin-bottom:18px">El prompt fusiona la marca y los productos. Pegás la respuesta y el sistema visualiza el calendario.</div>

  ${!ready ? `<div class="card" style="border-color:var(--warn);background:var(--warn-s);padding:12px 14px;margin-bottom:16px">
    <div class="note" style="color:var(--warn)">Completá la identidad y al menos un producto antes de generar la estrategia.</div>
  </div>` : ''}

  <!-- Prompt fusionado -->
  <div class="prompt-box" style="margin-bottom:16px">
    <div class="prompt-box-head">
      <span class="prompt-box-icon">🔀</span>
      <span class="prompt-box-ttl">Prompt de estrategia — ${esc(c.identidad.nombre)} · ${c.productos.length} producto${c.productos.length!==1?'s':''}</span>
      <button class="btn sm pri" id="copyPromptEst" ${!ready?'disabled':''}>Copiar prompt</button>
    </div>
    <div class="prompt-box-body">
      <pre class="prompt-pre" id="estPromptPre">${esc(ready ? promptEstrategia(c) : 'Completá la identidad y los productos primero.')}</pre>
    </div>
  </div>

  <!-- Respuesta -->
  <div class="step ${est.respuesta?'done':''}" id="step-est-resp">
    <div class="step-head" onclick="toggleStep('step-est-resp')">
      <div class="step-n">2</div>
      <div class="step-ttl">Pegar respuesta de Claude.ai</div>
      <span class="step-badge ${est.respuesta?'sb-done':'sb-pending'}">${est.respuesta?'Estrategia cargada':'Esperando respuesta'}</span>
    </div>
    <div class="step-body">
      <div class="step-desc">Pegá la respuesta completa. El sistema va a estructurar el calendario visual.</div>
      <textarea class="field" id="estRespTa" rows="10"
        placeholder="Pegá acá la respuesta de Claude.ai…">${esc(est.respuesta)}</textarea>
      <div class="row" style="margin-top:10px">
        <button class="btn pri" id="saveEstResp">Estructurar calendario</button>
      </div>
    </div>
  </div>

  <!-- Visualización de la estrategia -->
  ${est.respuesta && est.semanas?.length ? `
  <div style="margin-top:22px">
    <div style="font-size:14px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:10px">
      Calendario del mes
      <div style="display:flex;gap:5px">
        <span style="padding:2px 7px;border-radius:5px;font-size:10px;font-weight:600;background:rgba(255,121,112,.15);color:var(--acc2)">● Emocional</span>
        <span style="padding:2px 7px;border-radius:5px;font-size:10px;font-weight:600;background:var(--ok-s);color:var(--ok)">● Comercial</span>
        <span style="padding:2px 7px;border-radius:5px;font-size:10px;font-weight:600;background:var(--info-s);color:var(--info)">● Educativo</span>
      </div>
    </div>
    <div class="strat-board">
      ${est.semanas.map(sem => `
        <div class="strat-week">
          <div class="strat-week-head">
            <span style="font-size:13px">${esc(sem.titulo)}</span>
            <span style="margin-left:auto;font-size:10.5px;color:var(--ink3)">${sem.dias.length} publicaciones</span>
          </div>
          <div class="strat-week-body">
            ${sem.dias.map(d => `
              <div class="strat-day">
                <div class="strat-day-n">Día ${d.dia}</div>
                <span class="strat-pill sp-${d.angulo}">${d.angulo}</span>
                <div style="margin-top:4px;font-size:9.5px;color:var(--ink2);line-height:1.3">${esc(d.tema)}</div>
                <div style="margin-top:3px;font-size:9px;color:var(--ink3)">${d.formato}</div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    </div>

    <div style="margin-top:14px;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);padding:14px">
      <div style="font-size:11.5px;font-weight:600;margin-bottom:8px;color:var(--ink3)">RESPUESTA COMPLETA</div>
      <pre style="white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:var(--ink2);max-height:260px;overflow-y:auto">${esc(est.respuesta)}</pre>
    </div>
  </div>` : ''}
  `;

  $('#copyPromptEst')?.addEventListener('click', () => {
    if (!ready) return;
    copy(promptEstrategia(c));
    openStep('step-est-resp');
  });

  $('#saveEstResp')?.addEventListener('click', () => {
    const ta = $('#estRespTa');
    if (!ta?.value.trim()) return toast('Pegá la respuesta primero');
    est.respuesta = ta.value.trim();
    est.semanas = parseEstrategiaToBoard(est.respuesta);
    save(); render(); toast('Calendario estructurado');
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 4 — PRODUCCIÓN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderProduccion(c, panel) {
  const prod = c.produccion;
  const ready = c.identidad.nombre && c.estrategia.respuesta;
  panel.innerHTML = `
  <div style="font-size:18px;font-weight:600;letter-spacing:-.02em;margin-bottom:4px">Producción</div>
  <div class="note" style="margin-bottom:18px">Fusiona marca + productos + estrategia. Genera los prompts de imagen y el plan de producción.</div>

  ${!ready ? `<div class="card" style="border-color:var(--warn);background:var(--warn-s);padding:12px 14px;margin-bottom:16px">
    <div class="note" style="color:var(--warn)">Completá la identidad y la estrategia antes de generar el plan de producción.</div>
  </div>` : ''}

  <div class="prompt-box" style="margin-bottom:16px">
    <div class="prompt-box-head">
      <span class="prompt-box-icon">🎬</span>
      <span class="prompt-box-ttl">Prompt de producción — ${esc(c.identidad.nombre)}</span>
      <button class="btn sm pri" id="copyPromptProd" ${!ready?'disabled':''}>Copiar prompt</button>
    </div>
    <div class="prompt-box-body">
      <pre class="prompt-pre" id="prodPromptPre">${esc(ready ? promptProduccion(c) : 'Completá la identidad y la estrategia primero.')}</pre>
    </div>
  </div>

  <div class="step ${prod.respuesta?'done':''}" id="step-prod-resp">
    <div class="step-head" onclick="toggleStep('step-prod-resp')">
      <div class="step-n">2</div>
      <div class="step-ttl">Pegar plan de producción</div>
      <span class="step-badge ${prod.respuesta?'sb-done':'sb-pending'}">${prod.respuesta?'Plan cargado':'Esperando respuesta'}</span>
    </div>
    <div class="step-body">
      <div class="step-desc">Pegá la respuesta con los prompts de imagen y el plan de producción completo.</div>
      <textarea class="field" id="prodRespTa" rows="12"
        placeholder="Pegá acá la respuesta de Claude.ai con los prompts e instrucciones de producción…">${esc(prod.respuesta)}</textarea>
      <div class="row" style="margin-top:10px">
        <button class="btn pri" id="saveProdResp">Guardar plan de producción</button>
      </div>
    </div>
  </div>

  ${prod.respuesta ? `
  <div style="margin-top:20px;border:1px solid var(--line);border-radius:var(--r);background:var(--panel);overflow:hidden">
    <div style="padding:10px 14px;border-bottom:1px solid var(--line);background:var(--p2);font-size:11.5px;font-weight:600">
      Plan de producción completo
      <button class="btn xs" id="copyProdResp" style="margin-left:8px">Copiar</button>
    </div>
    <pre style="padding:14px;white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:var(--ink2);max-height:400px;overflow-y:auto">${esc(prod.respuesta)}</pre>
  </div>` : ''}
  `;

  $('#copyPromptProd')?.addEventListener('click', () => {
    if (!ready) return;
    copy(promptProduccion(c));
    openStep('step-prod-resp');
  });
  $('#saveProdResp')?.addEventListener('click', () => {
    const ta = $('#prodRespTa');
    if (!ta?.value.trim()) return toast('Pegá la respuesta primero');
    prod.respuesta = ta.value.trim(); save(); render(); toast('Plan guardado');
  });
  $('#copyProdResp')?.addEventListener('click', () => copy(prod.respuesta));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 5 — ENTREGA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderEntrega(c, panel) {
  if (!c.entrega.lotes.length) {
    c.entrega.lotes = buildEntregaDefault(c);
    save();
  }
  const lotes = c.entrega.lotes;
  const estados = ['pendiente','en proceso','entregado'];

  panel.innerHTML = `
  <div style="font-size:18px;font-weight:600;letter-spacing:-.02em;margin-bottom:4px">Cronograma de entrega</div>
  <div class="note" style="margin-bottom:20px">Qué se entrega y cuándo. Actualizá el estado de cada lote.</div>

  <div class="delivery-tl">
    ${lotes.map((l, i) => `
      <div class="dt-item ${l.estado==='entregado'?'done':l.estado==='en proceso'?'now':''}" id="lote-${i}">
        <div class="dt-dot">${i+1}</div>
        <div style="flex:1">
          <div class="dt-day">Día ${l.dia}</div>
          <div class="dt-ttl">${esc(l.titulo)}</div>
          <div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <select class="field" data-lote="${i}" data-lk="estado"
              style="width:auto;font-size:11.5px;padding:3px 8px">
              ${estados.map(e=>`<option ${l.estado===e?'selected':''}>${e}</option>`).join('')}
            </select>
          </div>
          <div class="dt-items" style="margin-top:10px">
            ${l.items.map((it, j) => `
              <span class="dt-item-tag">
                ${esc(it)}
                <button style="border:0;background:transparent;cursor:pointer;color:var(--ink3);margin-left:4px" data-rmitem="${i}-${j}">×</button>
              </span>`).join('')}
            <input class="field" data-addinput="${i}" placeholder="+ agregar ítem"
              style="width:auto;max-width:180px;font-size:11px;padding:3px 8px;border-style:dashed">
          </div>
        </div>
      </div>`).join('')}
  </div>
  `;

  $$('[data-lote]').forEach(sel => {
    sel.onchange = () => {
      const i = +sel.dataset.lote; const k = sel.dataset.lk;
      if (lotes[i]) lotes[i][k] = sel.value; save(); render();
    };
  });
  $$('[data-rmitem]').forEach(b => b.onclick = () => {
    const [li, ji] = b.dataset.rmitem.split('-').map(Number);
    lotes[li].items.splice(ji, 1); save(); render();
  });
  $$('[data-addinput]').forEach(inp => {
    const li = +inp.dataset.addinput;
    inp.onkeydown = e => {
      if (e.key === 'Enter' && inp.value.trim()) {
        lotes[li].items.push(inp.value.trim()); inp.value = ''; save(); render();
      }
    };
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TAB 6 — CALENDARIO
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderCalendario(c, panel) {
  let filtroTipo = 'todos'; let filtroDia = 'todos';
  const cal = c.calendario;

  const draw = () => {
    const items = cal.filter(x =>
      (filtroTipo === 'todos' || x.tipo === filtroTipo) &&
      (filtroDia === 'todos' || String(x.dia) === filtroDia)
    );

    $('#calContent').innerHTML = `
      <div class="cal-grid">
        ${items.map((it, i) => `
          <div class="cal-card">
            ${it.img
              ? `<img src="${it.img}" class="cal-img" data-viewimg="${it.id}" alt="${esc(it.titulo)}">`
              : `<div class="cal-img-ph" data-uploaddoc="${it.id}">
                  <div style="font-size:24px;margin-bottom:6px">📷</div>
                  <div style="font-size:11px">Subir imagen</div>
                  <input type="file" id="calFile-${it.id}" accept="image/*" class="hidden">
                </div>`}
            <div class="cal-foot">
              <div class="cal-day">Día ${it.dia}</div>
              <div class="cal-ttl">${esc(it.titulo || 'Sin título')}</div>
              <span class="cal-type ct-${it.tipo}">${it.tipo === 'org' ? 'Orgánico' : 'Pago'}</span>
            </div>
            <div class="cal-comments">
              ${(it.comentarios || []).map(cm => `<div class="cal-comment">💬 ${esc(cm)}</div>`).join('')}
              <input class="cal-add-comment" placeholder="Agregar comentario de edición…"
                data-addcomment="${it.id}">
            </div>
            <div style="padding:6px 10px;display:flex;gap:5px;border-top:1px solid var(--line)">
              <button class="btn xs ghost" data-editcal="${it.id}">Editar</button>
              <button class="btn xs ghost" data-rmcal="${it.id}" style="color:var(--bad);margin-left:auto">×</button>
            </div>
          </div>`).join('')}

        <!-- Tarjeta para agregar -->
        <div class="cal-card" style="border-style:dashed;cursor:pointer;display:grid;place-items:center;min-height:200px"
          id="addCalCard">
          <div style="text-align:center;color:var(--ink3)">
            <div style="font-size:28px;margin-bottom:6px">+</div>
            <div style="font-size:12px">Agregar pieza</div>
          </div>
        </div>
      </div>`;

    /* bindings internos del calendario */
    $$('[data-uploaddoc]').forEach(el => {
      const id = el.dataset.uploaddoc;
      const inp = $(`#calFile-${id}`);
      el.onclick = () => inp?.click();
      inp?.addEventListener('change', async () => {
        const f = inp.files[0]; if (!f) return;
        const item = cal.find(x => x.id === id);
        if (item) { item.img = await imgToB64(f); save(); draw(); }
      });
    });
    $$('[data-addcomment]').forEach(inp => {
      const id = inp.dataset.addcomment;
      inp.onkeydown = e => {
        if (e.key === 'Enter' && inp.value.trim()) {
          const item = cal.find(x => x.id === id);
          if (item) { item.comentarios = item.comentarios || []; item.comentarios.push(inp.value.trim()); save(); draw(); }
        }
      };
    });
    $$('[data-rmcal]').forEach(b => b.onclick = () => {
      const i = cal.findIndex(x => x.id === b.dataset.rmcal);
      if (i > -1) { cal.splice(i, 1); save(); draw(); }
    });
    $$('[data-editcal]').forEach(b => b.onclick = () => {
      const id = b.dataset.editcal;
      const item = cal.find(x => x.id === id);
      if (!item) return;
      const dia = prompt('Día del mes:', item.dia);
      if (dia !== null) item.dia = +dia;
      const ttl = prompt('Título:', item.titulo);
      if (ttl !== null) item.titulo = ttl;
      save(); draw();
    });
    $('#addCalCard')?.addEventListener('click', () => {
      const dia = prompt('Día del mes (1-30):');
      if (!dia) return;
      const ttl = prompt('Título de la pieza:') || 'Nueva pieza';
      const tipo = confirm('¿Es publicidad paga? OK = pago · Cancelar = orgánico') ? 'pago' : 'org';
      cal.push({ id:uid(), dia:+dia, titulo:ttl, tipo, img:'', angulo:'', comentarios:[] });
      save(); draw();
    });
  };

  panel.innerHTML = `
  <div class="cal-toolbar">
    <div style="font-size:18px;font-weight:600;letter-spacing:-.02em">Calendario</div>
    <div style="flex:1"></div>
    <div class="cal-filter" id="filtroTipo">
      <button class="cal-f on" data-ft="todos">Todos</button>
      <button class="cal-f" data-ft="org">Orgánico</button>
      <button class="cal-f" data-ft="pago">Pago</button>
    </div>
    <select class="field" id="filtroDiaSelect" style="width:auto;font-size:12px">
      <option value="todos">Todos los días</option>
      ${[...Array(30)].map((_,i)=>`<option value="${i+1}">Día ${i+1}</option>`).join('')}
    </select>
    <button class="btn pri" id="addCalBtnTop">+ Agregar pieza</button>
  </div>
  <div id="calContent"></div>
  `;

  $$('#filtroTipo .cal-f').forEach(b => b.onclick = () => {
    filtroTipo = b.dataset.ft;
    $$('#filtroTipo .cal-f').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); draw();
  });
  $('#filtroDiaSelect')?.addEventListener('change', e => { filtroDia = e.target.value; draw(); });
  $('#addCalBtnTop')?.addEventListener('click', () => {
    const dia = prompt('Día del mes (1-30):'); if (!dia) return;
    const ttl = prompt('Título de la pieza:') || 'Nueva pieza';
    const tipo = confirm('¿Publicidad paga? OK = pago · Cancelar = orgánico') ? 'pago' : 'org';
    cal.push({ id:uid(), dia:+dia, titulo:ttl, tipo, img:'', angulo:'', comentarios:[] });
    save(); draw();
  });

  draw();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPERS UI
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
window.toggleStep = id => {
  const s = document.getElementById(id);
  if (!s) return;
  const b = s.querySelector('.step-body');
  if (b) b.classList.toggle('hidden');
};
function openStep(id) {
  const s = document.getElementById(id);
  if (!s) return;
  const b = s.querySelector('.step-body');
  if (b) b.classList.remove('hidden');
}

/* Export */
function exportData() {
  const c = cli(); if (!c) return;
  let out = `KORESKILL CAMPAIGN STUDIO v2\n${c.identidad.nombre}\n${'─'.repeat(50)}\n\n`;
  if (c.identidad.respuesta) out += `IDENTIDAD DE MARCA\n${c.identidad.respuesta}\n\n`;
  c.productos.forEach((p, i) => {
    out += `PRODUCTO ${i+1}: ${p.nombre}\n${p.descripcion}\n`;
    if (p.respuesta) out += `Análisis:\n${p.respuesta}\n`;
    out += '\n';
  });
  if (c.estrategia.respuesta) out += `ESTRATEGIA\n${c.estrategia.respuesta}\n\n`;
  if (c.produccion.respuesta) out += `PRODUCCIÓN\n${c.produccion.respuesta}\n\n`;
  const blob = new Blob([out], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `koreskill-${(c.identidad.nombre||'cliente').toLowerCase().replace(/\s+/g,'-')}.txt`;
  a.click(); toast('Exportado');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BOOT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
loadDB();

/* bindings globales */
document.addEventListener('click', e => {
  if (e.target.id === 'newCo') {
    const c = mkCli(); DB.clientes.unshift(c); DB.activo = c.id; TAB='identidad';
    save(); render(); toast('Cliente creado');
  }
  if (e.target.id === 'thBtn') {
    DB.theme = DB.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme = DB.theme; save();
  }
  if (e.target.id === 'exportBtn') exportData();
});

render();
