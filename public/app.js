/* =====================================================================
   KORESKILL CAMPAIGN STUDIO v3 — app.js
   8 tabs · 18 prompts · aprobaciones del cliente · historial por mes
   ===================================================================== */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"]/g,
  m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));

let toastT;
const toast = m => {
  const t = $('#toast'); t.textContent = m; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2500);
};
const copyTxt = async t => { await navigator.clipboard.writeText(t); toast('Prompt copiado'); };
const imgB64 = f => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f);
});

/* ── tabs ── */
const TABS = [
  { id:'identidad',  n:1, nom:'Identidad'  },
  { id:'productos',  n:2, nom:'Productos'  },
  { id:'avatar',     n:3, nom:'Avatar'     },
  { id:'angulos',    n:4, nom:'Ángulos'    },
  { id:'estrategia', n:5, nom:'Estrategia' },
  { id:'produccion', n:6, nom:'Producción' },
  { id:'entrega',    n:7, nom:'Entrega'    },
  { id:'calendario', n:8, nom:'Calendario' },
];

/* ── estado ── */
const SK = 'ks.v3.db';
let DB = { clientes: [], activo: null, theme: 'light' };
let TAB = 'identidad';
let VISTA = 'admin';           // 'admin' | 'cliente'
let CAL_F = { tipo:'todos', estado:'todos', semana:'todas' };

function mkCli() {
  return {
    id: uid(),
    token: uid() + uid(),
    identidad: {
      nombre:'', rubro:'', ciudad:'', pais:'Argentina', web:'', instagram:'',
      descripcion:'', diferencial:'', tono:'', nivel_digital:2, presupuesto_ads:'',
      colores:[], tipografia:'', tipografia2:'', logo:'', banner:'',
      respuesta:'', respuesta12:'', respuesta13:''
    },
    productos: [],
    avatar:     { primario:'', secundario:'', matriz:'' },
    angulos:    { porProducto:{}, hooks:'', ctas:'' },
    estrategia: { organico:'', anuncios:'', mix:'', semanas:[] },
    produccion: { prompts_imagen:'', guiones:'', carruseles:'' },
    entrega:    { lotes: [] },
    calendario: [],
    historial:  [],
    creado: Date.now()
  };
}

function loadDB() {
  try { const r = localStorage.getItem(SK); if (r) DB = { ...DB, ...JSON.parse(r) }; } catch(e){}
  if (!DB.clientes.length) { const c = mkCli(); DB.clientes=[c]; DB.activo=c.id; }
  if (!DB.activo || !DB.clientes.find(c=>c.id===DB.activo)) DB.activo = DB.clientes[0]?.id || null;
  /* migración: asegurar campos nuevos */
  DB.clientes.forEach(c => {
    const base = mkCli();
    for (const k in base) if (c[k] === undefined) c[k] = base[k];
    if (!c.token) c.token = uid()+uid();
  });
  document.documentElement.dataset.theme = DB.theme || 'light';
}
const save = () => { try { localStorage.setItem(SK, JSON.stringify(DB)); } catch(e){ toast('Sin espacio — borrá imágenes viejas'); } };
const cli  = () => DB.clientes.find(c => c.id === DB.activo);

/* progreso por tab */
function progTab(c) {
  return {
    identidad:  !!c.identidad.respuesta,
    productos:  c.productos.length > 0,
    avatar:     !!c.avatar.primario,
    angulos:    Object.keys(c.angulos.porProducto||{}).length > 0 || !!c.angulos.hooks,
    estrategia: !!c.estrategia.organico,
    produccion: !!c.produccion.prompts_imagen,
    entrega:    c.entrega.lotes.length > 0,
    calendario: c.calendario.length > 0,
  };
}
const progNum = c => Object.values(progTab(c)).filter(Boolean).length;

/* ═══════════════════════════════════════════════════════════
   COMPONENTE: tarjeta de prompt reutilizable
   ═══════════════════════════════════════════════════════════ */
function promptCard(pid, c, opts = {}) {
  const p = PROMPTS[pid];
  if (!p) return '';
  const ready = promptReady(pid, c);
  const hecho = opts.hecho || false;
  const texto = ready ? fillPrompt(pid, c, opts.prod || null) : '';
  const key   = opts.key || pid;

  return `
  <div class="pc ${hecho ? 'done' : ready ? 'ready' : ''}" data-pcard="${key}">
    <div class="pc-head" data-toggle="${key}">
      <div class="pc-icon">${p.icon}</div>
      <div class="pc-meta">
        <div class="pc-n">${p.n}${opts.sufijo ? ' · ' + esc(opts.sufijo) : ''}</div>
        <div class="pc-ttl">${esc(p.titulo)}</div>
        <div class="pc-desc">${esc(p.desc)}</div>
      </div>
      <span class="pc-badge ${hecho ? 'pb-done' : ready ? 'pb-ready' : 'pb-lock'}">
        ${hecho ? 'Cargado' : ready ? 'Listo' : 'Faltan datos'}
      </span>
    </div>
    <div class="pc-body hidden" id="body-${key}">
      ${!ready ? `<div class="alert al-warn">
        Faltan datos para armar este prompt: ${p.requiere.map(r=>({
          nombre:'nombre del negocio', colores:'paleta de colores',
          productos:'al menos un producto', avatar_primario:'avatar primario'
        }[r]||r)).join(', ')}.
      </div>` : `
      <div class="row" style="margin-bottom:10px">
        <button class="btn pri sm" data-copy="${key}">Copiar prompt</button>
        <button class="btn sm ghost" data-expand="${key}">Ver completo</button>
      </div>
      <pre class="pc-pre" id="pre-${key}">${esc(texto)}</pre>
      <div class="pc-resp">
        <label class="lab">Pegá acá la respuesta de Claude.ai</label>
        <textarea class="field" id="resp-${key}" rows="5"
          placeholder="Pegá la respuesta completa…">${esc(opts.valor || '')}</textarea>
        <button class="btn sm pri" data-save="${key}" style="margin-top:8px">Guardar respuesta</button>
      </div>`}
    </div>
  </div>`;
}

function bindPromptCards(c, handlers) {
  $$('[data-toggle]').forEach(el => el.onclick = () => {
    const k = el.dataset.toggle;
    $(`#body-${CSS.escape(k)}`)?.classList.toggle('hidden');
  });
  $$('[data-copy]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const k = b.dataset.copy;
    const h = handlers[k];
    copyTxt(h?.texto ?? fillPrompt(k, c));
  });
  $$('[data-expand]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    $(`#pre-${CSS.escape(b.dataset.expand)}`)?.classList.toggle('exp');
  });
  $$('[data-save]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const k = b.dataset.save;
    const ta = $(`#resp-${CSS.escape(k)}`);
    if (!ta?.value.trim()) return toast('Pegá la respuesta primero');
    handlers[k]?.onSave?.(ta.value.trim());
    save(); render(); toast('Respuesta guardada');
  });
}

/* ═══════════════════════════════════════════════════════════
   SHELL
   ═══════════════════════════════════════════════════════════ */
function renderShell() {
  const c = cli();
  $('#colist').innerHTML = DB.clientes.map(x => `
    <button class="co" data-id="${x.id}" aria-current="${x.id===DB.activo}">
      <span class="co-dot ${progNum(x)>0?'on':''}"></span>
      <span style="flex:1;min-width:0">
        <span class="co-nm">${esc(x.identidad.nombre||'Sin nombre')}</span>
        <span class="co-sub">${esc([x.identidad.rubro,x.identidad.ciudad].filter(Boolean).join(' · ')||'sin datos')}</span>
      </span>
      <span class="co-prog">${progNum(x)}/8</span>
    </button>`).join('');
  $$('#colist .co').forEach(b => b.onclick = () => {
    DB.activo = b.dataset.id; VISTA='admin'; save(); render();
  });

  if (!c) { $('#tabs').innerHTML=''; return; }
  const pr = progTab(c);
  $('#tabs').innerHTML = VISTA==='cliente' ? '' : TABS.map(t => `
    <button class="tab ${pr[t.id]?'done':''}" role="tab" aria-selected="${TAB===t.id}" data-tab="${t.id}">
      <span class="tn">${pr[t.id]?'✓':t.n}</span>${t.nom}
    </button>`).join('');
  $$('#tabs .tab').forEach(b => b.onclick = () => { TAB=b.dataset.tab; render(); });
  $('#ctx').textContent = c.identidad.nombre || '';
  $('#viewClientBtn').textContent = VISTA==='cliente' ? '← Admin' : 'Vista cliente';
}

function render() {
  renderShell();
  const c = cli(), panel = $('#panel');
  if (!c) { panel.innerHTML = `<div class="note" style="padding:40px;text-align:center">Creá un cliente.</div>`; return; }
  if (VISTA === 'cliente') return renderVistaCliente(c, panel);
  ({
    identidad: renderIdentidad, productos: renderProductos, avatar: renderAvatar,
    angulos: renderAngulos, estrategia: renderEstrategia, produccion: renderProduccion,
    entrega: renderEntrega, calendario: renderCalendario
  })[TAB](c, panel);
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — IDENTIDAD
   ═══════════════════════════════════════════════════════════ */
function renderIdentidad(c, panel) {
  const id = c.identidad;
  panel.innerHTML = `
  <div class="h-title">Identidad de marca</div>
  <div class="h-sub">Cargá los datos base. Después usá los 3 prompts para construir el tablero.</div>

  <div class="sec">
    <div class="sec-t">Datos del negocio</div>
    <div class="card">
      <div class="g4" style="margin-bottom:11px">
        ${[['nombre','Nombre'],['rubro','Rubro'],['ciudad','Ciudad'],['pais','País'],
           ['instagram','Instagram'],['web','Web'],['presupuesto_ads','Presupuesto ads/día']]
          .map(([k,l])=>`<div><label class="lab">${l}</label>
            <input class="field" data-idf="${k}" value="${esc(id[k]||'')}"></div>`).join('')}
        <div><label class="lab">Nivel digital (0-5)</label>
          <input class="field" type="number" min="0" max="5" data-idf="nivel_digital" value="${id.nivel_digital??2}"></div>
      </div>
      <div style="margin-bottom:11px">
        <label class="lab">Descripción del negocio</label>
        <textarea class="field" data-idf="descripcion" rows="3">${esc(id.descripcion||'')}</textarea>
      </div>
      <div class="g2" style="margin-bottom:11px">
        <div><label class="lab">Diferencial real</label>
          <textarea class="field" data-idf="diferencial" rows="2">${esc(id.diferencial||'')}</textarea></div>
        <div><label class="lab">Tono de comunicación</label>
          <textarea class="field" data-idf="tono" rows="2">${esc(id.tono||'')}</textarea></div>
      </div>
      <div style="margin-bottom:11px">
        <label class="lab">Colores de marca</label>
        <div class="row">
          ${id.colores.map((col,i)=>`
            <span class="dt-tag"><span style="width:15px;height:15px;border-radius:4px;background:${esc(col)};
              border:1px solid var(--line2);display:inline-block"></span>
              <span class="mono" style="font-size:10.5px">${esc(col)}</span>
              <button class="btn xs ghost" data-rmcol="${i}" style="padding:0 3px">×</button></span>`).join('')}
          <input class="field mono" id="colorIn" placeholder="#FF7970" style="width:105px;font-size:12px">
          <button class="btn sm" id="addCol">+ Color</button>
        </div>
      </div>
      <div class="g2" style="margin-bottom:11px">
        <div><label class="lab">Tipografía principal</label>
          <input class="field" data-idf="tipografia" value="${esc(id.tipografia||'')}"></div>
        <div><label class="lab">Tipografía secundaria</label>
          <input class="field" data-idf="tipografia2" value="${esc(id.tipografia2||'')}"></div>
      </div>
      <div class="g2">
        <div><label class="lab">Logo</label>
          ${id.logo
            ? `<div class="row"><img src="${id.logo}" style="width:54px;height:54px;object-fit:contain;
                border-radius:9px;background:var(--p2);border:1px solid var(--line)">
                <button class="btn xs ghost" id="rmLogo">Quitar</button></div>`
            : `<div class="drop" id="dpLogo" style="padding:14px"><b>Subir logo</b><small>PNG, SVG</small>
                <input type="file" id="fLogo" accept="image/*" class="hidden"></div>`}
        </div>
        <div><label class="lab">Banner</label>
          ${id.banner
            ? `<div class="row"><img src="${id.banner}" style="width:120px;height:44px;object-fit:cover;
                border-radius:9px;border:1px solid var(--line)">
                <button class="btn xs ghost" id="rmBanner">Quitar</button></div>`
            : `<div class="drop" id="dpBanner" style="padding:14px"><b>Subir banner</b><small>3:1</small>
                <input type="file" id="fBanner" accept="image/*" class="hidden"></div>`}
        </div>
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-t">Prompts de identidad</div>
    ${promptCard('1.1', c, { hecho: !!id.respuesta,   valor: id.respuesta })}
    ${promptCard('1.2', c, { hecho: !!id.respuesta12, valor: id.respuesta12, key:'1.2' })}
    ${promptCard('1.3', c, { hecho: !!id.respuesta13, valor: id.respuesta13, key:'1.3' })}
  </div>

  ${id.respuesta ? `<div class="sec">
    <div class="sec-t">Tablero de marca</div>
    ${brandBoard(c)}
  </div>` : ''}`;

  $$('[data-idf]').forEach(i => i.oninput = () => { id[i.dataset.idf] = i.value; save(); renderShell(); });
  $('#addCol').onclick = () => {
    const v = $('#colorIn').value.trim(); if (!v) return;
    if (!id.colores.includes(v)) id.colores.push(v); save(); render();
  };
  $$('[data-rmcol]').forEach(b => b.onclick = () => { id.colores.splice(+b.dataset.rmcol,1); save(); render(); });
  $('#rmLogo')?.addEventListener('click', () => { id.logo=''; save(); render(); });
  $('#rmBanner')?.addEventListener('click', () => { id.banner=''; save(); render(); });
  bindDrop('#dpLogo','#fLogo', b64 => { id.logo=b64; save(); render(); });
  bindDrop('#dpBanner','#fBanner', b64 => { id.banner=b64; save(); render(); });

  bindPromptCards(c, {
    '1.1': { onSave: v => id.respuesta = v },
    '1.2': { onSave: v => id.respuesta12 = v },
    '1.3': { onSave: v => id.respuesta13 = v },
  });
}

function brandBoard(c) {
  const id = c.identidad;
  return `<div class="bb">
    ${(id.logo||id.banner) ? `<div class="bb-c" style="grid-column:1/-1">
      <div class="bb-h">Identidad visual</div>
      <div class="bb-b row" style="gap:14px">
        ${id.logo?`<img src="${id.logo}" style="width:70px;height:70px;object-fit:contain;border-radius:10px;background:var(--p2)">`:''}
        ${id.banner?`<img src="${id.banner}" style="flex:1;min-width:180px;max-width:380px;height:58px;object-fit:cover;border-radius:10px">`:''}
      </div></div>`:''}
    ${id.colores.length?`<div class="bb-c">
      <div class="bb-h">Paleta</div>
      <div class="bb-b row" style="gap:10px">
        ${id.colores.map(col=>`<div><span class="sw" style="background:${esc(col)}"></span>
          <div class="sw-lbl">${esc(col)}</div></div>`).join('')}
      </div></div>`:''}
    ${id.tipografia?`<div class="bb-c">
      <div class="bb-h">Tipografía</div>
      <div class="bb-b">
        <div class="font-pv" style="font-family:'${esc(id.tipografia)}',Inter,sans-serif">Aa Bb 123</div>
        <div class="font-nm">${esc(id.tipografia)} · principal</div>
        ${id.tipografia2?`<div style="margin-top:12px">
          <div class="font-pv" style="font-size:16px;font-family:'${esc(id.tipografia2)}',Inter,sans-serif">Aa Bb 123</div>
          <div class="font-nm">${esc(id.tipografia2)} · secundaria</div></div>`:''}
      </div></div>`:''}
    <div class="bb-c" style="grid-column:1/-1">
      <div class="bb-h">Análisis de identidad</div>
      <div class="bb-b" style="white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:var(--ink2);
        max-height:300px;overflow-y:auto">${esc(id.respuesta)}</div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — PRODUCTOS
   ═══════════════════════════════════════════════════════════ */
function renderProductos(c, panel) {
  panel.innerHTML = `
  <div class="row" style="margin-bottom:16px">
    <div style="flex:1">
      <div class="h-title">Productos</div>
      <div class="h-sub">Cargá cada producto. La estrella marca cuál se impulsa este mes.</div>
    </div>
    <button class="btn pri" id="addProd">+ Agregar producto</button>
  </div>

  ${!c.productos.length ? `<div class="card" style="text-align:center;padding:44px 20px">
    <div style="font-size:28px;margin-bottom:8px">📦</div>
    <div class="note">Todavía no hay productos cargados.</div>
  </div>` : c.productos.map((p,i)=>`
    <div class="prod-card">
      <div class="prod-head" data-ptoggle="${i}">
        <span class="prod-star ${p.es_estrella?'on':''}" data-star="${i}" title="Marcar como producto estrella">★</span>
        ${p.foto?`<img src="${p.foto}" class="prod-thumb">`:`<div class="prod-thumb" style="display:grid;place-items:center;font-size:16px">📦</div>`}
        <span class="prod-nm">${esc(p.nombre||'Producto sin nombre')}</span>
        <span class="prod-price">$${esc(p.precio||'?')}</span>
        <span class="pc-badge ${p.respuesta?'pb-done':'pb-lock'}">${p.respuesta?'Analizado':'Sin analizar'}</span>
        <button class="btn xs ghost" data-rmprod="${i}">×</button>
      </div>
      <div class="prod-body hidden" id="pbody-${i}">
        <div class="g4" style="margin-bottom:10px">
          <div><label class="lab">Nombre</label><input class="field" data-pf="${i}" data-pk="nombre" value="${esc(p.nombre||'')}"></div>
          <div><label class="lab">Precio</label><input class="field" data-pf="${i}" data-pk="precio" value="${esc(p.precio||'')}"></div>
          <div><label class="lab">Tipo</label>
            <select class="field" data-pf="${i}" data-pk="tipo">
              ${['Producto físico','Producto digital','Servicio','Combo','Artesanal']
                .map(t=>`<option ${p.tipo===t?'selected':''}>${t}</option>`).join('')}
            </select></div>
          <div><label class="lab">Público</label><input class="field" data-pf="${i}" data-pk="publico" value="${esc(p.publico||'')}"></div>
        </div>
        <div class="g2" style="margin-bottom:10px">
          <div><label class="lab">Etiquetas / variantes</label><input class="field" data-pf="${i}" data-pk="etiquetas" value="${esc(p.etiquetas||'')}" placeholder="sabores, colores, modelos…"></div>
          <div><label class="lab">Tamaños de referencia</label><input class="field" data-pf="${i}" data-pk="tamanos" value="${esc(p.tamanos||'')}" placeholder="250g, 500g, 1kg…"></div>
        </div>
        <div style="margin-bottom:10px">
          <label class="lab">Descripción</label>
          <textarea class="field" data-pf="${i}" data-pk="descripcion" rows="3">${esc(p.descripcion||'')}</textarea>
        </div>
        <div style="margin-bottom:14px">
          <label class="lab">Foto del producto</label>
          ${p.foto?`<div class="row"><img src="${p.foto}" style="width:58px;height:58px;object-fit:cover;border-radius:9px;border:1px solid var(--line)">
            <button class="btn xs ghost" data-rmpf="${i}">Quitar</button></div>`
           :`<div class="drop" id="dpProd-${i}" style="padding:13px"><b>Subir foto</b><small>PNG, JPG</small>
             <input type="file" id="fProd-${i}" accept="image/*" class="hidden"></div>`}
        </div>
        ${promptCard('2.1', c, { hecho:!!p.respuesta, valor:p.respuesta, prod:p, key:`p${i}`, sufijo:p.nombre })}
      </div>
    </div>`).join('')}

  ${c.productos.length ? `<div class="sec">
    <div class="sec-t">Prompts de catálogo</div>
    ${promptCard('2.2', c, { hecho:!!c.prodJerarquia, valor:c.prodJerarquia, key:'2.2' })}
    ${promptCard('2.3', c, { hecho:!!c.prodFoto, valor:c.prodFoto, key:'2.3' })}
  </div>`:''}`;

  $('#addProd').onclick = () => {
    c.productos.push({ id:uid(),nombre:'',descripcion:'',precio:'',tipo:'Producto físico',
      publico:'',etiquetas:'',tamanos:'',foto:'',es_estrella:!c.productos.length,respuesta:'' });
    save(); render();
  };
  $$('[data-ptoggle]').forEach(el => el.onclick = e => {
    if (e.target.closest('[data-star],[data-rmprod]')) return;
    $(`#pbody-${el.dataset.ptoggle}`)?.classList.toggle('hidden');
  });
  $$('[data-star]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    c.productos.forEach((p,j) => p.es_estrella = j === +b.dataset.star);
    save(); render(); toast('Producto estrella actualizado');
  });
  $$('[data-rmprod]').forEach(b => b.onclick = e => {
    e.stopPropagation(); c.productos.splice(+b.dataset.rmprod,1); save(); render();
  });
  $$('[data-pf]').forEach(i => i.oninput = () => {
    c.productos[+i.dataset.pf][i.dataset.pk] = i.value; save();
  });
  $$('[data-rmpf]').forEach(b => b.onclick = () => { c.productos[+b.dataset.rmpf].foto=''; save(); render(); });
  c.productos.forEach((p,i) => bindDrop(`#dpProd-${i}`, `#fProd-${i}`, b64 => { p.foto=b64; save(); render(); }));

  const h = { '2.2': { onSave: v => c.prodJerarquia = v }, '2.3': { onSave: v => c.prodFoto = v } };
  c.productos.forEach((p,i) => h[`p${i}`] = { texto: fillPrompt('2.1', c, p), onSave: v => p.respuesta = v });
  bindPromptCards(c, h);
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — AVATAR
   ═══════════════════════════════════════════════════════════ */
function renderAvatar(c, panel) {
  const a = c.avatar;
  panel.innerHTML = `
  <div class="h-title">Avatar y dolores</div>
  <div class="h-sub">Quién compra, por qué, y qué lo frena. La base de toda la comunicación.</div>

  <div class="sec">
    <div class="sec-t">Prompts de avatar</div>
    ${promptCard('3.1', c, { hecho:!!a.primario,   valor:a.primario,   key:'3.1' })}
    ${promptCard('3.2', c, { hecho:!!a.secundario, valor:a.secundario, key:'3.2' })}
    ${promptCard('3.3', c, { hecho:!!a.matriz,     valor:a.matriz,     key:'3.3' })}
  </div>

  ${a.primario ? `<div class="sec">
    <div class="sec-t">Avatar primario</div>
    <div class="card" style="white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:var(--ink2);
      max-height:340px;overflow-y:auto">${esc(a.primario)}</div>
  </div>`:''}
  ${a.matriz ? `<div class="sec">
    <div class="sec-t">Matriz dolor → producto → resultado</div>
    <div class="card" style="white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:var(--ink2);
      max-height:340px;overflow-y:auto">${esc(a.matriz)}</div>
  </div>`:''}`;

  bindPromptCards(c, {
    '3.1': { onSave: v => a.primario = v },
    '3.2': { onSave: v => a.secundario = v },
    '3.3': { onSave: v => a.matriz = v },
  });
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — ÁNGULOS
   ═══════════════════════════════════════════════════════════ */
function renderAngulos(c, panel) {
  const g = c.angulos;
  panel.innerHTML = `
  <div class="h-title">Ángulos de comunicación</div>
  <div class="h-sub">Emocional, comercial y educativo. Por producto. Más los hooks y CTAs.</div>

  ${!c.productos.length ? `<div class="alert al-warn">Cargá al menos un producto para generar ángulos.</div>`:''}

  <div class="sec">
    <div class="sec-t">Ángulos por producto</div>
    ${c.productos.map((p,i)=>promptCard('4.1', c, {
      hecho: !!g.porProducto[p.id], valor: g.porProducto[p.id],
      prod: p, key:`a${i}`, sufijo:p.nombre
    })).join('') || '<div class="note">Sin productos cargados.</div>'}
  </div>

  <div class="sec">
    <div class="sec-t">Hooks y cierres</div>
    ${promptCard('4.2', c, { hecho:!!g.hooks, valor:g.hooks, key:'4.2' })}
    ${promptCard('4.3', c, { hecho:!!g.ctas,  valor:g.ctas,  key:'4.3' })}
  </div>

  ${g.hooks ? `<div class="sec">
    <div class="sec-t">Hooks disponibles</div>
    <div class="card" style="white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:var(--ink2);
      max-height:300px;overflow-y:auto">${esc(g.hooks)}</div>
  </div>`:''}`;

  const h = { '4.2': { onSave: v => g.hooks = v }, '4.3': { onSave: v => g.ctas = v } };
  c.productos.forEach((p,i) => h[`a${i}`] = {
    texto: fillPrompt('4.1', c, p), onSave: v => { g.porProducto[p.id] = v; }
  });
  bindPromptCards(c, h);
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — ESTRATEGIA
   ═══════════════════════════════════════════════════════════ */
function renderEstrategia(c, panel) {
  const e = c.estrategia;
  panel.innerHTML = `
  <div class="h-title">Estrategia del mes</div>
  <div class="h-sub">Calendario orgánico, plan de anuncios y la vista unificada.</div>

  <div class="sec">
    <div class="sec-t">Prompts de estrategia</div>
    ${promptCard('5.1', c, { hecho:!!e.organico, valor:e.organico, key:'5.1' })}
    ${promptCard('5.2', c, { hecho:!!e.anuncios, valor:e.anuncios, key:'5.2' })}
    ${promptCard('5.3', c, { hecho:!!e.mix,      valor:e.mix,      key:'5.3' })}
  </div>

  ${e.semanas?.length ? `<div class="sec">
    <div class="sec-t">Calendario visual</div>
    <div class="row" style="margin-bottom:10px;gap:6px">
      <span class="badge" style="background:rgba(255,121,112,.15);color:var(--acc2)">● Emocional</span>
      <span class="badge b-ok">● Comercial</span>
      <span class="badge" style="background:var(--info-s);color:var(--info)">● Educativo</span>
      <div style="flex:1"></div>
      <button class="btn sm" id="calFromStrat">Volcar al calendario →</button>
    </div>
    ${e.semanas.map(s=>`
      <div class="card" style="padding:0;margin-bottom:9px;overflow:hidden">
        <div style="padding:9px 13px;background:var(--p2);border-bottom:1px solid var(--line);
          font-size:12px;font-weight:600;display:flex;align-items:center">
          ${esc(s.titulo)}<span style="margin-left:auto;font-size:10.5px;color:var(--ink3)">${s.dias.length} piezas</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;padding:9px">
          ${s.dias.map(d=>`
            <div style="border:1px solid var(--line);border-radius:9px;padding:8px;background:var(--panel)">
              <div style="font-size:9.5px;font-weight:700;color:var(--ink3)">DÍA ${d.dia}</div>
              <span class="pz-tag" style="background:${
                d.angulo==='emocional'?'rgba(255,121,112,.15);color:var(--acc2)':
                d.angulo==='comercial'?'var(--ok-s);color:var(--ok)':'var(--info-s);color:var(--info)'};
                margin-top:4px;display:inline-block">${esc(d.angulo)}</span>
              <div style="font-size:10.5px;color:var(--ink2);line-height:1.35;margin-top:4px">${esc(d.tema)}</div>
              <div style="font-size:9.5px;color:var(--ink3);margin-top:3px">${esc(d.formato)}</div>
            </div>`).join('')}
        </div>
      </div>`).join('')}
  </div>`:''}`;

  bindPromptCards(c, {
    '5.1': { onSave: v => { e.organico = v; e.semanas = parseCalendario(v); } },
    '5.2': { onSave: v => e.anuncios = v },
    '5.3': { onSave: v => e.mix = v },
  });

  $('#calFromStrat')?.addEventListener('click', () => {
    let n = 0;
    e.semanas.forEach((s, si) => s.dias.forEach(d => {
      if (c.calendario.some(x => x.dia === d.dia && x.titulo === d.tema)) return;
      c.calendario.push({
        id: uid(), dia: d.dia, semana: si+1, tipo:'org', formato: d.formato,
        titulo: d.tema, angulo: d.angulo, imgs: [], estado:'pendiente', comentarios: [], prompt:''
      });
      n++;
    }));
    save(); toast(`${n} piezas volcadas al calendario`); TAB='calendario'; render();
  });
}

function parseCalendario(txt) {
  const semanas = []; let sem = null, n = 0;
  for (const raw of txt.split('\n')) {
    const l = raw.trim(); if (!l) continue;
    if (/semana\s*\d/i.test(l)) {
      if (sem?.dias.length) semanas.push(sem);
      n++; sem = { sem:n, titulo:l.replace(/[═─=]/g,'').trim(), dias:[] };
    } else if (sem && /d[íi]a\s*\d{1,2}/i.test(l)) {
      const dia = +(l.match(/d[íi]a\s*(\d{1,2})/i)?.[1] || 0);
      if (!dia) continue;
      const angulo = /emocional/i.test(l) ? 'emocional'
                   : /educativ/i.test(l)  ? 'educativo' : 'comercial';
      const formato = /reel/i.test(l) ? 'reel' : /stor/i.test(l) ? 'story'
                    : /carrus/i.test(l) ? 'carrusel' : 'feed';
      const partes = l.split('·').map(s=>s.trim());
      const tema = partes.find(p =>
        !/^d[íi]a/i.test(p) && !/feed|reel|story|carrus/i.test(p) &&
        !/emocional|comercial|educativ/i.test(p) && !/objetivo|cta/i.test(p)
      ) || partes[3] || 'Publicación';
      sem.dias.push({ dia, angulo, formato, tema: tema.replace(/^\[|\]$/g,'').slice(0,70) });
    }
  }
  if (sem?.dias.length) semanas.push(sem);
  return semanas;
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — PRODUCCIÓN
   ═══════════════════════════════════════════════════════════ */
function renderProduccion(c, panel) {
  const p = c.produccion;
  panel.innerHTML = `
  <div class="h-title">Producción</div>
  <div class="h-sub">Los prompts de imagen, los guiones y los carruseles.</div>

  <div class="sec">
    <div class="sec-t">Prompts de producción</div>
    ${promptCard('6.1', c, { hecho:!!p.prompts_imagen, valor:p.prompts_imagen, key:'6.1' })}
    ${promptCard('6.2', c, { hecho:!!p.guiones,        valor:p.guiones,        key:'6.2' })}
    ${promptCard('6.3', c, { hecho:!!p.carruseles,     valor:p.carruseles,     key:'6.3' })}
  </div>

  ${p.prompts_imagen ? `<div class="sec">
    <div class="sec-t">Kit de imágenes <button class="btn xs" id="cpImgs" style="margin-left:8px">Copiar todo</button></div>
    <div class="card"><pre style="white-space:pre-wrap;font-family:'IBM Plex Mono',monospace;font-size:11px;
      line-height:1.6;color:var(--ink2);max-height:420px;overflow-y:auto">${esc(p.prompts_imagen)}</pre></div>
  </div>`:''}
  ${p.guiones ? `<div class="sec">
    <div class="sec-t">Guiones de video</div>
    <div class="card"><pre style="white-space:pre-wrap;font-size:12.5px;line-height:1.7;color:var(--ink2);
      max-height:340px;overflow-y:auto">${esc(p.guiones)}</pre></div>
  </div>`:''}`;

  bindPromptCards(c, {
    '6.1': { onSave: v => p.prompts_imagen = v },
    '6.2': { onSave: v => p.guiones = v },
    '6.3': { onSave: v => p.carruseles = v },
  });
  $('#cpImgs')?.addEventListener('click', () => { navigator.clipboard.writeText(p.prompts_imagen); toast('Copiado'); });
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — ENTREGA
   ═══════════════════════════════════════════════════════════ */
function renderEntrega(c, panel) {
  if (!c.entrega.lotes.length) {
    c.entrega.lotes = [
      { dia:1,  titulo:'Brief estratégico',   estado:'pendiente', items:['Tablero de marca','Avatar','Los 3 ángulos'] },
      { dia:5,  titulo:'Aprobación visual',   estado:'pendiente', items:['3 referencias','Paleta confirmada'] },
      { dia:8,  titulo:'Primer lote',         estado:'pendiente', items:['6 imágenes','6 copies','2 videos'] },
      { dia:15, titulo:'Segundo lote',        estado:'pendiente', items:['6 imágenes','Calendario del mes'] },
      { dia:22, titulo:'Entrega final',       estado:'pendiente', items:['Todo organizado','Plantillas WhatsApp','Video de cierre'] },
    ];
    save();
  }
  const L = c.entrega.lotes;
  panel.innerHTML = `
  <div class="h-title">Cronograma de entrega</div>
  <div class="h-sub">Qué se entrega y cuándo. Esto es lo que ve el cliente.</div>
  <div class="sec"><div class="dtl">
    ${L.map((l,i)=>`
      <div class="dti ${l.estado==='entregado'?'done':l.estado==='en proceso'?'now':''}">
        <div class="dtd">${i+1}</div>
        <div class="dt-day">DÍA ${l.dia}</div>
        <div class="dt-ttl">${esc(l.titulo)}</div>
        <div class="row" style="margin-top:6px">
          <select class="field" data-lote="${i}" style="width:auto;font-size:11.5px;padding:4px 9px">
            ${['pendiente','en proceso','entregado'].map(s=>`<option ${l.estado===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="dt-tags">
          ${l.items.map((it,j)=>`<span class="dt-tag">${esc(it)}
            <button class="btn xs ghost" data-rmit="${i}-${j}" style="padding:0 3px">×</button></span>`).join('')}
          <input class="field" data-addit="${i}" placeholder="+ ítem"
            style="width:auto;max-width:160px;font-size:11px;padding:4px 9px;border-style:dashed">
        </div>
      </div>`).join('')}
  </div></div>`;

  $$('[data-lote]').forEach(s => s.onchange = () => { L[+s.dataset.lote].estado = s.value; save(); render(); });
  $$('[data-rmit]').forEach(b => b.onclick = () => {
    const [i,j] = b.dataset.rmit.split('-').map(Number); L[i].items.splice(j,1); save(); render();
  });
  $$('[data-addit]').forEach(inp => inp.onkeydown = e => {
    if (e.key==='Enter' && inp.value.trim()) { L[+inp.dataset.addit].items.push(inp.value.trim()); save(); render(); }
  });
}

/* ═══════════════════════════════════════════════════════════
   TAB 8 — CALENDARIO
   ═══════════════════════════════════════════════════════════ */
function renderCalendario(c, panel) {
  const cal = c.calendario;
  const pend = cal.filter(p => p.estado === 'correccion').length;

  const vis = cal.filter(p =>
    (CAL_F.tipo==='todos'   || p.tipo===CAL_F.tipo) &&
    (CAL_F.estado==='todos' || p.estado===CAL_F.estado) &&
    (CAL_F.semana==='todas' || String(p.semana||Math.ceil(p.dia/7))===CAL_F.semana)
  ).sort((a,b)=>a.dia-b.dia);

  panel.innerHTML = `
  <div class="row" style="margin-bottom:6px">
    <div style="flex:1"><div class="h-title">Calendario de contenido</div>
      <div class="h-sub">${cal.length} piezas · ${cal.filter(p=>p.estado==='aprobado').length} aprobadas${pend?` · <span style="color:var(--warn)">${pend} con corrección</span>`:''}</div></div>
    <button class="btn pri" id="addPz">+ Agregar pieza</button>
  </div>

  ${pend ? `<div class="alert al-warn" style="margin-top:12px">
    El cliente pidió correcciones en ${pend} pieza${pend>1?'s':''}. Filtrá por "Corrección" para verlas.</div>`:''}

  <div class="cal-bar" style="margin-top:14px">
    <div class="cal-f" id="fTipo">
      ${[['todos','Todos'],['org','Orgánico'],['pago','Pago']].map(([v,l])=>
        `<button class="cal-fb ${CAL_F.tipo===v?'on':''}" data-v="${v}">${l}</button>`).join('')}
    </div>
    <div class="cal-f" id="fEstado">
      ${[['todos','Todos'],['pendiente','Pendiente'],['aprobado','Aprobado'],['correccion','Corrección']].map(([v,l])=>
        `<button class="cal-fb ${CAL_F.estado===v?'on':''}" data-v="${v}">${l}</button>`).join('')}
    </div>
    <select class="field" id="fSem" style="width:auto;font-size:12px">
      <option value="todas">Todas las semanas</option>
      ${[1,2,3,4].map(s=>`<option value="${s}" ${CAL_F.semana==String(s)?'selected':''}>Semana ${s}</option>`).join('')}
    </select>
  </div>

  ${!vis.length ? `<div class="card" style="text-align:center;padding:44px 20px">
    <div style="font-size:28px;margin-bottom:8px">📅</div>
    <div class="note">${cal.length?'Ninguna pieza con estos filtros.':'Todavía no hay piezas. Agregá la primera o volcalas desde Estrategia.'}</div>
  </div>` : `<div class="cal-grid">
    ${vis.map(p=>{
      const i = cal.indexOf(p);
      return `<div class="pz ${p.estado}">
        <div class="pz-imgs">
          <span class="pz-state ${p.estado==='aprobado'?'ps-apr':p.estado==='correccion'?'ps-cor':'ps-pend'}">
            ${p.estado==='aprobado'?'✓ Aprobado':p.estado==='correccion'?'⚠ Corrección':'Pendiente'}</span>
          ${p.imgs?.length ? `<img src="${p.imgs[0]}" class="pz-img">
            ${p.imgs.length>1?`<span class="pz-count">${p.imgs.length} 🖼</span>`:''}`
           : `<div class="pz-ph" data-up="${i}"><div style="font-size:24px">📷</div>Subir imagen
              <input type="file" id="fPz-${i}" accept="image/*" multiple class="hidden"></div>`}
        </div>
        <div class="pz-foot">
          <div class="pz-day">DÍA ${p.dia}</div>
          <div class="pz-ttl">${esc(p.titulo)}</div>
          <div class="pz-tags">
            <span class="pz-tag ${p.tipo==='pago'?'pt-pago':'pt-org'}">${p.tipo==='pago'?'Pago':'Orgánico'}</span>
            <span class="pz-tag pt-fmt">${esc(p.formato||'feed')}</span>
            ${p.angulo?`<span class="pz-tag pt-fmt">${esc(p.angulo)}</span>`:''}
          </div>
        </div>
        ${p.comentarios?.length ? `<div class="pz-cmts">
          ${p.comentarios.map(cm=>`<div class="pz-cmt ${cm.autor==='cliente'?'cliente':''}">
            <div class="pz-cmt-a">${cm.autor==='cliente'?'Cliente':'Vos'}</div>${esc(cm.texto)}</div>`).join('')}
        </div>`:''}
        <div class="pz-acts">
          ${p.imgs?.length?`<button class="btn xs ghost" data-addimg="${i}">+ Imagen
            <input type="file" id="fAdd-${i}" accept="image/*" multiple class="hidden"></button>`:''}
          <button class="btn xs ghost" data-edit="${i}">Editar</button>
          <button class="btn xs ghost" data-cmt="${i}">💬</button>
          <button class="btn xs ghost" data-rmpz="${i}" style="margin-left:auto;color:var(--bad)">×</button>
        </div>
      </div>`;
    }).join('')}
  </div>`}`;

  $$('#fTipo .cal-fb').forEach(b=>b.onclick=()=>{ CAL_F.tipo=b.dataset.v; render(); });
  $$('#fEstado .cal-fb').forEach(b=>b.onclick=()=>{ CAL_F.estado=b.dataset.v; render(); });
  $('#fSem').onchange = e => { CAL_F.semana=e.target.value; render(); };
  $('#addPz').onclick = () => modalPieza(c, null);

  $$('[data-up]').forEach(el => {
    const i = +el.dataset.up, inp = $(`#fPz-${i}`);
    el.onclick = () => inp.click();
    inp.onchange = async () => {
      const imgs = [];
      for (const f of inp.files) imgs.push(await imgB64(f));
      cal[i].imgs = imgs; save(); render(); toast(`${imgs.length} imagen(es) subida(s)`);
    };
  });
  $$('[data-addimg]').forEach(b => {
    const i = +b.dataset.addimg, inp = $(`#fAdd-${i}`);
    b.onclick = () => inp.click();
    inp.onchange = async () => {
      for (const f of inp.files) cal[i].imgs.push(await imgB64(f));
      save(); render(); toast('Imagen agregada');
    };
  });
  $$('[data-edit]').forEach(b => b.onclick = () => modalPieza(c, +b.dataset.edit));
  $$('[data-rmpz]').forEach(b => b.onclick = () => { cal.splice(+b.dataset.rmpz,1); save(); render(); });
  $$('[data-cmt]').forEach(b => b.onclick = () => modalComentario(c, +b.dataset.cmt, 'admin'));
}

/* ── modales ── */
function modalPieza(c, idx) {
  const nueva = idx === null;
  const p = nueva
    ? { id:uid(), dia:1, semana:1, tipo:'org', formato:'feed', titulo:'', angulo:'', imgs:[], estado:'pendiente', comentarios:[], prompt:'' }
    : { ...c.calendario[idx] };

  $('#modalHost').innerHTML = `
  <div class="modal" id="mod">
    <div class="modal-box">
      <div class="modal-h"><span class="modal-t">${nueva?'Nueva pieza':'Editar pieza'}</span>
        <button class="btn xs ghost" id="mClose">×</button></div>
      <div class="modal-b">
        <div class="g2" style="margin-bottom:11px">
          <div><label class="lab">Día del mes</label>
            <input class="field" type="number" min="1" max="31" id="mDia" value="${p.dia}"></div>
          <div><label class="lab">Semana</label>
            <select class="field" id="mSem">${[1,2,3,4].map(s=>`<option value="${s}" ${p.semana==s?'selected':''}>Semana ${s}</option>`).join('')}</select></div>
        </div>
        <div style="margin-bottom:11px"><label class="lab">Título de la pieza</label>
          <input class="field" id="mTtl" value="${esc(p.titulo)}" placeholder="Ej: Medialunas recién horneadas"></div>
        <div class="g3" style="margin-bottom:11px">
          <div><label class="lab">Tipo</label>
            <select class="field" id="mTipo">
              <option value="org" ${p.tipo==='org'?'selected':''}>Orgánico</option>
              <option value="pago" ${p.tipo==='pago'?'selected':''}>Pago</option></select></div>
          <div><label class="lab">Formato</label>
            <select class="field" id="mFmt">
              ${['feed','reel','story','carrusel'].map(f=>`<option ${p.formato===f?'selected':''}>${f}</option>`).join('')}</select></div>
          <div><label class="lab">Ángulo</label>
            <select class="field" id="mAng">
              <option value="">—</option>
              ${['emocional','comercial','educativo'].map(a=>`<option ${p.angulo===a?'selected':''}>${a}</option>`).join('')}</select></div>
        </div>
        <div><label class="lab">Prompt usado (opcional)</label>
          <textarea class="field" id="mPrompt" rows="3">${esc(p.prompt||'')}</textarea></div>
      </div>
      <div class="modal-f">
        <button class="btn" id="mCancel">Cancelar</button>
        <button class="btn pri" id="mSave">${nueva?'Crear pieza':'Guardar'}</button>
      </div>
    </div>
  </div>`;

  const close = () => $('#modalHost').innerHTML = '';
  $('#mClose').onclick = close; $('#mCancel').onclick = close;
  $('#mod').onclick = e => { if (e.target.id==='mod') close(); };
  $('#mSave').onclick = () => {
    const n = {
      ...p,
      dia: +$('#mDia').value || 1, semana: +$('#mSem').value,
      titulo: $('#mTtl').value.trim() || 'Sin título',
      tipo: $('#mTipo').value, formato: $('#mFmt').value,
      angulo: $('#mAng').value, prompt: $('#mPrompt').value.trim()
    };
    if (nueva) c.calendario.push(n); else c.calendario[idx] = n;
    save(); close(); render(); toast(nueva?'Pieza creada':'Pieza actualizada');
  };
}

function modalComentario(c, idx, autor) {
  const p = c.calendario[idx];
  $('#modalHost').innerHTML = `
  <div class="modal" id="mod2">
    <div class="modal-box" style="max-width:440px">
      <div class="modal-h"><span class="modal-t">Comentarios · ${esc(p.titulo)}</span>
        <button class="btn xs ghost" id="m2Close">×</button></div>
      <div class="modal-b">
        ${p.comentarios?.length ? p.comentarios.map(cm=>`
          <div style="padding:9px 11px;background:var(--p2);border-radius:9px;margin-bottom:7px">
            <div style="font-size:10px;font-weight:700;color:${cm.autor==='cliente'?'var(--acc)':'var(--ink3)'};
              margin-bottom:3px">${cm.autor==='cliente'?'CLIENTE':'VOS'} · ${new Date(cm.ts).toLocaleDateString('es-AR')}</div>
            <div style="font-size:12.5px;line-height:1.5">${esc(cm.texto)}</div>
          </div>`).join('') : '<div class="note" style="margin-bottom:10px">Sin comentarios todavía.</div>'}
        <textarea class="field" id="m2Txt" rows="3" placeholder="Escribí un comentario…"></textarea>
      </div>
      <div class="modal-f">
        <button class="btn" id="m2Cancel">Cerrar</button>
        <button class="btn pri" id="m2Save">Agregar comentario</button>
      </div>
    </div>
  </div>`;
  const close = () => $('#modalHost').innerHTML = '';
  $('#m2Close').onclick = close; $('#m2Cancel').onclick = close;
  $('#mod2').onclick = e => { if (e.target.id==='mod2') close(); };
  $('#m2Save').onclick = () => {
    const t = $('#m2Txt').value.trim(); if (!t) return;
    p.comentarios = p.comentarios || [];
    p.comentarios.push({ autor, texto:t, ts:Date.now() });
    if (autor==='cliente') p.estado = 'correccion';
    save(); close(); render(); toast('Comentario agregado');
  };
}

/* ═══════════════════════════════════════════════════════════
   VISTA CLIENTE
   ═══════════════════════════════════════════════════════════ */
function renderVistaCliente(c, panel) {
  const cal = c.calendario;
  const apr = cal.filter(p=>p.estado==='aprobado').length;
  const pend = cal.filter(p=>p.estado==='pendiente').length;
  const L = c.entrega.lotes;

  panel.innerHTML = `
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px">
    ${c.identidad.logo?`<img src="${c.identidad.logo}" style="width:46px;height:46px;object-fit:contain;
      border-radius:11px;background:var(--p2);border:1px solid var(--line)">`:''}
    <div><div style="font-size:clamp(1.4rem,3vw,1.9rem);font-weight:700;letter-spacing:-.035em;line-height:1.12">
      ${esc(c.identidad.nombre)}</div>
      <div class="note">${esc([c.identidad.rubro,c.identidad.ciudad].filter(Boolean).join(' · '))} — Campaña del mes</div></div>
  </div>

  ${pend ? `<div class="alert al-acc" style="margin-top:16px">
    <b>Tenés ${pend} pieza${pend>1?'s':''} esperando tu aprobación.</b>
    Revisalas abajo — aprobá o dejá un comentario con lo que querés cambiar.</div>`:''}

  <div class="g3 sec">
    <div class="card"><div class="lab">Estrategia</div>
      <div style="font-size:15px;font-weight:600">${c.estrategia.organico?'Definida':'En proceso'}</div>
      <span class="badge ${c.estrategia.organico?'b-ok':'b-warn'}" style="margin-top:6px">
        ${c.estrategia.organico?'✓ Lista':'En proceso'}</span></div>
    <div class="card"><div class="lab">Contenido</div>
      <div style="font-size:15px;font-weight:600">${apr} de ${cal.length} aprobadas</div>
      <span class="badge ${apr===cal.length&&cal.length?'b-ok':apr?'b-warn':'b-off'}" style="margin-top:6px">
        ${apr===cal.length&&cal.length?'✓ Completo':apr?'En revisión':'Pendiente'}</span></div>
    <div class="card"><div class="lab">Entrega final</div>
      <div style="font-size:15px;font-weight:600">Día 22</div>
      <span class="badge ${L.every(l=>l.estado==='entregado')?'b-ok':'b-off'}" style="margin-top:6px">
        ${L.every(l=>l.estado==='entregado')?'✓ Entregado':'Programado'}</span></div>
  </div>

  <div class="sec">
    <div class="sec-t">Cronograma</div>
    <div class="dtl">
      ${L.map((l,i)=>`<div class="dti ${l.estado==='entregado'?'done':l.estado==='en proceso'?'now':''}">
        <div class="dtd">${i+1}</div>
        <div class="dt-day">DÍA ${l.dia}</div>
        <div class="dt-ttl">${esc(l.titulo)}</div>
        <div class="dt-tags">${l.items.map(it=>`<span class="dt-tag">${esc(it)}</span>`).join('')}</div>
      </div>`).join('')}
    </div>
  </div>

  ${cal.length ? `<div class="sec">
    <div class="sec-t">Tu contenido del mes</div>
    <div class="cal-grid">
      ${cal.slice().sort((a,b)=>a.dia-b.dia).map(p=>{
        const i = cal.indexOf(p);
        return `<div class="pz ${p.estado}">
          <div class="pz-imgs">
            <span class="pz-state ${p.estado==='aprobado'?'ps-apr':p.estado==='correccion'?'ps-cor':'ps-pend'}">
              ${p.estado==='aprobado'?'✓ Aprobado':p.estado==='correccion'?'⚠ Corrección':'Para revisar'}</span>
            ${p.imgs?.length?`<img src="${p.imgs[0]}" class="pz-img">
              ${p.imgs.length>1?`<span class="pz-count">${p.imgs.length} 🖼</span>`:''}`
             :`<div class="pz-ph"><div style="font-size:22px">⏳</div>En producción</div>`}
          </div>
          <div class="pz-foot">
            <div class="pz-day">DÍA ${p.dia}</div>
            <div class="pz-ttl">${esc(p.titulo)}</div>
            <div class="pz-tags">
              <span class="pz-tag ${p.tipo==='pago'?'pt-pago':'pt-org'}">${p.tipo==='pago'?'Publicidad':'Orgánico'}</span>
              <span class="pz-tag pt-fmt">${esc(p.formato||'feed')}</span></div>
          </div>
          ${p.comentarios?.length?`<div class="pz-cmts">
            ${p.comentarios.map(cm=>`<div class="pz-cmt ${cm.autor==='cliente'?'cliente':''}">
              <div class="pz-cmt-a">${cm.autor==='cliente'?'Vos':'Koreskill'}</div>${esc(cm.texto)}</div>`).join('')}
          </div>`:''}
          ${p.imgs?.length?`<div class="pz-acts">
            ${p.estado!=='aprobado'?`<button class="btn xs ok" data-apr="${i}">✓ Aprobar</button>`:''}
            <button class="btn xs ghost" data-cli-cmt="${i}">💬 Pedir cambio</button>
          </div>`:''}
        </div>`;
      }).join('')}
    </div>
  </div>`:''}`;

  $$('[data-apr]').forEach(b => b.onclick = () => {
    c.calendario[+b.dataset.apr].estado = 'aprobado'; save(); render(); toast('Pieza aprobada');
  });
  $$('[data-cli-cmt]').forEach(b => b.onclick = () =>
    modalComentario(c, +b.getAttribute('data-cli-cmt'), 'cliente'));
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function bindDrop(dropSel, inputSel, cb) {
  const d = $(dropSel), i = $(inputSel);
  if (!d || !i) return;
  d.onclick = () => i.click();
  d.ondragover = e => { e.preventDefault(); d.classList.add('over'); };
  d.ondragleave = () => d.classList.remove('over');
  d.ondrop = async e => {
    e.preventDefault(); d.classList.remove('over');
    const f = e.dataTransfer.files[0]; if (f) cb(await imgB64(f));
  };
  i.onchange = async () => { const f = i.files[0]; if (f) cb(await imgB64(f)); };
}

function exportar() {
  const c = cli(); if (!c) return;
  const L = [];
  L.push(`KORESKILL CAMPAIGN STUDIO\n${c.identidad.nombre}`);
  L.push(`${[c.identidad.rubro,c.identidad.ciudad,c.identidad.pais].filter(Boolean).join(' · ')}`);
  L.push('═'.repeat(56),'');
  const secs = [
    ['1. IDENTIDAD DE MARCA', c.identidad.respuesta],
    ['1.2 PRESENCIA DIGITAL', c.identidad.respuesta12],
    ['1.3 GUÍA DE MARCA', c.identidad.respuesta13],
    ['2.2 JERARQUÍA DE PRODUCTOS', c.prodJerarquia],
    ['2.3 GUÍA DE FOTOGRAFÍA', c.prodFoto],
    ['3.1 AVATAR PRIMARIO', c.avatar.primario],
    ['3.2 AVATAR SECUNDARIO', c.avatar.secundario],
    ['3.3 MATRIZ DOLOR→PRODUCTO', c.avatar.matriz],
    ['4.2 HOOKS', c.angulos.hooks],
    ['4.3 CTAs WHATSAPP', c.angulos.ctas],
    ['5.1 CALENDARIO ORGÁNICO', c.estrategia.organico],
    ['5.2 PLAN DE ANUNCIOS', c.estrategia.anuncios],
    ['5.3 MIX UNIFICADO', c.estrategia.mix],
    ['6.1 PROMPTS DE IMAGEN', c.produccion.prompts_imagen],
    ['6.2 GUIONES DE VIDEO', c.produccion.guiones],
    ['6.3 CARRUSELES', c.produccion.carruseles],
  ];
  secs.forEach(([t,v]) => { if (v) L.push(`\n\n### ${t}\n`, v); });
  c.productos.forEach((p,i)=>{ if (p.respuesta) L.push(`\n\n### PRODUCTO ${i+1}: ${p.nombre}\n`, p.respuesta); });
  Object.entries(c.angulos.porProducto||{}).forEach(([pid,v])=>{
    const p = c.productos.find(x=>x.id===pid);
    if (v) L.push(`\n\n### ÁNGULOS: ${p?.nombre||''}\n`, v);
  });
  if (c.calendario.length) {
    L.push('\n\n### CALENDARIO\n');
    c.calendario.slice().sort((a,b)=>a.dia-b.dia).forEach(p =>
      L.push(`Día ${p.dia} · ${p.formato} · ${p.tipo==='pago'?'PAGO':'ORG'} · ${p.titulo} · [${p.estado}]`));
  }
  const blob = new Blob([L.join('\n')],{type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `koreskill-${(c.identidad.nombre||'cliente').toLowerCase().replace(/\s+/g,'-')}.txt`;
  a.click(); toast('Exportado');
}

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
loadDB();
$('#newCo').onclick = () => {
  const c = mkCli(); DB.clientes.unshift(c); DB.activo = c.id; TAB='identidad'; VISTA='admin';
  save(); render(); toast('Cliente creado');
};
$('#thBtn').onclick = () => {
  DB.theme = DB.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme = DB.theme; save();
};
$('#viewClientBtn').onclick = () => { VISTA = VISTA==='cliente'?'admin':'cliente'; render(); };
$('#exportBtn').onclick = exportar;
render();
