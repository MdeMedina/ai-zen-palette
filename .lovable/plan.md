## Cambios funcionales por workspace

### 1. Oracle (`/_app/oracle`)
- Quitar el selector de brand del header. El backend/agente infiere el producto desde el prompt; el cliente ya no lo envía.
- Layout en 2 columnas: **sidebar permanente** (260px) + hilo dialéctico.
- Sidebar de sesiones del usuario actual:
  - Lista ordenada por `updated_at` desc, agrupada por estado (`Active`, `Closed`, `Encauzada`).
  - Cada item muestra título, fecha relativa y badge de estado (puntito amarillo = activa, gris = cerrada, ✓ amarillo = encauzada).
  - Click en sesión activa → carga transcript y permite seguir conversando.
  - Click en sesión cerrada/encauzada → carga read-only + botón **"Abrir"** que hace `POST /api/sessions/:id/reopen` (mock: cambia status a `Active`) y la vuelve editable.
  - Botón "+ Nueva conversación" arriba.
- `chatApi.sendPrompt` deja de recibir `brand_id`.
- `sessions.ts` añade: `listMySessions(userId)`, `reopenSession(id)`, `getSession(id)` (con transcript).

### 2. Hive Matrix (`/_app/hive`)
- Tabla de operadores con acciones por fila: **Edit** y **Delete** (icon buttons).
- Modal `EditUserDialog` (Radix dialog) con form:
  - `full_name` (text)
  - `email` (email)
  - `global_role` (select: admin / operator)
  - `brand_access` (multi-select de brands disponibles → array de brand_ids)
  - Friction/Calcification se muestran read-only (calculados por backend).
- Modal `DeleteUserDialog` con confirmación (escribir email para confirmar).
- `users.ts` añade: `updateUser(id, patch)`, `deleteUser(id)`, `listUserBrandAccess(id)`.
- `SessionUser` y mocks ganan campo `brand_access: UUID[]`.

### 3. Knowledge Pipeline (`/_app/knowledge`)
- **Asset types** del upload reducidos a `SOP | Dogma`. Tipo `Gold`/`Jewel` se quitan de `TYPES` (siguen existiendo en el type union porque el Audit los crea).
- **CRUD de Brands** (admin only): nuevo panel arriba del form de upload o tab dedicado.
  - Lista de brands con inline edit del nombre + delete.
  - Botón "+ New Brand" → dialog con `name`, `slug`, `description`.
  - `brands.ts` añade: `createBrand`, `updateBrand`, `deleteBrand`.
- **Repository** (panel derecho):
  - Input de búsqueda (filtro client-side por `title`, `asset_type`, debounced 200ms).
  - Columna nueva **Actions** con botón `Download` → llama `knowledgeApi.downloadAsset(id)` que en mock abre `source_file_url` en nueva pestaña; en real hace `GET /api/knowledge/:id/download` y descarga el blob.

### 4. Audit Workspace (`/_app/audit`)
Reestructura jerárquica **Usuario → Sesión**:

- Layout en 3 columnas:
  - **Col 1 (260px)**: lista de operadores (`listOperators`). Click selecciona usuario.
  - **Col 2 (flex)**: cambia según selección:
    - Si solo hay usuario seleccionado → **Dashboard de Usuario**:
      - `max_friction` agregado (max sobre todas sus sesiones) mostrado como número 0.0–10.0 grande.
      - `diagnostic` (texto + score del backend vía `usersApi.getOperatorDiagnostic(userId)` → `{ text, score, encauzamiento_count, glitch_count, coupling_node_count }`).
      - Grid de glitches: cada glitch es una card con texto + score numérico; si `score >= 5` muestra `CheckCircle` verde, si `< 5` muestra `AlertTriangle` amarillo.
      - Lista de sesiones del usuario (tabla compacta con título, fecha, friction, status, encauzada sí/no). Click → entra al modo sesión.
    - Si hay sesión seleccionada → **Dialectic Thread read-only** + breadcrumb "← Volver al usuario".
  - **Col 3 (320px)**: Telemetry de la sesión seleccionada (solo en modo sesión).
- Botón **Approve & Extract Structural Gold** SOLO visible si `selected.encauzamiento_count > 0` Y `selected.gold_extraction_status !== 'Extracted'`. Una sesión se encauza una sola vez → tras `integrateSession` el botón desaparece.
- Deep link `?session=...` ahora también resuelve el `user_id` para abrir la vista correcta.
- `users.ts` añade `getOperatorDiagnostic(userId)` (mock retorna texto fijo + score derivado de las sesiones).
- Mocks: añadir campo `glitches: { text: string; score: number }[]` a `SessionRecord` y agregarlo por usuario en el diagnostic.

## Cambios en API/types (resumen)

```text
types.ts
  + brand_access?: UUID[]   en SessionUser y UserRecord
  + glitches: Glitch[]       en SessionRecord
  + Glitch { text, score }
  + OperatorDiagnostic { text, score, encauzamiento_count, glitch_count, coupling_node_count, max_friction }
  - brand_id requerido en ChatSendInput

sessions.ts  + listMySessions, getSession, reopenSession
users.ts     + updateUser, deleteUser, getOperatorDiagnostic, listUserBrandAccess
brands.ts    + createBrand, updateBrand, deleteBrand
knowledge.ts + downloadAsset
chat.ts      − brand_id del payload
```

Todos los nuevos métodos siguen el patrón existente: rama `USE_MOCKS` con `delay()` y mutación de los arrays de `mocks/data.ts`, y fetch real apuntando a la ruta REST equivalente. Listo para conectar al backend cambiando `VITE_API_BASE_URL`.

## Archivos a tocar

- `src/lib/api/types.ts`, `chat.ts`, `sessions.ts`, `users.ts`, `brands.ts`, `knowledge.ts`, `mocks/data.ts`
- `src/routes/_app.oracle.tsx` (+ nuevo `SessionSidebar.tsx`)
- `src/routes/_app.hive.tsx` (+ `EditUserDialog.tsx`, `DeleteUserDialog.tsx`)
- `src/routes/_app.knowledge.tsx` (+ `BrandsManager.tsx`)
- `src/routes/_app.audit.tsx` (+ `UserDashboard.tsx`, `GlitchCard.tsx`)
- `src/stores/session.ts` (añadir `brand_access` al `SessionUser`)

## Fuera de alcance

- Lógica real de cálculo de friction/calcification/diagnostic (100% backend).
- Permisos granulares por brand en server (solo se persiste el array en el cliente y se envía al PATCH).
- Paginación real del repository/sesiones (filtro client-side es suficiente para el shell).
