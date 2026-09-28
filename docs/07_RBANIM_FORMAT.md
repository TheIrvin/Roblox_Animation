# 07 — Formato `.rbanim` V1

## 1. Decisión

En V1, `.rbanim` es **JSON UTF-8 legible**, no ZIP.

Ventajas:
- simple;
- fácil de depurar;
- versionable;
- sencillo para Claude Code;
- sin dependencia de compresión.

La extensión sigue siendo `.rbanim`.

---

# 2. Schema raíz

Ejemplo:

```json
{
  "schemaVersion": 1,
  "app": {
    "name": "Roblox Animator Desktop",
    "createdWith": "0.1.0"
  },
  "project": {
    "id": "uuid",
    "name": "ThrowRock",
    "rig": "R15",
    "fps": 30,
    "durationFrames": 22,
    "loop": false,
    "priority": "Action"
  },
  "tracks": {},
  "markers": []
}
```

---

# 3. Tipos TypeScript normativos

```ts
type RigType = "R6" | "R15";

type AnimationPriority =
  | "Core"
  | "Idle"
  | "Movement"
  | "Action"
  | "Action2"
  | "Action3"
  | "Action4";

type PoseEasingStyle =
  | "Linear"
  | "Constant"
  | "Elastic"
  | "Cubic"
  | "Bounce"
  | "CubicV2";

type PoseEasingDirection =
  | "In"
  | "Out"
  | "InOut";

type Vec3 = [number, number, number];
type Quat = [number, number, number, number];

interface JointKeyframeV1 {
  frame: number;
  transform: {
    position: Vec3;
    rotation: Quat;
  };
  easing: {
    style: PoseEasingStyle;
    direction: PoseEasingDirection;
  };
}

interface JointTrackV1 {
  jointId: string;
  keyframes: JointKeyframeV1[];
}

interface MarkerV1 {
  id: string;
  frame: number;
  name: string;
  value?: string;
}

interface RbanimProjectV1 {
  schemaVersion: 1;
  app: {
    name: "Roblox Animator Desktop";
    createdWith: string;
  };
  project: {
    id: string;
    name: string;
    rig: RigType;
    fps: number;
    durationFrames: number;
    loop: boolean;
    priority: AnimationPriority;
  };
  tracks: Record<string, JointTrackV1>;
  markers: MarkerV1[];
}
```

---

# 4. Reglas

## DATA-RBA-001
`schemaVersion` obligatorio.

## DATA-RBA-002
Frames son enteros >= 0.

## DATA-RBA-003
`durationFrames >= max(keyframe.frame, marker.frame)`.

## DATA-RBA-004
FPS entero 1–240.

## DATA-RBA-005
Quaternion orden:
```text
[x, y, z, w]
```

## DATA-RBA-006
Quaternion debe estar normalizado al guardar/exportar.

Tolerancia inicial:
```text
abs(length(q) - 1) <= 1e-5
```

Si está cerca, normalizar.
Si es inválido/casi cero, rechazar.

## DATA-RBA-007
No guardar NaN/Infinity.

## DATA-RBA-008
Track keyframes ordenados por frame.

## DATA-RBA-009
Máximo un keyframe por track por frame.

## DATA-RBA-010
IDs de joint deben existir en el rig elegido.

## DATA-RBA-011
Unknown fields pueden ignorarse al leer si no comprometen seguridad/semántica.

## DATA-RBA-012
No mutar el archivo al abrir.

---

# 5. Frame a segundos

Para exportar:

```text
timeSeconds = frame / fps
```

Ejemplo:
```text
frame 15 @ 30 FPS = 0.5 s
```

Roblox `Keyframe.Time` usa segundos.

---

# 6. Sparse tracks

Los tracks son sparse.

Ejemplo:
- frame 0: brazo identity;
- frame 9: atrás;
- frame 16: delante.

No generar automáticamente 17 keyframes en el archivo.

Interpolación ocurre al evaluar.

---

# 7. Markers

Ejemplo:

```json
{
  "id": "a-marker-uuid",
  "frame": 16,
  "name": "THROW",
  "value": "rock"
}
```

`value` es opcional.

En Roblox se mapea a `KeyframeMarker`.

---

# 8. Ejemplo ThrowRock parcial

```json
{
  "schemaVersion": 1,
  "app": {
    "name": "Roblox Animator Desktop",
    "createdWith": "0.1.0"
  },
  "project": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "ThrowRock",
    "rig": "R15",
    "fps": 30,
    "durationFrames": 22,
    "loop": false,
    "priority": "Action"
  },
  "tracks": {
    "RightUpperArm": {
      "jointId": "RightUpperArm",
      "keyframes": [
        {
          "frame": 0,
          "transform": {
            "position": [0, 0, 0],
            "rotation": [0, 0, 0, 1]
          },
          "easing": {
            "style": "Cubic",
            "direction": "Out"
          }
        }
      ]
    }
  },
  "markers": [
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "frame": 16,
      "name": "THROW",
      "value": "rock"
    }
  ]
}
```

No usar los UUID del ejemplo como defaults reales.

---

# 9. Migraciones futuras

`migrate.ts` debe tener estructura preparada:

```text
V1 -> current
V2 -> current
...
```

En V1 no inventar V2.

Si schema > versión conocida:
- no abrir silenciosamente;
- informar “archivo creado con una versión más nueva”.

---

# 10. Export envelope

El bridge no expone el archivo crudo sin contexto.

```ts
interface ExportEnvelopeV1 {
  protocolVersion: 1;
  exportId: string;
  createdAt: string;
  project: RbanimProjectV1;
}
```

El plugin solo soporta `protocolVersion = 1`.

---

# 11. Prioridades Roblox

La UI expone:

```text
Core
Idle
Movement
Action
Action2
Action3
Action4
```

Si durante implementación una prioridad no puede mapearse a la representación elegida en `KeyframeSequence`, conservarla como metadata del export y documentar el comportamiento. No falsificar compatibilidad.
