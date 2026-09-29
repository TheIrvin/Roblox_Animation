# Phase 15 Handoff — R6 End-to-end

## Status
PASSED — Studio import, publication, published-ID playback, movement, marker, and app save/restart/reopen passed.

## Scope completed

- Confirmed the desktop app's saved `ThrowRock` project uses the R6 rig and includes the `THROW` event and keyframes on Torso and Right Arm.
- Imported the R6 `KeyframeSequence` into Studio's Animation Editor on an R6 rig. The timeline showed four keyframes and the event lane.
- Published from Studio's Animation Editor as creator `Yo`; local animation instances were retained.
- Studio confirmed successful upload as `ThrowRock R6`, asset ID `118009092366291` (`https://create.roblox.com/store/asset/118009092366291`).
- Loaded `rbxassetid://118009092366291` on an R6 humanoid rig in Studio Play mode. The track length was `0.733` seconds, the head, arms, and legs moved, and marker `THROW` fired with value `rock`.
- Removed the temporary R6 `AnimSaves` reference and local clips created during the Studio publication flow.
- Saved the desktop project to `%TEMP%\RobloxAnimatorPhase13\ThrowRock-R6.rbanim`, closed the editor, restarted it with `npm run tauri dev`, and reopened the file. The R6 rig, seven-joint tree, keyframes, and `THROW` marker were present after reopening.

## Verification results

- R6 local sequence import: PASSED.
- Studio publication: PASSED — asset `118009092366291`.
- Published-ID R6 playback and movement: PASSED — track length `0.733` seconds.
- Published-ID marker `THROW=rock`: PASSED.
- Desktop app save/restart/reopen workflow: PASSED — the R6 project reopened with its rig, tracks, and marker intact.

## Decisions

- Published asset title: `ThrowRock R6`, to distinguish it from R15 asset `ThrowRock`.
- Creator: `Yo`.
- `Eliminar instancias locales`: off.

## Next action

Continue Phase 16 UX/polish. The final development app restart reports `Bridge: connected`.
