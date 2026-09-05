/* =====================================================================
   KORESKILL CAMPAIGN STUDIO — frontend v1
   ===================================================================== */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));

/* ---------- estado ---------- */
const KEY = 'koreskill.studio.v1';
let DB = { clientes: [], activo: null, theme: 'light' };
let TAB = 'e1';

const ETAPAS = [
  { id:'e1', n:1, nombre:'Identidad',  desc:'Quién es el negocio y para quién existe' },
  { id:'e2', n:2, nombre:'Producto',   desc:'Qué vende y qué lo hace especial' },
  { id:'e3', n:3, nombre:'Avatar',     desc:'Quién compra, por qué y qué lo frena' },
  { id:'e4', n:4, nombre:'Estrategia', desc:'Los ángulos y el calendario del mes' },
  { id:'e5', n:5, nombre:'Producción', desc:'Qué se produce y en qué formato' },
  { id:'e6', n:6, nombre:'Entrega',    desc:'El brief final para el cliente' },
  { id:'px', n:7, nombre:'Prompts',    desc:'Prompts de imagen listos para generar' },
  { id:'gx', n:8, nombre:'Guiones',    desc:'Guiones de video vertical' },
  { id:'cx', n:9, nombre:'Copies',     desc:'Textos de publicaciones y WhatsApp' },
];

const nuevoCliente = () => ({
  id: uid(),
  ficha: { nombre:'Nuevo cliente', rubro:'', ciudad:'', pais:'Argentina', instagram:'', whatsapp:'', web:'' },
  fuentes: [],
  etapas: { e1:'', e2:'', e3:'', e4:'', e5:'', e6:'' },
  prompts: [],
  guiones: [],
  copies: [],
  whatsapp: [],
  imagenes: {},
  creado: Date.now()
});

/* ---------- persistencia ---------- */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) DB = { ...DB, ...JSON.parse(raw) };
  } catch (e) { console.warn('load', e); }
  if (!DB.clientes.length) {
    const c = nuevoCliente();
    DB.clientes = [c];
    DB.activo = c.id;
  }
  if (!DB.activo || !DB.clientes.find(c => c.id === DB.activo))
    DB.activo = DB.clientes[0]?.id || null;
  document.documentElement.dataset.theme = DB.theme || 'light';
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e){} };
const cli  = () => DB.clientes.find(c => c.id === DB.activo);

/* ---------- toast ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- api ---------- */
async function api(path, body, method = 'POST') {
  const opt = { method, headers: { 'Content-Type':'application/json' } };
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(path, opt);
  const j = await r.json().catch(() => ({ error:'Respuesta inválida del servidor' }));
  if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
  return j;
}

/* =====================================================================
   RENDER — rail de clientes
   ===================================================================== */
function renderRail() {
  const box = $('#colist');
  box.innerHTML = DB.clientes.map(c => {
    const hechas = Object.values(c.etapas).filter(v => v && v.trim().length > 40).length;
    return `<button class="co" data-id="${c.id}" aria-current="${c.id === DB.activo}">
      <span class="co-dot ${hechas > 0 ? 'on' : ''}"></span>
      <span class="co-meta">
        <span class="co-nm">${esc(c.ficha.nombre || 'Sin nombre')}</span>
        <span class="co-sub">${esc([c.ficha.rubro, c.ficha.ciudad].filter(Boolean).join(' · ') || 'sin datos')}</span>
      </span>
      <span class="co-prog">${hechas}/6</span>
    </button>`;
  }).join('');

  $$('#colist .co').forEach(b => b.onclick = () => {
    DB.activo = b.dataset.id; save(); render();
  });
  $('#noCo').classList.toggle('hidden', DB.clientes.length > 0);
}

/* =====================================================================
   RENDER — tabs
   ===================================================================== */
function renderTabs() {
  const c = cli();
  $('#tabs').innerHTML = ETAPAS.map(e => {
    const done = e.id.startsWith('e')
      ? (c?.etapas[e.id] || '').trim().length > 40
      : (e.id === 'px' ? c?.prompts?.length
        : e.id === 'gx' ? c?.guiones?.length
        : (c?.copies?.length || c?.whatsapp?.length)) > 0;
    return `<button class="tab ${done ? 'done' : ''}" role="tab"
      aria-selected="${TAB === e.id}" data-tab="${e.id}">
      <span class="tab-n">${done ? '✓' : e.n}</span>${e.nombre}</button>`;
  }).join('');

  $$('#tabs .tab').forEach(b => b.onclick = () => { TAB = b.dataset.tab; render(); });
  $('#ctxLabel').textContent = c ? `${c.ficha.nombre}` : '';
  const vc = $('#viewClient'); if (vc && c) vc.href = `/cliente.html?id=${c.id}`;
}

/* =====================================================================
   RENDER — panel principal
   ===================================================================== */
function render() {
  load; renderRail(); renderTabs();
  const c = cli();
  if (!c) { $('#panel').innerHTML = ''; return; }

  if (TAB === 'e1') return renderEtapa1(c);
  if (TAB.startsWith('e')) return renderEtapa(c, TAB);
  if (TAB === 'px') return renderPrompts(c);
  if (TAB === 'gx') return renderGuiones(c);
  if (TAB === 'cx') return renderCopies(c);
}

/* ---------- Etapa 1: incluye ficha + fuentes ---------- */
function renderEtapa1(c) {
  const e = ETAPAS[0];
  $('#panel').innerHTML = `
    <div class="hero">
      <h2>Cargá todo lo que tengas del negocio</h2>
      <p class="lede">Fotos, textos, links a redes, notas de la reunión. El sistema ordena el resto.</p>

      <div class="drop" id="drop" tabindex="0" role="button">
        <div class="big">Soltá archivos acá o hacé clic</div>
        <div class="sm-hint">PDF, TXT, MD, CSV, JSON</div>
        <input type="file" id="fileInput" multiple class="hidden" accept=".pdf,.txt,.md,.csv,.json">
      </div>

      <div class="inp-row">
        <input class="field" id="urlInput" placeholder="https://… instagram, web, catálogo…">
        <button class="btn" id="addUrl">Agregar link</button>
      </div>
      <div style="margin-top:8px">
        <textarea class="field" id="textInput" placeholder="Pegá acá notas de la reunión, el brief del cliente, lo que te contó por WhatsApp…"></textarea>
        <div class="row" style="margin-top:6px">
          <button class="btn" id="addText">Agregar texto</button>
          <span class="note" id="charCount"></span>
        </div>
      </div>
      <div class="srcs" id="srcs"></div>
    </div>

    <div class="block">
      <div class="block-title">Ficha del cliente</div>
      <div class="block-sub">Completala vos o autocompletá desde el material cargado.</div>
      <div class="card g4" id="fichaGrid"></div>
    </div>

    <div class="block">
      <div class="etapa-head">
        <div class="etapa-n ${(c.etapas.e1||'').length>40?'done':''}">${e.n}</div>
        <div style="flex:1">
          <div class="etapa-ttl">${e.nombre}</div>
          <div class="etapa-desc">${e.desc}</div>
        </div>
      </div>
      <div class="row" style="margin-bottom:10px">
        <button class="btn pri" id="runEtapa">Analizar identidad</button>
        <button class="btn" id="autoFicha">Autocompletar ficha</button>
        <span class="note" id="etapaState"></span>
      </div>
      <textarea class="etapa-ta" id="etapaTa" placeholder="El análisis va a aparecer acá. También podés escribirlo vos.">${esc(c.etapas.e1)}</textarea>
    </div>`;

  bindFuentes(c);
  bindFicha(c);
  bindEtapa(c, 'e1');
}

/* ---------- Etapas 2-6 ---------- */
function renderEtapa(c, id) {
  const e = ETAPAS.find(x => x.id === id);
  const prevId = 'e' + (e.n - 1);
  const prevOk = (c.etapas[prevId] || '').trim().length > 40;

  $('#panel').innerHTML = `
    <div class="etapa-head">
      <div class="etapa-n ${(c.etapas[id]||'').length>40?'done':''}">${e.n}</div>
      <div style="flex:1">
        <div class="etapa-ttl">${e.nombre}</div>
        <div class="etapa-desc">${e.desc}</div>
      </div>
    </div>

    ${!prevOk ? `<div class="card" style="margin-bottom:14px; border-color:var(--warn); background:var(--warn-soft)">
      <div class="note" style="color:var(--warn)">Completá la etapa ${e.n-1} primero — cada etapa usa el contexto de la anterior.</div>
    </div>` : ''}

    <div class="row" style="margin-bottom:10px">
      <button class="btn pri" id="runEtapa" ${!prevOk?'disabled':''}>Analizar ${e.nombre.toLowerCase()}</button>
      <button class="btn ghost sm" id="clearEtapa">Limpiar</button>
      <span class="note" id="etapaState"></span>
    </div>
    <textarea class="etapa-ta" id="etapaTa" placeholder="El análisis va a aparecer acá.">${esc(c.etapas[id])}</textarea>`;

  bindEtapa(c, id);
}

/* ---------- Prompts de imagen ---------- */
function renderPrompts(c) {
  const listo = (c.etapas.e4 || '').length > 40 || (c.etapas.e5 || '').length > 40;

  $('#panel').innerHTML = `
    <div class="etapa-head">
      <div class="etapa-n ${c.prompts.length?'done':''}">7</div>
      <div style="flex:1">
        <div class="etapa-ttl">Prompts de imagen</div>
        <div class="etapa-desc">Listos para pegar en Ideogram, Nano Banana o generar acá con Replicate</div>
      </div>
    </div>

    ${!listo ? `<div class="card" style="margin-bottom:14px; border-color:var(--warn); background:var(--warn-soft)">
      <div class="note" style="color:var(--warn)">Necesito la etapa de Estrategia o Producción antes de generar prompts.</div>
    </div>` : ''}

    <div class="row" style="margin-bottom:14px">
      <button class="btn pri" id="genPrompts" ${!listo?'disabled':''}>Generar prompts</button>
      <select class="field" id="cantPrompts" style="width:auto">
        <option value="4">4 prompts</option>
        <option value="6" selected>6 prompts</option>
        <option value="8">8 prompts</option>
      </select>
      <button class="btn" id="genAllImgs" ${!c.prompts.length?'disabled':''}>Generar todas las imágenes</button>
      <span class="note" id="pxState"></span>
    </div>

    ${c.prompts.length ? `<div class="out-list">${c.prompts.map((p,i) => promptCard(p,i,c)).join('')}</div>` : `
      <div class="card" style="text-align:center; padding:40px 20px">
        <div class="note">Todavía no hay prompts. Generá los primeros con el botón de arriba.</div>
      </div>`}`;

  bindPrompts(c);
}

function promptCard(p, i, c) {
  const img = c.imagenes[`p${p.n}`];
  return `<div class="out-card">
    <div class="out-head">
      <span class="out-badge">#${p.n}</span>
      <span class="out-badge fmt">${esc(p.formato || '1:1')}</span>
      <span class="out-badge fmt">${esc(p.modo || 'light')}</span>
      <span class="out-ttl">${esc(p.titulo || 'Sin título')}
        <span class="out-sub">${esc(p.angulo || '')}</span></span>
      <button class="btn sm" data-copy="${i}">Copiar</button>
      <button class="btn sm pri" data-img="${i}">${img?'Regenerar':'Generar'}</button>
    </div>
    <div class="out-body">
      ${img ? `<img src="${esc(img)}" style="width:100%; max-width:280px; border-radius:10px; margin-bottom:10px; display:block">` : ''}
      <div class="out-pre" data-pre="${i}">${esc(p.prompt || '')}</div>
      ${p.negative ? `<div class="chips"><span class="chip">negative: ${esc(p.negative).slice(0,90)}…</span></div>` : ''}
    </div>
  </div>`;
}

/* ---------- Guiones ---------- */
function renderGuiones(c) {
  const listo = (c.etapas.e4 || '').length > 40;
  $('#panel').innerHTML = `
    <div class="etapa-head">
      <div class="etapa-n ${c.guiones.length?'done':''}">8</div>
      <div style="flex:1">
        <div class="etapa-ttl">Guiones de video</div>
        <div class="etapa-desc">Vertical 9:16 · gancho, agitación, solución, cierre</div>
      </div>
    </div>
    <div class="row" style="margin-bottom:14px">
      <button class="btn pri" id="genGuiones" ${!listo?'disabled':''}>Generar guiones</button>
      <span class="note" id="gxState"></span>
    </div>
    ${c.guiones.length ? `<div class="out-list">${c.guiones.map((g,i)=>`
      <div class="out-card">
        <div class="out-head">
          <span class="out-badge">#${g.n}</span>
          <span class="out-badge fmt">${esc(g.duracion||'30s')}</span>
          <span class="out-ttl">${esc(g.titulo||'')}</span>
          <button class="btn sm" data-gcopy="${i}">Copiar</button>
        </div>
        <div class="out-body">
          <div style="font-size:13px; font-weight:600; margin-bottom:8px; color:var(--acc)">${esc(g.gancho||'')}</div>
          ${(g.bloques||[]).map(b=>`
            <div style="display:flex; gap:10px; padding:7px 0; border-bottom:1px solid var(--line)">
              <span class="mono" style="font-size:11px; color:var(--ink-3); flex:none; width:52px">${esc(b.t||'')}</span>
              <div style="flex:1; min-width:0">
                <div style="font-size:12.5px">${esc(b.voz||'')}</div>
                <div class="note" style="margin-top:2px">📹 ${esc(b.imagen||'')}</div>
              </div>
            </div>`).join('')}
          ${g.cierre?`<div style="margin-top:9px; font-size:12.5px; font-weight:500">${esc(g.cierre)}</div>`:''}
        </div>
      </div>`).join('')}</div>` : `
      <div class="card" style="text-align:center; padding:40px 20px">
        <div class="note">Todavía no hay guiones.</div>
      </div>`}`;
  bindGuiones(c);
}

/* ---------- Copies + WhatsApp ---------- */
function renderCopies(c) {
  const listo = (c.etapas.e4 || '').length > 40;
  $('#panel').innerHTML = `
    <div class="etapa-head">
      <div class="etapa-n ${(c.copies.length||c.whatsapp.length)?'done':''}">9</div>
      <div style="flex:1">
        <div class="etapa-ttl">Copies y WhatsApp</div>
        <div class="etapa-desc">Textos de publicaciones y plantillas de conversación</div>
      </div>
    </div>
    <div class="row" style="margin-bottom:14px">
      <button class="btn pri" id="genCopies" ${!listo?'disabled':''}>Generar copies</button>
      <button class="btn" id="genWa" ${!listo?'disabled':''}>Generar plantillas WhatsApp</button>
      <span class="note" id="cxState"></span>
    </div>

    ${c.copies.length?`<div class="block-title">Publicaciones (${c.copies.length})</div>
    <div class="out-list" style="margin-bottom:22px">${c.copies.map((x,i)=>`
      <div class="out-card">
        <div class="out-head">
          <span class="out-badge">#${x.n}</span>
          <span class="out-badge fmt">${esc(x.formato||'feed')}</span>
          <span class="out-ttl">${esc(x.angulo||'')}</span>
          <button class="btn sm" data-ccopy="${i}">Copiar</button>
        </div>
        <div class="out-body">
          <div style="font-size:13.5px; font-weight:600; margin-bottom:6px">${esc(x.gancho||'')}</div>
          <div style="font-size:13px; line-height:1.6; color:var(--ink-2); white-space:pre-wrap">${esc(x.cuerpo||'')}</div>
          <div style="margin-top:8px; font-size:12.5px; color:var(--acc); font-weight:500">${esc(x.cta||'')}</div>
          ${x.hashtags?`<div class="note" style="margin-top:5px">${esc(x.hashtags)}</div>`:''}
        </div>
      </div>`).join('')}</div>`:''}

    ${c.whatsapp.length?`<div class="block-title">Plantillas de WhatsApp (${c.whatsapp.length})</div>
    <div class="out-list">${c.whatsapp.map((w,i)=>`
      <div class="out-card">
        <div class="out-head">
          <span class="out-badge">${esc(w.momento||'')}</span>
          <span class="out-ttl"><span class="out-sub">${esc(w.cuando||'')}</span></span>
          <button class="btn sm" data-wcopy="${i}">Copiar</button>
        </div>
        <div class="out-body">
          <div style="font-size:13px; line-height:1.6; white-space:pre-wrap; background:var(--panel-2); padding:11px; border-radius:9px">${esc(w.texto||'')}</div>
          ${w.porque?`<div class="note" style="margin-top:7px">💡 ${esc(w.porque)}</div>`:''}
        </div>
      </div>`).join('')}</div>`:''}

    ${!c.copies.length && !c.whatsapp.length?`
      <div class="card" style="text-align:center; padding:40px 20px">
        <div class="note">Todavía no hay contenido generado.</div>
      </div>`:''}`;
  bindCopies(c);
}

/* =====================================================================
   BINDINGS
   ===================================================================== */
function bindFicha(c) {
  const campos = [
    ['nombre','Negocio'], ['rubro','Rubro'], ['ciudad','Ciudad'], ['pais','País'],
    ['instagram','Instagram'], ['whatsapp','WhatsApp'], ['web','Web'],
  ];
  $('#fichaGrid').innerHTML = campos.map(([k,l]) =>
    `<div><label class="lab">${l}</label>
     <input class="field" data-f="${k}" value="${esc(c.ficha[k]||'')}"></div>`).join('');
  $$('#fichaGrid input').forEach(i => i.oninput = () => {
    c.ficha[i.dataset.f] = i.value; save(); renderRail();
    $('#ctxLabel').textContent = c.ficha.nombre;
  });

  const auto = $('#autoFicha');
  if (auto) auto.onclick = async () => {
    const fuentes = c.fuentes.map(f => f.text).join('\n\n---\n\n');
    if (!fuentes.trim()) return toast('Cargá material primero');
    auto.disabled = true; auto.textContent = 'Leyendo…';
    try {
      const { ficha } = await api('/api/analyze', { etapa:'ficha', fuentes: fuentes.slice(0,60000) });
      Object.assign(c.ficha, Object.fromEntries(Object.entries(ficha).filter(([,v]) => v)));
      save(); render(); toast('Ficha completada');
    } catch (e) { toast(e.message); }
    finally { auto.disabled = false; auto.textContent = 'Autocompletar ficha'; }
  };
}

function bindFuentes(c) {
  const drawSrcs = () => {
    $('#srcs').innerHTML = c.fuentes.map((f,i) =>
      `<span class="src-chip"><span class="src-ck">✓</span>
        <span class="src-type">${esc(f.tipo)}</span>${esc(f.nombre).slice(0,38)}
        <button class="src-x" data-rm="${i}">×</button></span>`).join('');
    $$('#srcs .src-x').forEach(b => b.onclick = () => {
      c.fuentes.splice(+b.dataset.rm,1); save(); drawSrcs();
    });
    const total = c.fuentes.reduce((a,f) => a + (f.text?.length||0), 0);
    $('#charCount').textContent = total ? `${c.fuentes.length} fuentes · ${(total/1000).toFixed(1)}k caracteres` : '';
  };
  drawSrcs();

  const addSrc = (tipo, nombre, text) => {
    c.fuentes.push({ tipo, nombre, text }); save(); drawSrcs();
  };

  const drop = $('#drop'), fi = $('#fileInput');
  drop.onclick = () => fi.click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); handleFiles(e.dataTransfer.files); };
  fi.onchange = () => handleFiles(fi.files);

  async function handleFiles(files) {
    for (const f of files) {
      try {
        if (f.name.toLowerCase().endsWith('.pdf')) {
          const buf = await f.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
          let txt = '';
          for (let p = 1; p <= Math.min(pdf.numPages, 60); p++) {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            txt += tc.items.map(i => i.str).join(' ') + '\n';
          }
          addSrc('pdf', f.name, txt);
        } else {
          addSrc('archivo', f.name, await f.text());
        }
        toast(`${f.name} cargado`);
      } catch (e) { toast(`Error con ${f.name}`); }
    }
  }

  $('#addUrl').onclick = async () => {
    const u = $('#urlInput').value.trim();
    if (!u) return;
    const b = $('#addUrl'); b.disabled = true; b.textContent = 'Leyendo…';
    try {
      const { title, text } = await api('/api/fetch', { url:u });
      addSrc('link', title || u, text); $('#urlInput').value = '';
      toast('Link agregado');
    } catch (e) { toast(e.message); }
    finally { b.disabled = false; b.textContent = 'Agregar link'; }
  };

  $('#addText').onclick = () => {
    const t = $('#textInput').value.trim();
    if (!t) return;
    addSrc('nota', `Nota ${c.fuentes.length+1}`, t);
    $('#textInput').value = ''; toast('Texto agregado');
  };
}

function bindEtapa(c, id) {
  const ta = $('#etapaTa');
  ta.oninput = () => { c.etapas[id] = ta.value; save(); };

  const clear = $('#clearEtapa');
  if (clear) clear.onclick = () => { ta.value=''; c.etapas[id]=''; save(); renderTabs(); };

  $('#runEtapa').onclick = async () => {
    const b = $('#runEtapa'), st = $('#etapaState');
    const fuentes = c.fuentes.map(f => `[${f.tipo}] ${f.nombre}\n${f.text}`).join('\n\n---\n\n');
    if (id === 'e1' && !fuentes.trim()) return toast('Cargá material del negocio primero');

    b.disabled = true; st.textContent = 'Analizando…'; st.classList.add('pulse');
    try {
      const { texto } = await api('/api/analyze', {
        etapa: id, cliente: c.ficha, previo: c.etapas, fuentes: fuentes.slice(0,70000)
      });
      c.etapas[id] = texto; ta.value = texto; save(); renderTabs();
      st.textContent = 'Listo'; st.classList.remove('pulse');
      toast('Etapa completada');
    } catch (e) {
      st.textContent = ''; st.classList.remove('pulse'); toast(e.message);
    } finally { b.disabled = false; }
  };
}

function bindPrompts(c) {
  const gen = $('#genPrompts');
  if (gen) gen.onclick = async () => {
    const st = $('#pxState');
    gen.disabled = true; st.textContent = 'Generando prompts…'; st.classList.add('pulse');
    try {
      const j = await api('/api/prompts', {
        cliente: c.ficha,
        estrategia: c.etapas.e4,
        produccion: c.etapas.e5,
        cantidad: +$('#cantPrompts').value
      });
      c.prompts = j.prompts || []; save(); render(); toast(`${c.prompts.length} prompts generados`);
    } catch (e) { st.textContent=''; st.classList.remove('pulse'); toast(e.message); }
    finally { gen.disabled = false; }
  };

  $$('[data-copy]').forEach(b => b.onclick = () => {
    navigator.clipboard.writeText(c.prompts[+b.dataset.copy].prompt);
    toast('Prompt copiado');
  });
  $$('[data-pre]').forEach(p => p.onclick = () => p.classList.toggle('expanded'));

  $$('[data-img]').forEach(b => b.onclick = async () => {
    const p = c.prompts[+b.dataset.img];
    b.disabled = true; b.textContent = 'Generando…';
    try {
      const r = await api('/api/imagen', {
        prompt: p.prompt, negative: p.negative || '',
        aspect: (p.formato||'1:1').replace('x',':')
      });
      let url = r.url;
      if (!url && r.id) {
        for (let i = 0; i < 45; i++) {
          await new Promise(s => setTimeout(s, 2000));
          const s = await api(`/api/imagen/${r.id}`, null, 'GET');
          if (s.status === 'succeeded' && s.url) { url = s.url; break; }
          if (s.status === 'failed') throw new Error(s.error || 'Falló la generación');
        }
      }
      if (!url) throw new Error('Timeout esperando la imagen');
      c.imagenes[`p${p.n}`] = url; save(); render(); toast('Imagen lista');
    } catch (e) { toast(e.message); b.disabled=false; b.textContent='Generar'; }
  });

  const all = $('#genAllImgs');
  if (all) all.onclick = async () => {
    all.disabled = true;
    for (const btn of $$('[data-img]')) { btn.click(); await new Promise(s=>setTimeout(s,1500)); }
  };
}

function bindGuiones(c) {
  const gen = $('#genGuiones');
  if (gen) gen.onclick = async () => {
    const st = $('#gxState');
    gen.disabled = true; st.textContent='Escribiendo guiones…'; st.classList.add('pulse');
    try {
      const j = await api('/api/guiones', { cliente:c.ficha, estrategia:c.etapas.e4, cantidad:4 });
      c.guiones = j.guiones || []; save(); render(); toast(`${c.guiones.length} guiones listos`);
    } catch(e){ st.textContent=''; st.classList.remove('pulse'); toast(e.message); }
    finally { gen.disabled = false; }
  };
  $$('[data-gcopy]').forEach(b => b.onclick = () => {
    const g = c.guiones[+b.dataset.gcopy];
    const txt = `${g.titulo}\n${g.gancho}\n\n` +
      (g.bloques||[]).map(x=>`[${x.t}] ${x.voz}\n  📹 ${x.imagen}`).join('\n\n') +
      `\n\n${g.cierre||''}`;
    navigator.clipboard.writeText(txt); toast('Guion copiado');
  });
}

function bindCopies(c) {
  const gc = $('#genCopies');
  if (gc) gc.onclick = async () => {
    const st = $('#cxState');
    gc.disabled=true; st.textContent='Escribiendo copies…'; st.classList.add('pulse');
    try {
      const j = await api('/api/copies', { cliente:c.ficha, estrategia:c.etapas.e4, cantidad:12 });
      c.copies = j.copies || []; save(); render(); toast(`${c.copies.length} copies listos`);
    } catch(e){ st.textContent=''; st.classList.remove('pulse'); toast(e.message); }
    finally { gc.disabled=false; }
  };

  const gw = $('#genWa');
  if (gw) gw.onclick = async () => {
    const st = $('#cxState');
    gw.disabled=true; st.textContent='Escribiendo plantillas…'; st.classList.add('pulse');
    try {
      const j = await api('/api/whatsapp', { cliente:c.ficha, avatar:c.etapas.e3, producto:c.etapas.e2 });
      c.whatsapp = j.plantillas || []; save(); render(); toast('Plantillas listas');
    } catch(e){ st.textContent=''; st.classList.remove('pulse'); toast(e.message); }
    finally { gw.disabled=false; }
  };

  $$('[data-ccopy]').forEach(b => b.onclick = () => {
    const x = c.copies[+b.dataset.ccopy];
    navigator.clipboard.writeText(`${x.gancho}\n\n${x.cuerpo}\n\n${x.cta}\n\n${x.hashtags||''}`);
    toast('Copy copiado');
  });
  $$('[data-wcopy]').forEach(b => b.onclick = () => {
    navigator.clipboard.writeText(c.whatsapp[+b.dataset.wcopy].texto);
    toast('Plantilla copiada');
  });
}

/* =====================================================================
   GLOBAL
   ===================================================================== */
$('#newCo').onclick = () => {
  const c = nuevoCliente();
  DB.clientes.unshift(c); DB.activo = c.id; TAB='e1'; save(); render();
  toast('Cliente creado');
};

$('#themeBtn').onclick = () => {
  DB.theme = DB.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = DB.theme; save();
};

$('#exportBtn').onclick = () => {
  const c = cli(); if (!c) return;
  const out = [
    `KORESKILL · ${c.ficha.nombre}`,
    `${c.ficha.rubro} · ${c.ficha.ciudad}, ${c.ficha.pais}`,
    '', '='.repeat(60), ''
  ];
  ETAPAS.filter(e=>e.id.startsWith('e')).forEach(e => {
    if (c.etapas[e.id]) out.push(`\n### ETAPA ${e.n} — ${e.nombre.toUpperCase()}\n`, c.etapas[e.id], '');
  });
  if (c.prompts.length) {
    out.push('\n### PROMPTS DE IMAGEN\n');
    c.prompts.forEach(p => out.push(`--- #${p.n} · ${p.formato} · ${p.titulo}`, p.prompt, ''));
  }
  if (c.copies.length) {
    out.push('\n### COPIES\n');
    c.copies.forEach(x => out.push(`--- #${x.n} ${x.formato}`, x.gancho, x.cuerpo, x.cta, ''));
  }
  const blob = new Blob([out.join('\n')], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `koreskill-${(c.ficha.nombre||'cliente').toLowerCase().replace(/\s+/g,'-')}.txt`;
  a.click();
  toast('Exportado');
};

/* ---------- boot ---------- */
(async () => {
  load(); render();
  try {
    const h = await api('/api/health', null, 'GET');
    $('#apiDot').classList.toggle('on', h.openai);
    $('#apiLbl').textContent = h.openai
      ? (h.replicate ? 'OpenAI + Replicate' : 'OpenAI · sin Replicate')
      : 'Modo local · sin API';
  } catch { $('#apiLbl').textContent = 'Sin conexión'; }
})();
