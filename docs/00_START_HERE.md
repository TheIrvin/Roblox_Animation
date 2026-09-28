# Roblox Animator Desktop — START HERE

**Documento obligatorio de entrada para Claude Code.**  
**Versión de documentación:** 1.0  
**Objetivo:** construir una aplicación de escritorio local, simple y rápida, para crear animaciones de personajes Roblox R6/R15 mediante poses y keyframes, y transferirlas a Roblox Studio para su publicación.

---

## 1. Regla principal

Antes de escribir código:

1. Lee **todos los archivos `.md` de `/docs` en orden numérico**.
2. Comprueba el estado actual del repositorio.
3. Comprueba `AGENT_STATE.md`.
4. No empieces una etapa si la etapa anterior no figura como `PASSED`.
5. No ejecutes agentes/subagentes en paralelo.
6. No cambies tecnologías, arquitectura, formato `.rbanim`, protocolo del bridge ni alcance del MVP sin documentar primero la razón en `DECISIONS.md`.
7. Prioriza una implementación simple, comprensible y mantenible.
8. No añadas funciones “por si acaso”.

---

## 2. Objetivo de usuario

El usuario debe poder hacer esto:

```text
Abrir Roblox Animator Desktop
        ↓
Nuevo proyecto
        ↓
Elegir R6 o R15
        ↓
Posar el personaje
        ↓
Crear varios keyframes
        ↓
Reproducir la animación
        ↓
Guardar el proyecto
        ↓
Exportar a Roblox Studio
        ↓
Plugin de Studio genera un KeyframeSequence
        ↓
Publicar desde Roblox Studio
        ↓
Obtener Animation ID
```

Ejemplo de referencia obligatorio:

```text
Animación: ThrowRock
Rig: R15
FPS: 30
Loop: false

Frame 0  -> pose neutra
Frame 5  -> torso comienza a girar
Frame 9  -> brazo derecho hacia atrás
Frame 13 -> comienza el lanzamiento
Frame 16 -> brazo hacia delante + marcador THROW
Frame 22 -> recuperación
```

Si esta animación puede crearse, guardarse, reabrirse, reproducirse y transferirse correctamente a Studio, el núcleo del producto funciona.

---

## 3. Qué NO es este proyecto

No construir:

- un Blender reducido;
- un editor de modelos;
- un editor de materiales;
- un editor de texturas;
- un editor de escenarios;
- un sistema de físicas;
- motion capture;
- animación facial;
- edición de ropa;
- cámaras cinematográficas;
- un marketplace;
- autenticación Roblox dentro de la app;
- publicación directa mediante Open Cloud en V1.

---

## 4. Tecnología congelada para V1

La arquitectura inicial es:

```text
Desktop Shell      Tauri 2
Frontend           React + TypeScript
3D                 Three.js mediante React Three Fiber
Helpers 3D         @react-three/drei
Estado UI/editor   Zustand
Build frontend     Vite
Core nativo        Rust
Servidor local     Rust + Tokio + Axum
Formato proyecto   JSON UTF-8 con extensión .rbanim
Plugin Studio      Luau
Plugin build       Rojo, solo como herramienta de desarrollo/build
Pruebas TS         Vitest
Pruebas React      React Testing Library
Pruebas Rust       cargo test
Lint/format TS     ESLint + Prettier
Lint/format Rust   cargo fmt + cargo clippy
```

No sustituir estas tecnologías durante el MVP sin una decisión documentada.

---

## 5. Cómo ejecutar el trabajo

Claude Code actuará como **orquestador**. Cada fase se delega a **un único agente/subagente a la vez**.

Flujo obligatorio:

```text
Orquestador
   ↓
Agente de Fase N
   ↓
Implementa solamente la Fase N
   ↓
Tests + lint + build
   ↓
Handoff escrito
   ↓
Orquestador valida
   ↓
AGENT_STATE = PASSED
   ↓
Siguiente agente
```

Nunca:

```text
Agente 3 ─┐
Agente 4 ─┼─ trabajando simultáneamente  X
Agente 5 ─┘
```

---

## 6. Primer procedimiento de Claude Code

Al recibir el prompt maestro:

### Paso A — Inspección

Ejecuta únicamente comandos de lectura para conocer:

- sistema operativo;
- arquitectura;
- contenido del directorio del proyecto;
- Git;
- Node.js;
- npm;
- Rust;
- Cargo;
- rustup;
- Microsoft C++ Build Tools necesarios para Tauri en Windows;
- WebView2;
- Roblox Studio;
- Rojo.

No instales todavía componentes pesados o con instalador gráfico.

### Paso B — Informe al usuario

Clasifica:

```text
OK
MISSING_AUTO
MISSING_MANUAL
OPTIONAL
```

Para herramientas de CLI seguras que puedan instalarse automáticamente, solicita permiso si la instalación afecta al sistema fuera del repositorio.

Para herramientas que requieren GUI, inicio de sesión, aceptación de licencias o intervención manual, detente y explica exactamente qué debe hacer el usuario.

### Paso C — Gate de entorno

No iniciar la Fase 1 hasta que los requisitos imprescindibles estén disponibles.

### Paso D — Crear `AGENT_STATE.md`

Si no existe, créalo usando el formato especificado en `13_AGENT_PROTOCOL.md`.

### Paso E — Ejecutar fases

Seguir `10_IMPLEMENTATION_PHASES.md` exactamente y de forma secuencial.

---

## 7. Restricciones de seguridad del agente

Claude Code:

- no debe borrar archivos fuera del repositorio;
- no debe ejecutar `git reset --hard` sobre trabajo del usuario;
- no debe limpiar directorios desconocidos;
- no debe sobrescribir configuraciones globales sin permiso;
- no debe almacenar tokens o credenciales en el repositorio;
- no debe exponer el bridge en `0.0.0.0`;
- debe escuchar únicamente en `127.0.0.1`;
- no debe ejecutar código descargado sin revisar qué instala;
- debe preferir gestores oficiales (`rustup`, Node LTS, instaladores/documentación oficial).

---

## 8. Documentos obligatorios

Leer en este orden:

1. `00_START_HERE.md`
2. `01_PROJECT_MASTER.md`
3. `02_SRS.md`
4. `03_ARCHITECTURE.md`
5. `04_ENVIRONMENT_SETUP.md`
6. `05_REPOSITORY_STRUCTURE.md`
7. `06_RIG_SPECIFICATION.md`
8. `07_RBANIM_FORMAT.md`
9. `08_UI_UX_SPECIFICATION.md`
10. `09_STUDIO_BRIDGE.md`
11. `10_IMPLEMENTATION_PHASES.md`
12. `11_TEST_PLAN.md`
13. `12_DEFINITION_OF_DONE.md`
14. `13_AGENT_PROTOCOL.md`
15. `14_CLAUDE_CODE_MASTER_PROMPT.md`
16. `15_ROBLOX_COMPATIBILITY_NOTES.md`
17. `DECISIONS.md`

---

## 9. Fuentes oficiales de Roblox que gobiernan la integración

Estas páginas deben tratarse como referencias externas, no como código para copiar ciegamente:

- Rig Generator: https://create.roblox.com/docs/studio/rig-builder
- Animation Editor: https://create.roblox.com/docs/animation/editor
- Animation events: https://create.roblox.com/docs/animation/events
- Keyframe: https://create.roblox.com/docs/reference/engine/classes/Keyframe
- Pose: https://create.roblox.com/docs/reference/engine/classes/Pose
- PoseEasingStyle: https://create.roblox.com/docs/reference/engine/enums/PoseEasingStyle
- HttpService / Studio plugins / localhost: https://create.roblox.com/docs/cloud-services/http-service

Si Roblox cambia una API, Claude Code debe registrar la desviación en `DECISIONS.md` antes de adaptar la implementación.

---

## 10. Criterio de éxito inmediato

No se considera que el MVP funciona por “abrir una ventana”.

El primer éxito real es:

1. crear `ThrowRock` en R15;
2. guardar;
3. cerrar la app;
4. abrir de nuevo;
5. conservar exactamente los keyframes;
6. reproducir;
7. exportar;
8. importar desde el plugin;
9. obtener un `KeyframeSequence` válido en Studio;
10. publicar la animación desde Studio;
11. probar el marcador `THROW`.

Después repetir el flujo con R6.
