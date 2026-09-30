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

Frontend playback and export tests assert that R15 root, pelvis, and leg channels remain at identity throughout the sample, R6 exports no torso/root/leg tracks, both rigs export only the intended tracks, and the release marker remains at frame 16. Luau coverage checks that sparse projects produce weight-one animated joints and weight-zero root/limb channels. These are code-level checks; visual playback of this revised choreography and replacement asset publication remain pending a connected Studio session. Previously published IDs in Phase 14/15 describe the earlier full-body versions and must not be treated as evidence for this revision.
