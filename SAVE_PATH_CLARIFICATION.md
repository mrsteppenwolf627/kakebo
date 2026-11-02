# Aclaración: Ruta de Guardado del Valor Normalizado

## ⚠️ CORRECCIÓN DE LA EXPLICACIÓN ANTERIOR

**Anterior (INCORRECTO):**
> "Supabase.insert() API" o "envía a la API"

**Correcto:**
> Insert DIRECTO a Supabase sin pasar por API REST

---

## Flujo Real del Código

```
┌─────────────────────────────────────────────────────────────────┐
│ USER INTERACCIÓN (Browser)                                      │
│ form.startYm = "2026-1"  (capturado en React state)             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ FUNCIÓN: addFixed() [page.tsx lines 175-204]                    │
│                                                                 │
│ 1. Get userId (line 178):                                       │
│    const userId = await getUserId();                            │
│                                                                 │
│ 2. Validate & Normalize (lines 180-186):                        │
│    const v = validateFixedPayload({                             │
│      start_ym: startYm,  ← "2026-1"                             │
│      ...                                                         │
│    });                                                           │
│    ↓                                                             │
│    validateFixedPayload() RETORNA:                               │
│    {                                                             │
│      ok: true,                                                  │
│      data: {                                                    │
│        start_ym: "2026-01"  ← NORMALIZADO!                      │
│        ...                                                      │
│      }                                                           │
│    }                                                             │
│                                                                 │
│ 3. Check validation (line 188):                                 │
│    if (!v.ok) throw new Error(v.message);                       │
│                                                                 │
│ 4. INSERT DIRECTO A SUPABASE (lines 190-194):                   │
│    const { error } = await supabase                             │
│      .from("fixed_expenses")     ← Tabla en Supabase            │
│      .insert({                                                  │
│        user_id: userId,                                         │
│        ...v.data,               ← SPREAD: trae start_ym:"2026-01"
│        active: true                                             │
│      });                                                         │
│                                                                 │
│ 5. Handle result (line 196):                                    │
│    if (error) throw error;                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Desglose: Qué se envía a Supabase

### Payload exacto que se inserta (línea 190-194):

```typescript
await supabase.from("fixed_expenses").insert({
  user_id: "550e8400-e29b-41d4-a716-446655440000",  // UUID del usuario
  name: "PRUEBA FIJO 20261006",
  amount: 30,
  start_ym: "2026-01",           // ← NORMALIZADO (no es "2026-1")
  end_ym: null,
  due_day: 1,
  active: true
})
```

### Cómo llega `start_ym: "2026-01"`:

1. **Usuario escribe:** `startYm = "2026-1"` (en el input HTML)
2. **React state captura:** `setStartYm("2026-1")`
3. **addFixed() pasa a validateFixedPayload():**
   ```typescript
   const v = validateFixedPayload({
     start_ym: startYm,  // "2026-1"
     ...
   });
   ```
4. **validateFixedPayload() hace:**
   ```typescript
   const sYm = args.start_ym.trim();  // "2026-1"
   if (!isYm(sYm)) return { ... };    // Valida ✅
   
   const normalizedStartYm = normalizeYm(sYm);  // "2026-01"
   
   return {
     data: {
       start_ym: normalizedStartYm,  // Retorna "2026-01"
       ...
     }
   };
   ```
5. **addFixed() usa el valor normalizado:**
   ```typescript
   const { error } = await supabase.from("fixed_expenses").insert({
     ...v.data,  // CONTIENE: start_ym: "2026-01"
     active: true
   });
   ```

---

## No hay API REST involucrada

### ✅ Lo que SÍ ocurre:
- Cliente JavaScript (React) en el navegador
- Función `supabase.from()` = cliente oficial de Supabase JS
- Insert directo a la base de datos Supabase
- Autenticación via sesión Supabase (auth token)
- RLS (Row Level Security) protege los datos

### ❌ Lo que NO ocurre:
- No hay endpoint `/api/fixed-expenses` usado aquí
- No hay POST HTTP a un backend intermediario
- No hay verificación adicional en API REST

---

## Relación con Backend API

**NOTA:** En el proyecto existe `/api/fixed-expenses/route.ts`, pero:

```typescript
// src/app/api/fixed-expenses/route.ts
export const POST = withLogging(async (request: NextRequest) => {
  const body = await request.json();
  const input = createFixedExpenseSchema.parse(body);
  // ... inserta via supabase
});
```

**Diferencia:**
- La página `/app/fixed` inserta directamente via `supabase.from()`
- Una aplicación que use `/api/fixed-expenses` iría por REST API
- El fix funciona para ambas rutas (normalizamos antes de enviar)

---

## Resumen: Dónde se normaliza

| Paso | Código | Valor |
|------|--------|-------|
| 1. Input HTML | `<input value={startYm} />` | `"2026-1"` |
| 2. React state | `setStartYm("2026-1")` | `"2026-1"` |
| 3. Validación | `isYm(sYm)` ✅ | `"2026-1"` |
| 4. **Normalización** | `normalizeYm(sYm)` | **`"2026-01"`** ← AQUÍ |
| 5. Retorno | `data: { start_ym: "2026-01" }` | `"2026-01"` |
| 6. Insert directo | `supabase.from(...).insert({ start_ym: "2026-01" })` | `"2026-01"` ✅ |
| 7. BD | `fixed_expenses.start_ym` | `'2026-01'` ✅ |

---

## Código Exacto (Para Referencia)

### validateFixedPayload (líneas 157-159):
```typescript
// Normalize YM format to ensure YYYY-MM (pad month with 0 if needed)
const normalizedStartYm = normalizeYm(sYm);
const normalizedEndYm = eYm ? normalizeYm(eYm) : null;
```

### Retorna (líneas 161-169):
```typescript
return {
  ok: true as const,
  data: {
    name: nm,
    amount: amt,
    start_ym: normalizedStartYm,  // ← Normalizado
    end_ym: normalizedEndYm,      // ← Normalizado
    due_day: dd,
  },
};
```

### Se usa en addFixed() (líneas 190-194):
```typescript
const { error } = await supabase.from("fixed_expenses").insert({
  user_id: userId,
  ...v.data,  // ← TRAE start_ym: "2026-01"
  active: true,
});
```

---

## Conclusión

✅ **El valor se normaliza en validateFixedPayload()** (líneas 157-159)  
✅ **Se envía directo a Supabase** (sin pasar por API REST)  
✅ **La BD siempre recibe YYYY-MM**  
✅ **No se requieren cambios en el API**
