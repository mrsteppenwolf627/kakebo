# audit-access-logs.mjs · Auditoría forense de logs de Googlebot

Script reutilizable (`scripts/audit-access-logs.mjs`, Node ≥ 18, sin dependencias). Atajo: `npm run audit:logs -- <log> [opciones]`.

Qué hace, en este orden:

1. **Fase 1 · Googlebot verificado vs. impostor.** Por cada IP con UA `Googlebot` / `Google-InspectionTool`: DNS inverso (PTR en `.googlebot.com` o `.google.com`), DNS directo (la IP debe coincidir) y ASN (AS15169, vía Team Cymru). Genera reglas de bloqueo para Cloudflare, Nginx y Vercel.
2. **Fase 2 · Códigos de estado y redirecciones.** Distribución de códigos sobre tráfico verificado. Si las redirecciones (301/302/307/308) superan el umbral (5 % por defecto): lista de URIs, causa raíz (prefijo `/es/`, barra final, mayúsculas, query, ruta heredada) y escaneo del código fuente.
3. **Fase 3 · Crawl Gap.** `Total URLs publicadas − URLs rastreadas con 200`, más Click Depth, paginación lineal y malla entre páginas hermanas (spoke-a-spoke).
4. **Fase 4 · Latencia y Host Load Limit.** p50/p90/p99 por plantilla, % de peticiones > 1.000 ms, 503, y veredicto heurístico (ALTO/MEDIO/BAJO) con recomendaciones de caché.

## Formatos de entrada

| Formato | Detección | Campos usados |
|---|---|---|
| Nginx combinado (+ `rt=` y `loc=`) | línea que no empieza por `{` | IP, fecha, método, URI, estado, UA, tiempo de respuesta, Location |
| NDJSON de Vercel Log Drain | `proxy.clientIp`, `proxy.userAgent`, `proxy.path`, `proxy.statusCode`, `proxy.timestamp` | sin tiempo de respuesta |
| JSON genérico / Cloudflare Logpush | `ClientIP`, `ClientRequestUserAgent`, `ClientRequestURI`, `EdgeResponseStatus`, `EdgeTimeToFirstByteMs`… | tiempo en ms |

Los nombres de campo de Vercel se han tomado de la documentación del formato; no se han contrastado con un export real (el plan Hobby no ofrece Log Drains).

`log_format` Nginx recomendado:

```
log_format seo '$remote_addr - - [$time_local] "$request" $status $body_bytes_sent '
               '"$http_referer" "$http_user_agent" rt=$request_time loc="$sent_http_location"';
```

## Opciones

| Opción | Efecto |
|---|---|
| `<log>` o `--log` | Archivo de log. Opcional si se usa `--crawled-urls` (solo Fase 3). |
| `--format auto\|nginx\|json` | Formato (auto por defecto). |
| `--sitemap <ruta\|url>` / `--static-dir <dir>` | Inventario canónico para la Fase 3. |
| `--host <url>` | Origen del sitio (def. `https://www.metodokakebo.com`). |
| `--src <dir>` | Código a escanear en la Fase 2 (def. `./src`). |
| `--out <dir>` | Carpeta de salida (def. `./audit-output`). |
| `--days <n>` | Ventana de la Fase 3 (def. 30), contada desde la última línea del log. |
| `--crawl` | Rastrea el sitio en vivo para calcular Click Depth. |
| `--links <graph.json>` | Grafo `{ "/ruta": ["/otra", …] }` precalculado. Los nodos de paginación usan `?page=N`. |
| `--crawled-urls <archivo>` | Lista de URLs rastreadas (una por línea o CSV con la URL en la 1.ª columna). Sin log, ejecuta solo la Fase 3. |
| `--dns-cache <json>` | Caché de DNS/ASN, se lee y se actualiza. |
| `--offline` | Sin red: solo caché y rangos. |
| `--no-asn` | Omite la consulta de ASN. |
| `--google-ranges <json>` | `googlebot.json` oficial: verifica por rango de IP, sin DNS. |
| `--allow-special-crawlers` | Acepta también PTR en `.googleusercontent.com`. |
| `--no-ip` | El log no trae IP: omite la Fase 1; las fases 2-4 usan UA sin verificar y el informe lo avisa. |
| `--time-unit s\|ms` | Fuerza la unidad del tiempo de respuesta. |
| `--slow-ms`, `--redirect-threshold`, `--concurrency` | Umbrales y paralelismo. |

## Salidas

`report.md`, `report.json`, `redirects-301-302.csv`, `crawl-gap-uncrawled.csv`, `crawled-outside-inventory.csv`, `waf-cloudflare.txt`, `waf-nginx.conf`, `waf-vercel.txt` (en modo solo Fase 3: `report-fase3.md/json`).

## Ejemplos

```
# Log completo (Nginx/Cloudflare) con DNS público
node scripts/audit-access-logs.mjs access.log --sitemap https://www.metodokakebo.com/sitemap.xml --crawl --dns-cache .dns-cache.json

# Log sin IP (p. ej. exportación del panel de Vercel)
node scripts/audit-access-logs.mjs export.ndjson --no-ip --sitemap sitemap.xml

# Solo Crawl Gap con URLs de Estadísticas de rastreo de Search Console
node scripts/audit-access-logs.mjs --crawled-urls gsc-html.txt --sitemap sitemap.xml --links graph.json
```

## Reglas de diseño

- **Solo se bloquean impostores definitivos:** PTR inexistente o ajeno a Google, resolución directa que no coincide, o ASN distinto de AS15169. Los fallos o timeouts de DNS quedan como «no concluyentes» y no entran en las reglas.
- **Control de sanidad del DNS:** si el resolvedor no responde a una consulta de control, el script aborta (código 3). Sin ese control, un DNS roto marcaría como impostor a todo Googlebot legítimo.
- **Redirecciones:** Next.js emite 308 (`permanent: true`) y 307 (`permanent: false`); el script cuenta 301, 302, 303, 307 y 308.
- **Crawl Gap:** se calcula con `URLs rastreadas ∩ inventario`; las rastreadas fuera del inventario se informan aparte, igual que las URLs con parámetros.
- **Host Load Limit:** Google no publica el umbral. El 1.000 ms y el 5 % de redirecciones son de la auditoría; el resto de umbrales del veredicto son heurísticos.

## Límites conocidos

- Sin tiempo de respuesta en el log, la Fase 4 sale «NO EVALUABLE».
- El ASN se consulta por DNS (Team Cymru): si falla, la IP se valida sin ASN (se indica en el motivo).
- `--crawl` rastrea solo enlaces `<a href>` del HTML; enlaces generados por JavaScript no se ven.
- Los rastreadores especiales de Google que resuelven en `.googleusercontent.com` requieren `--allow-special-crawlers`.

## Pruebas realizadas

Logs sintéticos (Nginx y NDJSON de Vercel), caché DNS, rangos oficiales (IPv4 e IPv6), modo `--no-ip`, modo solo Fase 3 con datos reales de Search Console, rastreo contra un servidor local y aborto con DNS roto.
