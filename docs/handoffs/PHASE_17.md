# Phase 17 Handoff — Windows local release

## Status
IN_PROGRESS — release artifacts and installation documentation are ready; the installed-app UI smoke flow could not be completed because the Windows UI helper could not restore the minimized app window.

## Release artifacts

- App version is `0.1.0` in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
- `npm run tauri build` produced the Windows x64 MSI (2.64 MiB) and per-user NSIS installer (1.94 MiB).
- `npm run build:plugin` with Rojo 7.7.0 produced `dist/RobloxAnimatorPlugin.rbxm` (12,765 bytes).
- The MSI, NSIS installer, and plugin model are staged in `dist/` for repository download.
- Added `npm run stage:release` to reproducibly copy the versioned installers alongside the plugin after building.
- Added Windows installation and release build instructions to `README.md` and release notes to `CHANGELOG.md`.

## Verification

- `npm run verify`: PASSED — TypeScript, ESLint, 13 Vitest files / 73 tests, Prettier, Rust formatting, Clippy, 7 Rust tests, and frontend build. Vite reports the known 1.3 MB JavaScript chunk warning.
- `npm run build:plugin`: PASSED — Rojo built the plugin model.
- `npm run stage:release`: PASSED — both installers and the plugin are present in `dist/`.
- `npm run test:plugin`: PASSED — plugin Luau sources parse and all 13 Luau tests pass.
- The staged plugin model and `%LOCALAPPDATA%\Roblox\Plugins\RobloxAnimatorPlugin.rbxm` have matching SHA-256 hashes.
- `npm run tauri build`: PASSED — MSI and NSIS packages produced.
- NSIS installer run silently as a per-user install: exit code 0; Windows uninstall registry reports version `0.1.0` and install path `%LOCALAPPDATA%\Roblox Animator Desktop`.
- Installed executable started. The local bridge health endpoint at `127.0.0.1:38472/health` returned `status: ok`.
- Studio import and published asset playback passed in Phases 14 and 15 using the same app/plugin protocol.

## Smoke-test limitation

The installed executable's window appeared minimized to the Windows UI helper. `get_window_state` reported that the window was minimized and required activation; refreshing the returned window and retrying activation returned `user input was detected in this window; call get_window_state before continuing`. The prescribed window-selection recovery did not make the window capturable, so the installed build's New, animate, save, reopen, export, and plugin-import interactions remain unverified.

The development app passed the save/reopen, export, and Studio import flow in Phases 14–16. The final `MVP = PASSED` gate remains open until the interaction flow is confirmed against the installed release.

## Continuation check — 2026-09-28

- The installed executable is still responding from `%LOCALAPPDATA%\Roblox Animator Desktop`; its file and uninstall registration both report version `0.1.0`.
- `/health` continues to return `status: ok`.
- `/api/v1/exports/latest` returned HTTP `204 No Content`, so there is no pending export to import from the installed app.
- Roblox Studio remains connected through its MCP bridge in Edit mode, but that connection does not exercise the required New/animate/save/reopen/export interactions in the installed desktop window.
- The installed-app smoke gate remains open. Do not mark Phase 17 or `MVP = PASSED` until that exact interaction flow and release-export plugin import have been verified.
