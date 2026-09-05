# Koreskill Campaign Studio

Sistema simple para trabajar una marca de forma continua: entender el negocio,
ordenar su oferta, definir el plan del mes, producir materiales y entregar un
próximo paso claro.

## Proceso

```text
MARCA → PRODUCTOS → PLAN DEL MES → PRODUCCIÓN → ENTREGA
   ↑                                             ↓
   └──────────── aprendizaje del próximo mes ───┘
```

### 1. Marca

El equipo carga notas, archivos o links y completa la ficha básica. La IA ayuda
a ordenar el contexto, pero no inventa la información faltante.

### 2. Productos

Se registran los productos o servicios, precio si está confirmado, forma de
compra y qué se puede mostrar. Se elige un foco para el mes.

### 3. Plan del mes

Se define un objetivo, un mensaje central y un calendario de hasta 12 piezas.
Cada pieza indica día, formato, tipo de contenido, objetivo y CTA.

### 4. Producción

Dentro del mismo momento se generan y guardan prompts de imagen, guiones,
copies y respuestas de WhatsApp. Cada material se puede copiar y llevar a la
herramienta correspondiente.

### 5. Entrega

Se marca el avance, se arma un resumen para el cliente, se agregan los links de
materiales y calendario y se define qué publicar primero.

## Uso local

```bash
npm install
cp .env.example .env
npm start
# http://localhost:3000
```

Sin `OPENAI_API_KEY`, la aplicación funciona en modo local: se puede cargar la
información, completar los campos y escribir cada sección manualmente.

## Variables de entorno

| Variable | Uso | Obligatoria |
| --- | --- | --- |
| `OPENAI_API_KEY` | Ordenar secciones y generar materiales | Solo para IA |
| `OPENAI_MODEL` | Modelo de texto. Default: `gpt-4.1` | No |
| `OPENAI_TPM_LIMIT` | Límite de tokens por minuto. Default: `30000` | No |
| `OPENAI_REQUEST_TOKEN_BUDGET` | Presupuesto máximo por pedido. Default: `9000` | No |
| `OPENAI_TIMEOUT_MS` | Tiempo máximo de cada pedido. Default: `90000` | No |
| `OPENAI_MAX_RETRIES` | Reintentos para errores temporales. Default: `2` | No |
| `REPLICATE_API_TOKEN` | Herramienta opcional de imágenes | No |
| `REPLICATE_MODEL` | Modelo opcional de imágenes | No |
| `PORT` | Puerto. Default: `3000` | No |

El servidor limita el tamaño de cada solicitud, recorta contexto extenso, pone
las solicitudes en cola y respeta el límite de tokens antes de enviar un nuevo
pedido. Esto evita el error de exceder el TPM disponible.

## Endpoints

| Método | Ruta | Función |
| --- | --- | --- |
| `GET` | `/api/health` | Estado de la conexión |
| `POST` | `/api/analyze` | Ordena `marca`, `productos`, `plan`, `produccion` o `entrega` |
| `POST` | `/api/prompts` | Genera prompts desde el plan |
| `POST` | `/api/guiones` | Genera guiones desde el plan |
| `POST` | `/api/copies` | Genera copies desde el plan |
| `POST` | `/api/whatsapp` | Genera respuestas de venta y postventa |
| `POST` | `/api/fetch` | Extrae texto de una URL cargada |

La generación automática de imágenes, los anuncios, CRM, automatizaciones,
Shopify, logística, facturación, usuarios y base de datos quedan fuera de esta
versión básica. Primero se valida el proceso de trabajo; después se agregan las
capas operativas que hagan falta.

## Datos

La aplicación guarda el proyecto en `localStorage` para un operador. La primera
carga migra automáticamente los clientes guardados con la estructura anterior
de nueve pestañas a la nueva estructura de cinco momentos sin borrar el
contenido previo.

## Vistas

- `/` — panel de trabajo.
- `/cliente.html?id=CLIENT_ID` — vista de solo lectura para compartir el avance.
