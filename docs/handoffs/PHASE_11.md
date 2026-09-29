# Phase 11 Handoff

## Status
PASSED

## Scope completed

- Added an Axum bridge that binds only to `127.0.0.1:38472` and runs on a dedicated Tokio thread so the Tauri UI remains responsive.
- Added `GET /health`, `GET /api/v1/exports/latest` (`204` when empty), and `POST /api/v1/exports/{exportId}/ack` with supported status, message-size, and export-ID validation.
- Added in-memory `Prepare Export` storage with ExportEnvelopeV1 validation and a 5 MB payload guard.
- Added Tauri commands for preparing an export and reading bridge startup/connection/ACK status.
- Added UI bridge status, a Prepare Export action, and protection against exporting preview-only unkeyed pose edits.
- Added no-CORS route behavior, 16 KB ACK body limit, and default 404/405 handling for unsupported paths/methods.

## Files created

- `docs/handoffs/PHASE_11.md`

## Files modified

- `src-tauri/src/lib.rs`
- `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`
- `src/App.tsx`, `src/App.css`, `src/App.test.tsx`
- `AGENT_STATE.md`

## Tests added

- Rust route tests cover health, empty/latest export, successful ACK, wrong export ID, invalid ACK, unknown route, unsupported method, and oversized ACK body.
- Payload validation tests cover protocol/schema checks, size guard, and loopback bind address.
- A real loopback TCP smoke test reads `/health` and `/api/v1/exports/latest` from an Axum server.
- React smoke asserts the bridge status and Prepare Export control are present; export remains disabled outside the Tauri desktop runtime.

## Commands executed

- `cargo add axum@0.8 --manifest-path src-tauri/Cargo.toml`
- `cargo add tokio@1 --features rt-multi-thread,net,sync,macros --manifest-path src-tauri/Cargo.toml`
- `cargo add tower@0.5 --features util --dev --manifest-path src-tauri/Cargo.toml`
- `npm run verify`

## Verification results

- `npm run verify` passed: TypeScript, ESLint, 13 Vitest files / 73 tests, Prettier, Rust formatting, Clippy, Rust tests (7/7), and Vite production build.
- The loopback smoke used a real TCP socket; full Tauri desktop launch and Roblox Studio permission flow remain for manual validation.
- The Vite large-chunk advisory and localized Windows linker warning remain.

## Known limitations

- The bridge uses the required default port only. If another process owns `38472`, the UI reports the bind error and keeps Prepare Export disabled; port settings are deferred.
- Export state and ACK state live in memory and expire when the desktop app closes.

## Decisions made

- ACK for an ID other than the latest export returns 404; accepted ACKs are retained in bridge status for the UI.
- CORS is not enabled because Roblox Studio's plugin communicates directly with the loopback service.

## Risks for next phase

- Studio's localhost permission prompt and actual plugin connection require Roblox Studio installed and a manual approval by the user.

## Suggested next action

Review Phase 11 and mark it PASSED, then build the Rojo plugin shell in Phase 12.
