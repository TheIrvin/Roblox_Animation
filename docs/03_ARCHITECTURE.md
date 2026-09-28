# 03 — Arquitectura

## 1. Vista general

```text
┌────────────────────────────────────────────┐
│ Tauri Desktop                              │
│                                            │
│ React UI                                   │
│ ├─ Home                                    │
│ ├─ Viewport                                │
│ ├─ Timeline                                │
│ └─ Inspector                               │
│        │                                   │
│ Zustand Editor Store                       │
│        │                                   │
│ Animation Core (TypeScript puro)           │
│ ├─ rig evaluation                          │
│ ├─ interpolation                           │
│ ├─ quaternion math                         │
│ ├─ mirror                                  │
│ └─ validation                              │
│        │                                   │
│ Tauri commands                             │
│        │                                   │
│ Rust                                       │
│ ├─ filesystem                              │
│ ├─ safe save/open                          │
│ └─ localhost bridge (Axum)                 │
└───────────────────┬────────────────────────┘
                    │ HTTP 127.0.0.1
                    ▼
┌────────────────────────────────────────────┐
│ Roblox Studio Plugin (Luau)                │
│ ├─ toolbar/widget                          │
│ ├─ bridge client                           │
│ ├─ payload validation                      │
│ └─ KeyframeSequence builder                │
└───────────────────┬────────────────────────┘
                    ▼
             Roblox Studio
                    │
                    ▼
              Publish manually
```

---

## 2. Capas

### A. Presentation

Responsable de:
- render React;
- comandos UI;
- dialogs;
- shortcuts;
- viewport/timeline visuals.

No debe contener matemática crítica de animación.

### B. Editor State

Zustand contiene:
- metadata del proyecto;
- rig;
- joints;
- keyframes;
- markers;
- selección;
- frame actual;
- playback;
- undo/redo;
- dirty flag.

### C. Animation Core

TypeScript puro, sin React.

Módulos:
- `rig-types`;
- `transform`;
- `quaternion`;
- `interpolation`;
- `easing`;
- `timeline`;
- `mirror`;
- `project-validation`;
- `export-normalization`.

Debe ser altamente testeado.

### D. Viewport Engine

React Three Fiber / Three.js.

Responsable de:
- geometría visual;
- cámara;
- picking;
- TransformControls;
- aplicación de transforms evaluados.

No es fuente de verdad.

**Fuente de verdad = Editor Store + Animation Core.**

Nunca serializar directamente la escena Three.js como proyecto.

### E. Native layer

Rust/Tauri:
- dialogs de archivo;
- abrir/guardar;
- safe write;
- bridge HTTP;
- logging local técnico;
- paths de app.

No duplicar lógica de interpolación en Rust.

### F. Studio Plugin

Recibe un payload normalizado.

No implementa un editor completo.

Funciones:
1. comprobar conexión;
2. descargar latest export;
3. validar;
4. generar `KeyframeSequence`;
5. insertar en Studio;
6. informar resultado.

---

## 3. Dirección de dependencias

Permitido:

```text
UI -> Store -> Core
Viewport -> Store/Core
Store -> Core
Tauri IPC -> Rust
Plugin -> Bridge protocol
```

No permitido:

```text
Core -> React
Core -> Three.js scene
Rust -> DOM
Plugin -> archivos internos del desktop
```

---

## 4. Modelo de transform

### Principio

Cada joint animado almacena un **delta local relativo a la bind pose**.

```text
finalLocal = bindLocal * deltaLocal
```

No guardar transformaciones world-space como fuente de verdad.

### Representación

```ts
type Vec3 = [number, number, number];
type Quat = [number, number, number, number]; // x,y,z,w

interface Transform {
  position: Vec3;
  rotation: Quat;
}
```

No incluir scale en V1.

### Identity

```text
position = [0,0,0]
rotation = [0,0,0,1]
```

---

## 5. Coordenadas

Espacio canónico del editor:

- +X = derecha;
- +Y = arriba;
- forward visual = -Z;
- 1 unidad = 1 stud conceptual.

Objetivo: minimizar conversiones entre preview y Roblox.

Toda conversión quaternion → Roblox `CFrame` debe estar centralizada en una sola implementación Luau y cubierta por fixtures.

---

## 6. Evaluación de pose

Para un frame `F`:

1. localizar keyframe anterior por joint;
2. localizar siguiente keyframe por joint;
3. si solo hay anterior, usar anterior;
4. si solo hay siguiente y no hay anterior, usar identity antes del primero, salvo decisión documentada;
5. calcular alpha;
6. aplicar easing;
7. posición: lerp;
8. rotación: quaternion slerp;
9. normalizar quaternion;
10. componer jerarquía para viewport.

Nunca interpolar quaternion componente a componente.

---

## 7. Estado y comandos

Las mutaciones del editor deben pasar por comandos semánticos:

```text
SetJointTransform
InsertKeyframe
DeleteKeyframe
MoveKeyframe
SetMarker
DeleteMarker
SetDuration
PastePose
MirrorPose
ResetPose
```

Esto facilita undo/redo.

No modificar objetos anidados del store desde componentes arbitrarios.

---

## 8. Undo/Redo

Patrón recomendado:
- command snapshots pequeños o patches;
- límite 100;
- agrupar drag continuo del gizmo como una única operación final.

Durante un drag:

```text
pointer down -> begin transaction
pointer move -> preview updates
pointer up   -> commit single undo entry
```

Evitar crear cientos de pasos undo por segundo.

---

## 9. Persistencia

Frontend genera un `RbanimProjectV1` validado.

Rust recibe:
- target path;
- JSON.

Rust:
1. valida path;
2. escribe `<name>.tmp`;
3. flush;
4. renombra/reemplaza.

Abrir:
1. leer;
2. parsear JSON;
3. validar schema en frontend/core;
4. solo entonces sustituir proyecto actual.

---

## 10. Bridge

El bridge vive dentro del proceso Tauri.

Bind fijo inicial:

```text
127.0.0.1:38472
```

No usar:
- `0.0.0.0`;
- IP LAN;
- UPnP;
- túneles.

No hacer polling automático.

---

## 11. Export pipeline

```text
Editor Project
    ↓
validateProject()
    ↓
normalizeForExport()
    ↓
ExportEnvelopeV1
    ↓
Rust Bridge memory
    ↓
GET /api/v1/exports/latest
    ↓
Studio Plugin
    ↓
validate payload
    ↓
build KeyframeSequence
    ↓
insert in ServerStorage/Workspace as documented
    ↓
user publishes in Studio
```

---

## 12. Error boundaries

Categorías:

```text
FILE_ERROR
SCHEMA_ERROR
RIG_ERROR
TIMELINE_ERROR
BRIDGE_ERROR
STUDIO_IMPORT_ERROR
UNKNOWN_ERROR
```

UI debe mostrar mensaje humano y mantener logs técnicos separados.

---

## 13. Observabilidad local

V1 puede guardar logs de diagnóstico en AppData.

No incluir:
- contenido de otros archivos;
- credenciales;
- tokens;
- historial Roblox;
- telemetría remota.

Rotación simple:
- máximo 5 archivos;
- máximo aproximado 1 MB cada uno.

---

## 14. Evolución futura

La arquitectura debe permitir después:
- IK;
- avatar custom;
- props;
- FBX;
- Open Cloud;
- CurveAnimation.

Pero ninguna de estas funciones debe implementarse en V1.
