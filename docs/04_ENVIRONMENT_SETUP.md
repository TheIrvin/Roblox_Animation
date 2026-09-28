# 04 — Environment Setup para Claude Code

## 1. Plataforma objetivo

V1:
- Windows 10/11;
- x64.

Claude Code debe detectar el sistema real antes de ejecutar instalaciones.

---

## 2. Comprobaciones iniciales

Ejecutar versiones/rutas equivalentes:

```powershell
git --version
node --version
npm --version
rustc --version
cargo --version
rustup --version
```

Comprobar también:
- Microsoft Visual C++ Build Tools;
- Windows SDK;
- WebView2 Runtime;
- Roblox Studio;
- Rojo.

No asumir que algo está instalado solo porque una carpeta existe.

---

## 3. Node

Requisito:
- versión LTS soportada por Tauri 2 en el momento de implementación.

Si falta:
1. informar al usuario;
2. preferir método oficial o `winget` si está disponible;
3. solicitar permiso antes de instalación a nivel sistema;
4. verificar `node` y `npm` después.

No usar una versión experimental de Node.

---

## 4. Rust

Instalar con `rustup` oficial si falta.

Después:

```powershell
rustup toolchain install stable
rustup default stable
rustc --version
cargo --version
```

No fijar nightly.

---

## 5. Tauri en Windows

Verificar requisitos oficiales de Tauri 2 para Windows vigentes en el momento de implementación.

Normalmente se necesitan:
- Microsoft C++ Build Tools;
- Windows SDK;
- WebView2.

Si falta Visual Studio Build Tools:
- no simular que está instalado;
- explicar al usuario los componentes exactos requeridos;
- si el instalador requiere GUI, marcar `MISSING_MANUAL`;
- esperar confirmación antes de continuar.

---

## 6. Roblox Studio

Necesario para validar la integración final.

Si falta:
- indicar que debe instalarse desde fuente oficial;
- no bloquear las fases puramente desktop si el usuario autoriza continuar;
- **sí bloquear la fase E2E Studio**.

---

## 7. Rojo

Rojo es herramienta de desarrollo para empaquetar/sincronizar el plugin Luau.

Reglas:
- no es dependencia runtime del usuario final;
- registrar versión utilizada;
- incluir comando reproducible de build;
- generar artefacto del plugin en `/dist`.

Si la instalación requiere una nueva herramienta adicional, explica el motivo antes.

---

## 8. Creación inicial del proyecto

Cuando el entorno esté listo:

1. crear repositorio Git si no existe;
2. crear `.gitignore`;
3. scaffold de Tauri 2 + React + TypeScript + Vite;
4. habilitar TypeScript strict;
5. instalar dependencias especificadas;
6. ejecutar app limpia;
7. ejecutar tests vacíos/base;
8. commit de bootstrap.

No añadir UI compleja durante bootstrap.

---

## 9. Dependencias frontend aprobadas

Necesarias:

```text
react
react-dom
three
@react-three/fiber
@react-three/drei
zustand
```

Dev:
```text
typescript
vite
vitest
@testing-library/react
@testing-library/jest-dom
eslint
prettier
```

Puede añadirse una dependencia adicional solo si:
- evita mucho código inseguro/repetitivo;
- tiene mantenimiento activo;
- se registra en `DECISIONS.md`.

Evitar frameworks de UI grandes en V1.

---

## 10. Rust aprobado

Dependencias esperadas:

```text
tauri
serde
serde_json
tokio
axum
uuid
tracing
tracing-subscriber
```

Usar features mínimas.

No añadir base de datos.

---

## 11. Scripts esperados

`package.json` debe ofrecer comandos equivalentes:

```text
npm run dev
npm run tauri dev
npm run build
npm run tauri build
npm run test
npm run lint
npm run format
npm run typecheck
npm run verify
npm run plugin:build
```

`verify` debe ejecutar el conjunto razonable de:
- typecheck;
- lint;
- tests;
- Rust fmt check;
- clippy;
- cargo test.

---

## 12. Gate de bootstrap

No pasar a lógica R6/R15 hasta que:

```text
[ ] Tauri app abre
[ ] React renderiza
[ ] Three.js/R3F renderiza una escena mínima
[ ] npm run typecheck pasa
[ ] npm run lint pasa
[ ] npm run test pasa
[ ] cargo test pasa
[ ] cargo clippy pasa
```
