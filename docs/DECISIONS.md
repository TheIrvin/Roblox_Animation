# Architecture Decision Log

## ADR-001 — Desktop stack

**Status:** Accepted

Use:
- Tauri 2;
- React + TypeScript;
- Three.js through React Three Fiber;
- Rust native layer.

Reason:
small focused desktop app, local filesystem and localhost bridge without embedding a full Chromium runtime as a separate application dependency.

---

## ADR-002 — Project format

**Status:** Accepted

`.rbanim` V1 is plain JSON UTF-8.

No ZIP/container in MVP.

---

## ADR-003 — Internal rotations

**Status:** Accepted

Store quaternion `[x,y,z,w]`.

Euler angles are UI only.

---

## ADR-004 — Roblox publication

**Status:** Accepted

V1 does not authenticate/publish directly from desktop.

Desktop prepares export.
Studio plugin builds `KeyframeSequence`.
User publishes from Roblox Studio.

---

## ADR-005 — Studio communication

**Status:** Accepted

HTTP on `127.0.0.1`, default port 38472.

No continuous polling.

---

## ADR-006 — Supported rigs

**Status:** Accepted

R6 + standard R15 Block in MVP.

No advanced R15/custom avatars in V1.

---

## ADR-007 — Props

**Status:** Accepted

Props such as a stone are not animated as scene objects in V1.

Use animation markers such as `THROW` to synchronize game logic.

## Phase 2 validation note — Standard R6 and R15 rigs

User-provided Roblox Studio Explorer screenshots confirm the standard R6 part set and R15 Block part set; preserved in `docs/handoffs/evidence/`. The displayed body parts are direct children of the `Rig` model, while `parentId` in the editor definitions describes the animation joint graph. Roblox's official `Pose` documentation confirms that pose nesting follows connected joints, and the official `Humanoid` documentation requires R6 `Head` to attach to `Torso` and R15 `Head` to `UpperTorso`. The selected internal parent graph matches `docs/06_RIG_SPECIFICATION.md`. Preview dimensions remain approximate primitives and will be reviewed in the Phase 3 viewport.

---

## ADR-008 — Roblox GLTF preview models

**Status:** Accepted

### Context

The Phase 3 viewport initially used primitive shapes. The user supplied Studio GLTF exports and clarified that `Rig_r15.gltf` is the square R15 model and `Rig_R6_Malla.gltf` is the humanoid R6 model.

### Decision

Use the user-supplied R15 export for R15 and the humanoid R6 Malla export for R6. Keep the internal R6/R15 joint definitions as the editable animation contract; map each imported model's joints onto those definitions. Construct R6 pivots at its Roblox joint locations because its exported parts are siblings. Exclude Studio world coordinates from the preview.

### Consequences

The viewport displays the supplied Roblox meshes in place of its approximate boxes. Root translation starts at the Roblox HumanoidRootPart center (Y = 2 studs); the ground grid is Y = 0. The original `Rig_R6.gltf` remains an unused user file because its block shape does not match the requested humanoid R6 preview.

### Documents/code affected

`public/models/roblox-r6.gltf`, `public/models/roblox-r15.gltf`, and `src/components/viewport/ImportedRobloxRig.tsx`.

## ADR-009 — ThrowRock upper-body isolation on standard rigs

**Status:** Accepted

### Context

The ThrowRock acceptance target is a planted lower body with the throw performed by the upper body. In the standard R15 animation hierarchy, `LowerTorso` is above both `UpperTorso` and the leg chains. A non-identity `LowerTorso` pose therefore propagates movement to the legs even when their own pose channels are identity. Standard R6 has a single `Torso` joint shared by the upper and lower body.

### Decision

- R15 ThrowRock leaves `HumanoidRootPart`, `LowerTorso`, and both leg chains at identity; torso motion starts at `UpperTorso` and includes the head and arms.
- R6 ThrowRock leaves `HumanoidRootPart`, `Torso`, and both legs at identity; it uses head and arm poses. This is the closest safe upper-body-only version on R6's shared torso joint.
- The R6 fixture is not required to imitate the R15 torso wind-up when doing so would move its legs.

### Alternatives

- Rotate `LowerTorso`/`Torso` and counter-animate both legs. Rejected for the MVP because joint rotations alone may not preserve the hip/foot world positions and require Studio visual validation.
- Allow the legs to move during the throw. Rejected because it conflicts with the user's stated acceptance target.

### Consequences

- The R15 sequence has a planted pelvis and an expressive waist-up throw.
- The R6 sequence has reduced torso motion due to its rig hierarchy.
- Any release assets created from the previous full-body fixtures must be replaced and retested before they represent the current samples.

### Documents/code affected

`docs/11_TEST_PLAN.md`, `docs/handoffs/THROW_ANIMATION_RESEARCH.md`, `src/core/export/fixtures/throw-rock-r15.json`, and `src/core/export/fixtures/throw-rock-r6.json`.

---

## ADR template

```markdown
## ADR-XXX — Title

**Status:** Proposed | Accepted | Superseded

### Context

### Decision

### Alternatives

### Consequences

### Documents/code affected
```
