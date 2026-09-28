# 08 — UI/UX Specification

## 1. Objetivo visual

Interfaz compacta, oscura/neutra y funcional.

No dedicar tiempo del MVP a efectos visuales decorativos.

---

# 2. Layout principal

```text
┌──────────────────────────────────────────────────────────────┐
│ File  Edit                  R15            Export to Studio  │
├──────────────┬─────────────────────────────────┬─────────────┤
│ Joints       │                                 │ Inspector   │
│              │         3D VIEWPORT             │             │
│ Root         │                                 │ Rotation    │
│ Torso        │                                 │ X           │
│ Head         │                                 │ Y           │
│ ...          │                                 │ Z           │
│              │                                 │             │
├──────────────┴─────────────────────────────────┴─────────────┤
│ ▶ ■   Frame 16 / 22    Auto Key [x]    30 FPS   Loop [ ]   │
├──────────────────────────────────────────────────────────────┤
│ Events        |────◆────◆────◆────▼ THROW────◆────────────|  │
│ RightArm      |────◆─────────◆────◆───────────────────────|  │
│ Torso         |────◆────◆─────────────────────────────────|  │
└──────────────────────────────────────────────────────────────┘
```

---

# 3. Home

Botones:
- New Animation;
- Open Project;
- Recent Projects (máximo 5; opcional si se implementa sin complejidad).

New Animation dialog:

```text
Name      [Untitled            ]
Rig       [R15 ▼]
FPS       [30  ▼]

[Cancel] [Create]
```

---

# 4. Viewport

## Controles

- Left click part: seleccionar;
- Left drag gizmo: rotar;
- Middle mouse: pan;
- Right mouse: orbit;
- Wheel: zoom;
- F: focus selected;
- Esc: cancelar operación/limpiar selección si procede.

No secuestrar shortcuts del navegador/webview de forma peligrosa.

## Visual selection

Joint seleccionado:
- outline o highlight;
- gizmo visible;
- nombre en Inspector.

No depender solo del color; nombre textual obligatorio.

---

# 5. Inspector

Para joint normal:

```text
RightUpperArm

Rotation
X [ -45.00 ° ]
Y [   0.00 ° ]
Z [  15.00 ° ]

Snap [Off ▼]

[Reset Joint]
```

Para root:

```text
HumanoidRootPart

Position
X [...]
Y [...]
Z [...]

Rotation
X [...]
Y [...]
Z [...]
```

Euler es solo UI.

Al modificar:
```text
Euler UI -> quaternion canonical -> store
```

---

# 6. Timeline

## Escala

Mostrar:
- frames como referencia primaria;
- tiempo secundario cuando sea útil.

Ejemplo:
```text
16f / 0.533s
```

## Tracks

Modo inicial simple:
- Events;
- joints que poseen keyframes;
- selected joint resaltado.

No mostrar 15 tracks vacíos obligatoriamente.

## Keyframe

Representación:
```text
◆
```

Seleccionado:
- estado visual distinto.

## Marker
Representación:
```text
▼ THROW
```

---

# 7. Toolbar playback

```text
|<   ▶/❚❚   ■   >|
```

Mínimo:
- jump to first;
- play/pause;
- stop;
- current frame input.

---

# 8. Auto Key

Toggle visible.

### ON
Editar joint crea/actualiza keyframe.

### OFF
Editar joint cambia preview temporal hasta que el usuario pulse:
```text
+ Keyframe
```

Si esta semántica crea ambigüedad durante implementación, V1 puede simplificarse a Auto Key ON obligatorio, pero solo mediante `DECISIONS.md`. Preferencia: implementar toggle.

---

# 9. Context menu keyframes

- Copy;
- Paste;
- Duplicate;
- Delete;
- Set Easing;
- Move to Current Frame.

---

# 10. Pose actions

Toolbar o menú Edit:

```text
Copy Pose
Paste Pose
Mirror Pose
Reset Pose
```

Shortcuts sugeridos:
- Ctrl+C = copia keyframe/joint según contexto;
- Ctrl+V = pega;
- Ctrl+Z = undo;
- Ctrl+Y / Ctrl+Shift+Z = redo;
- Space = play/pause;
- Delete = borrar selección;
- S = crear keyframe;
- M = crear marker;
- F = focus selected.

Resolver conflictos por contexto.

---

# 11. Export dialog

```text
Export to Roblox Studio

Animation: ThrowRock
Rig:       R15
FPS:       30
Duration:  0.73 s
Markers:   1

Status:
● Ready

[Cancel] [Prepare Export]
```

Después:

```text
Export ready.

Open Roblox Studio and press:
Roblox Animator > Import Latest

Export ID:
abc...

[Close]
```

No afirmar “published” porque V1 no publica.

---

# 12. Errores

Mal:
```text
Error 0x0372
```

Bien:
```text
Could not export animation.

The project contains an invalid rotation in RightUpperArm at frame 16.

[Go to Frame 16] [Close]
```

Logs técnicos pueden contener detalles.

---

# 13. Dirty state

Título:
```text
ThrowRock.rbanim *
```

`*` indica cambios sin guardar.

---

# 14. Rendimiento UI

Durante drag:
- no serializar proyecto;
- no guardar a disco;
- no llamar bridge;
- no generar objetos Roblox;
- actualizar solo estado/viewport requerido.

---

# 15. Responsive

V1 prioriza ventana desktop >= 1100x700.

Debe seguir siendo usable aproximadamente a 900x600, aunque con paneles colapsables si es necesario.

No diseñar para móvil.
