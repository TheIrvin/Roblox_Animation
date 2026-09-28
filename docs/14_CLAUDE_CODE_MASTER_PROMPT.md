# 14 — Prompt maestro para Claude Code

Copia este contenido al iniciar la construcción en Claude Code.

---

## PROMPT

Vas a construir localmente el proyecto **Roblox Animator Desktop** contenido en este repositorio.

Tu función principal será actuar como **ORQUESTADOR**. Debes utilizar agentes/subagentes de forma **SECUENCIAL**, nunca paralela.

### REGLAS ABSOLUTAS

1. Antes de programar, lee todos los archivos Markdown de `docs/` en orden numérico.
2. Trata `docs/00_START_HERE.md` y `docs/01_PROJECT_MASTER.md` como reglas globales.
3. Sigue `docs/10_IMPLEMENTATION_PHASES.md` estrictamente.
4. Sigue `docs/13_AGENT_PROTOCOL.md`.
5. No ejecutes dos agentes de implementación al mismo tiempo.
6. No avances de fase si la anterior no está validada.
7. No cambies el stack tecnológico sin registrar una decisión en `docs/DECISIONS.md`.
8. No añadas funciones fuera del MVP.
9. No borres ni sobrescribas trabajo del usuario fuera del repositorio.
10. No hagas push a repositorios remotos sin instrucción explícita.
11. No guardes secretos, tokens ni credenciales.
12. El servidor bridge debe escuchar únicamente en `127.0.0.1`.
13. El plugin no debe hacer polling continuo.
14. La publicación final de animaciones se hace manualmente desde Roblox Studio en V1.

### PRIMERA TAREA: PREFLIGHT

No escribas código todavía.

Comprueba:
- sistema operativo y arquitectura;
- Git;
- Node.js y npm;
- Rust/Cargo/rustup;
- requisitos de Tauri 2 en Windows;
- Microsoft C++ Build Tools y Windows SDK;
- WebView2;
- Roblox Studio;
- Rojo;
- contenido actual del repositorio.

Presenta un informe:

```text
COMPONENT | STATUS | VERSION | ACTION
```

Estados:
```text
OK
MISSING_AUTO
MISSING_MANUAL
OPTIONAL
```

Si falta una herramienta CLI que pueda instalarse de forma segura pero afecta al sistema, explícame lo que instalarás y solicita autorización.

Si falta algo que requiere interfaz gráfica, licencia, login o intervención manual, indícame paso por paso qué debo hacer y detente en ese punto hasta que confirme que terminé.

No simules que una dependencia existe.

### DESPUÉS DEL PREFLIGHT

Crea o actualiza `AGENT_STATE.md`.

Empieza por la Fase 0.

Para cada fase:

1. marca `IN_PROGRESS`;
2. crea un único subagente con el alcance de esa fase;
3. exige que lea la documentación pertinente;
4. deja que implemente;
5. exige tests;
6. exige handoff;
7. cuando termine, inspecciona el diff tú mismo;
8. ejecuta verificaciones;
9. si falla, repara la MISMA fase;
10. solo si todo pasa, marca `PASSED`;
11. haz un commit local de fase si Git está disponible y el árbol previo no contiene cambios del usuario que no deban mezclarse;
12. continúa a la siguiente fase.

### OBJETIVO FUNCIONAL

La aplicación debe permitir:

```text
New Project
→ R6/R15
→ pose character
→ keyframes
→ playback
→ marker
→ save .rbanim
→ reopen
→ Prepare Export
→ Roblox Studio plugin Import Latest
→ KeyframeSequence
→ Publish in Studio
```

### PRUEBA DE REFERENCIA

Debes construir y conservar fixtures E2E:

```text
ThrowRock R15
ThrowRock R6
```

Configuración:

```text
FPS: 30
Loop: false
Priority: Action
Duration: 22 frames
Marker: THROW at frame 16
```

El MVP no se considera terminado hasta que ambos flujos puedan publicarse y reproducirse correctamente en Roblox Studio y el marker `THROW` sea detectable.

### TECNOLOGÍA

No reemplazar:

```text
Tauri 2
React
TypeScript
Vite
Three.js / React Three Fiber
@react-three/drei
Zustand
Rust
Tokio
Axum
Luau
Rojo
Vitest
React Testing Library
```

Puedes ajustar versiones a las últimas estables compatibles al momento de instalar, pero registra las versiones finales en el README/lockfiles.

### SIMPLICIDAD

No implementes:
- Blender-like modeling;
- materiales;
- texturas;
- escenarios;
- IK;
- motion capture;
- facial animation;
- avatar custom;
- cloud sync;
- cuentas;
- Open Cloud publishing;
- telemetry;
- FBX export;
- props;
- cámaras.

Si crees que una de esas funciones es imprescindible, NO la implementes directamente. Registra el motivo y pregúntame.

### CUANDO ENCUENTRES UNA AMBIGÜEDAD

Primero busca la respuesta en la documentación del repositorio.

Si se trata de una API de Roblox/Tauri/otra dependencia que puede haber cambiado, consulta la documentación oficial actual antes de modificar el diseño.

Si todavía existen dos caminos razonables:
- elige el más simple y compatible;
- registra la decisión;
- evita bloquearte salvo que cambie el comportamiento visible o el alcance.

### FINAL

Cuando todas las fases estén `PASSED`:
- ejecuta el suite completo;
- crea build release de Windows;
- genera el plugin;
- realiza smoke test;
- genera `RELEASE_NOTES_0.1.0.md`;
- actualiza README;
- muestra exactamente dónde quedaron los artefactos.

No declares éxito si solo compila. Debe completarse el E2E R6 y R15.
