# 06 — Especificación de Rigs

## 1. Objetivo

La aplicación no depende de un archivo Roblox en tiempo de edición.

R6 y R15 se representan mediante definiciones internas deterministas.

---

# 2. IDs canónicos

Los IDs internos deben ser iguales a los nombres de partes Roblox cuando sea práctico.

No renombrarlos por estética.

---

# 3. R6

Los árboles siguientes describen la jerarquía de joints/poses de animación, no el anidamiento de `Instance.Parent` de Roblox. En los modelos de Rig Builder, las partes del cuerpo aparecen como hijas del modelo `Rig`; los joints conectados definen la jerarquía que usan las poses de animación.

Partes/joints objetivo:

```text
HumanoidRootPart
└─ Torso
   ├─ Head
   ├─ Left Arm
   ├─ Right Arm
   ├─ Left Leg
   └─ Right Leg
```

Partes visuales:
- Head
- Torso
- Left Arm
- Right Arm
- Left Leg
- Right Leg

`HumanoidRootPart` puede ser invisible o semitransparente en viewport.

## 3.1 Mirror pairs

```text
Left Arm  <-> Right Arm
Left Leg  <-> Right Leg
```

Centrales:
```text
HumanoidRootPart
Torso
Head
```

---

# 4. R15

Jerarquía canónica:

```text
HumanoidRootPart
└─ LowerTorso
   ├─ UpperTorso
   │  ├─ Head
   │  ├─ LeftUpperArm
   │  │  └─ LeftLowerArm
   │  │     └─ LeftHand
   │  └─ RightUpperArm
   │     └─ RightLowerArm
   │        └─ RightHand
   │
   ├─ LeftUpperLeg
   │  └─ LeftLowerLeg
   │     └─ LeftFoot
   │
   └─ RightUpperLeg
      └─ RightLowerLeg
         └─ RightFoot
```

## 4.1 Mirror pairs

```text
LeftUpperArm  <-> RightUpperArm
LeftLowerArm  <-> RightLowerArm
LeftHand      <-> RightHand
LeftUpperLeg  <-> RightUpperLeg
LeftLowerLeg  <-> RightLowerLeg
LeftFoot      <-> RightFoot
```

Centrales:
```text
HumanoidRootPart
LowerTorso
UpperTorso
Head
```

---

# 5. Definición de joint

```ts
interface RigJointDefinition {
  id: string;
  parentId: string | null;
  displayName: string;
  side: "center" | "left" | "right";
  editableRotation: boolean;
  editablePosition: boolean;
  bindPosition: [number, number, number];
  bindRotation: [number, number, number, number];
  visual: {
    shape: "box" | "sphere";
    size: [number, number, number];
    offset: [number, number, number];
  };
}
```

---

# 6. Geometría visual

Las mallas de vista previa pueden usar los modelos GLTF proporcionados por el usuario. No descargar modelos externos sin instrucción del usuario. La pose editable siempre se representa con transforms de los joints internos; la malla solo proporciona geometría para el viewport.

La vista usa las exportaciones de Roblox Studio aprobadas en ADR-008 de `DECISIONS.md`: humanoide para R6 y R15 Block para R15. El modelo se centra en el origen de animación y el suelo se sitúa en Y=0.

Objetivo:
- reconocer el cuerpo;
- seleccionar partes;
- animar con claridad;
- carga rápida.

La apariencia de la malla importada puede replicar el rig estándar de Roblox.

La **jerarquía y nombres para exportación sí deben coincidir** con el rig objetivo.

---

# 7. Transform editable

Por defecto:

| Joint | Rotación | Posición |
|---|---:|---:|
| HumanoidRootPart | Sí | Sí |
| Joints corporales | Sí | No |

No permitir stretch/scale.

---

# 8. Joint limits

V1 **no impone límites anatómicos duros**.

Motivo:
- Roblox permite animaciones estilizadas;
- límites prematuros pueden impedir poses válidas.

La UI puede advertir rotaciones extremas en una versión posterior.

---

# 9. Bind pose

Todas las definiciones deben tener:
- bindPosition;
- bindRotation normalizado.

En los modelos de Studio usados por el viewport, el centro de `HumanoidRootPart` está a 2 studs del suelo (`Y = 0`). El bind root se representa como `[0, 2, 0]`; los offsets corporales se miden desde ese pivote.

Los valores geométricos concretos deben validarse visualmente contra rigs estándar de Studio.

Antes de declarar terminada la fase de rigs, Claude debe:

1. generar un R6 estándar en Studio;
2. generar un R15 Block estándar;
3. comparar jerarquía/nombres;
4. registrar cualquier diferencia en `DECISIONS.md`.

---

# 10. Selección

Cuando el usuario hace clic en una mesh visual:

```text
visual part -> associated joint id -> editor selection
```

No almacenar referencias Three.js en `.rbanim`.

---

# 11. Mirror matemático

Mirror se realiza respecto al plano sagital X=0.

Regla conceptual:
- posición X cambia signo;
- left/right intercambian;
- quaternion debe reflejar orientación correctamente.

No implementar mirror copiando Euler con signos “a ojo”.

Debe existir una función matemática única y tests con:
- identidad;
- brazo 45°;
- brazo hacia atrás;
- pose asimétrica completa;
- double mirror = pose original dentro de tolerancia.

---

# 12. Compatibilidad de exportación

El plugin debe construir poses con nombres correspondientes a las partes.

Roblox documenta que las poses de un `KeyframeSequence` se nombran según las `BasePart` y siguen la jerarquía de joints.

Fuente oficial:
https://create.roblox.com/docs/reference/engine/classes/Keyframe
