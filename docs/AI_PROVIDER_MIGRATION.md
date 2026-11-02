# Proveedor de IA del chatbot

El flujo activo del chatbot (`/api/ai/agent-v2/stream`) puede utilizar Anthropic
sin cambiar la lógica de herramientas, confirmaciones ni persistencia. El
adaptador traduce los mensajes y herramientas del formato interno actual al
Messages API de Anthropic y vuelve a entregar al orquestador fragmentos con el
formato que ya utiliza la aplicación.

## Configuración local

En `kakebo/.env.local`, completa estas variables:

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=pega_aqui_la_clave_sin_comillas
ANTHROPIC_MODEL=claude-haiku-5-5
ANTHROPIC_MAX_TOKENS=4096
```

La clave no debe pegarse en Git, en el chat ni en archivos versionados.

`claude-haiku-5-5` es el valor recomendado para el chatbot por coste y
velocidad. Se puede cambiar a `claude-sonnet-5-5` si las pruebas muestran que
el razonamiento adicional compensa el coste.

## Alcance de esta primera migración

- El flujo de conversación en streaming y sus llamadas con herramientas usan
  Anthropic cuando `AI_PROVIDER=anthropic` y existe `ANTHROPIC_API_KEY`.
- Las herramientas siguen ejecutándose en el servidor y las confirmaciones de
  escritura mantienen el mismo flujo de seguridad.
- Las pruebas y el fallback local siguen pudiendo usar OpenAI si no hay clave
  Anthropic disponible.
- La búsqueda semántica vectorial externa se ha sustituido por búsqueda local
  sin coste basada en texto, categoría, fecha e importe. Así no depende de
  OpenAI ni de otra clave de pago; la búsqueda pierde matices semánticos, pero
  sigue disponible y no falla por credenciales.
- Las rutas antiguas que llaman directamente a OpenAI no se activan desde el
  flujo web principal y quedan fuera de esta primera fase.

## Validación antes del despliegue

1. Completar `ANTHROPIC_API_KEY` solo en el `.env.local` local.
2. Ejecutar las pruebas unitarias del adaptador y del orquestador.
3. Probar una conversación sin herramientas y otra que consulte gastos.
4. Probar una operación de escritura y comprobar que sigue pidiendo
   confirmación.
5. Revisar que no aparecen claves en `git diff` y que la respuesta se muestra
   correctamente en streaming.

No se hará commit ni push hasta que esta validación sea aprobada.
