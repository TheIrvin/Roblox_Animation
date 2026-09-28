# 02 — Software Requirements Specification (SRS)

## 1. Propósito

Definir qué debe hacer Roblox Animator Desktop V1 y cómo se verificará.

Los IDs de requisito son estables. No reutilizar un ID eliminado para otro requisito.

---

# 2. Requisitos funcionales

## 2.1 Proyectos

### FR-PROJ-001 — Crear proyecto
El sistema debe permitir crear un proyecto nuevo.

Entradas:
- nombre;
- rig `R6` o `R15`;
- FPS.

Default:
- nombre `Untitled`;
- R15;
- 30 FPS;
- 1 segundo inicial;
- loop desactivado;
- prioridad `Action`.

Aceptación:
- se abre el editor;
- aparece el rig correcto;
- existe frame 0;
- el proyecto queda marcado como modificado hasta guardar.

### FR-PROJ-002 — Guardar
Debe guardar el estado completo como `.rbanim`.

### FR-PROJ-003 — Abrir
Debe cargar `.rbanim` V1 y reconstruir el editor sin pérdida de datos.

### FR-PROJ-004 — Guardar como
Debe permitir elegir otra ruta.

### FR-PROJ-005 — Cambios sin guardar
Al cerrar/cambiar proyecto con cambios pendientes debe preguntar:
- Guardar;
- No guardar;
- Cancelar.

---

## 2.2 Rigs

### FR-RIG-001 — R6
Debe existir un rig R6 integrado.

### FR-RIG-002 — R15
Debe existir un rig R15 Block integrado.

### FR-RIG-003 — Selección
Clic sobre una parte seleccionable debe seleccionar su joint editable correspondiente.

### FR-RIG-004 — Jerarquía
Las transformaciones de un parent deben afectar visualmente a sus children.

### FR-RIG-005 — Bind pose
Cada rig debe poseer una bind/rest pose determinista.

### FR-RIG-006 — Reset joint
Debe restaurar un joint seleccionado a delta identity.

### FR-RIG-007 — Reset pose
Debe restaurar todos los joints del frame actual a identity.

---

## 2.3 Manipulación

### FR-EDIT-001 — Rotación
El usuario debe poder rotar joints mediante gizmo.

### FR-EDIT-002 — Root movement
`HumanoidRootPart` puede trasladarse y rotarse.

En V1, las partes normales del cuerpo no tienen traslación libre por defecto.

### FR-EDIT-003 — Entrada numérica
El inspector debe permitir editar rotación en grados para el joint seleccionado.

La UI puede mostrar Euler, pero internamente se guarda quaternion.

### FR-EDIT-004 — Snap opcional
Debe existir snap angular:
- Off;
- 1°;
- 5°;
- 15°.

Default: Off.

---

## 2.4 Timeline

### FR-TIME-001 — Scrubber
Debe poder moverse a cualquier frame entre 0 y duración.

### FR-TIME-002 — Keyframe
Debe crear keyframe en el frame actual.

### FR-TIME-003 — Auto-key
V1 debe incluir toggle Auto Key.

Default: activado.

Cuando está activado, modificar un joint crea/actualiza keyframe de ese joint en el frame actual.

### FR-TIME-004 — Eliminar keyframe
Debe poder eliminar keyframes seleccionados.

### FR-TIME-005 — Mover keyframe
Debe poder arrastrar keyframes a otro frame válido.

### FR-TIME-006 — Duplicar
Debe poder copiar y pegar keyframes.

### FR-TIME-007 — Duración
Debe poder modificar la duración en frames o segundos.

Nunca truncar keyframes sin confirmación.

### FR-TIME-008 — FPS
Valores de UI recomendados:
- 24;
- 30;
- 60.

Formato interno admite entero 1–240.

---

## 2.5 Playback

### FR-PLAY-001
Play inicia desde el frame actual.

### FR-PLAY-002
Pause conserva la posición.

### FR-PLAY-003
Stop vuelve al frame 0.

### FR-PLAY-004
Loop reinicia al terminar cuando está activo.

### FR-PLAY-005
La reproducción debe interpolar las poses.

### FR-PLAY-006
La vista previa debe permanecer visualmente consistente con los datos exportados.

---

## 2.6 Easing

### FR-EASE-001
Cada keyframe/joint puede indicar easing.

V1 debe mapear al menos:
- Linear;
- Constant;
- Cubic;
- CubicV2;
- Elastic;
- Bounce.

### FR-EASE-002
Direcciones:
- In;
- Out;
- InOut.

### FR-EASE-003
Default:
- style = Linear;
- direction = Out.

---

## 2.7 Poses

### FR-POSE-001
Copiar pose completa del frame actual.

### FR-POSE-002
Pegar pose en el frame actual.

### FR-POSE-003
Mirror pose.

Reglas:
- izquierda ↔ derecha;
- conservar transformaciones centrales;
- aplicar conversión espacial correcta;
- tests obligatorios para R6 y R15.

### FR-POSE-004
Copiar joint seleccionado.

### FR-POSE-005
Pegar joint seleccionado.

---

## 2.8 Undo/Redo

### FR-UNDO-001
Undo para:
- transformaciones;
- crear/eliminar/mover keyframes;
- markers;
- duración;
- propiedades de animación;
- pegar/mirror/reset.

### FR-UNDO-002
Redo debe restaurar lo deshecho.

### FR-UNDO-003
Máximo inicial recomendado: 100 operaciones.

---

## 2.9 Markers

### FR-MARK-001
Crear marker en frame actual.

### FR-MARK-002
Nombre requerido.

Patrón recomendado:
`[A-Za-z_][A-Za-z0-9_]{0,63}`

### FR-MARK-003
Renombrar.

### FR-MARK-004
Mover.

### FR-MARK-005
Eliminar.

### FR-MARK-006
Exportar a `KeyframeMarker` dentro del `Keyframe` correspondiente.

---

## 2.10 Exportación

### FR-EXP-001
Botón `Export to Roblox Studio`.

### FR-EXP-002
Antes de exportar validar:
- proyecto tiene nombre;
- rig soportado;
- duración > 0;
- tiempos válidos;
- joints conocidos;
- quaternion normalizado o normalizable;
- markers válidos.

### FR-EXP-003
La exportación debe quedar disponible en el bridge local.

### FR-EXP-004
No requiere Studio abierto para preparar el payload.

### FR-EXP-005
El plugin debe importar el último export explícitamente cuando el usuario lo solicita.

### FR-EXP-006
El plugin crea un `KeyframeSequence` con:
- Keyframes;
- Pose hierarchy;
- Pose.CFrame;
- easing;
- markers;
- loop;
- prioridad cuando sea representable.

### FR-EXP-007
El plugin no publica automáticamente en V1.

---

# 3. Requisitos no funcionales

## NFR-001 — Inicio
Objetivo: UI utilizable en <= 3 s en equipo moderno de gama media, salvo primer arranque del WebView.

## NFR-002 — Responsividad
Manipulación del rig debe apuntar a 60 FPS en escena básica.

## NFR-003 — Tamaño de escena
Solo un rig activo en V1.

## NFR-004 — Offline
Crear/editar/guardar debe funcionar sin Internet.

## NFR-005 — Determinismo
Abrir y guardar sin editar no debe alterar transformaciones numéricas más allá de tolerancias documentadas.

## NFR-006 — Seguridad bridge
Escuchar solamente en `127.0.0.1`.

## NFR-007 — No background polling
El plugin no consulta constantemente el bridge.

## NFR-008 — Recoverable errors
Errores de archivos o exportación deben mostrarse sin cerrar la aplicación.

## NFR-009 — Datos
JSON UTF-8.

## NFR-010 — Compatibilidad
Windows 10/11 64-bit como objetivo del MVP.

## NFR-011 — Código
TypeScript con `strict: true`.

## NFR-012 — Rust
No aceptar warnings críticos de Clippy en código propio al cerrar una fase.

## NFR-013 — Testabilidad
La matemática de transforms/interpolación debe estar fuera de componentes React para poder probarla.

## NFR-014 — Accesibilidad mínima
Botones principales con labels/tooltips y shortcuts visibles.

---

# 4. Requisitos de usabilidad

## UX-001
Crear una animación no debe requerir configurar un esqueleto manualmente.

## UX-002
El usuario no debe escribir matrices/quaternions.

## UX-003
La selección 3D debe indicar claramente el joint activo.

## UX-004
Las acciones principales deben tener shortcut.

## UX-005
Exportar debe mostrar un resultado comprensible:
- Ready for Studio;
- Studio bridge unavailable;
- Invalid project;
- Imported by Studio.

---

# 5. Requisitos de integridad

## DATA-001
Todo archivo incluye `schemaVersion`.

## DATA-002
Nunca sobrescribir archivo existente en `Save As` sin confirmación del sistema operativo.

## DATA-003
Guardado debe usar estrategia segura:
1. escribir temporal;
2. flush/cerrar;
3. reemplazo atómico cuando el sistema lo permita.

## DATA-004
Un archivo inválido no debe mutar el proyecto actualmente abierto.

---

# 6. Matriz de trazabilidad resumida

| Caso | Requisitos clave |
|---|---|
| Crear ThrowRock | FR-PROJ-001, FR-RIG-002, FR-EDIT-001, FR-TIME-002 |
| Marker THROW | FR-MARK-001..006 |
| Guardar/reabrir | FR-PROJ-002, FR-PROJ-003, DATA-001..004 |
| Reproducir | FR-PLAY-001..006 |
| Enviar a Studio | FR-EXP-001..007 |
| R6 equivalente | FR-RIG-001 + mismos requisitos de editor |
