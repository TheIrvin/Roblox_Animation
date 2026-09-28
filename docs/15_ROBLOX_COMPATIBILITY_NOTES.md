# 15 — Roblox Compatibility Notes

**Fecha de referencia:** 2026-09-25

Este archivo existe para evitar que Claude Code confunda distintos flujos de animación de Roblox.

---

## 1. R6 y R15 siguen siendo objetivos válidos

Roblox Studio ofrece rigs:
- R6 legacy;
- R15 estándar.

La documentación actual describe R6 como un rig de 6 partes visibles y R15 como un rig de 15 partes visibles, con una jerarquía y rango de movimiento más detallados.

Referencia oficial:
https://create.roblox.com/docs/studio/rig-builder

Para el MVP:
- soportar R6;
- soportar R15 Block estándar;
- no intentar advanced/custom avatar rigging.

---

## 2. Modelo de animación usado por este proyecto

El MVP usa el concepto:

```text
KeyframeSequence
  └─ Keyframe
      └─ Pose hierarchy
          └─ Pose.CFrame
```

Roblox documenta que:
- `Keyframe` contiene poses aplicadas a joints;
- los keyframes se interpolan durante playback;
- las poses siguen la jerarquía del rig;
- un plugin/script puede generar estas estructuras.

Referencia:
https://create.roblox.com/docs/reference/engine/classes/Keyframe

Esto encaja directamente con el editor de poses/keyframes de la aplicación.

---

## 3. Animation Editor

La documentación actual del Animation Editor establece que:
- las animaciones se crean sobre rigs;
- se crean poses moviendo/rotando partes;
- Studio interpola entre poses;
- el default de la timeline es 30 FPS;
- las animaciones pueden guardarse y publicarse desde Studio.

Referencia:
https://create.roblox.com/docs/animation/editor

La aplicación no necesita replicar todas las funciones de ese editor.

---

## 4. Markers

Roblox soporta eventos de animación/markers.

El juego puede escuchar:

```lua
track:GetMarkerReachedSignal("THROW")
```

Por eso el marker es parte formal del MVP.

Referencias:
- https://create.roblox.com/docs/animation/events
- https://create.roblox.com/docs/reference/engine/classes/AnimationTrack

---

## 5. Plugin ↔ software local

Roblox documenta que plugins de Studio pueden comunicarse con otro software ejecutándose en la misma computadora mediante:
- `localhost`;
- `127.0.0.1`.

El usuario puede recibir un prompt de permisos de Studio.

Referencia:
https://create.roblox.com/docs/cloud-services/http-service

Por eso el bridge local es una arquitectura deliberada y soportada.

---

## 6. KeyframeSequence vs CurveAnimation

No confundir:

### Caso A — objetivo del MVP
Animaciones normales utilizadas dentro de una experiencia Roblox.

Pipeline:
```text
.rbanim
→ Studio plugin
→ KeyframeSequence
→ Save/Publish in Studio
→ Animation ID
```

### Caso B — Marketplace/emotes/animation packs
Algunos flujos actuales de avatar Marketplace requieren `CurveAnimation`.

La documentación de paquetes/emotes actuales indica que dichos clips deben convertirse a CurveAnimation para esos flujos concretos.

Referencias:
- https://create.roblox.com/docs/avatar/emotes/import
- https://create.roblox.com/docs/avatar/animation-packs

**Conclusión de diseño:**
No convertir todo el MVP a CurveAnimation solo porque Marketplace lo requiera.

Si en una versión futura se añade:
- publicación de emotes;
- animation packs;
- Marketplace;

crear una etapa/adapter específico de CurveAnimation.

---

## 7. Publicación desde Studio

V1 delega la publicación a Roblox Studio.

Motivos:
- Studio ya maneja sesión Roblox;
- selector de creador/cuenta/grupo;
- permisos;
- asset configuration;
- cambios futuros del flujo de publicación.

La app no debe pedir contraseña/token Roblox.

---

## 8. Easing

`Pose` hereda easing.

Estilos actuales relevantes incluyen:

```text
Linear
Constant
Elastic
Cubic
Bounce
CubicV2
```

Referencia:
https://create.roblox.com/docs/reference/engine/enums/PoseEasingStyle

Direcciones:
```text
In
Out
InOut
```

Claude debe comprobar la API oficial durante la Fase 13 por si Roblox modifica nombres.

---

## 9. Regla ante cambios de Roblox

Cuando documentación actual contradiga este pack:

1. no improvisar;
2. guardar enlace oficial;
3. registrar ADR;
4. explicar qué contrato cambió;
5. adaptar el componente más pequeño posible;
6. conservar `.rbanim` si el cambio solo afecta exportación.

Ejemplo:

```text
Editor data (.rbanim)
        ↓ estable
Export Adapter
        ↓ puede cambiar
Roblox representation
```

El formato editable no debe acoplarse innecesariamente a APIs volátiles de Roblox.

---

## 10. Verificación obligatoria durante desarrollo

Aunque estos documentos parten de APIs verificadas el 2026-09-25, Claude Code debe comprobar documentación oficial actual al implementar las fases de integración con Studio.

Especialmente:
- Phase 12;
- Phase 13;
- Phase 14;
- Phase 15.

No usar tutoriales antiguos como única fuente cuando exista documentación oficial actual.
