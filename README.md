# Koreskill Campaign Studio

Sistema de producción de campañas de marketing para negocios locales.
Adaptado de la arquitectura de Tesis: etapas encadenadas donde cada una
usa el contexto de las anteriores.

---

## QUÉ RESUELVE

Antes: cada campaña arranca de cero. Abrís un doc en blanco, pensás la
estrategia, escribís los prompts a mano, generás las imágenes en otra
pestaña, armás los copies en otra, y al cliente le mandás un link de Drive
sin contexto.

Ahora: un flujo de 9 pantallas donde cada paso alimenta al siguiente, y el
cliente entra a una URL y ve su campaña armada.

---

## EL FLUJO

```
ETAPA 1 · Identidad     → quién es el negocio y para quién existe
ETAPA 2 · Producto      → qué vende y qué lo hace especial
ETAPA 3 · Avatar        → quién compra, por qué y qué lo frena
ETAPA 4 · Estrategia    → los 3 ángulos y el calendario del mes
ETAPA 5 · Producción    → qué piezas se producen y en qué formato
ETAPA 6 · Entrega       → el brief final escrito para el cliente

PROMPTS  → prompts de imagen listos para Ideogram o Replicate
GUIONES  → guiones de video vertical con estructura de 4 bloques
COPIES   → textos de publicaciones + plantillas de WhatsApp
```

Cada etapa recibe automáticamente el texto de las etapas anteriores como
contexto. La Etapa 4 sabe lo que dijiste en la 1, 2 y 3 sin que tengas que
copiarlo.

---

## ARRANCAR EN LOCAL

```bash
npm install
cp .env.example .env      # completá las claves
npm start                 # http://localhost:3000
```

Sin claves de API el sistema arranca igual en modo local: podés escribir
las etapas a mano y usar todo el resto (guardado, exportación, vista cliente).

---

## VARIABLES DE ENTORNO

| Variable | Para qué | Obligatoria |
|---|---|---|
| `OPENAI_API_KEY` | Análisis de las 6 etapas + generación de prompts, guiones y copies | Sí para usar IA |
| `OPENAI_MODEL` | Modelo. Default `gpt-4.1` | No |
| `OPENAI_TPM_LIMIT` | Límite de tokens por minuto de la cuenta. Default `30000` | No |
| `OPENAI_REQUEST_TOKEN_BUDGET` | Presupuesto máximo por solicitud. Default `12000` | No |
| `OPENAI_TIMEOUT_MS` | Tiempo máximo por intento de OpenAI. Default `120000` | No |
| `OPENAI_MAX_RETRIES` | Reintentos automáticos para 429, timeout y errores 5xx. Default `4` | No |
| `REPLICATE_API_TOKEN` | Generación de imágenes desde los prompts | Solo para imágenes |
| `REPLICATE_MODEL` | Modelo de imagen. Default `black-forest-labs/flux-1.1-pro` | No |
| `REPLICATE_TIMEOUT_MS` | Tiempo máximo de cada consulta a Replicate. Default `45000` | No |
| `PORT` | Puerto. Default 3000 | No |

### Control de tiempos y límites

El servidor compacta automáticamente las fuentes largas antes de enviarlas a
OpenAI, mantiene cada solicitud por debajo del presupuesto configurado y pone
las generaciones de texto en una cola. Si OpenAI devuelve un `429` o un error
temporal, espera el tiempo indicado por la API y reintenta con un contexto más
pequeño.

La generación masiva de imágenes es secuencial: espera que termine una imagen
antes de iniciar la siguiente. Cada imagen puede procesarse durante hasta cinco
minutos sin bloquear ni perder los prompts ya guardados.

---

## DEPLOY EN DOKPLOY

1. Subí el repo a GitHub.
2. En Dokploy: **New Application → Docker → conectá el repo**.
3. Build type: `Dockerfile`.
4. Port: `3000`.
5. En **Environment** cargá las variables del `.env.example`.
6. Deploy.

El `docker-compose.yml` también sirve si preferís levantarlo con Compose.

---

## ENDPOINTS DEL BACKEND

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | Estado de las APIs conectadas |
| POST | `/api/analyze` | Corre una etapa. Body: `{etapa, cliente, previo, fuentes}` |
| POST | `/api/prompts` | Genera prompts de imagen desde la estrategia |
| POST | `/api/guiones` | Genera guiones de video |
| POST | `/api/copies` | Genera copies de publicaciones |
| POST | `/api/whatsapp` | Genera plantillas de conversación |
| POST | `/api/imagen` | Genera una imagen con Replicate |
| GET | `/api/imagen/:id` | Polling del estado de generación |
| POST | `/api/fetch` | Lee una URL y extrae el texto |

---

## VISTAS

**Admin** — `/`
Todo el flujo de trabajo. Rail de clientes, 9 pestañas, generación con IA.

**Cliente** — `/cliente.html?id=CLIENT_ID`
Solo lectura. Estado de la campaña, cronograma, piezas producidas, textos
listos para copiar. Sin acceso a las etapas de trabajo.

---

## DÓNDE SE GUARDA

Ahora mismo: `localStorage` del navegador. Funciona perfecto para un solo
operador y no necesita infraestructura.

**Próximo paso — Supabase.** Dos tablas:

```sql
create table clientes (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users,
  ficha jsonb,
  creado timestamptz default now()
);

create table campanas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes on delete cascade,
  etapas jsonb,
  prompts jsonb,
  guiones jsonb,
  copies jsonb,
  whatsapp jsonb,
  imagenes jsonb,
  mes text,
  actualizado timestamptz default now()
);
```

Con RLS: el admin ve todo, el cliente ve solo su fila.
Las imágenes generadas se suben a Cloudflare Images y se guarda la URL.

---

## PERSONALIZAR LOS PROMPTS DEL SISTEMA

Todo el conocimiento del método está en `server.js`:

- `METODO` — las reglas de trabajo que guían todas las etapas
- `ETAPAS` — el prompt de cada una de las 6 etapas
- `PROMPT_ENGINE` — la biblioteca de formatos visuales y las anti-AI rules

Editando esos tres bloques cambiás el criterio de todo el sistema sin tocar
nada más.
