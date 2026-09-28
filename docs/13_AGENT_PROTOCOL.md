# 13 — Protocolo de agentes Claude Code

## 1. Objetivo

Impedir que múltiples agentes hagan cambios incompatibles.

Solo un agente de implementación activo a la vez.

---

# 2. Rol del orquestador

El Claude Code principal:

1. lee documentación;
2. comprueba `AGENT_STATE.md`;
3. elige la siguiente fase;
4. lanza un único subagente;
5. recibe resultado;
6. inspecciona diff;
7. ejecuta verificación;
8. aprueba/rechaza;
9. actualiza estado;
10. lanza siguiente agente.

---

# 3. Prompt obligatorio para cada agente

Cada subagente debe recibir:

```text
Eres el agente responsable ÚNICAMENTE de la Fase N.

Lee primero:
- docs/00_START_HERE.md
- docs/01_PROJECT_MASTER.md
- documento(s) específicos de esta fase
- AGENT_STATE.md
- último handoff

No trabajes en fases posteriores.
No cambies arquitectura o stack.
No elimines trabajo previo para simplificar.
Antes de editar, inspecciona el código existente.
Implementa.
Añade/actualiza tests.
Ejecuta verificaciones.
Corrige fallos causados por tu fase.
Crea docs/handoffs/PHASE_N.md.
No marques tu propia fase PASSED: informa READY_FOR_REVIEW al orquestador.
```

---

# 4. AGENT_STATE.md

Formato:

```markdown
# Agent State

Current phase: 3
Status: IN_PROGRESS

## Phases
- Phase 0: PASSED
- Phase 1: PASSED
- Phase 2: PASSED
- Phase 3: IN_PROGRESS
- Phase 4: NOT_STARTED

## Last verified commit
`<hash>`

## Blocking issues
None

## Next required action
Complete viewport selection and gizmo tests.
```

Estados permitidos:
```text
NOT_STARTED
IN_PROGRESS
READY_FOR_REVIEW
FAILED
BLOCKED
PASSED
```

---

# 5. Handoff

Archivo:
```text
docs/handoffs/PHASE_03.md
```

Contenido obligatorio:

```markdown
# Phase 3 Handoff

## Scope completed

## Files created

## Files modified

## Tests added

## Commands executed

## Verification results

## Known limitations

## Decisions made
None / links to DECISIONS.md

## Risks for next phase

## Suggested next action
```

---

# 6. Review del orquestador

No confiar únicamente en el resumen del subagente.

El orquestador debe:
- inspeccionar `git diff`;
- leer archivos críticos;
- correr tests;
- comprobar que no hubo scope creep;
- comprobar documentación.

Si falla:
- estado `FAILED`;
- devolver la misma fase a un agente de reparación;
- no avanzar.

---

# 7. Commits

Recomendado:

```text
phase-00: bootstrap
phase-01: animation math core
phase-02: r6 r15 rig definitions
...
```

No mezclar varias fases en un commit si puede evitarse.

Nunca hacer push remoto sin que el usuario lo haya solicitado/configurado.

---

# 8. Bloqueos y preguntas

El agente debe detener su fase cuando:

- necesita credenciales;
- requiere instalación manual;
- necesita aceptar licencia;
- requiere login Roblox;
- encuentra cambio incompatible en APIs;
- la decisión afectaría el alcance central.

Debe explicar:
1. qué encontró;
2. por qué bloquea;
3. opciones;
4. recomendación técnica;
5. acción exacta requerida del usuario.

No inventar credenciales.

---

# 9. Instalaciones

Puede instalar dependencias de proyecto declaradas.

Para software de sistema:
- detectar;
- informar;
- pedir autorización cuando proceda.

No instalar silenciosamente software pesado.

---

# 10. Regla anti-rewrite

Si una fase anterior tiene problemas:
- corregir mínimamente;
- registrar la regresión;
- mantener sus contratos públicos cuando sea posible.

No reescribir media aplicación porque el agente prefiere otro patrón.

---

# 11. Contexto al siguiente agente

El siguiente agente debe leer:
- estado;
- handoff anterior;
- archivos relevantes.

No necesita releer cada línea del repositorio, pero sí los contratos/documentos.

---

# 12. Uso de agentes de revisión

Puede existir un subagente revisor después del implementador **solo de forma secuencial**:

```text
Implementador fase 5
       ↓ termina
Revisor fase 5
       ↓ termina
Orquestador
       ↓
Fase 6
```

Nunca implementar y revisar al mismo tiempo.
