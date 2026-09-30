# ThrowRock — research and animation pass

## Findings

The ThrowRock project used sparse tracks for the torso and throwing arm, but the Studio importer built every pose node with `Weight = 1`. The export protocol intentionally fills untracked joints with identity poses; treating those placeholders as animated channels makes an `Action` sequence claim the root and legs too. The importer now gives weight one only to joints that have project tracks and weight zero to all other nodes in the hierarchy. A second review caught a separate hierarchy issue: animating R15 `LowerTorso` also transforms its leg descendants even when their own channels are identity. The revised fixture therefore leaves both `HumanoidRootPart` and `LowerTorso` unanimated and keeps the pelvis planted.

## Animation design

The revised sample is a 22-frame, 30 FPS one-handed rock throw with keys at frames 0, 5, 9, 13, 16, 19, 21, and 22:

1. Neutral start.
2. Small anticipation and balance pose.
3. Wind-up: upper torso counter-twist, right shoulder lifts back, elbow bends, and the left arm balances. The pelvis stays planted so leg transforms are unaffected by hierarchy inheritance.
4. Acceleration into release; marker `THROW=rock` stays at frame 16.
5. Arm and torso follow through, with the head following slightly later.
6. Recovery to neutral.

R15 animates `UpperTorso`, head, and arm joints. `HumanoidRootPart`, `LowerTorso`, and both leg chains have no project tracks. This keeps the hips/legs still while upper torso motion carries the throw. R6 has one shared `Torso` joint instead of separate waist and hip joints; rotating it would also turn the legs, so the R6 version keeps the torso still and uses only head and arm poses. R6 consequently cannot reproduce the same torso wind-up without moving the legs; that compatibility tradeoff is recorded in ADR-009.

New poses use `CubicV2`. Roblox marks `Cubic` as a legacy alias with a known direction reversal between the Animation Editor and runtime.

## Roblox Creator Hub sources

- [Create character animations](https://create.roblox.com/docs/tutorials/use-case-tutorials/animation/create-an-animation) — pose references, key poses, rig-aware movement, and iterative playback.
- [KeyframeSequence](https://create.roblox.com/docs/reference/engine/classes/KeyframeSequence) — the API example sets root pose weight to 0 and `LowerTorso` to 1.
- [AnimationTrack priority](https://create.roblox.com/docs/reference/engine/classes/AnimationTrack) — higher priority poses win only where animations target the same joint.
- [PoseEasingStyle](https://create.roblox.com/docs/reference/engine/enums/PoseEasingStyle) — `CubicV2` is recommended for new work due to the legacy `Cubic` direction bug.

## Verification status

### Automated

- `npm run verify`: passed — TypeScript, ESLint, 13 Vitest files / 73 tests, Prettier, Rust formatting, Clippy, 7 Rust tests, and production frontend build. Vite emitted its existing non-blocking large-chunk warning.
- `npm run test:plugin`: passed — all 14 Luau tests, including sparse channel weights.
- The R15 evaluator test checks every half-frame from 0.5 to 22 and asserts root, pelvis, and leg local transforms remain identity.
- Export tests check the 22-frame sample, intended joint tracks, identity lower-body poses, and `THROW=rock` at frame 16 for both rigs.

### Roblox Studio playback

- Studio MCP connected to place `79451974722950` in Edit mode. Existing R15 and R6 source rigs were cloned under a temporary test folder; the source rigs were not changed.
- Both normalized sample envelopes were converted into temporary `KeyframeSequence` instances using the same pose-tree, easing, marker, priority, and sparse-weight rules as the plugin builder. Each sequence had 8 keyframes, `Loop=false`, `Priority=Action`, and one marker.
- Temporary preview animation IDs were registered with `KeyframeSequenceProvider`; both sequences played to completion on their matching cloned rigs. Each track length was `0.733333 s`, and each fired `THROW` exactly once with value `rock`.
- During playback, maximum measured world-space position and rotation drift were exactly zero for the R15 root, pelvis, and both leg chains. Upper torso, head, and throwing arm rotated. R6 root, shared torso, and both legs also had zero measured drift; head and arms rotated.
- The temporary clones and sequences were removed after playback. Existing `ServerStorage.RobloxAnimatorImports` entries were left in place.

### Still pending

- The desktop bridge was not running (`127.0.0.1:38472/health` refused the connection), and this environment rejected launching the installed desktop app. Therefore the exact UI path `Prepare Export` → plugin `Import Latest` was not exercised in this session. The plugin builder itself is covered by the 14 passing Luau tests, and Studio playback was performed on sequences created from the normalized sample envelopes.
- Publish the corrected R15/R6 samples and verify their replacement asset IDs. The IDs in Phase 14/15 describe the earlier full-body animation and are stale for this revision.
