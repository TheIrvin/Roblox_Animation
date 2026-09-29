# Phase 15 Handoff — R6 End-to-end

## Status
IN_PROGRESS — Studio import, publication, published-ID playback, movement, and marker passed; desktop app save/restart/reopen remains unverified.

## Scope completed

- Confirmed the desktop app's saved `ThrowRock` project uses the R6 rig and includes the `THROW` event and keyframes on Torso and Right Arm.
- Imported the R6 `KeyframeSequence` into Studio's Animation Editor on an R6 rig. The timeline showed four keyframes and the event lane.
- Published from Studio's Animation Editor as creator `Yo`; local animation instances were retained.
- Studio confirmed successful upload as `ThrowRock R6`, asset ID `118009092366291` (`https://create.roblox.com/store/asset/118009092366291`).
- Loaded `rbxassetid://118009092366291` on an R6 humanoid rig in Studio Play mode. The track length was `0.733` seconds, the head, arms, and legs moved, and marker `THROW` fired with value `rock`.
- Removed the temporary R6 `AnimSaves` reference and local clips created during the Studio publication flow.

## Verification results

- R6 local sequence import: PASSED.
- Studio publication: PASSED — asset `118009092366291`.
- Published-ID R6 playback and movement: PASSED — track length `0.733` seconds.
- Published-ID marker `THROW=rock`: PASSED.
- Desktop app save/restart/reopen workflow: NOT VERIFIED in this continuation; this remains the Phase 15 gate item.

## Decisions

- Published asset title: `ThrowRock R6`, to distinguish it from R15 asset `ThrowRock`.
- Creator: `Yo`.
- `Eliminar instancias locales`: off.

## Next action

Verify save, restart, and reopen for the R6 desktop app project. Then update this handoff and `AGENT_STATE.md` before starting Phase 16.
