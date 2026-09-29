# Phase 17 Handoff — Windows local release

## Status

PASSED — Windows release artifacts were rebuilt and installed after resolving the blank desktop window. The installed release candidate completed the New → animate → save → reopen → export → Studio import smoke flow. The final no-DevTools build was then installed and its bridge health endpoint returned `status: ok`.

## Blank-window diagnosis and fix

The Tauri WebView started with an empty React root because the configured Content Security Policy blocked the same-origin GLTF model request and the embedded `data:` buffer requests. After those requests were permitted, Drei's `useGLTF` still tried to initialize a Meshopt WebAssembly decoder even though the bundled Roblox rigs are not Meshopt or Draco compressed.

The final source allows `'self'` and `data:` in `connect-src`, and calls `useGLTF` with both optional decoders disabled. Temporary DevTools feature/setup instrumentation used to identify the CSP and WebAssembly errors was removed before producing the final release. The editor and bundled R15 block rig rendered in the installed release candidate after the fix.

## Release artifacts

- App version: `0.1.0`.
- `npm run tauri build` produced Windows x64 MSI (2.64 MiB) and per-user NSIS installer (1.94 MiB).
- `npm run build:plugin` with Rojo 7.7.0 produced `dist/RobloxAnimatorPlugin.rbxm` (12,765 bytes).
- `npm run stage:release` staged the MSI, NSIS installer, and Studio plugin in `dist/`.
- Windows install instructions and release notes are in `README.md` and `CHANGELOG.md`.

## Verification

- `npm run verify`: PASSED — TypeScript, ESLint, 13 Vitest files / 73 tests, Prettier, Rust formatting, Clippy, 7 Rust tests, and production frontend build. Vite reports the known 1.3 MB JavaScript chunk warning.
- `npm run test:plugin`: PASSED — plugin Luau sources parse and all 13 Luau tests pass.
- `npm run build:plugin`: PASSED.
- `npm run tauri build`: PASSED — MSI and NSIS bundles produced from the final no-DevTools configuration.
- `npm run stage:release`: PASSED.
- Per-user NSIS install: PASSED; installed executable reports version `0.1.0` at `%LOCALAPPDATA%\Roblox Animator Desktop`.
- Installed bridge health: `GET http://127.0.0.1:38472/health` returned `{"service":"roblox-animator-bridge","protocolVersion":1,"status":"ok"}`.
- Existing release-candidate UI smoke: created `Release Smoke R15`, added Root keyframes at frames 0 and 10, played/stopped the animation, added marker `THROW` at frame 10, saved a `.rbanim`, created a new project and reopened the saved file, then prepared a two-frame export.
- Studio import: Roblox Animator widget showed `Release Smoke R15 · R15 · 2 keyframes · 1 marker · ACK sent`. Studio DataModel inspection found `ServerStorage.RobloxAnimatorImports.Release Smoke R15` with keyframes `Frame_000000@0` and `Frame_000010@0.333333...`; the second keyframe contains marker `THROW`.
- The final no-DevTools installer was installed and launched. Windows kept its window minimized; the UI helper's activation/recovery attempt did not make the final window capturable. The complete interaction flow above was verified in the immediately preceding installed release candidate, whose frontend/CSP and plugin protocol were identical; the final build only removed temporary DevTools instrumentation. Health was rechecked against the final installed process.

## Notes

- The build emits a non-blocking Vite chunk-size warning (approximately 1.3 MB minified bundle).
- User-provided files `Rig_R6.gltf`, `Rig_R6_Malla.gltf`, and `Rig_r15.gltf` remain untracked and are intentionally excluded from commits.
