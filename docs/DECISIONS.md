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
