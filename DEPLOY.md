# Guía de despliegue del backend (GIJIops / Soporte Técnico)

Esta guía asume que ya ejecutaste los pasos anteriores: las tablas existen en
Supabase (`backend/sql/01_schema.sql` + `02_seed_data.sql`) y probaste el
backend localmente con `npm start` usando tu `.env`.

Vas a desplegar SOLO la carpeta `backend/` (una API Node/Express). El
frontend Angular/Ionic se compila aparte y no necesita "servidor" propio: se
sirve como archivos estáticos (o se empaqueta como app móvil con Capacitor).

---

## Paso 1 — Sube el proyecto a GitHub

Si tu proyecto todavía no es un repositorio git:

```bash
cd soporte-main
git init
git add .
git commit -m "Backend migrado a Supabase Postgres"
```

Crea un repositorio vacío en https://github.com/new (puede ser privado) y
luego:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

> El `.gitignore` ya excluye `node_modules/` y cualquier archivo `.env`, así
> que tu `DATABASE_URL` real nunca se sube al repositorio.

---

## Opción A — Desplegar en Render (recomendado, tiene plan gratuito)

1. Entra a https://dashboard.render.com y conecta tu cuenta de GitHub.
2. Click en **New +** → **Web Service**.
3. Selecciona el repositorio que acabas de subir.
4. Este proyecto ya incluye `render.yaml` en la raíz, así que Render debería
   detectar automáticamente la configuración (root: `backend/`, build:
   `npm install`, start: `npm start`). Si te pide confirmar manualmente:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. En la sección **Environment Variables**, agrega:
   - `DATABASE_URL` → tu connection string de Supabase (la nueva, con la
     contraseña rotada).
6. Click **Create Web Service**. Render instalará dependencias y arrancará
   el servidor. El primer deploy tarda 2–3 minutos.
7. Cuando termine, Render te da una URL pública, algo como:
   `https://soporte-backend.onrender.com`
8. Verifica que la base de datos esté conectada visitando:
   `https://soporte-backend.onrender.com/api/health`
   Debe responder `{"success":true,"database":"connected"}`.

**Nota sobre el plan gratuito de Render:** el servicio "duerme" tras ~15 min
de inactividad y tarda unos segundos en despertar con la primera petición.
Para una app en producción real conviene el plan pago (~$7/mes) que no
duerme.

---

## Opción B — Desplegar en Railway

1. Entra a https://railway.app y conecta tu cuenta de GitHub.
2. **New Project** → **Deploy from GitHub repo** → selecciona tu repositorio.
3. Railway detecta Node.js automáticamente. Si no configura la carpeta sola:
   - En **Settings** → **Root Directory**, escribe `backend`.
   - **Start Command:** `npm start`
4. En la pestaña **Variables**, agrega:
   - `DATABASE_URL` → tu connection string de Supabase.
5. Railway despliega automáticamente. En **Settings → Networking**, activa
   **Generate Domain** para obtener tu URL pública
   (ej. `https://soporte-backend-production.up.railway.app`).
6. Verifica `https://TU_URL/api/health`.

---

## Paso 3 — Apunta el frontend a tu backend desplegado

Edita `src/environments/environment.prod.ts`:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://soporte-backend.onrender.com/api'
};
```

(usa tu URL real de Render/Railway, sin barra final, sin olvidar `/api` si
tus rutas lo requieren — revisa cómo lo consume `src/app/services` en tu
proyecto).

---

## Paso 4 — Compila el frontend para producción

```bash
npm install
npx ng build --configuration production
```

Esto genera la carpeta `www/` con la app lista para desplegar como sitio
estático (Netlify, Vercel, Render Static Site, GitHub Pages) o para
empaquetar con Capacitor (`npx cap sync android`) como app Android/iOS.

---

## Checklist final

- [ ] Contraseña de Supabase rotada (la que compartiste antes ya no es válida)
- [ ] `01_schema.sql` y `02_seed_data.sql` ejecutados en Supabase
- [ ] `DATABASE_URL` configurada como variable de entorno en Render/Railway
      (NUNCA en el código)
- [ ] `/api/health` responde `database: connected` en producción
- [ ] `environment.prod.ts` apunta a la URL pública del backend
- [ ] `ng build --configuration production` compila sin errores
