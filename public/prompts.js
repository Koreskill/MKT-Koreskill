/* =====================================================================
   KORESKILL CAMPAIGN STUDIO v3 — BIBLIOTECA DE PROMPTS
   ─────────────────────────────────────────────────────────────────────
   18 prompts organizados por etapa.
   Cada uno usa {{variables}} que el motor rellena con los datos del cliente.
   Para editar un prompt: buscá su id y cambiá el texto. Nada más.
   ===================================================================== */

const PROMPTS = {

/* ══════════════════════════════════════════════════════════
   ETAPA 1 · IDENTIDAD
   ══════════════════════════════════════════════════════════ */

'1.1': {
  tab: 'identidad', n: '1.1',
  titulo: 'Brief de identidad visual',
  desc: 'El tablero de marca completo. Arrancá siempre por acá.',
  icon: '🎨',
  requiere: ['nombre'],
  texto: `Sos un estratega de branding para negocios locales de {{pais}}.

Analizá la identidad visual de {{nombre}} ({{rubro}}, {{ciudad}}).

LO QUE SÉ HASTA AHORA:
{{descripcion}}
Diferencial: {{diferencial}}
Tono de comunicación: {{tono}}
Colores de marca: {{colores}}
Tipografías: {{tipografia}} / {{tipografia2}}

Devolvé el TABLERO DE IDENTIDAD con estas secciones:

QUIÉN ES — quién lo lleva, cuánto hace, qué historia tiene
QUÉ HACE — descripción exacta sin jerga
PARA QUIÉN — a quién le vende en la realidad
DIFERENCIAL REAL — qué hace distinto que ningún competidor puede copiar fácil
PERSONALIDAD — 5 adjetivos que definen cómo habla y se muestra
TONO — cómo escribe: cercano/formal, vos/usted, con o sin emojis, largo/corto
PALETA — para cada color: su función en la comunicación (principal/acento/fondo/texto)
EN UNA FRASE — el negocio en 15 palabras máximo

Texto plano. Títulos en MAYÚSCULA. Sin markdown decorativo. Máximo 500 palabras.`
},

'1.2': {
  tab: 'identidad', n: '1.2',
  titulo: 'Análisis de presencia digital',
  desc: 'Diagnóstico del estado actual en redes y la brecha a cerrar.',
  icon: '📱',
  requiere: ['nombre'],
  texto: `Analizá la presencia digital actual de {{nombre}} ({{rubro}}, {{ciudad}}).

Instagram: {{instagram}}
Web: {{web}}
Nivel digital declarado: {{nivel_digital}} sobre 5

CONTEXTO DEL NEGOCIO:
{{descripcion}}
Diferencial: {{diferencial}}

Devolvé:

ESTADO ACTUAL — qué tiene, qué le falta, qué está haciendo mal
OPORTUNIDADES INMEDIATAS — 3 acciones concretas que puede hacer esta semana
BENCHMARK — cómo se compara con negocios similares bien digitalizados de su rubro
BRECHA — la diferencia entre donde está hoy y donde puede estar en 90 días
PRIMER MOVIMIENTO — la única cosa que debería hacer primero y por qué

Texto plano. Directo. Sin suavizar los problemas.`
},

'1.3': {
  tab: 'identidad', n: '1.3',
  titulo: 'Guía de uso de marca para contenido',
  desc: 'Cómo aplicar la identidad en cada pieza. El filtro de calidad.',
  icon: '📐',
  requiere: ['nombre', 'colores'],
  texto: `Basándote en la identidad de {{nombre}} ({{rubro}}):

Colores: {{colores}}
Tipografías: {{tipografia}} / {{tipografia2}}
Tono: {{tono}}
Diferencial: {{diferencial}}

Creá la GUÍA DE CONTENIDO DE MARCA:

QUÉ MOSTRAR — tipos de fotos y videos que funcionan para este negocio
QUÉ NO MOSTRAR — qué genera ruido o daña la identidad
PALETA EN REDES — cómo usar cada color en feed, stories y reels
TIPOGRAFÍA EN DISEÑOS — cuándo usar cada fuente y en qué jerarquía
COMPOSICIÓN — reglas de encuadre para este rubro
FILTRO DE CALIDAD — 5 preguntas para saber si una pieza está lista para publicar

Texto plano. Reglas accionables, no teoría.`
},

/* ══════════════════════════════════════════════════════════
   ETAPA 2 · PRODUCTOS
   ══════════════════════════════════════════════════════════ */

'2.1': {
  tab: 'productos', n: '2.1',
  titulo: 'Brief de producto individual',
  desc: 'Uno por cada producto. Es la base de todos los ángulos.',
  icon: '📦',
  porProducto: true,
  requiere: ['nombre'],
  texto: `Analizá este producto de {{nombre}} ({{rubro}}):

PRODUCTO: {{prod_nombre}}
Descripción: {{prod_descripcion}}
Precio: \${{prod_precio}}
Tipo: {{prod_tipo}}
Público estimado: {{prod_publico}}
Etiquetas / variantes: {{prod_etiquetas}}
Tamaños: {{prod_tamanos}}

CONTEXTO DE MARCA:
{{descripcion}}
Diferencial de marca: {{diferencial}}

Devolvé el BRIEF DE PRODUCTO:

QUÉ ES — descripción para alguien que no lo conoce
QUÉ LO HACE ESPECIAL — diferencial concreto y verificable, no adjetivos vacíos
QUIÉN LO COMPRA — descripción detallada del comprador real
POR QUÉ LO COMPRA — el dolor que resuelve o el sueño que cumple
POR QUÉ NO LO COMPRA — 3 objeciones reales en palabras del cliente
CÓMO SE MUESTRA — qué tipo de foto o video lo representa mejor
MEJOR MOMENTO DE COMPRA — cuándo está el cliente más receptivo
PRECIO PERCIBIDO — ¿el precio comunica lo correcto? ¿es caro, barato o justo para su avatar?

Texto plano. Máximo 400 palabras.`
},

'2.2': {
  tab: 'productos', n: '2.2',
  titulo: 'Jerarquía de productos del mes',
  desc: 'Cuál impulsar, cuál sostiene, cuál da credibilidad.',
  icon: '🎯',
  requiere: ['nombre', 'productos'],
  texto: `{{nombre}} ({{rubro}}) tiene estos productos:

{{lista_productos}}

CONTEXTO DE LA MARCA:
{{descripcion}}
Diferencial: {{diferencial}}
Avatar principal: {{avatar_resumen}}

Definí la ESTRATEGIA DE PRODUCTO DEL MES:

PRODUCTO ESTRELLA — cuál impulsar este mes y por qué exactamente ese
PRODUCTOS DE SOPORTE — cuáles complementan sin competir por atención
PRODUCTO ANCLA — cuál da credibilidad aunque no sea el que más vende
COMBOS RECOMENDADOS — qué productos funcionan mejor juntos y a qué precio
SECUENCIA DE PRESENTACIÓN — en qué orden mostrarlos durante el mes
PRODUCTO A NO MOSTRAR — si hay alguno que conviene dejar fuera este mes, cuál y por qué

Texto plano. Decisiones concretas, no opciones.`
},

'2.3': {
  tab: 'productos', n: '2.3',
  titulo: 'Guía de fotografía de producto',
  desc: 'Cómo fotografiar cada producto solo con celular.',
  icon: '📸',
  requiere: ['nombre', 'productos'],
  texto: `Creá la GUÍA DE FOTOGRAFÍA para {{nombre}} ({{rubro}}).

PRODUCTOS: {{lista_productos}}
Colores de marca: {{colores}}
Tono visual: {{tono}}

Para cada formato de pieza (FEED 1:1, HISTORIA 9:16, CARRUSEL), indicá:

ENCUADRE — ángulo y composición recomendada
LUZ — natural o artificial, dirección, mejor hora del día
FONDO — qué usar, qué evitar
PROPS — qué elementos agregar para dar contexto
EDICIÓN — temperatura de color, saturación, qué filtro sí y cuál no
ERROR MÁS COMÚN — qué hace todo el mundo mal en este rubro

Al final: LAS 5 FOTOS QUE NO PUEDEN FALTAR — las tomas base que sirven para todo el mes.

Restricción: solo con celular. Sin equipamiento profesional, sin estudio, sin fotógrafo.`
},

/* ══════════════════════════════════════════════════════════
   ETAPA 3 · AVATAR
   ══════════════════════════════════════════════════════════ */

'3.1': {
  tab: 'avatar', n: '3.1',
  titulo: 'Avatar primario',
  desc: 'El perfil completo de quien compra. La base de toda la comunicación.',
  icon: '👤',
  requiere: ['nombre'],
  texto: `Construí el AVATAR PRIMARIO de {{nombre}} ({{rubro}}, {{ciudad}}, {{pais}}).

LO QUE SÉ DEL NEGOCIO:
{{descripcion}}
Diferencial: {{diferencial}}
Productos: {{lista_productos}}

Devolvé el perfil completo:

DEMOGRAFÍA — edad, género, situación familiar, trabajo, nivel de ingreso
DÍA A DÍA — cómo es un día típico de esta persona, de la mañana a la noche

DOLORES (5, del más intenso al menos):
1. Emocional — qué siente que le falta
2. Funcional — qué problema práctico tiene
3. Social — qué le preocupa de cómo lo ven
4. Económico — qué alternativa está evaluando
5. Identidad — qué historia se cuenta a sí mismo

SUEÑOS — qué quiere lograr, en sus palabras, no en palabras de marketing
OBJECIONES DE COMPRA — 5 razones por las que NO compra hoy
DÓNDE ESTÁ — qué redes usa, a qué hora, qué contenido consume
DISPARADOR DE COMPRA — qué situación lo hace comprar hoy y no mañana
FRASE QUE DIRÍA — cómo describiría su problema con sus propias palabras

Escribí como si describieras a una persona real, no a un segmento de mercado.
Texto plano. Máximo 700 palabras.`
},

'3.2': {
  tab: 'avatar', n: '3.2',
  titulo: 'Avatar secundario',
  desc: 'El segundo grupo que compra, con motivaciones distintas.',
  icon: '👥',
  requiere: ['nombre', 'avatar_primario'],
  texto: `{{nombre}} ({{rubro}}) ya tiene un avatar primario definido.

AVATAR PRIMARIO:
{{avatar_primario}}

Ahora construí el AVATAR SECUNDARIO: comparte el rubro y el producto,
pero tiene motivaciones, dolores o momentos de compra distintos.

Devolvé el mismo esquema completo:
DEMOGRAFÍA · DÍA A DÍA · DOLORES (5) · SUEÑOS · OBJECIONES ·
DÓNDE ESTÁ · DISPARADOR DE COMPRA · FRASE QUE DIRÍA

Al final, agregá:
DIFERENCIA CLAVE — en qué difiere del primario
CÓMO CAMBIA EL MENSAJE — qué hay que decir distinto para llegarle
PROPORCIÓN — qué porcentaje del contenido debería apuntarle a este avatar`
},

'3.3': {
  tab: 'avatar', n: '3.3',
  titulo: 'Matriz dolor → producto → resultado',
  desc: 'La conexión exacta entre lo que duele y lo que vendés.',
  icon: '🔗',
  requiere: ['nombre', 'avatar_primario', 'productos'],
  texto: `Conectá los dolores del avatar de {{nombre}} con sus productos.

AVATAR PRIMARIO:
{{avatar_primario}}

PRODUCTOS:
{{lista_productos}}

Creá la MATRIZ DOLOR → PRODUCTO → RESULTADO.

Para cada uno de los 5 dolores del avatar:

DOLOR — el problema exacto, en palabras del cliente
PRODUCTO — cuál de los productos lo resuelve
CÓMO LO RESUELVE — el mecanismo concreto, no una promesa vaga
RESULTADO — qué cambia en la vida del cliente después de comprar
PRUEBA — cómo demostrar ese resultado en contenido (foto, video, testimonio, dato)
TIEMPO — en cuánto tiempo el cliente nota la diferencia
OBJECIÓN ASOCIADA — qué duda aparece justo antes de comprar y cómo desarmarla

Esta matriz es la base de toda la comunicación del mes.
Texto plano. Una sección por dolor.`
},

/* ══════════════════════════════════════════════════════════
   ETAPA 4 · ÁNGULOS
   ══════════════════════════════════════════════════════════ */

'4.1': {
  tab: 'angulos', n: '4.1',
  titulo: 'Los 3 ángulos por producto',
  desc: 'Emocional, comercial y educativo para cada producto.',
  icon: '📐',
  porProducto: true,
  requiere: ['nombre', 'avatar_primario'],
  texto: `Definí los 3 ÁNGULOS DE COMUNICACIÓN para {{prod_nombre}} de {{nombre}}.

MARCA: {{descripcion}}
Diferencial: {{diferencial}}
Tono: {{tono}}

PRODUCTO: {{prod_nombre}}
{{prod_descripcion}}
Precio: \${{prod_precio}}

AVATAR: {{avatar_resumen}}
Dolor principal: {{dolor_principal}}

Para cada ángulo devolvé:

ÁNGULO A — EMOCIONAL
Nombre del ángulo:
A quién le habla:
Qué dice:
Qué acción busca:
Formato que mejor lo expresa:
Ejemplo de primera línea de copy:

ÁNGULO B — COMERCIAL
(mismo esquema)

ÁNGULO C — EDUCATIVO
(mismo esquema)

Al final:
PROPORCIÓN RECOMENDADA — cuántas piezas de cada ángulo en el mes y por qué esa distribución
ÁNGULO PRIORITARIO — si tuvieras que elegir uno solo este mes, cuál y por qué`
},

'4.2': {
  tab: 'angulos', n: '4.2',
  titulo: 'Hooks y ganchos por ángulo',
  desc: '30 primeras líneas que paran el scroll.',
  icon: '🪝',
  requiere: ['nombre', 'avatar_primario'],
  texto: `Escribí 30 HOOKS para {{nombre}} ({{rubro}}, {{ciudad}}).

MARCA: {{descripcion}}
PRODUCTO PRINCIPAL: {{prod_estrella}}
AVATAR: {{avatar_resumen}}
DOLOR PRINCIPAL: {{dolor_principal}}
TONO: {{tono}}

10 HOOKS — ÁNGULO EMOCIONAL
Conectan con el dolor. Deben funcionar como texto de post,
como texto sobre la imagen y como gancho hablado de reel.

10 HOOKS — ÁNGULO COMERCIAL
Orientados a la venta directa de {{prod_estrella}}.

10 HOOKS — ÁNGULO EDUCATIVO
Contenido de valor que posiciona a {{nombre}} como referente.

REGLAS:
— Español rioplatense, voseo
— Máximo 12 palabras por hook
— Sin emojis al inicio
— Sin signos de exclamación múltiples
— Que suenen a persona real hablando, no a marca corporativa
— Nada de "¿Sabías que...?" ni "Descubrí el secreto de..."`
},

'4.3': {
  tab: 'angulos', n: '4.3',
  titulo: 'CTAs y cierres de WhatsApp',
  desc: 'Las 6 plantillas que convierten la consulta en venta.',
  icon: '💬',
  requiere: ['nombre'],
  texto: `Escribí las PLANTILLAS DE CONVERSACIÓN de WhatsApp para {{nombre}} ({{rubro}}).

PRODUCTO PRINCIPAL: {{prod_estrella}} — \${{prod_precio}}
TONO DE COMUNICACIÓN: {{tono}}
AVATAR: {{avatar_resumen}}
OBJECIÓN MÁS COMÚN: {{objecion_principal}}

6 PLANTILLAS COMPLETAS:

1. SALUDO INICIAL — cuando alguien escribe por primera vez
2. CONSULTA DE PRECIO — respuesta que NO mata la conversación
3. OBJECIÓN DE PRECIO — cuando dicen "es caro" o "lo pienso"
4. SEGUIMIENTO 24HS — para quien vio el mensaje y no respondió
5. CIERRE — cuando ya está listo para comprar
6. POST-VENTA — para que vuelva y recomiende

Para cada una devolvé:
CUÁNDO SE USA:
TEXTO EXACTO:
POR QUÉ FUNCIONA:

REGLAS:
— Nunca mandar solo el precio. Siempre: contexto + precio + próximo paso
— Español rioplatense, voseo
— Máximo 3 líneas por mensaje
— Máximo 1 emoji por mensaje
— Siempre terminar con una pregunta o una acción concreta`
},

/* ══════════════════════════════════════════════════════════
   ETAPA 5 · ESTRATEGIA
   ══════════════════════════════════════════════════════════ */

'5.1': {
  tab: 'estrategia', n: '5.1',
  titulo: 'Calendario orgánico 30 días',
  desc: 'Qué publicar cada día y para qué.',
  icon: '📅',
  requiere: ['nombre', 'avatar_primario'],
  texto: `Creá el CALENDARIO ORGÁNICO de {{nombre}} para este mes.

MARCA: {{identidad_resumen}}
PRODUCTO A IMPULSAR: {{prod_estrella}}
AVATAR: {{avatar_resumen}}
ÁNGULOS DEFINIDOS: {{angulos_resumen}}
TONO: {{tono}}

30 días de contenido. Formato exacto de salida:

SEMANA 1
Día 2 · FEED · Emocional · [tema concreto] · Objetivo: [qué logra] · CTA: [acción]
Día 4 · REEL · Comercial · [tema] · Objetivo · CTA
Día 6 · STORY · Educativo · [tema] · Objetivo · CTA
(y así hasta completar la semana)

SEMANA 2
(mismo formato)

SEMANA 3
(mismo formato)

SEMANA 4
(mismo formato)

DISTRIBUCIÓN OBLIGATORIA:
— 40% emocional (conecta, retiene seguidores)
— 40% comercial (vende, genera consultas)
— 20% educativo (genera autoridad)

REQUISITOS:
— En semana 2 y semana 4: incluir un post de prueba social (testimonio o resultado)
— Al menos 3 reels en el mes
— Al menos 2 carruseles
— Ningún día con más de una publicación de feed

Al final:
MÉTRICA DE ÉXITO — los dos números a mirar para saber si el mes funcionó
SEÑAL DE ALERTA — qué indicaría que hay que corregir el rumbo`
},

'5.2': {
  tab: 'estrategia', n: '5.2',
  titulo: 'Plan de anuncios Meta Ads',
  desc: 'Las 3 campañas del embudo con audiencias y presupuesto.',
  icon: '📢',
  requiere: ['nombre', 'avatar_primario'],
  texto: `Creá el PLAN DE ANUNCIOS META para {{nombre}} ({{rubro}}, {{ciudad}}).

MARCA: {{identidad_resumen}}
PRODUCTO: {{prod_estrella}} — \${{prod_precio}}
AVATAR: {{avatar_resumen}}
DOLOR PRINCIPAL: {{dolor_principal}}
PRESUPUESTO DIARIO DISPONIBLE: {{presupuesto_ads}}

3 CAMPAÑAS:

═══ CAMPAÑA 1 — TOFU (conciencia) ═══
Objetivo de Meta a elegir:
Audiencia: intereses concretos + geolocalización + edad
Creatividad: formato y concepto visual
Copy: gancho / cuerpo / CTA
Días activa:
Presupuesto diario sugerido:
Qué mirar: métrica de éxito de esta campaña

═══ CAMPAÑA 2 — MOFU (consideración) ═══
Objetivo de Meta:
Audiencia: engagement + interacción previa + lookalike
Creatividad + copy completo
Días activa · Presupuesto · Métrica

═══ CAMPAÑA 3 — BOFU (conversión) ═══
Objetivo de Meta:
Audiencia: visitantes web + lista de contactos + retargeting
Creatividad + copy completo
Días activa · Presupuesto · Métrica

Al final:
DISTRIBUCIÓN DE PRESUPUESTO — qué % a cada campaña y por qué
ORDEN DE ACTIVACIÓN — en qué orden encender las campañas
CUÁNDO ESCALAR — qué señal indica que hay que subir el presupuesto
CUÁNDO CORTAR — qué señal indica que una campaña no funciona`
},

'5.3': {
  tab: 'estrategia', n: '5.3',
  titulo: 'Mix orgánico + pago unificado',
  desc: 'Vista integrada semana por semana con puntos de control.',
  icon: '🔀',
  requiere: ['nombre'],
  texto: `Integrá el calendario orgánico y el plan de anuncios de {{nombre}} en una VISTA UNIFICADA.

CALENDARIO ORGÁNICO:
{{calendario_organico}}

PLAN DE ANUNCIOS:
{{plan_anuncios}}

Devolvé las 4 semanas con este formato exacto:

═══ SEMANA 1 ═══
ORGÁNICO: qué se publica cada día
ANUNCIOS: qué campaña está activa y con qué creatividad
OBJETIVO DE LA SEMANA: qué tiene que pasar concretamente
PUNTO DE CONTROL: qué revisar el domingo
SEÑAL DE ALERTA: qué número indica que algo no funciona
AJUSTE RÁPIDO: qué cambiar si la semana no va bien

═══ SEMANA 2 ═══
(mismo formato)

═══ SEMANA 3 ═══
(mismo formato)

═══ SEMANA 4 ═══
(mismo formato)

Al final:
SINERGIAS — dónde el orgánico potencia al pago y viceversa
CARGA DE TRABAJO DEL CLIENTE — cuánto tiempo real necesita dedicarle por semana`
},

/* ══════════════════════════════════════════════════════════
   ETAPA 6 · PRODUCCIÓN
   ══════════════════════════════════════════════════════════ */

'6.1': {
  tab: 'produccion', n: '6.1',
  titulo: 'Kit de 12 prompts de imagen',
  desc: 'Los prompts listos para Ideogram, Flux o Nano Banana.',
  icon: '🖼️',
  requiere: ['nombre', 'colores'],
  texto: `Generá 12 PROMPTS DE IMAGEN para {{nombre}} ({{rubro}}, {{ciudad}}, {{pais}}).

IDENTIDAD VISUAL:
Paleta: {{colores}}
Tipografía: {{tipografia}}
Tono visual: {{tono}}
Diferencial: {{diferencial}}

PRODUCTO A MOSTRAR: {{prod_estrella}} — \${{prod_precio}}
AVATAR: {{avatar_resumen}}
ÁNGULOS: {{angulos_resumen}}

Para cada una de las 12 imágenes devolvé:

N° · FORMATO (1:1 / 4:5 / 9:16) · ÁNGULO · TÍTULO INTERNO

Luego el PROMPT COMPLETO EN INGLÉS con estas secciones:
— FORMAT: formato y modo (light/dark)
— COMPOSITION: composición por zonas del encuadre
— LIGHTING: iluminación y ambiente
— PALETTE: colores con HEX exactos
— TEXT IN IMAGE: qué texto aparece (en ESPAÑOL RIOPLATENSE), tipografía y posición
— STYLE: estilo fotográfico (documental / editorial / UGC / producto)
— ANTI-AI RULES: mínimo 4 reglas concretas que eviten look de stock o render 3D

DISTRIBUCIÓN DE FORMATOS:
— 4 imágenes en 1:1 (feed)
— 4 imágenes en 4:5 (feed vertical)
— 4 imágenes en 9:16 (stories/reels)

REGLAS GENERALES:
— Ningún prompt lleva botón CTA dentro de la imagen
— Las personas se ven reales del país, nunca modelos de stock
— Los locales se ven como negocios reales de barrio
— Los carteles de precio son escritos a mano en cartón
— Sin gradientes decorativos, sin neones, sin efectos`
},

'6.2': {
  tab: 'produccion', n: '6.2',
  titulo: 'Guiones de video UGC',
  desc: '4 guiones verticales listos para grabar con celular.',
  icon: '🎬',
  requiere: ['nombre', 'avatar_primario'],
  texto: `Escribí 4 GUIONES DE VIDEO UGC para {{nombre}} ({{rubro}}).

MARCA: {{descripcion}}
Diferencial: {{diferencial}}
Tono: {{tono}}

PRODUCTO: {{prod_estrella}} — \${{prod_precio}}
AVATAR: {{avatar_resumen}}
DOLOR PRINCIPAL: {{dolor_principal}}

Para cada guión devolvé:

TÍTULO INTERNO:
DURACIÓN: (entre 20 y 45 segundos)
FORMATO: 9:16 vertical
ÁNGULO: emocional / comercial / educativo / testimonio

GANCHO (0-3 segundos): la línea exacta que se dice o el texto que aparece

BLOQUES:
[0-3s]  VOZ: "texto exacto que se dice"
        IMAGEN: qué se ve en cámara
[3-8s]  VOZ: "..."
        IMAGEN: ...
(continuar hasta el final)

CIERRE: CTA claro y breve

NOTAS DE PRODUCCIÓN: qué necesita el cliente para grabarlo (locación, props, momento del día)

LOS 4 GUIONES:
1. Emocional — conecta con el dolor
2. Comercial — muestra el producto y el precio
3. Educativo — enseña algo del rubro
4. Testimonio — simula o guiona un caso de cliente real

REGLAS:
— Español rioplatense, voseo
— Lenguaje de dueño de negocio real, no de actor
— Grabable con celular sin equipo especial
— Nada de "Hola chicos" ni "Bienvenidos a mi canal"`
},

'6.3': {
  tab: 'produccion', n: '6.3',
  titulo: 'Brief de carruseles',
  desc: '3 carruseles slide por slide, texto e imagen.',
  icon: '🎠',
  requiere: ['nombre'],
  texto: `Diseñá 3 CARRUSELES para {{nombre}} ({{rubro}}).

IDENTIDAD:
Paleta: {{colores}}
Tipografía: {{tipografia}}
Tono: {{tono}}

PRODUCTO: {{prod_estrella}}
AVATAR: {{avatar_resumen}}
ÁNGULOS DISPONIBLES: {{angulos_resumen}}

Para cada carrusel devolvé:

TÍTULO INTERNO:
ÁNGULO:
OBJETIVO: qué tiene que lograr (guardar / compartir / consultar / comprar)
CANTIDAD DE SLIDES: entre 5 y 8

SLIDE 1 (portada):
  TEXTO: exacto, máximo 8 palabras
  VISUAL: descripción de lo que se ve
  
SLIDE 2:
  TEXTO: máximo 20 palabras
  VISUAL: descripción
  
(continuar hasta el último)

SLIDE FINAL (CTA):
  TEXTO: la acción pedida
  VISUAL: descripción

LOS 3 CARRUSELES:
1. Educativo — enseña algo útil del rubro
2. Comercial — presenta el producto y sus beneficios
3. Prueba social — muestra resultados o testimonios

FORMATO: cuadrado 1:1
REGLAS: textos cortos, máximo 20 palabras por slide, sin párrafos largos`
},

};

/* =====================================================================
   MOTOR DE INYECCIÓN DE VARIABLES
   Rellena los {{marcadores}} con los datos reales del cliente.
   ===================================================================== */

function buildVars(c, prod = null) {
  const id = c.identidad || {};
  const productos = c.productos || [];
  const estrella = productos.find(p => p.es_estrella) || productos[0] || {};

  /* resumen de identidad (usa la respuesta si existe, si no los campos) */
  const identidadResumen = id.respuesta
    ? id.respuesta.slice(0, 900)
    : [
        id.nombre && `${id.nombre} · ${id.rubro || ''} · ${id.ciudad || ''}, ${id.pais || ''}`,
        id.descripcion,
        id.diferencial && `Diferencial: ${id.diferencial}`
      ].filter(Boolean).join('\n');

  /* lista de productos formateada */
  const listaProductos = productos.length
    ? productos.map((p, i) =>
        `${i + 1}. ${p.nombre || 'Sin nombre'}${p.es_estrella ? ' ★ ESTRELLA' : ''}` +
        `\n   ${p.descripcion || ''}` +
        `\n   Precio: $${p.precio || '?'} · Tipo: ${p.tipo || '?'}` +
        (p.etiquetas ? `\n   Variantes: ${p.etiquetas}` : '') +
        (p.tamanos ? `\n   Tamaños: ${p.tamanos}` : '')
      ).join('\n\n')
    : '(sin productos cargados)';

  /* avatar */
  const avatarPrimario = c.avatar?.primario || '';
  const avatarResumen = avatarPrimario
    ? avatarPrimario.slice(0, 500)
    : '(avatar no definido — completá la etapa 3)';

  /* dolor principal — intenta extraerlo del avatar */
  let dolorPrincipal = '(no definido)';
  if (avatarPrimario) {
    const m = avatarPrimario.match(/1\.\s*Emocional[^\n]*[\n\s]*([^\n]+)/i)
           || avatarPrimario.match(/DOLORES?[\s\S]{0,200}?1[\.\)]\s*([^\n]+)/i);
    if (m) dolorPrincipal = m[1].trim().slice(0, 200);
  }

  /* objeción principal */
  let objecionPrincipal = '(no definida)';
  if (avatarPrimario) {
    const m = avatarPrimario.match(/OBJECIONES[\s\S]{0,300}?1[\.\)]\s*([^\n]+)/i);
    if (m) objecionPrincipal = m[1].trim().slice(0, 200);
  }

  /* ángulos */
  const angulosResumen = (c.angulos || []).length
    ? c.angulos.map(a => `${a.tipo?.toUpperCase() || ''}: ${a.nombre || ''} — ${a.que_dice || ''}`).join('\n')
    : (c.angulosTexto || '(ángulos no definidos)');

  return {
    /* identidad */
    nombre:        id.nombre || '(sin nombre)',
    rubro:         id.rubro || 'negocio local',
    ciudad:        id.ciudad || '',
    pais:          id.pais || 'Argentina',
    web:           id.web || '(sin web)',
    instagram:     id.instagram || '(sin instagram)',
    descripcion:   id.descripcion || '(sin descripción cargada)',
    diferencial:   id.diferencial || '(sin diferencial definido)',
    tono:          id.tono || 'cercano y directo',
    colores:       (id.colores || []).join(' · ') || '(sin paleta definida)',
    tipografia:    id.tipografia || '(sin definir)',
    tipografia2:   id.tipografia2 || '(sin definir)',
    nivel_digital: id.nivel_digital ?? 2,
    presupuesto_ads: id.presupuesto_ads || 'a definir',
    identidad_resumen: identidadResumen,

    /* productos */
    lista_productos: listaProductos,
    prod_estrella:   estrella.nombre || '(producto principal no definido)',
    prod_precio:     estrella.precio || '?',

    /* producto individual (para prompts porProducto) */
    prod_nombre:      prod?.nombre || estrella.nombre || '',
    prod_descripcion: prod?.descripcion || estrella.descripcion || '',
    prod_tipo:        prod?.tipo || estrella.tipo || 'producto físico',
    prod_publico:     prod?.publico || estrella.publico || '(a definir)',
    prod_etiquetas:   prod?.etiquetas || estrella.etiquetas || '(sin variantes)',
    prod_tamanos:     prod?.tamanos || estrella.tamanos || '(sin tamaños)',

    /* avatar */
    avatar_primario:    avatarPrimario || '(no definido)',
    avatar_resumen:     avatarResumen,
    dolor_principal:    dolorPrincipal,
    objecion_principal: objecionPrincipal,

    /* ángulos */
    angulos_resumen: angulosResumen,

    /* estrategia */
    calendario_organico: c.estrategia?.organico?.slice(0, 2000) || '(no cargado)',
    plan_anuncios:       c.estrategia?.anuncios?.slice(0, 2000) || '(no cargado)',
  };
}

/* Rellena un prompt con las variables del cliente */
function fillPrompt(promptId, c, prod = null) {
  const p = PROMPTS[promptId];
  if (!p) return '';
  const vars = buildVars(c, prod);
  return p.texto.replace(/\{\{(\w+)\}\}/g, (m, k) =>
    vars[k] !== undefined ? vars[k] : m
  );
}

/* Verifica si el prompt tiene los datos mínimos para ser útil */
function promptReady(promptId, c) {
  const p = PROMPTS[promptId];
  if (!p?.requiere) return true;
  return p.requiere.every(r => {
    if (r === 'nombre')          return !!c.identidad?.nombre;
    if (r === 'colores')         return (c.identidad?.colores || []).length > 0;
    if (r === 'productos')       return (c.productos || []).length > 0;
    if (r === 'avatar_primario') return !!c.avatar?.primario;
    return true;
  });
}

/* Devuelve los prompts de un tab */
function promptsDeTab(tab) {
  return Object.entries(PROMPTS)
    .filter(([, p]) => p.tab === tab)
    .map(([id, p]) => ({ id, ...p }));
}
