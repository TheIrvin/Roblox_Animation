# 11 — Test Plan

## 1. Filosofía

El proyecto no se valida solo con “compila”.

Cada capa tiene pruebas propias y existe un E2E manual con Roblox Studio.

---

# 2. Unit tests TypeScript

## Math
- quaternion identity;
- normalize;
- inverse;
- multiply;
- slerp;
- Euler conversions;
- transform compose;
- mirror.

## Animation
- keyframe selection;
- exact values;
- lerp;
- slerp;
- easing;
- sparse track evaluation;
- loop.

## Schema
- valid V1;
- missing fields;
- invalid frame;
- duplicate frame;
- invalid rig;
- invalid marker;
- NaN prevention;
- future version.

---

# 3. Store tests

- create project;
- select joint;
- edit;
- Auto Key;
- undo;
- redo;
- copy/paste pose;
- mirror;
- reset;
- dirty flag.

---

# 4. React tests

No intentar testear WebGL pixel a pixel.

Testear:
- controls;
- dialogs;
- validation text;
- timeline actions;
- export status;
- shortcut dispatch.

Viewport complejo se valida con smoke/manual + core tests.

---

# 5. Rust tests

## Files
- read;
- write temp;
- replace;
- error path;
- UTF-8.

## Bridge
- health;
- 204;
- export response;
- ack;
- invalid route;
- payload boundary.

---

# 6. Plugin tests

Si se incorpora framework Luau de tests, mantenerlo simple.

Obligatorio:
- payload validation;
- quaternion conversion;
- rig tree generation.

Manual en Studio:
- permission;
- import;
- Explorer structure;
- Save to Roblox / Publish flow;
- playback.

---

# 7. Transform fixture

`tests/fixtures/transform-fixtures.json` debe contener al menos:

```text
identity
rotate_x_90
rotate_y_90
rotate_z_90
rotate_xyz_combined
root_translate_x
root_translate_y
root_translate_z
```

El resultado desktop y plugin debe coincidir visual/matemáticamente dentro de tolerancia.

---

# 8. ThrowRock R15 fixture

Obligatorio:

```text
Rig: R15
FPS: 30
Duration: 22 frames
Loop: false
Priority: Action
Marker: THROW@16
```

Tracks mínimos:
- UpperTorso;
- RightUpperArm;
- RightLowerArm;
- opcional Head;
- opcional LeftUpperArm / LeftLowerArm para balance;

Para la variante upper-body-only, `HumanoidRootPart`, `LowerTorso` y las piernas deben conservar transforms identity durante toda la secuencia. No basta con que las pistas de piernas sean sparse: `LowerTorso` es ancestro de las piernas en la jerarquía R15.

No obsesionarse con que la animación sea artísticamente perfecta: es fixture funcional.

---

# 9. ThrowRock R6 fixture

Equivalente usando:
- Right Arm;
- Head y Left Arm opcionales para balance.

En esta variante, `HumanoidRootPart`, `Torso` y ambas piernas quedan en identity. R6 comparte un único `Torso` entre brazos y piernas; por tanto, no se anima el torso en ThrowRock cuando el criterio exige mantener las piernas quietas. Ver ADR-009.

Marker:
```text
THROW@16
```

---

# 10. Roundtrip test

Proceso automatizable:

```text
fixture
  -> parse
  -> validate
  -> serialize
  -> parse
  -> semantic deep equal
```

No exigir igualdad textual por formatting.

---

# 11. Manual Studio E2E

Checklist:

```text
[ ] Desktop health OK
[ ] Studio plugin installed
[ ] localhost permission granted
[ ] plugin sees desktop
[ ] latest export fetched
[ ] correct rig type displayed
[ ] KeyframeSequence created
[ ] number/times of keyframes plausible
[ ] Pose hierarchy correct
[ ] THROW marker exists
[ ] Save/Publish succeeds
[ ] Animation ID obtained
[ ] animation plays on target rig
[ ] THROW signal fires
```

---

# 12. Ejemplo script de marker para smoke test

```lua
local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://REPLACE_ME"

local animator = script.Parent:WaitForChild("Humanoid"):WaitForChild("Animator")
local track = animator:LoadAnimation(animation)

track:GetMarkerReachedSignal("THROW"):Connect(function(value)
    print("THROW marker reached", value)
end)

track:Play()
```

Solo para entorno de prueba.

---

# 13. Tolerancias

Quaternion:
```text
1e-5
```

Float general:
```text
1e-5
```

Visual transform E2E:
usar tolerancia razonable y comparar CFrame/angles cuando sea posible.

---

# 14. Regression gate

Antes de marcar cada fase PASSED:

```text
npm run typecheck
npm run lint
npm run test
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

Ajustar paths si Rust se ejecuta desde `src-tauri`.

No saltarse pruebas previas para ahorrar tiempo.
