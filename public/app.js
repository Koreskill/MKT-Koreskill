/* =====================================================================
   KORESKILL CAMPAIGN STUDIO — frontend v2
   Un recorrido simple para trabajar cada marca de forma continua.
   ===================================================================== */
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));
const nowMonth = () => new Intl.DateTimeFormat('es-AR', { month:'long', year:'numeric' }).format(new Date());

const KEY = 'koreskill.studio.v2';
const LEGACY_KEY = 'koreskill.studio.v1';
let DB = { version:2, clientes:[], activo:null, theme:'light' };
let TAB = 'marca';

const ETAPAS = [
  { id:'marca', n:1, nombre:'Marca', desc:'Entendemos el negocio y ordenamos la información' },
  { id:'productos', n:2, nombre:'Productos', desc:'Definimos qué se vende y qué impulsamos' },
  { id:'plan', n:3, nombre:'Plan del mes', desc:'Elegimos objetivo, mensaje y piezas' },
  { id:'produccion', n:4, nombre:'Producción', desc:'Preparamos imágenes, videos, copies y respuestas' },
  { id:'entrega', n:5, nombre:'Entrega', desc:'Revisamos, organizamos y dejamos el próximo paso' }
];

const productoVacio = () => ({
  id: uid(), nombre:'', categoria:'', descripcion:'', precio:'', margen:'',
  modo_venta:'', foto_url:'', prioridad:'secundario', capacidad:''
});

const piezaVacia = () => ({
  id: uid(), dia:'', semana:'', formato:'feed', titulo:'', objetivo:'',
  producto_id:'', tipo:'atraer', copy:'', cta:'', media_url:'', estado:'pendiente', comentarios:[]
});

const nuevoCliente = () => ({
  id: uid(),
  ficha: {
    nombre:'Nuevo cliente', rubro:'', ciudad:'', pais:'Argentina', contacto:'',
    whatsapp:'', instagram:'', web:'', descripcion:'', diferencial:'', tono:'',
    colores:'', tipografia:''
  },
  fuentes:[],
  marca:{ diagnostico:'' },
  productos:[],
  productos_analisis:'',
  mes_actual:{ mes:nowMonth(), objetivo:'', mensaje_central:'', producto_principal_id:'', plan:'', piezas:[] },
  produccion:{ prompts:[], guiones:[], copies:[], whatsapp:[], imagenes:{}, resumen:'' },
  entrega:{ estado:'en proceso', resumen:'', drive_url:'', calendario_url:'', notas:'', proxima_accion:'', checklist:{} },
  historial:[], creado:Date.now(), actualizado:Date.now()
});

function normalizeClient(client) {
  const c = client || nuevoCliente();
  c.ficha = { ...nuevoCliente().ficha, ...(c.ficha || {}) };
  c.fuentes = Array.isArray(c.fuentes) ? c.fuentes : [];
  c.marca = { diagnostico:'', ...(c.marca || {}) };
  c.productos = (Array.isArray(c.productos) ? c.productos : []).map(product => ({ ...productoVacio(), ...product, id:product.id || uid() }));
  c.productos_analisis = c.productos_analisis || '';
  c.mes_actual = { mes:nowMonth(), objetivo:'', mensaje_central:'', producto_principal_id:'', plan:'', piezas:[], ...(c.mes_actual || {}) };
  c.mes_actual.piezas = (Array.isArray(c.mes_actual.piezas) ? c.mes_actual.piezas : []).map(piece => ({ ...piezaVacia(), ...piece, id:piece.id || uid() }));
  c.produccion = { prompts:[], guiones:[], copies:[], whatsapp:[], imagenes:{}, resumen:'', ...(c.produccion || {}) };
  c.produccion.prompts = Array.isArray(c.produccion.prompts) ? c.produccion.prompts : [];
  c.produccion.guiones = Array.isArray(c.produccion.guiones) ? c.produccion.guiones : [];
  c.produccion.copies = Array.isArray(c.produccion.copies) ? c.produccion.copies : [];
  c.produccion.whatsapp = Array.isArray(c.produccion.whatsapp) ? c.produccion.whatsapp : [];
  c.produccion.imagenes = c.produccion.imagenes || {};
  c.entrega = { estado:'en proceso', resumen:'', drive_url:'', calendario_url:'', notas:'', proxima_accion:'', checklist:{}, ...(c.entrega || {}) };
  c.entrega.checklist = { brief:false, plan:false, produccion:false, aprobacion:false, entrega:false, ...(c.entrega.checklist || {}) };

  /* Migración segura de clientes guardados con la estructura anterior. */
  if (c.etapas) {
    if (!c.marca.diagnostico && c.etapas.e1) c.marca.diagnostico = c.etapas.e1;
    if (!c.productos.length && c.etapas.e2) c.productos = [{ ...productoVacio(), id:'producto-principal', nombre:'Producto principal', prioridad:'principal', descripcion:c.etapas.e2 }];
    if (!c.productos_analisis && c.etapas.e2) c.productos_analisis = c.etapas.e2;
    if (!c.mes_actual.plan && c.etapas.e4) c.mes_actual.plan = c.etapas.e4;
    if (!c.produccion.resumen && c.etapas.e5) c.produccion.resumen = c.etapas.e5;
    if (!c.entrega.resumen && c.etapas.e6) c.entrega.resumen = c.etapas.e6;
  }
  if (!c.produccion.prompts.length && Array.isArray(c.prompts)) c.produccion.prompts = c.prompts;
  if (!c.produccion.guiones.length && Array.isArray(c.guiones)) c.produccion.guiones = c.guiones;
  if (!c.produccion.copies.length && Array.isArray(c.copies)) c.produccion.copies = c.copies;
  if (!c.produccion.whatsapp.length && Array.isArray(c.whatsapp)) c.produccion.whatsapp = c.whatsapp;
  if (!Object.keys(c.produccion.imagenes).length && c.imagenes) c.produccion.imagenes = c.imagenes;
  c.actualizado = c.actualizado || Date.now();
  return c;
}

function load() {
  try {
    const current = localStorage.getItem(KEY);
    const legacy = localStorage.getItem(LEGACY_KEY);
    DB = current ? { ...DB, ...JSON.parse(current) } : legacy ? { ...DB, ...JSON.parse(legacy), version:2 } : DB;
  } catch (error) { console.warn('No se pudo cargar el proyecto', error); }
  DB.clientes = (DB.clientes || []).map(normalizeClient);
  if (!DB.clientes.length) {
    const c = nuevoCliente();
    DB.clientes = [c];
    DB.activo = c.id;
  }
  if (!DB.activo || !DB.clientes.find(c => c.id === DB.activo)) DB.activo = DB.clientes[0]?.id || null;
  document.documentElement.dataset.theme = DB.theme || 'light';
  save();
}

function save() {
  try {
    const c = cli();
    if (c) c.actualizado = Date.now();
    localStorage.setItem(KEY, JSON.stringify(DB));
  } catch (error) { console.warn('No se pudo guardar', error); }
}

const cli = () => DB.clientes.find(client => client.id === DB.activo);

let toastT;
function toast(message) {
  const target = $('#toast');
  if (!target) return;
  target.textContent = message;
  target.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => target.classList.remove('show'), String(message || '').length > 90 ? 6500 : 3000);
}

async function api(path, body, method = 'POST', timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const options = { method, headers:{ 'Content-Type':'application/json' }, signal:controller.signal };
  if (body) options.body = JSON.stringify(body);
  try {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({ error:'Respuesta inválida del servidor' }));
    if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('La operación tardó demasiado. Probá de nuevo; lo guardado no se pierde.');
    throw error;
  } finally { clearTimeout(timer); }
}

function sectionDone(c, id) {
  if (id === 'marca') return Boolean(c.ficha.nombre && (c.fuentes.length || c.marca.diagnostico || c.ficha.descripcion));
  if (id === 'productos') return c.productos.length > 0;
  if (id === 'plan') return Boolean(c.mes_actual.objetivo && (c.mes_actual.mensaje_central || c.mes_actual.plan));
  if (id === 'produccion') return Boolean(c.produccion.prompts.length || c.produccion.guiones.length || c.produccion.copies.length || c.produccion.whatsapp.length);
  if (id === 'entrega') return Boolean(c.entrega.resumen || c.entrega.drive_url || c.entrega.calendario_url || c.entrega.estado === 'entregada');
  return false;
}

function completedCount(c) { return ETAPAS.filter(stage => sectionDone(c, stage.id)).length; }

function renderRail() {
  const list = $('#colist');
  list.innerHTML = DB.clientes.map(c => `<button class="co" data-id="${c.id}" aria-current="${c.id === DB.activo}">
    <span class="co-dot ${completedCount(c) ? 'on' : ''}"></span>
    <span class="co-meta"><span class="co-nm">${esc(c.ficha.nombre || 'Sin nombre')}</span>
    <span class="co-sub">${esc([c.ficha.rubro, c.ficha.ciudad].filter(Boolean).join(' · ') || 'sin datos')}</span></span>
    <span class="co-prog">${completedCount(c)}/5</span>
  </button>`).join('');
  $$('#colist .co').forEach(button => button.onclick = () => { DB.activo = button.dataset.id; save(); render(); });
  $('#noCo').classList.toggle('hidden', DB.clientes.length > 0);
}

function renderTabs() {
  const c = cli();
  $('#tabs').innerHTML = ETAPAS.map(stage => `<button class="tab ${sectionDone(c, stage.id) ? 'done' : ''}" role="tab" aria-selected="${TAB === stage.id}" data-tab="${stage.id}">
    <span class="tab-n">${sectionDone(c, stage.id) ? '✓' : stage.n}</span>${stage.nombre}</button>`).join('');
  $$('#tabs .tab').forEach(button => button.onclick = () => { TAB = button.dataset.tab; render(); });
  $('#ctxLabel').textContent = c ? c.ficha.nombre : '';
  const view = $('#viewClient');
  if (view && c) view.href = `/cliente.html?id=${encodeURIComponent(c.id)}`;
}

function sectionHead(stage, intro = '') {
  const c = cli();
  return `<div class="etapa-head"><div class="etapa-n ${sectionDone(c, stage.id) ? 'done' : ''}">${sectionDone(c, stage.id) ? '✓' : stage.n}</div>
    <div style="flex:1"><div class="etapa-ttl">${stage.nombre}</div><div class="etapa-desc">${stage.desc}</div>${intro ? `<div class="note" style="margin-top:5px">${intro}</div>` : ''}</div></div>`;
}

function processLine(active) {
  return `<div class="process-line">${ETAPAS.map((stage, index) => `<span class="process-step ${stage.id === active ? 'active' : ''}"><b>${index + 1}</b>${stage.nombre}</span>`).join('<span class="process-arrow">→</span>')}</div>`;
}

function render() {
  renderRail(); renderTabs();
  const c = cli();
  if (!c) { $('#panel').innerHTML = ''; return; }
  if (TAB === 'marca') return renderMarca(c);
  if (TAB === 'productos') return renderProductos(c);
  if (TAB === 'plan') return renderPlan(c);
  if (TAB === 'produccion') return renderProduccion(c);
  if (TAB === 'entrega') return renderEntrega(c);
}

function renderMarca(c) {
  $('#panel').innerHTML = `${processLine('marca')}
    <div class="hero"><h2>Primero entendemos la marca</h2><p class="lede">Cargá todo lo que tengas. Con eso ordenamos qué hace, para quién vende y cómo conviene comunicarla.</p>
      <div class="drop" id="drop" tabindex="0" role="button"><div class="big">Soltá archivos acá o hacé clic</div><div class="sm-hint">PDF, TXT, MD, CSV, JSON</div><input type="file" id="fileInput" multiple class="hidden" accept=".pdf,.txt,.md,.csv,.json"></div>
      <div class="inp-row"><input class="field" id="urlInput" placeholder="https://… web, catálogo o red social"><button class="btn" id="addUrl">Agregar link</button></div>
      <div style="margin-top:8px"><textarea class="field" id="textInput" placeholder="Pegá notas de la reunión, el brief, lo que te contó por WhatsApp…"></textarea><div class="row" style="margin-top:6px"><button class="btn" id="addText">Agregar texto</button><span class="note" id="charCount"></span></div></div>
      <div class="srcs" id="srcs"></div>
    </div>
    <div class="block"><div class="block-title">Ficha de la marca</div><div class="block-sub">Estos datos se usan en todo el proceso. Si algo falta, queda marcado como pendiente.</div><div class="card g3" id="fichaGrid"></div></div>
    <div class="block"><div class="block-title">Contexto ordenado</div><div class="block-sub">Una síntesis práctica para trabajar la marca.</div><div class="row" style="margin-bottom:10px"><button class="btn pri" id="runMarca">Ordenar información</button><button class="btn" id="autoFicha">Completar datos básicos</button><span class="note" id="marcaState"></span></div><textarea class="etapa-ta" id="marcaTa" placeholder="Acá va a quedar el contexto ordenado…">${esc(c.marca.diagnostico)}</textarea></div>`;
  bindFuentes(c); bindFicha(c); bindMarca(c);
}

function bindFicha(c) {
  const fields = [
    ['nombre','Negocio'], ['rubro','Rubro'], ['ciudad','Ciudad'], ['pais','País'],
    ['contacto','Persona de contacto'], ['whatsapp','WhatsApp'], ['instagram','Instagram'], ['web','Web'],
    ['descripcion','Qué hace'], ['diferencial','Qué lo diferencia'], ['tono','Tono de comunicación'], ['colores','Colores'], ['tipografia','Tipografía']
  ];
  $('#fichaGrid').innerHTML = fields.map(([key,label]) => `<div class="${['descripcion','diferencial','tono'].includes(key) ? 'span-2' : ''}"><label class="lab">${label}</label>${['descripcion','diferencial','tono'].includes(key) ? `<textarea class="field" data-f="${key}" rows="2" placeholder="Pendiente">${esc(c.ficha[key] || '')}</textarea>` : `<input class="field" data-f="${key}" value="${esc(c.ficha[key] || '')}" placeholder="Pendiente">`}</div>`).join('');
  $$('[data-f]').forEach(input => input.oninput = () => { c.ficha[input.dataset.f] = input.value; save(); renderRail(); $('#ctxLabel').textContent = c.ficha.nombre; });
  $('#autoFicha').onclick = async () => {
    const sources = c.fuentes.map(source => source.text).join('\n\n---\n\n');
    if (!sources.trim()) return toast('Cargá material primero');
    const button = $('#autoFicha'); button.disabled = true; button.textContent = 'Leyendo…';
    try { const data = await api('/api/analyze', { etapa:'ficha', fuentes:sources.slice(0,14000) }); Object.assign(c.ficha, data.ficha || {}); save(); render(); toast('Datos básicos completados'); }
    catch (error) { toast(error.message); }
    finally { button.disabled = false; button.textContent = 'Completar datos básicos'; }
  };
}

function bindFuentes(c) {
  const draw = () => {
    $('#srcs').innerHTML = c.fuentes.map((source,index) => `<span class="src-chip"><span class="src-ck">✓</span><span class="src-type">${esc(source.tipo)}</span>${esc(source.nombre).slice(0,38)}<button class="src-x" data-rm="${index}" type="button">×</button></span>`).join('');
    $$('#srcs .src-x').forEach(button => button.onclick = () => { c.fuentes.splice(+button.dataset.rm,1); save(); draw(); });
    const total = c.fuentes.reduce((sum, source) => sum + (source.text?.length || 0), 0);
    $('#charCount').textContent = total ? `${c.fuentes.length} fuente${c.fuentes.length === 1 ? '' : 's'} · ${(total / 1000).toFixed(1)}k caracteres` : '';
  };
  const add = (tipo,nombre,text) => { c.fuentes.push({ tipo,nombre,text }); save(); draw(); };
  draw();
  const drop = $('#drop'); const input = $('#fileInput');
  drop.onclick = () => input.click();
  drop.ondragover = event => { event.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = event => { event.preventDefault(); drop.classList.remove('over'); handleFiles(event.dataTransfer.files); };
  input.onchange = () => handleFiles(input.files);
  async function handleFiles(files) {
    for (const file of files) {
      try {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const pdf = await pdfjsLib.getDocument({ data:await file.arrayBuffer() }).promise;
          let text = '';
          for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 40); pageNumber++) { const page = await pdf.getPage(pageNumber); const content = await page.getTextContent(); text += content.items.map(item => item.str).join(' ') + '\n'; }
          add('pdf', file.name, text);
        } else add('archivo', file.name, await file.text());
        toast(`${file.name} cargado`);
      } catch { toast(`No pude leer ${file.name}`); }
    }
  }
  $('#addUrl').onclick = async () => {
    const url = $('#urlInput').value.trim(); if (!url) return;
    const button = $('#addUrl'); button.disabled = true; button.textContent = 'Leyendo…';
    try { const data = await api('/api/fetch', { url }); add('link', data.title || url, data.text); $('#urlInput').value = ''; toast('Link agregado'); }
    catch (error) { toast(error.message); }
    finally { button.disabled = false; button.textContent = 'Agregar link'; }
  };
  $('#addText').onclick = () => { const text = $('#textInput').value.trim(); if (!text) return; add('nota',`Nota ${c.fuentes.length + 1}`,text); $('#textInput').value = ''; toast('Texto agregado'); };
}

function bindMarca(c) {
  $('#marcaTa').oninput = event => { c.marca.diagnostico = event.target.value; save(); renderTabs(); };
  $('#runMarca').onclick = async () => {
    const button = $('#runMarca'); const state = $('#marcaState'); const sources = c.fuentes.map(source => `[${source.tipo}] ${source.nombre}\n${source.text}`).join('\n\n---\n\n');
    if (!sources.trim() && !c.ficha.descripcion) return toast('Cargá material o completá qué hace el negocio');
    button.disabled = true; state.textContent = 'Ordenando…'; state.classList.add('pulse');
    try { const data = await api('/api/analyze', { etapa:'marca', cliente:c.ficha, previo:'', fuentes:sources.slice(0,18000) }); c.marca.diagnostico = data.texto; $('#marcaTa').value = data.texto; save(); renderTabs(); state.textContent = 'Listo'; toast('Contexto de marca ordenado'); }
    catch (error) { state.textContent = ''; toast(error.message); }
    finally { button.disabled = false; state.classList.remove('pulse'); }
  };
}

function renderProductos(c) {
  $('#panel').innerHTML = `${processLine('productos')}${sectionHead(ETAPAS[1], 'Acá definimos qué se puede vender, mostrar y priorizar este mes.')}
    <div class="row" style="margin-bottom:14px"><button class="btn pri" id="addProduct">+ Agregar producto o servicio</button><button class="btn" id="analyzeProducts">Ordenar oferta</button><span class="note" id="productsState"></span></div>
    <div id="productsList" class="out-list"></div>
    <div class="block"><div class="block-title">Análisis de la oferta</div><div class="block-sub">Sirve para decidir qué impulsar. No reemplaza la información real de precios y capacidad.</div><textarea class="etapa-ta short" id="productsAnalysis" placeholder="Todavía no ordenamos la oferta…">${esc(c.productos_analisis)}</textarea></div>`;
  drawProducts(c); bindProducts(c);
}

function productCard(product,index,c) {
  const productOptions = c.productos.map(item => `<option value="${esc(item.id)}" ${item.id === c.mes_actual.producto_principal_id ? 'selected' : ''}>${esc(item.nombre || 'Sin nombre')}</option>`).join('');
  return `<div class="card product-card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><div class="block-title">Producto ${index + 1}</div><button class="btn sm ghost" type="button" data-delete-product="${index}">Eliminar</button></div>
    <div class="g3"><div><label class="lab">Nombre</label><input class="field" data-product="${index}" data-field="nombre" value="${esc(product.nombre)}" placeholder="Ej. Pan integral"></div>
    <div><label class="lab">Categoría</label><input class="field" data-product="${index}" data-field="categoria" value="${esc(product.categoria)}" placeholder="Ej. Producto principal"></div>
    <div><label class="lab">Precio</label><input class="field" data-product="${index}" data-field="precio" value="${esc(product.precio)}" placeholder="Si está confirmado"></div>
    <div><label class="lab">Margen o ticket</label><input class="field" data-product="${index}" data-field="margen" value="${esc(product.margen)}" placeholder="Opcional"></div>
    <div><label class="lab">Cómo se compra</label><input class="field" data-product="${index}" data-field="modo_venta" value="${esc(product.modo_venta)}" placeholder="Local, WhatsApp, envío…"></div>
    <div><label class="lab">Prioridad</label><select class="field" data-product="${index}" data-field="prioridad"><option value="principal" ${product.prioridad === 'principal' ? 'selected' : ''}>Impulsar este mes</option><option value="secundario" ${product.prioridad !== 'principal' ? 'selected' : ''}>Secundario</option></select></div>
    <div class="span-3"><label class="lab">Qué es y qué resuelve</label><textarea class="field" data-product="${index}" data-field="descripcion" rows="2" placeholder="Características, uso y beneficio real">${esc(product.descripcion)}</textarea></div>
    <div class="span-3"><label class="lab">Qué puede mostrar el cliente</label><input class="field" data-product="${index}" data-field="foto_url" value="${esc(product.foto_url)}" placeholder="Link a foto o nota sobre cómo mostrarlo"></div></div>
    <div class="note" style="margin-top:9px">${productOptions ? `Producto elegido para el mes: <select class="field inline-field" data-main-product="${index}"><option value="">Elegir después</option>${productOptions}</select>` : 'Agregá el primer producto para elegirlo como foco del mes.'}</div></div>`;
}

function drawProducts(c) { $('#productsList').innerHTML = c.productos.length ? c.productos.map((product,index) => productCard(product,index,c)).join('') : `<div class="card empty-card"><div class="note">Todavía no hay productos. Agregá el primero para empezar.</div></div>`; }

function bindProducts(c) {
  $('#addProduct').onclick = () => { c.productos.push(productoVacio()); save(); drawProducts(c); bindProducts(c); renderTabs(); };
  $$('[data-product]').forEach(input => input.oninput = () => { c.productos[+input.dataset.product][input.dataset.field] = input.value; save(); });
  $$('[data-delete-product]').forEach(button => button.onclick = () => { c.productos.splice(+button.dataset.deleteProduct,1); if (!c.productos.find(product => product.id === c.mes_actual.producto_principal_id)) c.mes_actual.producto_principal_id = ''; save(); drawProducts(c); bindProducts(c); renderTabs(); });
  $$('[data-main-product]').forEach(select => select.onchange = () => { c.mes_actual.producto_principal_id = select.value; save(); drawProducts(c); bindProducts(c); });
  $('#productsAnalysis').oninput = event => { c.productos_analisis = event.target.value; save(); };
  $('#analyzeProducts').onclick = async () => {
    if (!c.productos.length) return toast('Agregá al menos un producto');
    const button = $('#analyzeProducts'); const state = $('#productsState'); button.disabled = true; state.textContent = 'Ordenando…'; state.classList.add('pulse');
    try { const data = await api('/api/analyze', { etapa:'productos', cliente:c.ficha, previo:c.marca.diagnostico, fuentes:c.fuentes.map(source => source.text).join('\n\n').slice(0,7000), productos:c.productos }); c.productos_analisis = data.texto; save(); render(); toast('Oferta ordenada'); }
    catch (error) { state.textContent = ''; toast(error.message); }
    finally { button.disabled = false; state.classList.remove('pulse'); }
  };
}

function renderPlan(c) {
  const productOptions = c.productos.map(product => `<option value="${esc(product.id)}" ${product.id === c.mes_actual.producto_principal_id ? 'selected' : ''}>${esc(product.nombre || 'Sin nombre')}</option>`).join('');
  $('#panel').innerHTML = `${processLine('plan')}${sectionHead(ETAPAS[2], 'El plan define qué queremos lograr y qué tiene que hacer cada pieza.')}
    <div class="card"><div class="g3"><div><label class="lab">Mes de trabajo</label><input class="field" id="month" value="${esc(c.mes_actual.mes)}"></div><div class="span-2"><label class="lab">Objetivo concreto del mes</label><input class="field" id="monthObjective" value="${esc(c.mes_actual.objetivo)}" placeholder="Ej. recibir más consultas por WhatsApp"></div><div class="span-2"><label class="lab">Mensaje central</label><textarea class="field" id="centralMessage" rows="2" placeholder="Qué queremos que la gente entienda">${esc(c.mes_actual.mensaje_central)}</textarea></div><div><label class="lab">Producto principal</label><select class="field" id="mainProduct"><option value="">Elegir producto</option>${productOptions}</select></div></div></div>
    <div class="block"><div class="row" style="margin-bottom:10px"><button class="btn pri" id="runPlan">Proponer plan del mes</button><button class="btn" id="addPiece">+ Agregar pieza</button><span class="note" id="planState"></span></div><textarea class="etapa-ta short" id="planText" placeholder="Acá queda el plan general…">${esc(c.mes_actual.plan)}</textarea></div>
    <div class="block"><div class="block-title">Calendario de piezas (${c.mes_actual.piezas.length}/12)</div><div class="block-sub">Cada pieza tiene una función: atraer, explicar o convertir.</div><div id="piecesList" class="out-list"></div></div>`;
  drawPieces(c); bindPlan(c);
}

function pieceCard(piece,index,c) {
  const productOptions = c.productos.map(product => `<option value="${esc(product.id)}" ${product.id === piece.producto_id ? 'selected' : ''}>${esc(product.nombre || 'Sin nombre')}</option>`).join('');
  return `<div class="card piece-card"><div class="row" style="justify-content:space-between;margin-bottom:9px"><div class="block-title">Pieza ${index + 1}</div><button class="btn sm ghost" type="button" data-delete-piece="${index}">Eliminar</button></div><div class="g4"><div><label class="lab">Día</label><input class="field" data-piece="${index}" data-field="dia" value="${esc(piece.dia)}" placeholder="Día 1"></div><div><label class="lab">Formato</label><select class="field" data-piece="${index}" data-field="formato"><option ${piece.formato === 'feed' ? 'selected' : ''}>feed</option><option ${piece.formato === 'reel' ? 'selected' : ''}>reel</option><option ${piece.formato === 'story' ? 'selected' : ''}>story</option><option ${piece.formato === 'carousel' ? 'selected' : ''}>carousel</option></select></div><div><label class="lab">Tipo</label><select class="field" data-piece="${index}" data-field="tipo"><option value="atraer" ${piece.tipo === 'atraer' ? 'selected' : ''}>Atraer</option><option value="explicar" ${piece.tipo === 'explicar' ? 'selected' : ''}>Explicar</option><option value="convertir" ${piece.tipo === 'convertir' ? 'selected' : ''}>Convertir</option></select></div><div><label class="lab">Estado</label><select class="field" data-piece="${index}" data-field="estado"><option value="pendiente" ${piece.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option><option value="en revisión" ${piece.estado === 'en revisión' ? 'selected' : ''}>En revisión</option><option value="corrección" ${piece.estado === 'corrección' ? 'selected' : ''}>Corrección</option><option value="aprobada" ${piece.estado === 'aprobada' ? 'selected' : ''}>Aprobada</option><option value="entregada" ${piece.estado === 'entregada' ? 'selected' : ''}>Entregada</option></select></div><div class="span-2"><label class="lab">Título o idea</label><input class="field" data-piece="${index}" data-field="titulo" value="${esc(piece.titulo)}" placeholder="Qué vamos a publicar"></div><div class="span-2"><label class="lab">Producto</label><select class="field" data-piece="${index}" data-field="producto_id"><option value="">Sin producto específico</option>${productOptions}</select></div><div class="span-2"><label class="lab">Objetivo de la pieza</label><input class="field" data-piece="${index}" data-field="objetivo" value="${esc(piece.objetivo)}" placeholder="Qué tiene que conseguir"></div><div class="span-2"><label class="lab">CTA</label><input class="field" data-piece="${index}" data-field="cta" value="${esc(piece.cta)}" placeholder="Ej. Consultá por WhatsApp"></div></div></div>`;
}

function drawPieces(c) { $('#piecesList').innerHTML = c.mes_actual.piezas.length ? c.mes_actual.piezas.map((piece,index) => pieceCard(piece,index,c)).join('') : `<div class="card empty-card"><div class="note">Todavía no hay piezas. Podés proponer un plan o agregarlas manualmente.</div></div>`; }

function bindPlan(c) {
  $('#month').oninput = event => { c.mes_actual.mes = event.target.value; save(); };
  $('#monthObjective').oninput = event => { c.mes_actual.objetivo = event.target.value; save(); renderTabs(); };
  $('#centralMessage').oninput = event => { c.mes_actual.mensaje_central = event.target.value; save(); renderTabs(); };
  $('#mainProduct').onchange = event => { c.mes_actual.producto_principal_id = event.target.value; save(); };
  $('#planText').oninput = event => { c.mes_actual.plan = event.target.value; save(); renderTabs(); };
  $('#addPiece').onclick = () => { if (c.mes_actual.piezas.length >= 12) return toast('El plan básico admite hasta 12 piezas'); c.mes_actual.piezas.push(piezaVacia()); save(); drawPieces(c); bindPlan(c); };
  $$('[data-piece]').forEach(input => input.oninput = () => { c.mes_actual.piezas[+input.dataset.piece][input.dataset.field] = input.value; save(); });
  $$('[data-delete-piece]').forEach(button => button.onclick = () => { c.mes_actual.piezas.splice(+button.dataset.deletePiece,1); save(); drawPieces(c); bindPlan(c); });
  $('#runPlan').onclick = async () => {
    if (!c.mes_actual.objetivo) return toast('Definí el objetivo del mes primero');
    const button = $('#runPlan'); const state = $('#planState'); button.disabled = true; state.textContent = 'Armando…'; state.classList.add('pulse');
    try { const data = await api('/api/analyze', { etapa:'plan', cliente:c.ficha, previo:c.marca.diagnostico, fuentes:c.fuentes.map(source => source.text).join('\n\n').slice(0,5000), productos:c.productos, plan:`OBJETIVO: ${c.mes_actual.objetivo}\nMENSAJE: ${c.mes_actual.mensaje_central}` }); c.mes_actual.plan = data.texto; save(); render(); toast('Plan del mes propuesto'); }
    catch (error) { state.textContent = ''; toast(error.message); }
    finally { button.disabled = false; state.classList.remove('pulse'); }
  };
}

function renderProduccion(c) {
  const ready = Boolean(c.mes_actual.plan || c.mes_actual.piezas.length || c.productos.length);
  $('#panel').innerHTML = `${processLine('produccion')}${sectionHead(ETAPAS[3], 'Acá convertimos el plan en materiales listos para revisar y publicar.')}
    ${!ready ? `<div class="card" style="margin-bottom:14px;border-color:var(--warn);background:var(--warn-soft)"><div class="note" style="color:var(--warn)">Completá productos o plan del mes antes de producir.</div></div>` : ''}
    <div class="card production-actions"><div class="block-title">Elegí qué producir</div><div class="block-sub">Los resultados quedan guardados en esta marca. Podés copiarlos y llevarlos a tu herramienta de trabajo.</div><div class="row"><button class="btn pri" id="genPrompts" ${!ready ? 'disabled' : ''}>Generar prompts</button><button class="btn" id="genGuiones" ${!ready ? 'disabled' : ''}>Generar guiones</button><button class="btn" id="genCopies" ${!ready ? 'disabled' : ''}>Generar copies</button><button class="btn" id="genWa" ${!ready ? 'disabled' : ''}>Generar WhatsApp</button><select class="field inline-field" id="amount"><option value="4">4 piezas</option><option value="6" selected>6 piezas</option><option value="8">8 piezas</option></select></div><span class="note" id="productionState"></span></div>
    ${renderProductionOutputs(c)}`;
  bindProduction(c);
}

function renderProductionOutputs(c) {
  return `<div class="block"><div class="block-title">Prompts de imagen (${c.produccion.prompts.length})</div>${c.produccion.prompts.length ? `<div class="out-list">${c.produccion.prompts.map((prompt,index) => `<div class="out-card"><div class="out-head"><span class="out-badge">#${esc(prompt.n || index + 1)}</span><span class="out-badge fmt">${esc(prompt.formato || '1:1')}</span><span class="out-ttl">${esc(prompt.titulo || 'Prompt de imagen')} <span class="out-sub">${esc(prompt.tipo || '')}</span></span><button class="btn sm" data-copy-prompt="${index}">Copiar</button></div><div class="out-body"><div class="out-pre">${esc(prompt.prompt || '')}</div>${prompt.negative ? `<div class="chips"><span class="chip">${esc(prompt.negative)}</span></div>` : ''}</div></div>`).join('')}</div>` : `<div class="card empty-card"><div class="note">Todavía no hay prompts.</div></div>`}</div>
  <div class="block"><div class="block-title">Guiones (${c.produccion.guiones.length})</div>${c.produccion.guiones.length ? `<div class="out-list">${c.produccion.guiones.map((script,index) => `<div class="out-card"><div class="out-head"><span class="out-badge">#${esc(script.n || index + 1)}</span><span class="out-badge fmt">${esc(script.duracion || '30s')}</span><span class="out-ttl">${esc(script.titulo || 'Guion')}</span><button class="btn sm" data-copy-script="${index}">Copiar</button></div><div class="out-body"><div style="font-size:13px;font-weight:600;color:var(--acc);margin-bottom:8px">${esc(script.gancho || '')}</div>${(script.bloques || []).map(block => `<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)"><span class="mono" style="font-size:11px;color:var(--ink-3);flex:none;width:52px">${esc(block.t || '')}</span><div><div style="font-size:12.5px">${esc(block.voz || '')}</div><div class="note">${esc(block.imagen || '')}</div></div></div>`).join('')}<div style="margin-top:9px;font-size:12.5px;font-weight:500">${esc(script.cierre || '')}</div></div></div>`).join('')}</div>` : `<div class="card empty-card"><div class="note">Todavía no hay guiones.</div></div>`}</div>
  <div class="block"><div class="block-title">Copies (${c.produccion.copies.length})</div>${c.produccion.copies.length ? `<div class="out-list">${c.produccion.copies.map((copy,index) => `<div class="out-card"><div class="out-head"><span class="out-badge">${esc(copy.formato || 'feed')}</span><span class="out-badge fmt">${esc(copy.tipo || '')}</span><span class="out-ttl">${esc(copy.gancho || 'Copy')}</span><button class="btn sm" data-copy-copy="${index}">Copiar</button></div><div class="out-body"><div style="font-size:13px;line-height:1.6;white-space:pre-wrap;color:var(--ink-2)">${esc(copy.cuerpo || '')}</div><div style="margin-top:8px;color:var(--acc);font-weight:500">${esc(copy.cta || '')}</div>${copy.hashtags ? `<div class="note" style="margin-top:5px">${esc(copy.hashtags)}</div>` : ''}</div></div>`).join('')}</div>` : `<div class="card empty-card"><div class="note">Todavía no hay copies.</div></div>`}</div>
  <div class="block"><div class="block-title">Respuestas de WhatsApp (${c.produccion.whatsapp.length})</div>${c.produccion.whatsapp.length ? `<div class="out-list">${c.produccion.whatsapp.map((reply,index) => `<div class="out-card"><div class="out-head"><span class="out-badge">${esc(reply.momento || '')}</span><span class="out-ttl"><span class="out-sub">${esc(reply.cuando || '')}</span></span><button class="btn sm" data-copy-wa="${index}">Copiar</button></div><div class="out-body"><div style="font-size:13px;line-height:1.6;white-space:pre-wrap;background:var(--panel-2);padding:11px;border-radius:9px">${esc(reply.texto || '')}</div><div class="note" style="margin-top:7px">${esc(reply.porque || '')}</div></div></div>`).join('')}</div>` : `<div class="card empty-card"><div class="note">Todavía no hay respuestas guardadas.</div></div>`}</div>`;
}

function productionPayload(c) { return { cliente:c.ficha, marca:c.marca.diagnostico, productos:c.productos, plan:`${c.mes_actual.plan}\n${c.mes_actual.piezas.map(piece => `${piece.dia} · ${piece.formato} · ${piece.tipo} · ${piece.titulo} · ${piece.objetivo}`).join('\n')}` }; }

function bindProduction(c) {
  const amount = () => +$('#amount').value;
  const run = async (buttonId, label, action) => {
    const button = $(buttonId); const state = $('#productionState'); button.disabled = true; state.textContent = `${label}…`; state.classList.add('pulse');
    try { await action(); save(); render(); toast(`${label} listos`); }
    catch (error) { state.textContent = ''; toast(error.message); }
    finally { const current = $(buttonId); if (current) current.disabled = false; state.classList.remove('pulse'); }
  };
  $('#genPrompts').onclick = () => run('#genPrompts','Generando prompts',async () => { const data = await api('/api/prompts', { ...productionPayload(c), cantidad:amount() }); c.produccion.prompts = data.prompts || []; });
  $('#genGuiones').onclick = () => run('#genGuiones','Generando guiones',async () => { const data = await api('/api/guiones', { ...productionPayload(c), cantidad:Math.min(8,amount()) }); c.produccion.guiones = data.guiones || []; });
  $('#genCopies').onclick = () => run('#genCopies','Generando copies',async () => { const data = await api('/api/copies', { ...productionPayload(c), cantidad:Math.max(6,amount()) }); c.produccion.copies = data.copies || []; });
  $('#genWa').onclick = () => run('#genWa','Generando respuestas',async () => { const data = await api('/api/whatsapp', productionPayload(c)); c.produccion.whatsapp = data.plantillas || []; });
  $$('[data-copy-prompt]').forEach(button => button.onclick = () => copyText(c.produccion.prompts[+button.dataset.copyPrompt].prompt, 'Prompt copiado'));
  $$('[data-copy-script]').forEach(button => button.onclick = () => { const script = c.produccion.guiones[+button.dataset.copyScript]; copyText(`${script.titulo}\n${script.gancho}\n\n${(script.bloques || []).map(block => `[${block.t}] ${block.voz}\n${block.imagen}`).join('\n\n')}\n\n${script.cierre || ''}`, 'Guion copiado'); });
  $$('[data-copy-copy]').forEach(button => button.onclick = () => { const copy = c.produccion.copies[+button.dataset.copyCopy]; copyText(`${copy.gancho}\n\n${copy.cuerpo}\n\n${copy.cta}\n${copy.hashtags || ''}`, 'Copy copiado'); });
  $$('[data-copy-wa]').forEach(button => button.onclick = () => copyText(c.produccion.whatsapp[+button.dataset.copyWa].texto, 'Respuesta copiada'));
}

function copyText(text, message) { if (!navigator.clipboard?.writeText) return toast('Copiá el texto manualmente'); navigator.clipboard.writeText(text).then(() => toast(message)).catch(() => toast('No pude copiar automáticamente')); }

function renderEntrega(c) {
  const checklist = c.entrega.checklist;
  $('#panel').innerHTML = `${processLine('entrega')}${sectionHead(ETAPAS[4], 'La entrega cierra el ciclo: revisar, aprobar, publicar y aprender para el siguiente mes.')}
    <div class="stat-grid"><div class="stat"><span class="stat-k">Proceso completado</span><span class="stat-v">${completedCount(c)}<span class="stat-u">/5</span></span></div><div class="stat"><span class="stat-k">Piezas del plan</span><span class="stat-v">${c.mes_actual.piezas.length}</span></div><div class="stat"><span class="stat-k">Materiales producidos</span><span class="stat-v">${c.produccion.prompts.length + c.produccion.guiones.length + c.produccion.copies.length}</span></div></div>
    <div class="block"><div class="block-title">Checklist de trabajo</div><div class="block-sub">Marcá cada paso cuando realmente esté terminado.</div><div class="card checklist">${[['brief','Información recibida'],['plan','Plan del mes definido'],['produccion','Materiales producidos'],['aprobacion','Cliente revisó y aprobó'],['entrega','Entrega organizada']].map(([key,label]) => `<label class="check-row"><input type="checkbox" data-check="${key}" ${checklist[key] ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></div>
    <div class="block"><div class="row" style="margin-bottom:10px"><button class="btn pri" id="runDelivery">Armar resumen de entrega</button><button class="btn" id="copyDelivery">Copiar resumen</button><span class="note" id="deliveryState"></span></div><textarea class="etapa-ta short" id="deliveryText" placeholder="Resumen operativo para el cliente…">${esc(c.entrega.resumen)}</textarea></div>
    <div class="block"><div class="card g2"><div><label class="lab">Estado</label><select class="field" id="deliveryStatus"><option value="en proceso" ${c.entrega.estado === 'en proceso' ? 'selected' : ''}>En proceso</option><option value="en revisión" ${c.entrega.estado === 'en revisión' ? 'selected' : ''}>En revisión</option><option value="aprobada" ${c.entrega.estado === 'aprobada' ? 'selected' : ''}>Aprobada</option><option value="entregada" ${c.entrega.estado === 'entregada' ? 'selected' : ''}>Entregada</option></select></div><div><label class="lab">Próxima acción</label><input class="field" id="nextAction" value="${esc(c.entrega.proxima_accion)}" placeholder="Ej. Publicar la pieza 1"></div><div><label class="lab">Carpeta de materiales</label><input class="field" id="driveUrl" value="${esc(c.entrega.drive_url)}" placeholder="Link de Drive o carpeta"></div><div><label class="lab">Calendario</label><input class="field" id="calendarUrl" value="${esc(c.entrega.calendario_url)}" placeholder="Link al calendario, si existe"></div><div class="span-2"><label class="lab">Notas para el cliente</label><textarea class="field" id="deliveryNotes" rows="3" placeholder="Qué debe revisar, publicar o responder">${esc(c.entrega.notas)}</textarea></div></div></div>`;
  bindEntrega(c);
}

function bindEntrega(c) {
  $$('[data-check]').forEach(input => input.onchange = () => { c.entrega.checklist[input.dataset.check] = input.checked; save(); renderTabs(); });
  $('#deliveryText').oninput = event => { c.entrega.resumen = event.target.value; save(); renderTabs(); };
  $('#deliveryStatus').onchange = event => { c.entrega.estado = event.target.value; save(); renderTabs(); };
  $('#nextAction').oninput = event => { c.entrega.proxima_accion = event.target.value; save(); };
  $('#driveUrl').oninput = event => { c.entrega.drive_url = event.target.value; save(); };
  $('#calendarUrl').oninput = event => { c.entrega.calendario_url = event.target.value; save(); };
  $('#deliveryNotes').oninput = event => { c.entrega.notas = event.target.value; save(); };
  $('#copyDelivery').onclick = () => copyText(c.entrega.resumen, 'Resumen copiado');
  $('#runDelivery').onclick = async () => {
    const button = $('#runDelivery'); const state = $('#deliveryState'); button.disabled = true; state.textContent = 'Armando…'; state.classList.add('pulse');
    try { const data = await api('/api/analyze', { etapa:'entrega', cliente:c.ficha, previo:c.marca.diagnostico, productos:c.productos, plan:`${c.mes_actual.plan}\n${c.mes_actual.piezas.map(piece => `${piece.dia} · ${piece.titulo} · ${piece.estado}`).join('\n')}`, fuentes:c.entrega.notas }); c.entrega.resumen = data.texto; save(); render(); toast('Resumen de entrega listo'); }
    catch (error) { state.textContent = ''; toast(error.message); }
    finally { button.disabled = false; state.classList.remove('pulse'); }
  };
}

function exportClient() {
  const c = cli(); if (!c) return;
  const lines = [`KORESKILL · ${c.ficha.nombre}`, `${c.ficha.rubro || ''} · ${c.ficha.ciudad || ''}, ${c.ficha.pais || ''}`, '', 'PROCESO CONTINUO', '1. MARCA', c.marca.diagnostico, '', '2. PRODUCTOS', ...c.productos.map(product => `- ${product.nombre}: ${product.descripcion} · ${product.precio || 'precio pendiente'}`), '', '3. PLAN DEL MES', `Objetivo: ${c.mes_actual.objetivo}`, `Mensaje: ${c.mes_actual.mensaje_central}`, c.mes_actual.plan, '', ...c.mes_actual.piezas.map((piece,index) => `${index + 1}. ${piece.dia} · ${piece.formato} · ${piece.titulo} · ${piece.estado}`), '', '4. PRODUCCIÓN'];
  c.produccion.prompts.forEach(prompt => lines.push(`\nPROMPT #${prompt.n || ''} · ${prompt.formato || ''}\n${prompt.prompt}`));
  c.produccion.copies.forEach(copy => lines.push(`\nCOPY #${copy.n || ''}\n${copy.gancho}\n${copy.cuerpo}\n${copy.cta}`));
  c.produccion.whatsapp.forEach(reply => lines.push(`\nWHATSAPP · ${reply.momento}\n${reply.texto}`));
  lines.push('', '5. ENTREGA', c.entrega.resumen, `Estado: ${c.entrega.estado}`, `Próxima acción: ${c.entrega.proxima_accion}`, `Materiales: ${c.entrega.drive_url}`, `Calendario: ${c.entrega.calendario_url}`);
  const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([lines.join('\n')], { type:'text/plain;charset=utf-8' })); anchor.download = `koreskill-${(c.ficha.nombre || 'cliente').toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi,'-')}.txt`; anchor.click(); toast('Proceso exportado');
}

$('#newCo').onclick = () => { const c = nuevoCliente(); DB.clientes.unshift(c); DB.activo = c.id; TAB = 'marca'; save(); render(); toast('Cliente creado'); };
$('#themeBtn').onclick = () => { DB.theme = DB.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = DB.theme; save(); };
$('#exportBtn').onclick = exportClient;

(async () => {
  load(); render();
  try { const health = await api('/api/health', null, 'GET', 15000); $('#apiDot').classList.toggle('on', health.openai); $('#apiLbl').textContent = health.openai ? 'OpenAI conectado' : 'Modo local · sin API'; }
  catch { $('#apiLbl').textContent = 'Sin conexión · modo local'; }
})();
