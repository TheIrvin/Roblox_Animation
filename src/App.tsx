import { useMemo, useState } from "react";
import {
  eulerXYZFromQuaternion,
  quaternionFromEulerXYZ,
  multiplyQuaternions,
} from "./core/math/quaternion";
import {
  createBindPose,
  setJointLocalRotation,
  setJointPositionOffset,
} from "./core/rigs/pose";
import { R6_RIG } from "./core/rigs/r6";
import { R15_RIG } from "./core/rigs/r15";
import type { RigDefinition, RigId, RigJointDefinition } from "./core/rigs/types";
import type { Vec3 } from "./core/math/types";
import { Viewport } from "./components/viewport/Viewport";
import "./App.css";

const RIGS: Record<RigId, RigDefinition> = { R6: R6_RIG, R15: R15_RIG };

function App() {
  const [rigId, setRigId] = useState<RigId>("R15");
  const rig = RIGS[rigId];
  const [pose, setPose] = useState(() => createBindPose(rig));
  const [selectedJointId, setSelectedJointId] = useState<string | null>(rig.rootId);
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
    setPose((current) => setJointLocalRotation(rig, current, selectedJoint.id, local));
  };

  const setPositionAxis = (axis: 0 | 1 | 2, value: number) => {
    if (!selectedJoint || !Number.isFinite(value)) return;
    const offset = [...pose[selectedJoint.id].position] as Vec3;
    offset[axis] = value - selectedJoint.bindPosition[axis];
    setPose((current) => setJointPositionOffset(rig, current, selectedJoint.id, offset));
  };

  const resetSelected = () => {
    if (!selectedJoint) return;
    setPose((current) => ({
      ...current,
      [selectedJoint.id]: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
    }));
  };

  const handleRotate = (
    jointId: string,
    localRotation: [number, number, number, number],
  ) => {
    setPose((current) => setJointLocalRotation(rig, current, jointId, localRotation));
  };

  const handleRigChange = (nextRigId: RigId) => {
    setRigId(nextRigId);
    setPose(createBindPose(RIGS[nextRigId]));
    setSelectedJointId(RIGS[nextRigId].rootId);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand-mark" aria-hidden="true">
          R
        </span>
        <span className="brand-name">Roblox Animator Desktop</span>
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
                onSelect={() => setSelectedJointId(joint.id)}
              />
            ))}
          </div>
        </aside>

        <section className="viewport-panel" aria-label="Escena 3D del rig">
          <div className="viewport-title">
            <span className="live-dot" />
            <span>{rig.displayName} · Bind pose</span>
          </div>
          <Viewport
            rig={rig}
            pose={pose}
            selectedJointId={selectedJointId}
            onSelectJoint={setSelectedJointId}
            onRotateJoint={handleRotate}
            onClearSelection={() => setSelectedJointId(null)}
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
