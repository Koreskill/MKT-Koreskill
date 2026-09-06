# Koreskill Campaign Studio v3

Tablero de producción de contenido por cliente. Tres etapas: **Marca → Trabajo → Calendario**.

---

## Antes de desplegar: qué funciona y qué no

**Funciona hoy, apenas lo levantás:**

- Las tres etapas completas, con la biblioteca de 10 prompts y la inyección de variables del cliente.
- El parser de respuestas (pegás lo que devuelve Claude, el sistema lo estructura).
- El calendario con estados, comentarios y subida de imágenes.
- La vista del cliente — **pero solo en tu navegador**.

**Todavía NO funciona:**

- Que el cliente entre desde su celular y vea tu trabajo. Los datos viven en
  `localStorage`, o sea en **el navegador de cada persona**. Si le pasás la URL a un
  cliente, él va a abrir una instalación vacía con el ejemplo cargado, no tu mes de trabajo.
- Que puedas seguir en otra máquina sin exportar/importar a mano.

Eso llega en el Sprint 3, cuando se conecta Supabase. Hasta entonces esto es
**tu herramienta interna**, y al cliente le seguís mostrando el contenido como lo venías haciendo.

Desplegarlo igual tiene sentido: lo tenés en cualquier máquina tuya, no dependés de un
archivo suelto, y ya queda la infra andando para cuando entre Supabase.

---

## Deploy en Dokploy

Igual que Kore Creative OS: repo de GitHub + servicio Docker Compose.

1. **Subí esta carpeta al repo.** Podés meterla como subcarpeta del repo `Koreskill-App`
   (por ejemplo `campaign-studio/`) o crear un repo nuevo.

2. **En Dokploy:** *Create Service → Compose*
   - Repositorio: el de GitHub
   - Rama: `main`
   - Compose path: `./campaign-studio/docker-compose.dokploy.yml`
     (o `./docker-compose.dokploy.yml` si es un repo propio)
   - Nombre del servicio: `campaign-studio`

3. **Dominio:** en la pestaña *Domains*, agregá `studio.koreskill.com`
   apuntando al puerto `3000`. En Hostinger, registro A hacia el VPS.

4. **Deploy.** Tarda un minuto. Verificá con `https://studio.koreskill.com/health`
   → tiene que devolver `{"ok":true,...}`.

No hay variables de entorno que cargar todavía.

---

## Correrlo local

```bash
npm install
npm start
# http://localhost:3000
```

O sin Node, directamente: abrí `public/index.html` en el navegador. La app es
un solo archivo y no necesita servidor para funcionar.

---

## Estructura

```
campaign-studio/
├── public/index.html          ← la app entera (HTML + CSS + JS, sin dependencias)
├── server.js                  ← Express: sirve estáticos + /health + /cliente/:id
├── package.json
├── Dockerfile
├── docker-compose.dokploy.yml
└── README.md
```

---

## Cómo migrar a Supabase (Sprint 3)

Todo el acceso a datos pasa por un solo objeto, arriba de todo en `public/index.html`:

```js
const Store = {
  read(){ ... },      // devuelve {clientes:[...], activo:'id'} o null
  write(db){ ... },   // persiste ese objeto
  reset(){ ... }
};
```

Para migrar:

1. Creá las tablas en Supabase (`clientes`, `bloques`, `piezas`) o guardá el
   documento completo como JSONB en una sola tabla `estudios` — para el volumen
   que manejás, lo segundo alcanza y es una tarde de trabajo en vez de una semana.
2. Reemplazá esos tres métodos por llamadas a Supabase (`read` async → hay que
   hacer `render()` después del `await` en el arranque).
3. Para la vista del cliente: leé el token de `/cliente/:id`, traé solo ese cliente
   y arrancá con `UI.vistaCliente = true`.
4. Las imágenes hoy se guardan como base64 comprimido a 900px. Cuando conectes
   Cloudflare Images, en `leerImagen()` subí el blob y guardá la URL en vez del data URL.

Esos son los únicos cuatro puntos del código que hay que tocar.
