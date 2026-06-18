# Verificación de checkout antes de auditar (Codex / agentes externos)

**Última actualización:** 2026-06-18
**Tipo:** Documentación operativa (no afecta a código, contenido ni SEO)

---

## Repo activo correcto

El único repositorio válido y sincronizado con GitHub es:

```
C:\Users\a.alarcon\Desktop\Cursor projects\kakebo
```

- Remoto: `https://github.com/mrsteppenwolf627/kakebo.git`
- Rama operativa: `main`

> El directorio `kakebo - copia\kakebo` es un **checkout obsoleto** que NO debe usarse.

---

## Incidente registrado — Codex auditó un checkout obsoleto (2026-06-18)

Durante la revisión de **SEO-2.3A**, Codex auditó accidentalmente el checkout antiguo
`kakebo - copia\kakebo`, que estaba **19 commits por detrás** de `origin/main` y/o **sin las
dependencias completas instaladas** (`npm install` no ejecutado).

A consecuencia de ello, Codex reportó conclusiones **falsas**:

| Afirmación de Codex | Realidad en `origin/main` (`93205d0`) |
|---|---|
| Build falla por `Cannot find module 'next-intl/plugin'` | Build limpia — `npm run build` termina con exit 0, `Compiled successfully`, 29/29 páginas |
| `related:` solo en 2 artículos | **14/14** archivos `.es.mdx` tienen `related:` |
| No ve claramente el commit SEO-2.3A | `93205d0` es HEAD y está en `origin/main` |

**Conclusión:** las observaciones de Codex sobre build, `related:` y SEO-2.3A **no son válidas**,
porque proceden de un checkout desactualizado y sin dependencias completas. SEO-2.3A está
correctamente completado y pusheado a `origin/main`.

---

## Protocolo obligatorio antes de auditar con Codex (o cualquier agente externo)

Antes de emitir cualquier conclusión sobre el estado del proyecto, el agente **debe** verificar:

1. **Ruta del repo activo** — confirmar que se está trabajando en
   `C:\Users\a.alarcon\Desktop\Cursor projects\kakebo` y **no** en `kakebo - copia\kakebo`.
2. **`git status`** — rama, limpieza del árbol de trabajo, archivos sin seguimiento.
3. **`git branch -vv`** — confirmar que `main` apunta a `[origin/main]` sin desfase.
4. **`git rev-list --left-right --count origin/main...HEAD`** — debe ser `0  0`
   (sin divergencia respecto al remoto).
5. **Presencia del commit esperado** — `git cat-file -t <sha>` / `git log --oneline -1 <sha>`
   para confirmar que el commit a auditar existe en el checkout.
6. **Dependencias disponibles** — si el agente va a ejecutar la build, confirmar que `npm install`
   se ha ejecutado y `node_modules/` está completo. Un `Cannot find module 'next-intl/plugin'`
   indica dependencias ausentes, **no** un fallo real de la build.

Si cualquiera de estas comprobaciones falla, las conclusiones de la auditoría **no son fiables**
hasta corregir el checkout.
