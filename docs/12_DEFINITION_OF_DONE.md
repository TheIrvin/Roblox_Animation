# 12 — Definition of Done

## 1. Una fase está terminada cuando

- alcance de la fase implementado;
- no se agregó alcance oculto;
- tests nuevos escritos;
- tests previos siguen pasando;
- typecheck pasa;
- lint pasa;
- Rust checks pasan si aplica;
- manual smoke realizado cuando aplica;
- documentación actualizada;
- handoff creado;
- `AGENT_STATE.md` actualizado;
- no existen errores conocidos críticos ocultos.

---

# 2. El MVP está terminado cuando

## Desktop

```text
[ ] abre correctamente
[ ] crea R6
[ ] crea R15
[ ] selecciona joints
[ ] rota joints
[ ] mueve root
[ ] timeline funciona
[ ] keyframes funcionan
[ ] playback funciona
[ ] loop funciona
[ ] easing funciona
[ ] copy/paste funciona
[ ] mirror funciona
[ ] undo/redo funciona
[ ] markers funcionan
[ ] save funciona
[ ] open funciona
[ ] proyecto inválido no rompe la app
```

## Export

```text
[ ] validate export
[ ] bridge escucha solo localhost
[ ] no polling continuo
[ ] plugin conecta bajo demanda
[ ] plugin crea KFS R6
[ ] plugin crea KFS R15
[ ] easing llega correctamente
[ ] marker llega correctamente
```

## Roblox

```text
[ ] R15 ThrowRock se publica y reproduce
[ ] R15 marker THROW se detecta
[ ] R6 ThrowRock se publica y reproduce
[ ] R6 marker THROW se detecta
```

## Build

```text
[ ] build release Windows
[ ] plugin build
[ ] README instalación
[ ] no rutas absolutas
[ ] no secretos
[ ] clean clone puede reconstruirse
```

---

# 3. No cuenta como Done

No marcar PASSED si:

- “funciona en mi sesión” pero no se guardó;
- UI existe pero botón no hace nada;
- tests fueron comentados;
- warning crítico ignorado;
- se usó hardcode específico de ThrowRock;
- solo funciona R15 cuando requisito dice R6/R15;
- export genera datos pero Studio no puede usarlos;
- marker solo existe en UI pero no llega a Roblox;
- app requiere Internet para editar;
- bridge está abierto a LAN;
- un agente cambió formato/arquitectura sin documentarlo.

---

# 4. Definition of Done de ThrowRock

R15 y R6 deben completar:

```text
Create
Edit
Save
Close
Open
Preview
Export
Studio Import
Publish
Play
Marker
```

Ese flujo es la aceptación central del producto.
