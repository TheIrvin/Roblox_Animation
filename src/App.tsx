import { useEffect, useMemo } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import {
  eulerXYZFromQuaternion,
  quaternionFromEulerXYZ,
  multiplyQuaternions,
} from "./core/math/quaternion";
import { R6_RIG } from "./core/rigs/r6";
import { R15_RIG } from "./core/rigs/r15";
import type { RigDefinition, RigId, RigJointDefinition } from "./core/rigs/types";
import type { Vec3 } from "./core/math/types";
import { Viewport } from "./components/viewport/Viewport";
import { editorStore, type EditorStoreState } from "./store/editorStore";
import "./App.css";

const RIGS: Record<RigId, RigDefinition> = { R6: R6_RIG, R15: R15_RIG };

export function App({ store = editorStore }: { store?: StoreApi<EditorStoreState> }) {
  const rigId = useStore(store, (state) => state.rigId);
  const rig = RIGS[rigId];
  const pose = useStore(store, (state) => state.pose);
  const selectedJointId = useStore(store, (state) => state.selectedJointId);
  const currentFrame = useStore(store, (state) => state.currentFrame);
  const isDirty = useStore(store, (state) => state.isDirty);
  const canUndo = useStore(store, (state) => state.canUndo);
  const canRedo = useStore(store, (state) => state.canRedo);
  const execute = useStore(store, (state) => state.execute);
  const selectJoint = useStore(store, (state) => state.selectJoint);
  const setCurrentFrame = useStore(store, (state) => state.setCurrentFrame);
  const beginTransformTransaction = useStore(
    store,
    (state) => state.beginTransformTransaction,
  );
  const updateTransform = useStore(store, (state) => state.updateTransform);
  const commitTransaction = useStore(store, (state) => state.commitTransaction);
  const undo = useStore(store, (state) => state.undo);
  const redo = useStore(store, (state) => state.redo);
  const selectedJoint = rig.joints.find((joint) => joint.id === selectedJointId) ?? null;

  const sortedJoints = useMemo(() => [...rig.joints], [rig]);
  const rotation =
    selectedJoint && pose[selectedJoint.id]
      ? eulerXYZFromQuaternion(pose[selectedJoint.id].rotation)
      : ([0, 0, 0] as Vec3);

  const setRotationAxis = (axis: 0 | 1 | 2, degrees: number) => {
    if (!selectedJoint || !Number.isFinite(degrees)) return;
    const euler = [...rotation] as Vec3;
    euler[axis] = (degrees * Math.PI) / 180;
    const delta = quaternionFromEulerXYZ(euler);
    const local = multiplyQuaternions(selectedJoint.bindRotation, delta);
    execute({ type: "set-joint-rotation", jointId: selectedJoint.id, rotation: local });
  };

  const setPositionAxis = (axis: 0 | 1 | 2, value: number) => {
    if (!selectedJoint || !Number.isFinite(value)) return;
    const position = [...pose[selectedJoint.id].position] as Vec3;
    position[axis] = value - selectedJoint.bindPosition[axis];
    execute({ type: "set-joint-position", jointId: selectedJoint.id, position });
  };

  const resetSelected = () => {
    if (!selectedJoint) return;
    execute({ type: "reset-joint", jointId: selectedJoint.id });
  };

  const handleRotate = (
    jointId: string,
    localRotation: [number, number, number, number],
  ) => {
    updateTransform({ type: "set-joint-rotation", jointId, rotation: localRotation });
  };

  const handleRigChange = (nextRigId: RigId) => {
    execute({ type: "change-rig", rigId: nextRigId });
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [redo, undo]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand-mark" aria-hidden="true">
          R
        </span>
        <span className="brand-name">Roblox Animator Desktop</span>
        <div className="history-controls" aria-label="Historial">
          <button aria-label="Undo" disabled={!canUndo} onClick={undo}>
            Undo
          </button>
          <button aria-label="Redo" disabled={!canRedo} onClick={redo}>
            Redo
          </button>
        </div>
        <label className="rig-picker">
          <span>Rig</span>
          <select
            aria-label="Rig"
            value={rigId}
            onChange={(event) => handleRigChange(event.target.value as RigId)}
          >
            <option value="R6">R6</option>
            <option value="R15">R15 Block</option>
          </select>
        </label>
        <span className="phase-indicator">Viewport · {rig.displayName}</span>
      </header>

      <section className="editor-layout" aria-label="Editor de animación">
        <aside className="joint-panel">
          <div className="panel-heading">
            <h2>Joints</h2>
            <span>{rig.joints.length}</span>
          </div>
          <div className="joint-list" role="list" aria-label="Articulaciones">
            {sortedJoints.map((joint) => (
              <JointRow
                key={joint.id}
                joint={joint}
                rig={rig}
                selected={joint.id === selectedJointId}
                onSelect={() => selectJoint(joint.id)}
              />
            ))}
          </div>
        </aside>

        <section className="viewport-panel" aria-label="Escena 3D del rig">
          <div className="viewport-title">
            <span className="live-dot" />
            <span>
              {rig.displayName}
              {isDirty ? " · Modificado *" : " · Guardado"}
            </span>
          </div>
          <Viewport
            rig={rig}
            pose={pose}
            selectedJointId={selectedJointId}
            onSelectJoint={selectJoint}
            onRotateJoint={handleRotate}
            onBeginRotate={beginTransformTransaction}
            onEndRotate={commitTransaction}
            onClearSelection={() => selectJoint(null)}
          />
        </section>

        <aside className="inspector-panel" aria-label="Inspector">
          <div className="panel-heading">
            <h2>Inspector</h2>
          </div>
          {selectedJoint ? (
            <div className="inspector-content">
              <p className="joint-id">{selectedJoint.displayName}</p>
              <p className="joint-id-subtle">{selectedJoint.id}</p>
              {selectedJoint.editablePosition && (
                <fieldset className="transform-fields">
                  <legend>Position</legend>
                  {([0, 1, 2] as const).map((axis, index) => (
                    <NumberField
                      key={axis}
                      label={`${"XYZ"[index]} Position`}
                      value={
                        selectedJoint.bindPosition[axis] +
                        pose[selectedJoint.id].position[axis]
                      }
                      onChange={(value) => setPositionAxis(axis, value)}
                      suffix="studs"
                    />
                  ))}
                </fieldset>
              )}
              <fieldset className="transform-fields">
                <legend>Rotation</legend>
                {([0, 1, 2] as const).map((axis, index) => (
                  <NumberField
                    key={axis}
                    label={`${"XYZ"[index]} Rotation`}
                    value={(rotation[axis] * 180) / Math.PI}
                    onChange={(value) => setRotationAxis(axis, value)}
                    suffix="°"
                  />
                ))}
              </fieldset>
              <button className="secondary-button reset-button" onClick={resetSelected}>
                Reset Joint
              </button>
              <p className="inspector-note">
                Los valores se guardan como transforms locales del editor.
              </p>
            </div>
          ) : (
            <div className="empty-inspector">
              Selecciona una articulación para editar su pose.
            </div>
          )}
        </aside>
      </section>
      <footer className="statusbar">
        <span>
          {selectedJoint ? `Seleccionado: ${selectedJoint.id}` : "Sin selección"}
        </span>
        <label className="frame-control">
          Frame
          <input
            aria-label="Current frame"
            type="number"
            min="0"
            step="1"
            value={currentFrame}
            onChange={(event) => {
              const frame = Number(event.target.value);
              if (Number.isSafeInteger(frame) && frame >= 0) setCurrentFrame(frame);
            }}
          />
        </label>
        <span>Gizmo: rotación · Coordenadas locales</span>
      </footer>
    </main>
  );
}

function JointRow({
  joint,
  rig,
  selected,
  onSelect,
}: {
  joint: RigJointDefinition;
  rig: RigDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  const depth = (() => {
    let result = 0;
    let parentId = joint.parentId;
    while (parentId) {
      result += 1;
      parentId =
        rig.joints.find((candidate) => candidate.id === parentId)?.parentId ?? null;
    }
    return result;
  })();
  return (
    <button
      className={`joint-row${selected ? " selected" : ""}`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{ paddingLeft: 10 + depth * 14 }}
    >
      <span className={`joint-indicator ${joint.side}`} aria-hidden="true" />
      <span>{joint.displayName}</span>
      {joint.editablePosition && <span className="root-tag">ROOT</span>}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <label className="number-field">
      <span>{label[0]}</span>
      <input
        aria-label={label}
        type="number"
        step="1"
        value={Number(value.toFixed(2))}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <small>{suffix}</small>
    </label>
  );
}

export default App;
