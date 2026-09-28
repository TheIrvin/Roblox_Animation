# 05 — Estructura del repositorio

La estructura debe tender a esto:

```text
roblox-animator/
├─ docs/
│  ├─ 00_START_HERE.md
│  ├─ ...
│  ├─ DECISIONS.md
│  └─ handoffs/
│
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.ts
│  │  └─ shortcuts.ts
│  │
│  ├─ components/
│  │  ├─ common/
│  │  ├─ home/
│  │  ├─ viewport/
│  │  ├─ timeline/
│  │  ├─ inspector/
│  │  └─ export/
│  │
│  ├─ core/
│  │  ├─ animation/
│  │  │  ├─ evaluate.ts
│  │  │  ├─ easing.ts
│  │  │  ├─ interpolation.ts
│  │  │  └─ timeline.ts
│  │  ├─ math/
│  │  │  ├─ quaternion.ts
│  │  │  ├─ transform.ts
│  │  │  └─ mirror.ts
│  │  ├─ rigs/
│  │  │  ├─ types.ts
│  │  │  ├─ r6.ts
│  │  │  └─ r15.ts
│  │  ├─ project/
│  │  │  ├─ schema.ts
│  │  │  ├─ validate.ts
│  │  │  └─ migrate.ts
│  │  └─ export/
│  │     ├─ normalize.ts
│  │     └─ types.ts
│  │
│  ├─ store/
│  │  ├─ editorStore.ts
│  │  ├─ commands.ts
│  │  └─ history.ts
│  │
│  ├─ hooks/
│  ├─ styles/
│  ├─ types/
│  └─ main.tsx
│
├─ src-tauri/
│  ├─ src/
│  │  ├─ main.rs
│  │  ├─ lib.rs
│  │  ├─ files.rs
│  │  ├─ bridge.rs
│  │  ├─ bridge_state.rs
│  │  └─ logging.rs
│  ├─ Cargo.toml
│  └─ tauri.conf.json
│
├─ studio-plugin/
│  ├─ default.project.json
│  └─ src/
│     ├─ init.server.luau
│     ├─ BridgeClient.luau
│     ├─ Validator.luau
│     ├─ KeyframeSequenceBuilder.luau
│     ├─ Quaternion.luau
│     └─ UI.luau
│
├─ tests/
│  ├─ fixtures/
│  │  ├─ throw-rock-r6.rbanim
│  │  ├─ throw-rock-r15.rbanim
│  │  └─ transform-fixtures.json
│  └─ manual/
│     ├─ studio-e2e.md
│     └─ release-smoke.md
│
├─ scripts/
│  ├─ verify.ps1
│  └─ build-plugin.ps1
│
├─ dist/
│  └─ .gitkeep
│
├─ AGENT_STATE.md
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

---

## Reglas

### R-STRUCT-001
No crear `utils.ts` gigantes.

### R-STRUCT-002
Matemática y formato de proyecto viven en `src/core`.

### R-STRUCT-003
Componentes React no deben importar directamente módulos Rust.

Usar una capa de servicios/commands cuando sea necesario.

### R-STRUCT-004
Fixtures compartidas deben ser datos, no lógica duplicada.

### R-STRUCT-005
No subir:
- `node_modules`;
- `target`;
- builds;
- secretos;
- caches;
- logs;
- archivos personales `.rbanim`.

### R-STRUCT-006
`dist/` puede contener artefactos generados solo en releases; decidir en `.gitignore` según estrategia.

### R-STRUCT-007
Cada nueva carpeta significativa debe tener una responsabilidad clara.
