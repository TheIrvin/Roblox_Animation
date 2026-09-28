# 09 — Studio Bridge Specification

## 1. Objetivo

Transferir una animación desde la app local a Roblox Studio sin:
- FBX;
- login en la app;
- Open Cloud;
- manipulación manual de `.rbxm` por parte del desktop.

Roblox documenta que plugins de Studio pueden comunicarse con software local mediante `localhost` / `127.0.0.1`.

Referencia:
https://create.roblox.com/docs/cloud-services/http-service

---

# 2. Modelo de interacción

**No polling.**

Flujo:

```text
Desktop: Prepare Export
        ↓
payload queda en memoria
        ↓
Usuario abre Studio
        ↓
Plugin: Import Latest
        ↓
GET localhost
        ↓
Plugin crea KeyframeSequence
        ↓
Plugin ACK al desktop
```

---

# 3. Endpoint base

Default:

```text
http://127.0.0.1:38472
```

No escuchar en interfaces externas.

Si el puerto está ocupado:
- app debe informar claramente;
- V1 puede permitir elegir otro puerto en Settings;
- plugin debe permitir editar el puerto;
- default siempre 38472.

---

# 4. Endpoints

## GET `/health`

Response 200:

```json
{
  "service": "roblox-animator-bridge",
  "protocolVersion": 1,
  "status": "ok"
}
```

---

## GET `/api/v1/exports/latest`

Si no hay export:
- `204 No Content`.

Si existe:

```json
{
  "protocolVersion": 1,
  "exportId": "uuid",
  "createdAt": "2026-09-25T12:00:00Z",
  "project": {}
}
```

---

## POST `/api/v1/exports/{exportId}/ack`

Body:

```json
{
  "status": "imported",
  "message": "KeyframeSequence created",
  "studioPlaceId": null
}
```

Status permitidos:
```text
imported
rejected
error
```

---

# 5. Seguridad

## BR-SEC-001
Bind `127.0.0.1` únicamente.

## BR-SEC-002
No endpoint de filesystem.

## BR-SEC-003
No endpoint que ejecute comandos.

## BR-SEC-004
Body max recomendado: 5 MB.

## BR-SEC-005
Métodos no definidos => 404/405.

## BR-SEC-006
No habilitar CORS amplio.

## BR-SEC-007
No aceptar upload desde Studio hacia rutas arbitrarias.

## BR-SEC-008
Export en memoria puede expirar después de cerrar la app.

---

# 6. Plugin UI

Toolbar:

```text
Roblox Animator
```

Botón:
```text
Import Latest
```

Widget opcional mínimo:
```text
Desktop: Connected
Last import: ThrowRock
Rig: R15

[Import Latest]
[Settings]
```

Settings:
```text
Host: 127.0.0.1  (bloqueado en V1)
Port: 38472
```

---

# 7. Permisos HttpService

El plugin debe manejar el caso donde Studio solicite permiso para comunicarse con localhost.

No intentar eludir el sistema de permisos.

Si denegado:

```text
Roblox Studio blocked localhost access for this plugin.
Enable/allow the plugin HTTP permission and retry.
```

---

# 8. Construcción del KeyframeSequence

Por cada tiempo único usado por:
- cualquier track keyframe;
- cualquier marker;

crear o reutilizar un `Keyframe`.

```text
Keyframe.Time = frame / fps
```

---

# 9. Pose hierarchy

El plugin debe construir la jerarquía de `Pose` que corresponda al rig.

Ejemplo R15 conceptual:

```text
Keyframe
└─ HumanoidRootPart Pose
   └─ LowerTorso Pose
      ├─ UpperTorso Pose
      │  ├─ Head Pose
      │  ├─ LeftUpperArm Pose
      │  │  └─ ...
      │  └─ RightUpperArm Pose
      │     └─ ...
      ├─ LeftUpperLeg Pose
      └─ RightUpperLeg Pose
```

No crear una lista plana si Roblox requiere jerarquía.

Roblox documenta esta estructura:
https://create.roblox.com/docs/reference/engine/classes/Keyframe

---

# 10. Poses en frames sparse

Problema:
el archivo `.rbanim` puede tener keyframes distintos por joint.

Al exportar, cada `Keyframe` Roblox debe representar el estado necesario de forma compatible.

Estrategia V1:
- para cada tiempo global, evaluar la pose completa del rig mediante el mismo algoritmo conceptual del desktop;
- generar poses completas de joints animables en cada keyframe global.

Ventaja:
- export determinista;
- simplifica jerarquía;
- evita ambigüedad entre sparse editor tracks y Roblox.

Optimización de keyframes queda fuera del MVP.

---

# 11. CFrame

`Pose.CFrame` representa el delta local.

El plugin recibe:
```text
position [x,y,z]
rotation [qx,qy,qz,qw]
```

Debe convertir quaternion a `CFrame` mediante una función única y testeada.

No usar Euler durante export.

Crear fixtures con:
- identity;
- X +90°;
- Y +90°;
- Z +90°;
- combinaciones;
- posición root.

---

# 12. Easing

Mapeo:

```text
Linear   -> Enum.PoseEasingStyle.Linear
Constant -> Enum.PoseEasingStyle.Constant
Elastic  -> Enum.PoseEasingStyle.Elastic
Cubic    -> Enum.PoseEasingStyle.Cubic
Bounce   -> Enum.PoseEasingStyle.Bounce
CubicV2  -> Enum.PoseEasingStyle.CubicV2
```

Direction:
```text
In    -> Enum.PoseEasingDirection.In
Out   -> Enum.PoseEasingDirection.Out
InOut -> Enum.PoseEasingDirection.InOut
```

Referencia:
https://create.roblox.com/docs/reference/engine/enums/PoseEasingStyle

---

# 13. Markers

Para cada marker:
1. encontrar/crear keyframe en el mismo tiempo;
2. `Instance.new("KeyframeMarker")`;
3. `Name = marker.name`;
4. si API/properties permiten value string, asignar de forma compatible;
5. parent/add al keyframe.

Roblox permite detectar markers con:

```lua
track:GetMarkerReachedSignal("THROW")
```

Referencias:
- https://create.roblox.com/docs/animation/events
- https://create.roblox.com/docs/reference/engine/classes/AnimationTrack

---

# 14. Lugar de inserción

Preferencia V1:

```text
ServerStorage
└─ RobloxAnimatorImports
   └─ ThrowRock (KeyframeSequence)
```

Después:
- seleccionar el `KeyframeSequence`;
- `Save to Roblox` desde Studio cuando esté disponible.

Si la integración actual de Animation Editor necesita `RBX_ANIMSAVES` para edición/carga, implementar un segundo comando explícito:
```text
Install into selected rig Animation Saves
```

No depender de una estructura interna no documentada sin validación manual.

---

# 15. Validación del rig seleccionado

Para `Import Latest` no es estrictamente necesario modificar el rig.

Sin embargo, el plugin debe ofrecer `Validate Selected Rig`:

R6:
- nombres básicos requeridos.

R15:
- nombres básicos requeridos.

Resultado:
```text
Compatible R15 rig
```
o lista de partes faltantes.

---

# 16. Publicación

V1 termina cuando Studio posee un `KeyframeSequence` correcto.

El usuario publica desde Studio.

La documentación oficial indica que animaciones pueden publicarse desde Studio y obtener un asset ID.

Referencia:
https://create.roblox.com/docs/animation/editor

No automatizar credenciales/publicación en V1.

---

# 17. Nota sobre CurveAnimation

Roblox utiliza `CurveAnimation` en flujos modernos específicos, especialmente Marketplace/emotes.

El MVP de esta aplicación tiene como objetivo **animaciones de juego R6/R15**, usando `KeyframeSequence` como objeto de transferencia.

No afirmar que V1 sirve automáticamente para publicar paquetes/emotes de Marketplace.

Eso sería una función separada futura.
