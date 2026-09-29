# Phase 12 Handoff

## Status
READY_FOR_REVIEW

## Scope completed

- Added a Rojo plugin project and a Studio toolbar button named Roblox Animator.
- Added a dockable widget with locked host `127.0.0.1`, a persisted port setting (default `38472`), a connection check, and an Import Latest button.
- Added an HTTP bridge client that reports permission/connection failures, checks protocol V1, handles an empty export, and reads latest export metadata without creating a sequence.
- Added a repeatable Windows build command and generated the plugin model with Rojo 7.7.0.
- Installed `RobloxAnimatorPlugin.rbxm` into the detected Roblox Studio plugin folder under `%LOCALAPPDATA%\Roblox\Plugins`.
- Fixed both ModuleScript lookups to resolve under the packaged root Script, rebuilt the plugin, and replaced the installed model.

## Files created

- `studio-plugin/default.project.json`
- `studio-plugin/src/init.server.lua`
- `studio-plugin/src/BridgeClient.lua`
- `studio-plugin/src/UI.lua`
- `scripts/build-plugin.ps1`
- `docs/handoffs/PHASE_12.md`

## Files modified

- `package.json` (added `build:plugin`)
- `.gitignore` (ignored generated plugin build output)
- `AGENT_STATE.md`

## Tests added

- No automated Luau test framework has been added. Rojo successfully parsed and packaged the project; Studio UI/permission behavior remains a manual gate.

## Commands executed

- `cargo install rojo --version ^7`
- `rojo --version` (7.7.0)
- `npm run build:plugin`
- `npm run verify`

## Verification results

- Rojo built `studio-plugin/build/RobloxAnimatorPlugin.rbxm` (3,891 bytes).
- `npm run verify` passed: TypeScript, ESLint, 13 Vitest files / 73 tests, Prettier, Rust formatting, Clippy, Rust tests (7/7), and Vite production build.
- Roblox Studio log confirmed the installed plugin was discovered, then failed at startup with `UI is not a valid member of Plugin "user_RobloxAnimatorPlugin.rbxm"`. The Rojo sourcemap shows `UI` and `BridgeClient` are children of the root Script; the entry script now looks up `UI` beneath itself, and `UI` looks up its sibling `BridgeClient` beneath the root Script.
- `npm run build:plugin` passed after the fix; the rebuilt model is 3,909 bytes and was copied to `%LOCALAPPDATA%\Roblox\Plugins\RobloxAnimatorPlugin.rbxm`.
- Studio must restart to load this replacement. The widget's `Connected` state and localhost permission decision remain unverified, so Phase 12 is not PASSED.

## Known limitations

- Import Latest currently fetches and validates the envelope and displays its project/rig/frame summary. Phase 13 will construct the `KeyframeSequence` and send ACK.
- Roblox Studio's first localhost request requires a user permission decision.

## Decisions made

- The plugin keeps `127.0.0.1` fixed and lets the user change only the port, matching the bridge specification.
- It does not poll. Health and Import Latest requests run on explicit user action or once when the widget starts.

## Risks for next phase

- Do not begin Phase 13 until Studio shows the plugin and a successful `Connected` state after the user approves localhost access.

## Suggested next action

Restart Roblox Studio, open the Roblox Animator toolbar widget, and approve its localhost access request. Confirm the widget reports `Connected`; then Phase 12 can be marked PASSED and Phase 13 can begin.
