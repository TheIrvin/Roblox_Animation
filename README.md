# Roblox Animator Desktop

Editor local para crear animaciones corporales de Roblox R6/R15. El alcance,
arquitectura y etapas de implementación están en [`docs/`](docs/).

## Install on Windows

Download the Windows installer and Studio plugin from [`dist/`](dist/):

1. Run `RobloxAnimatorDesktop-0.1.0-Windows-x64-setup.exe` (per-user NSIS
   installer) or `RobloxAnimatorDesktop-0.1.0-Windows-x64.msi`.
2. Copy `RobloxAnimatorPlugin.rbxm` to
   `%LOCALAPPDATA%\Roblox\Plugins\RobloxAnimatorPlugin.rbxm`.
3. Restart Roblox Studio and open the **Roblox Animator** plugin widget.
4. Keep the desktop app open while exporting. In Studio, allow the plugin to
   connect to `127.0.0.1` if Studio asks for local network access.

The bridge only listens on the local loopback address. Rojo is needed to rebuild
the plugin, not to use the installed app.

## Development

```powershell
npm install
npm run tauri dev
```

Requisitos de desarrollo: Node.js LTS, Rust stable y las dependencias de
Windows indicadas en [`docs/04_ENVIRONMENT_SETUP.md`](docs/04_ENVIRONMENT_SETUP.md).

## Verification and release build

```powershell
npm run verify
npm run tauri build
npm run build:plugin
npm run stage:release
```

The installers are generated under `src-tauri/target/release/bundle/` and staged
with the versioned plugin model in `dist/`.
