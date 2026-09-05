# Koreskill Campaign Studio v3

Sistema de producción y presentación de campañas para negocios locales.
Vos trabajás con la biblioteca de prompts. El cliente entra a ver y aprobar.

## Arrancar

```bash
npm install
npm start          # http://localhost:3000
```

## Los 8 tabs

| # | Tab | Qué hacés ahí |
|---|-----|---------------|
| 1 | Identidad  | Datos de marca, colores, tipografía, logo. 3 prompts. |
| 2 | Productos  | Catálogo con precios y fotos. 1 prompt por producto + 2 de catálogo. |
| 3 | Avatar     | Perfil del comprador, dolores, matriz dolor→producto. 3 prompts. |
| 4 | Ángulos    | Emocional/comercial/educativo por producto + hooks + CTAs. 3 prompts. |
| 5 | Estrategia | Calendario orgánico, plan de anuncios, mix. 3 prompts. |
| 6 | Producción | Prompts de imagen, guiones, carruseles. 3 prompts. |
| 7 | Entrega    | Cronograma editable de lotes. |
| 8 | Calendario | Piezas con imágenes, estados y comentarios. |

## Cómo se usa cada prompt

1. Completás los datos que pide el tab
2. Se abre la tarjeta del prompt → el sistema ya inyectó los datos del cliente
3. **Copiar prompt** → lo pegás en Claude.ai
4. Traés la respuesta → la pegás en el campo de abajo
5. **Guardar respuesta** → queda estructurada y alimenta los prompts siguientes

## Editar la biblioteca de prompts

Todo está en `public/prompts.js`. Cada prompt tiene un id (`1.1`, `2.3`, etc).
Para cambiar uno, buscá su id y editá el campo `texto`.

Las variables `{{nombre}}`, `{{diferencial}}`, `{{avatar_resumen}}` etc. se
rellenan solas. La lista completa está en la función `buildVars()`.

**Importante:** si escribís un `$` justo antes de `{{`, escapalo como `\${{`
porque JavaScript lo interpreta como expresión de template.

## Flujo con el cliente

- **Vista cliente** (botón arriba a la derecha): lo que ve el cliente
- El cliente aprueba piezas o deja comentarios de corrección
- Las piezas con corrección aparecen destacadas en tu calendario

## Deploy en Dokploy

1. Subí el repo a GitHub
2. New Application → Docker → conectá el repo
3. Build type: `Dockerfile` · Port: `3000`
4. Deploy

## Próximo paso: Supabase

Hoy guarda en localStorage. Para que el cliente entre desde su celular:

```sql
create table clientes (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users,
  token text unique,
  identidad jsonb, productos jsonb, avatar jsonb, angulos jsonb,
  estrategia jsonb, produccion jsonb, entrega jsonb,
  creado timestamptz default now()
);

create table piezas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes on delete cascade,
  dia int, semana int, tipo text, formato text, titulo text, angulo text,
  imgs text[], estado text default 'pendiente',
  comentarios jsonb default '[]',
  actualizado timestamptz default now()
);
```

Las imágenes van a Cloudflare Images en vez de base64.
