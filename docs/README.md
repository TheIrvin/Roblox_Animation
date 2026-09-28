# Roblox Animator Desktop — Documentation Pack for Claude Code

Este paquete contiene la especificación previa a la implementación de un editor de animaciones local para Roblox R6/R15.

## Uso

1. Crea la carpeta raíz del proyecto.
2. Coloca estos documentos dentro de `docs/`.
3. Puedes mover `AGENT_STATE_TEMPLATE.md` a la raíz como `AGENT_STATE.md` al iniciar.
4. Abre Claude Code en la raíz.
5. Pega el contenido de `14_CLAUDE_CODE_MASTER_PROMPT.md`.
6. Claude Code debe ejecutar primero el preflight y después las fases secuencialmente.

## Archivos clave

- `00_START_HERE.md`: reglas globales.
- `02_SRS.md`: requisitos.
- `03_ARCHITECTURE.md`: arquitectura.
- `07_RBANIM_FORMAT.md`: formato de proyecto.
- `09_STUDIO_BRIDGE.md`: integración con Roblox Studio.
- `10_IMPLEMENTATION_PHASES.md`: orden exacto.
- `13_AGENT_PROTOCOL.md`: trabajo secuencial de agentes.
- `14_CLAUDE_CODE_MASTER_PROMPT.md`: prompt para iniciar Claude Code.

## Alcance

MVP:
- R6;
- R15;
- poses;
- keyframes;
- timeline;
- playback;
- markers;
- `.rbanim`;
- bridge localhost;
- plugin Studio;
- `KeyframeSequence`;
- publicación manual desde Studio.
