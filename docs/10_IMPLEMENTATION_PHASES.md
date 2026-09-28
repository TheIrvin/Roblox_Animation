# 10 — Plan de implementación por etapas

**Claude Code debe ejecutar estas fases en orden. Un agente por fase. Nunca en paralelo.**

---

# Fase 0 — Preflight y bootstrap

## Objetivo
Entorno reproducible y app Tauri vacía funcional.

## Crear
- scaffold;
- estructura de carpetas;
- tooling;
- scripts;
- `AGENT_STATE.md`;
- CI local `verify`.

## No crear
- rig real;
- timeline funcional;
- bridge real.

## Tests
- React smoke;
- Rust smoke;
- typecheck;
- lint;
- clippy.

## Gate
`PHASE_0 = PASSED`.

---

# Fase 1 — Core matemático

## Objetivo
Construir transforms independientes de UI.

## Crear
- Vec3;
- quaternion normalize;
- multiply;
- inverse;
- slerp;
- Euler UI conversions;
- transform compose;
- transform identity;
- interpolation;
- easing.

## Tests mínimos
- identity;
- normalization;
- 90° axes;
- slerp midpoint;
- no NaN;
- roundtrip Euler/quaternion con tolerancia.

## Prohibido
No tocar Studio.

## Gate
`PHASE_1 = PASSED`.

---

# Fase 2 — Rig definitions R6/R15

## Objetivo
Definiciones internas estables.

## Crear
- rig types;
- r6 definition;
- r15 definition;
- hierarchy validator;
- mirror pair metadata;
- geometría primitive metadata.

## Visual
Pantalla de debug puede mostrar rigs.

## Tests
- IDs únicos;
- parents existen;
- no cycles;
- root único;
- mirror mapping simétrico;
- bind quaternions válidos.

## Gate
`PHASE_2 = PASSED`.

---

# Fase 3 — Viewport 3D

## Objetivo
Manipular rigs visualmente.

## Crear
- Canvas R3F;
- camera;
- orbit;
- rig renderer;
- picking;
- joint highlight;
- transform gizmo;
- inspector básico.

## Requisito clave
Three.js no es fuente de verdad.

## Tests
- componentes;
- transform command;
- manual smoke.

## Gate
El usuario puede seleccionar y rotar brazos R6/R15 sin errores.

---

# Fase 4 — Store + command system + undo/redo

## Objetivo
Editor state robusto.

## Crear
- Zustand store;
- commands;
- history;
- dirty state;
- selection;
- current frame.

## Tests
- transform + undo;
- redo;
- reset;
- transaction de drag crea un solo undo.

## Gate
`PHASE_4 = PASSED`.

---

# Fase 5 — Timeline y keyframes

## Objetivo
Crear poses temporalmente.

## Crear
- timeline;
- scrubber;
- tracks;
- keyframe add/delete/move;
- Auto Key;
- duration;
- FPS;
- copy/paste keyframe.

## Tests
- insertion;
- sorted frames;
- duplicate frame update policy;
- move collision;
- duration guard.

## Gate
Se puede crear una animación simple de 3 poses.

---

# Fase 6 — Playback + interpolation

## Objetivo
Ver animación correctamente.

## Crear
- evaluator;
- play;
- pause;
- stop;
- loop;
- real time -> frame/time;
- easing;
- quaternion slerp.

## Tests
- exact keyframe values;
- midpoint;
- loop boundary;
- non-loop end;
- multiple independent joint tracks.

## Gate
ThrowRock preliminar se reproduce fluidamente.

---

# Fase 7 — Pose tools

## Objetivo
Acelerar edición.

## Crear
- Copy Pose;
- Paste Pose;
- Copy Joint;
- Paste Joint;
- Mirror Pose;
- Reset Pose;
- Reset Joint.

## Tests
- double mirror ≈ original;
- left/right mapping;
- central joints;
- undo/redo de todas las acciones.

## Gate
R6 y R15 pose tools validados.

---

# Fase 8 — Markers

## Objetivo
Sincronizar acciones del juego.

## Crear
- events lane;
- marker create;
- rename;
- move;
- delete;
- validation.

## Fixture
ThrowRock tiene `THROW @ frame 16`.

## Gate
Guardar/reabrir conserva marker.

---

# Fase 9 — `.rbanim` persistencia

## Objetivo
Proyecto durable.

## Crear
- schema V1;
- validator;
- serializer;
- parser;
- migration entrypoint;
- Rust open/save;
- safe write;
- file dialogs;
- recent optional solo si trivial.

## Tests
- roundtrip;
- invalid JSON;
- unknown rig;
- bad quaternion;
- future schema;
- temp write behavior donde pueda probarse.

## Gate
Crear -> guardar -> cerrar -> abrir -> datos iguales.

---

# Fase 10 — Export normalizer

## Objetivo
Transformar proyecto editable a payload determinista.

## Crear
- validation;
- global export times;
- full-pose evaluation;
- ExportEnvelopeV1;
- export diagnostics.

## Tests
Snapshot/fixtures:
- ThrowRock R15;
- ThrowRock R6.

## Gate
Payload estable y validado sin Studio.

---

# Fase 11 — Local bridge Rust

## Objetivo
Servir export al plugin.

## Crear
- Axum;
- `/health`;
- `/api/v1/exports/latest`;
- ACK;
- in-memory export state;
- 127.0.0.1 only;
- payload size guards;
- UI bridge status.

## Tests
Rust integration tests:
- health;
- no export => 204;
- latest => payload;
- ack;
- wrong ID;
- bind config.

## Gate
curl/PowerShell puede leer export local.

---

# Fase 12 — Studio Plugin shell

## Objetivo
Plugin instalable y conexión.

## Crear
- Rojo project;
- toolbar;
- widget pequeño;
- BridgeClient;
- Settings port;
- health check;
- Import Latest button.

## No crear aún
Conversión completa de poses si shell no está validado.

## Gate manual
Studio concede permiso localhost y plugin muestra `Connected`.

---

# Fase 13 — KeyframeSequence builder

## Objetivo
Crear animación Roblox correcta.

## Crear
- payload validator Luau;
- quaternion->CFrame;
- R6 pose tree;
- R15 pose tree;
- keyframes;
- easing;
- markers;
- loop metadata compatible;
- ServerStorage import folder;
- ACK.

## Tests
Donde Luau unit tests sean viables, cubrir matemática/validator.
Además tests manuales obligatorios en Studio.

## Gate
ThrowRock R15 aparece como `KeyframeSequence`.

---

# Fase 14 — End-to-end R15

Procedimiento:
1. abrir app;
2. crear R15;
3. construir ThrowRock;
4. marker THROW;
5. guardar;
6. reiniciar;
7. abrir;
8. reproducir;
9. Prepare Export;
10. Studio Import Latest;
11. inspeccionar KeyframeSequence;
12. publicar desde Studio;
13. usar ID en rig de prueba;
14. verificar movimiento;
15. verificar marker.

Registrar evidencia en handoff.

Gate:
`R15_E2E = PASSED`.

---

# Fase 15 — End-to-end R6

Repetir proceso equivalente.

Gate:
`R6_E2E = PASSED`.

---

# Fase 16 — UX/polish del MVP

Solo después del E2E.

Corregir:
- mensajes;
- shortcuts;
- layouts;
- focus;
- errores;
- loading;
- dirty state;
- tooltips.

No agregar features fuera de alcance.

---

# Fase 17 — Build/release local

## Crear
- release build Windows;
- artefacto plugin;
- README instalación;
- `CHANGELOG.md`;
- versión `0.1.0`.

## Smoke test
En instalación limpia o perfil razonablemente limpio:
- abrir;
- new;
- animate;
- save;
- reopen;
- export;
- plugin import.

## Gate final
`MVP = PASSED`.
