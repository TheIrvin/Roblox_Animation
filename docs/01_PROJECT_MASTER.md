# 01 — PROJECT MASTER

## 1. Nombre de trabajo

**Roblox Animator Desktop**

El nombre puede cambiar comercialmente más adelante. No renombrar paquetes, namespaces o archivos arbitrariamente durante el MVP.

---

## 2. Visión

Crear una herramienta de escritorio enfocada exclusivamente en animación corporal básica para Roblox.

La experiencia deseada es más cercana a un editor tipo Pivot/Stick Animator que a Blender:

- abrir;
- elegir un rig;
- posar;
- crear keyframes;
- reproducir;
- exportar.

La simplicidad tiene prioridad sobre la cantidad de funciones.

---

## 3. Usuario objetivo

Usuario que crea experiencias en Roblox y necesita animaciones como:

- lanzar;
- golpear;
- patear;
- recoger;
- saludar;
- agacharse;
- recargar;
- atacar con espada;
- morir;
- bailar;
- interacciones simples.

No se asume conocimiento de matrices, quaternions, CFrame ni estructura interna de `KeyframeSequence`.

---

## 4. Principios del producto

### P-001 — Animar debe ser directo

Una animación corta debe poder crearse en pocos minutos.

### P-002 — La UI no expone complejidad interna

El usuario manipula un personaje y una timeline. Las conversiones matemáticas ocurren internamente.

### P-003 — Proyecto editable

Exportar a Roblox no destruye el proyecto fuente.

### P-004 — Roblox Studio es el punto final de publicación en V1

La app prepara la animación. Studio controla el login, propietario, grupo y publicación.

### P-005 — Compatibilidad prioritaria

R6 y R15 estándar son obligatorios.

### P-006 — Sin procesos innecesarios

El plugin no debe hacer polling permanente. La importación ocurre cuando el usuario lo solicita.

### P-007 — Local first

Los proyectos se guardan en el equipo. La app no necesita cuenta propia, backend remoto ni telemetría en V1.

---

## 5. Alcance MVP

### Incluido

- proyecto nuevo;
- abrir proyecto;
- guardar;
- guardar como;
- R6;
- R15 Block estándar;
- viewport 3D;
- cámara orbital;
- zoom;
- selección de articulaciones;
- gizmo de rotación;
- movimiento de root cuando corresponda;
- timeline;
- keyframes;
- interpolación;
- reproducción;
- FPS;
- duración;
- loop;
- easing compatible con Roblox;
- copiar pose;
- pegar pose;
- mirror pose;
- reset pose;
- undo;
- redo;
- markers/eventos;
- formato `.rbanim`;
- bridge localhost;
- plugin para Studio;
- conversión a `KeyframeSequence`;
- build Windows.

### No incluido

- Mac/Linux como plataformas soportadas oficialmente;
- avatar personalizado por User ID;
- FBX export;
- GLB import/export para usuario final;
- facial animation;
- IK;
- motion capture;
- constraints avanzados;
- objetos/props animados;
- cámaras;
- escena;
- audio;
- efectos;
- edición gráfica de curves;
- CurveAnimation como formato interno;
- Open Cloud;
- login Roblox;
- colaboración;
- nube;
- autosync constante con Studio.

---

## 6. Restricciones

- App de escritorio local.
- Windows es plataforma objetivo de V1.
- El proyecto debe compilar desde código fuente.
- Ningún proyecto del usuario debe depender de rutas absolutas del equipo del desarrollador.
- `.rbanim` debe ser versionado.
- El bridge solo puede escuchar en loopback.
- La app debe funcionar sin Roblox Studio abierto, excepto al exportar/importar.
- El viewport no debe requerir conexión a Internet.
- Rigs internos deben ser redistribuibles y creados por el proyecto; no copiar assets propietarios de terceros.

---

## 7. Definición funcional del editor

### Pose

Estado local de las articulaciones en un instante.

### Keyframe

Pose parcial o total asociada a un frame/tiempo.

### Timeline

Representación temporal de keyframes y markers.

### Marker

Evento nombrado asociado a un tiempo, por ejemplo:

```text
THROW
HIT
STEP_LEFT
STEP_RIGHT
RELOAD
```

### Playback

Interpolación temporal de las transformaciones guardadas.

---

## 8. Flujo principal

```text
Launch
  ↓
Home
  ↓
New Project
  ↓
R6 / R15
  ↓
Editor
  ├─ Viewport
  ├─ Joints
  └─ Timeline
  ↓
Save
  ↓
Export to Studio
  ↓
Studio Plugin
  ↓
KeyframeSequence
  ↓
Publish to Roblox
```

---

## 9. Ejemplo funcional obligatorio — ThrowRock

Datos mínimos:

```text
name      = ThrowRock
rig       = R15
fps       = 30
loop      = false
priority  = Action
duration  = 22 frames
marker    = THROW @ frame 16
```

No es necesario animar la piedra. El marker indica al código del juego cuándo debe soltarse/lanzarse.

Uso conceptual en Roblox:

```lua
track:GetMarkerReachedSignal("THROW"):Connect(function()
    -- lógica de lanzamiento de la piedra
end)
```

---

## 10. Reglas de cambio

Una decisión congelada solo puede modificarse si:

1. existe un bloqueo técnico real;
2. la alternativa es más simple o más compatible;
3. se registra en `DECISIONS.md`;
4. se explica impacto;
5. se actualizan los documentos afectados;
6. las pruebas continúan pasando.

No cambiar algo simplemente porque un agente prefiere otra biblioteca.
