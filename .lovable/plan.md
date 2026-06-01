
# Plan — Frontend Shell "PKGD OS" (revisado)

Construyo el frontend completo en TanStack Start (equivalente funcional a Next.js, ya que Lovable no soporta Next.js) con Zustand para sesión, Tailwind con la paleta de marca y una capa de API mockeada alineada al contrato del backend (Node + Express + Prisma + n8n) listo para conectar cambiando una sola capa.

## Paleta y lenguaje visual

- **Fondo** `#1d1d1b` · **Texto principal** `#FFFFFF` · **Detalles / acento** `#fae714`.
- Estilo "AI premium": tipografía display + mono, mucho negro, halos amarillos sutiles, micro-animaciones de atenuación/pulso. Cero spinners — la latencia es "silencio deliberado" (El Intervalo).
- UI 100% en inglés. Solo el contenido del hilo de chat es bilingüe con toggle manual EN/ES.

## Estructura de rutas (TanStack Start, file-based)

```text
src/routes/
  __root.tsx                shell + QueryClient + Zustand hydration
  index.tsx                 redirect → /login o /oracle según sesión
  login.tsx                 Authentication Gateway
  _app.tsx                  layout autenticado (guard + nav)
  _app.oracle.tsx           Oracle Workspace (chat)
  _app.hive.tsx             Hive Matrix (admin)
  _app.knowledge.tsx        Knowledge Pipeline Hub (admin)
  _app.audit.tsx            Audit Workspace (admin)
```

`_app` valida JWT en Zustand. Redirige a `/oracle` si `global_role !== 'admin'` y se intenta entrar a hive/knowledge/audit. Captura `?alert=structural_gold&session=...` antes del login y restaura el destino tras autenticar (Deep Link Interceptor).

## Estado global (Zustand) — alineado al backend

`src/stores/session.ts` (persist en `localStorage`, hydration gate):

```ts
type GlobalRole = "admin" | "operator";

interface SessionUser {
  id: string;                  // UUID
  full_name: string;
  email: string;
  password_hash?: string;      // solo eco del payload, nunca se renderiza
  global_role: GlobalRole;
  // Telemetría — solo presente para admins (DTO del backend la purga para operators)
  friction_level?: number | null;
  calcification_level?: number | null;
}

interface SessionState {
  token: string | null;        // JWT
  user: SessionUser | null;
  chatLanguage: "en" | "es";
  setSession(token: string, user: SessionUser): void;
  clear(): void;
  setLanguage(l: "en" | "es"): void;
}
```

`src/stores/deepLink.ts` — guarda URL objetivo pre-login.

> **Nota de ceguera del operador:** para `global_role === 'operator'`, `friction_level` y `calcification_level` quedan en `null` (el backend los purga vía DTO en `/api/users/me`). El frontend nunca los renderiza en ninguna vista del operador; solo aparecen en Hive Matrix y Audit Workspace para admins.

## Capa de API (mocks abiertos, contrato real)

`src/lib/api/`

- `client.ts` — `apiFetch(path, init)` con base `VITE_API_BASE_URL`, header `Authorization: Bearer <jwt>`, parseo JSON, errores tipados. Si `VITE_USE_MOCKS=true` o no hay base URL, delega al adaptador mock.
- `auth.ts` — `login(email, password)` → `POST /api/auth/login`; `me()` → `GET /api/users/me`.
- `users.ts` — `listOperators()` `GET /api/users` (admin, incluye telemetría); `createOperator(payload)` `POST /api/users`; `updateRole`, `linkBrands`.
- `sessions.ts` — `mySessions()` `GET /api/sessions/my-sessions`; `createSession(brand_id, title)` `POST /api/sessions` → devuelve `session_id` (luego el chat puentea directo a n8n); `listAllSessions()` `GET /api/sessions` (admin); `getSession(id)` `GET /api/sessions/:id` (admin, telemetría + transcript_payload); `integrateSession(id)` `PATCH /api/sessions/:id/integrate`.
- `chat.ts` — `sendPrompt({ session_id, prompt, language })` → `POST` directo a `VITE_N8N_CHAT_WEBHOOK` (bypass Node, como dicta la Asincronía Asimétrica). Soporta streaming si el webhook lo entrega; fallback a respuesta completa. Mock devuelve respuestas simuladas con retraso variable para que el "Intervalo" sea visible.
- `knowledge.ts` — `listByBrand(brand_id)` `GET /api/knowledge/:brand_id`; `upload(file, { brand_id, asset_type, title })` `POST /api/knowledge/upload` (multipart); `extractGold(session_id)` `POST /api/knowledge/extract`.
- `brands.ts` — `list()` (mock por ahora; el doc no lista endpoint pero el modelo existe).
- `mocks/` — datasets coherentes con el schema Prisma (UUIDs, ENUMs como strings: `asset_type ∈ {SOP, Dogma, Gold, Jewel}`, `vectorization_status ∈ {Pending, Embedded, Error}`, `gold_extraction_status`, `resolution_status`, etc.).

Variables de entorno (todas opcionales hoy): `VITE_API_BASE_URL`, `VITE_USE_MOCKS`, `VITE_N8N_CHAT_WEBHOOK`, `VITE_N8N_INGEST_URL` (si se necesita disparo directo además del backend).

Toda llamada de UI pasa por TanStack Query (`useQuery`/`useMutation`) consumiendo estas funciones; conectar el backend real será cambiar `client.ts` y desactivar `VITE_USE_MOCKS`.

## Componentes por página

### 1. `/login` — Authentication Gateway
- Card central, fondo `#1d1d1b`, borde 1px `#fae714` con halo sutil, texto `#FFFFFF`.
- Inputs: `Corporate Email / Operator ID`, `Access Key` (password).
- Botón `Initialize Session`: atenuación + micro-pulso al click, sin spinner.
- En éxito (`auth.login` → `auth.me`): `setSession(token, user)` y redirect al deep link guardado o `/oracle`.
- Errores: línea de texto bajo el form, sin toasts ruidosos.

### 2. `/oracle` — The Oracle Workspace
- Layout columna única, header fino con logo, toggle EN/ES y avatar (initials del `full_name`).
- `DialecticThread`: lista virtualizada de mensajes (`user` vs `ai-ceo`). Texto AI en blanco, usuario en blanco con borde amarillo apagado izquierdo.
- `InputSandbox`: textarea autoexpandible, ⌘/Ctrl+Enter envía. Botón `Send` atenuado al disparar.
- Flujo: al primer mensaje crea sesión vía `sessions.createSession()` (Node), guarda `session_id`, luego cada prompt va vía `chat.sendPrompt()` directo a n8n con `session_id` + `prompt` + `language` (n8n inyecta friction/calcification en el system prompt — el cliente nunca los ve).
- "Intervalo" pasivo: si la respuesta tarda > umbral, el thread baja opacidad y aparece cursor pulsante. Nunca texto "Loading".
- Cero indicadores de friction/calcification.

### 3. `/hive` — Hive Matrix (Admin)
- Tabla de operadores con columnas: Operator (`full_name` + `email`), Role, Friction Level, Calcification Level, Linked Brands, Created. (Friction/Calcification visibles solo aquí, por requireAdmin.)
- Drawer `Register Operator` con form: `full_name`, `email`, `password` (se enviará como `password_hash` al backend tras hash; mock acepta plano), `global_role`, `brands` multi-select.
- Acciones por fila: edit role, link brands, deactivate.
- Guard: redirección a `/oracle` si no es admin.

### 4. `/knowledge` — Knowledge Pipeline Hub (Admin)
- Selector de Brand arriba (filtra el grid).
- Zona Drag & Drop grande con borde dasheado `#fae714`.
- Form de metadatos: `title`, `asset_type` (SOP / Dogma / Gold / Jewel), `brand_id`.
- Botón `Process Knowledge` → `knowledge.upload()` (POST /api/knowledge/upload → Node guarda y notifica a n8n).
- `Knowledge Repository Grid`: title, asset_type, vectorization_status (`Pending` con pulso pasivo, `Embedded`, `Error`), source link. Polling cada 5s mientras haya `Pending`.

### 5. `/audit` — The Audit Workspace (Admin)
- Layout split:
  - **Operator & Session Explorer** (izq): búsqueda por operador, lista de `sessions` con `friction_level (max)`, `resolution_status`, `coupling_node_triggered`, `gold_extraction_status`.
  - **Dialectic Thread Read-Only** (centro): re-renderiza `transcript_payload` (JSONB) reutilizando el componente del Oracle.
  - **Session Telemetry Panel** (der): Max Friction, Calcification Delta, Interval Count, Glitch Count, Encauzamiento Count, Coupling Node Triggered, Resolution Status, Gold Extraction Status, Integration Signal At.
- Botón `Approve & Extract Structural Gold` (amarillo sólido) → `sessions.integrateSession(id)` + `knowledge.extractGold(session_id)`.
- `DeepLinkBanner`: si la ruta llega con `?alert=structural_gold`, barra amarilla con ⚠️ "High Probability of Structural Gold Detected!".

## Componentes compartidos (`src/components/`)

`AppShell` (nav lateral oscura solo en `_app`), `BrandLogo`, `LangToggle`, `RoleGuard`, `DeepLinkBanner`, `DialecticThread`, `MessageBubble`, `IntervalIndicator`, `PassivePulse`, `EmptyState`, `BrandSelect`, `AssetTypeBadge`, `VectorStatusBadge`, `TelemetryStat`.

## Tokens y Tailwind

En `src/styles.css` redefino en oklch:
- `--background` = `#1d1d1b`
- `--foreground` = `#FFFFFF`
- `--primary` = `#FFFFFF` (texto/superficies principales)
- `--accent` = `#fae714` (detalles, bordes activos, CTAs críticos)
- `--border`, `--muted`, `--card` en grises cálidos sobre el fondo
- `--glow-accent`: halo amarillo sutil para focos y CTAs
- Tipografía: display **Space Grotesk** + body **Inter** + mono **JetBrains Mono**.

## Detalles técnicos

- **Zustand** con `persist` middleware + `useHydrated()` gate en `_app` para evitar SSR mismatch.
- **TanStack Query** ya en el proyecto; `defaultPreloadStaleTime: 0`.
- **Motion** para atenuaciones simples.
- Todos los fetchs viven en `src/lib/api/*`. Cada función expone shape tipado alineado al schema Prisma para que el backend solo cumpla el contrato.
- Chat usa webhook n8n directo (bypass Node) en cuanto `VITE_N8N_CHAT_WEBHOOK` esté seteado; mientras tanto, mock local.

## Fuera de alcance de este plan

- Auth real, RLS, base de datos en Lovable Cloud.
- Streaming real del LLM (la UI ya soporta el "Intervalo" cuando exista).
- Cálculo de friction/calcification (100% backend + n8n).
- Tests automatizados.

## Orden de implementación al aprobar

1. Tokens + Tailwind + tipografías + AppShell.
2. Zustand (`session`, `deepLink`) + capa API + mocks.
3. `/login` + Deep Link Interceptor.
4. `/oracle` (con mock de n8n y "Intervalo").
5. `/hive`, `/knowledge`, `/audit` con sus guards admin.
