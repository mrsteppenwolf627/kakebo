# Escáner de tickets — Wireflows (Fase 3)

Diseño **PROPUESTO**; nada está implementado. Las pantallas (S1…S15) y las reglas están en [`ux-functional-spec.md`](ux-functional-spec.md). Los textos exactos están en [`ux-copy-es-en.md`](ux-copy-es-en.md). Los marcadores `{…}` son valores PENDIENTES.

Notación: `[Pantalla]` pantalla; `<decisión>` bifurcación; `(servidor)` comprobación en servidor; `~analytics~` requisito de analítica **no sensible**: solo con consentimiento y solo con los parámetros permitidos (`tool_name`, `page_path`, `page_title`, `source`, estado técnico no financiero). Ningún evento lleva importes, comercio, fechas del ticket, categorías, artículos ni estados derivados de datos financieros.

## 1. Flujo principal — Español

```
[Panel / Entrada]  ~scanner_opened~
   │  enlace «Escanear ticket»
   ▼
(servidor) ¿sesión válida?  ── no ──> [Iniciar sesión]
   │ sí
   ▼
(servidor) ¿derecho de acceso al escáner? (jerarquía PENDIENTE; denegar por defecto)
   │
   ├─ no ──> [S1 Inicio, bloqueado: función visible, sin selector]
   │            │  enlace «Ver cómo funciona»
   │            ▼
   │         [S2 Explicación del plan]  ~scanner_blocked_viewed~
   │            │  «Ver planes» → /app/subscription      «Volver» → S1
   │            └─ NUNCA abre selector, cámara ni subida
   │
   └─ sí ──> [S1 Inicio]
                │  <¿cuota diaria disponible?>  (día y consumo PENDIENTES)
                ├─ no ──> [S11 Límite alcanzado]  ~state: quota_reached~
                └─ sí ──> [S3 Elegir origen]  ~source: camera|image|pdf~
                            │
                            ▼
                         [S4 Vista previa del archivo]
                            │  «Cambiar» → S3          «Usar este archivo»
                            ▼
                         <¿conexión?> ── no ──> [S12 Sin conexión] ─ «Reintentar» ─> S4
                            │ sí
                            ▼
                         [S5 Subiendo]  barra real · «Cancelar» → [S14 Descartado]
                            │
                            ▼
                         (servidor) validación: tipo real, tamaño {MAX_SIZE}, páginas {MAX_PAGES},
                                    PDF protegido, integridad
                            │
                            ├─ falla ──> [S6 Error de archivo] ─ «Elegir otro» → S3
                            │                                    «Introducir a mano» → /app/new
                            ▼
                         (servidor) cuota → envío a OCR (proveedor PENDIENTE)
                            ▼
                         [S7 Procesando]  indicador indeterminado · sin tiempo prometido
                            │   «Cancelar» → S14        salir de la pantalla: sigue en servidor
                            ├─ error ──> [S15 Error] ─ «Reintentar» (≤{MAX_RETRIES}) → S7
                            │                          «Introducir a mano» → /app/new
                            ▼
                         [S8 Revisión]  foco: primer campo obligatorio dudoso
                            │  cabecera · artículos · totales · duplicado (aviso) · retención
                            │  «Repartir» → [S8a Repartir artículo] → «Aplicar» → S8
                            │  <¿faltan comercio/fecha/total, categoría, reparto incompleto,
                            │    ciclo cerrado o suma≠total sin resolver?>
                            │       sí → «Confirmar» deshabilitado + motivo enlazado
                            │       no ↓
                            ▼
                         [S9 Confirmación]  «Se crearán N gastos» · retención del original
                            │  «Volver a revisar» → S8
                            │  «Confirmar»
                            ▼
                         (servidor) confirmación idempotente → crea gastos (modelo PENDIENTE)
                            ▼
                         [S10 Hecho]  gastos creados · estado del original (condicionado)
                            │  ~scanner_ticket_confirmed~ (sin importes ni nº de gastos)
                            ▼
                         <¿conservar original?>
                            ├─ no (por defecto) ──> borrado del original (verificado antes de afirmarlo)
                            └─ sí (elección explícita + {RETENTION_OPTIONS}) ──> conservación con vencimiento
```

## 2. Main flow — English

```
[Dashboard / Entry]  ~scanner_opened~
   │  link "Scan receipt"
   ▼
(server) valid session?  ── no ──> [Sign in]
   │ yes
   ▼
(server) access to the scanner? (hierarchy PENDING; deny by default)
   │
   ├─ no ──> [S1 Home, locked: feature visible, no picker]
   │            │  link "See how it works"
   │            ▼
   │         [S2 Plan explainer]  ~scanner_blocked_viewed~
   │            │  "See plans" → /app/subscription      "Back" → S1
   │            └─ NEVER opens a picker, camera or upload
   │
   └─ yes ──> [S1 Home]
                │  <daily quota available?>  (day and consumption PENDING)
                ├─ no ──> [S11 Limit reached]  ~state: quota_reached~
                └─ yes ──> [S3 Choose source]  ~source: camera|image|pdf~
                            │
                            ▼
                         [S4 File preview]
                            │  "Change" → S3          "Use this file"
                            ▼
                         <connection?> ── no ──> [S12 Offline] ─ "Try again" ─> S4
                            │ yes
                            ▼
                         [S5 Uploading]  real progress · "Cancel" → [S14 Discarded]
                            │
                            ▼
                         (server) validation: real type, size {MAX_SIZE}, pages {MAX_PAGES},
                                  password-protected PDF, integrity
                            │
                            ├─ fails ──> [S6 File error] ─ "Choose another" → S3
                            │                              "Enter manually" → /app/new
                            ▼
                         (server) quota → send to OCR (provider PENDING)
                            ▼
                         [S7 Processing]  indeterminate · no time promised
                            │   "Cancel" → S14        leaving the screen: stays on the server
                            ├─ error ──> [S15 Error] ─ "Try again" (≤{MAX_RETRIES}) → S7
                            │                          "Enter manually" → /app/new
                            ▼
                         [S8 Review]  focus: first doubtful required field
                            │  header · items · totals · duplicate (warning) · retention
                            │  "Split" → [S8a Split item] → "Apply" → S8
                            │  <missing merchant/date/total, category, incomplete split,
                            │    closed cycle or items≠total unresolved?>
                            │       yes → "Confirm" disabled + linked reason
                            │       no ↓
                            ▼
                         [S9 Confirmation]  "N expenses will be created" · original retention
                            │  "Back to review" → S8
                            │  "Confirm"
                            ▼
                         (server) idempotent confirmation → creates expenses (model PENDING)
                            ▼
                         [S10 Done]  expenses created · original status (conditioned)
                            │  ~scanner_ticket_confirmed~ (no amounts, no expense count)
                            ▼
                         <keep original?>
                            ├─ no (default) ──> original deleted (verified before claiming it)
                            └─ yes (explicit choice + {RETENTION_OPTIONS}) ──> kept until expiry
```

## 3. Subflujos

### 3.1 Cámara móvil (ES / EN)

```
[S3] «Hacer foto» / "Take photo"
  → control de archivo con captura de cámara (comportamiento en la PWA: NO DEMOSTRADO)
  → <¿el sistema concede cámara?>
       no  → texto «No pudimos abrir la cámara. Elige una imagen.» / "We couldn't open the camera. Choose an image." → [S3]
       sí  → [S4]
```

### 3.2 PDF y multipágina

```
[S3] «Elegir PDF» / "Choose PDF" → [S4] muestra nº de páginas
  → <páginas ≤ {MAX_PAGES}?>  no → [S6] «Demasiadas páginas» / "Too many pages"
  → <¿protegido?>             sí → [S6] «PDF protegido» / "Protected PDF"
Varias fotos de un mismo ticket: fuera del MVP.
```

### 3.3 Duplicado (aviso no destructivo)

```
[S8] aviso «Puede que ya esté registrado» / "This may already be registered"
   ├─ «Descartar» / "Discard" → [S14]
   └─ «Continuar» / "Continue" → sigue en [S8] (aviso descartado en esa sesión)
 Nunca bloquea; nunca borra por sí solo. Sin evento de analítica.
```

### 3.4 Repartir un artículo (S8a)

```
[S8] «Repartir» / "Split" en un artículo
  → [S8a] filas «categoría + importe»; diferencia visible
  → <suma partes = importe del artículo?>
        no → «Aplicar» deshabilitado + diferencia anunciada con texto
        sí → «Aplicar» → [S8] (el artículo muestra «Repartido en N categorías» / "Split into N categories")
  foco al abrir: primera fila; al cerrar: botón «Repartir» que lo abrió
```

### 3.5 Corrección sin sobrescritura

```
[S8] edición manual de un campo → origen = usuario
 reprocesar (si existiera) → no cambia campos editados; ofrece «Ver propuesta nueva» / "See new suggestion"
```

### 3.6 Conservar el original (S9)

```
[S9] casilla NO marcada por defecto «Conservar el original» / "Keep the original"
   marcada → selector {RETENTION_OPTIONS}  (PENDIENTE) y aviso de que se puede borrar cuando quiera (si está implementado)
   sin marcar → el original se elimina tras confirmar (afirmarlo solo cuando esté verificado)
```

### 3.7 Antes y después de confirmar

```
Antes de confirmar: «Volver» conserva · «Descartar ticket» elimina borrador y original → [S14]
Después de confirmar: sin «deshacer» en el MVP · editar/borrar gastos con los flujos existentes
                      (borrar un gasto no recupera el original ya eliminado)
```

### 3.8 Expirado y eliminado

```
[S1] ticket pendiente con plazo vencido → [S13 Caducado] «Súbelo de nuevo» / "Upload it again"
[S14] «Ticket descartado» / "Receipt discarded" → [S1]
```

## 4. Qué NO se instrumenta

Ningún paso del wireflow envía a analítica: importes, comercio, fecha del ticket, categorías, artículos, método de pago, IVA, confianza, duplicado detectado, discrepancia de totales ni conteos de gastos. Sin consentimiento (`src/lib/consent.ts`), ningún evento.

## 5. Puntos abiertos que afectan a los flujos

Jerarquía de entitlement; día y consumo de cuota; límites de archivo y páginas; formatos; modelo de gastos y agrupado; proveedor y privacidad; opciones de retención; umbral de espera larga; nombre de ruta; posición en la navegación (ver `decision-log.md`).
