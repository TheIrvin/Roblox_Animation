import { useEffect, useMemo, useRef } from "react";
import { TransformControls } from "@react-three/drei";
import { Group, Vector3 } from "three";
import { localRotationForJoint } from "../../core/rigs/pose";
import type { RigPose } from "../../core/rigs/pose";
import type { RigDefinition, RigJointDefinition } from "../../core/rigs/types";

interface RobloxRigProps {
  rig: RigDefinition;
  pose: RigPose;
  selectedJointId: string | null;
  onSelectJoint: (jointId: string) => void;
  onRotateJoint: (jointId: string, rotation: [number, number, number, number]) => void;
  onFocusJoint: (jointId: string, position: Vector3) => void;
}

interface RigNode extends RigJointDefinition {
  readonly children: RigNode[];
}

function buildRigTree(rig: RigDefinition): RigNode[] {
  const nodes = new Map(
    rig.joints.map((joint) => [joint.id, { ...joint, children: [] as RigNode[] }]),
  );
  const roots: RigNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId === null) roots.push(node);
    else nodes.get(node.parentId)?.children.push(node);
  }
  return roots;
}

export function RobloxRig(props: RobloxRigProps) {
  const roots = useMemo(() => buildRigTree(props.rig), [props.rig]);
  return (
    <group name={props.rig.id + "Rig"}>
      {roots.map((node) => (
        <RigPart key={node.id} node={node} {...props} />
      ))}
    </group>
  );
}

function RigPart({
  node,
  rig,
  pose,
  selectedJointId,
  onSelectJoint,
  onRotateJoint,
  onFocusJoint,
}: RobloxRigProps & { node: RigNode }) {
  const selected = selectedJointId === node.id;
  const objectRef = useRef<Group>(null!);
  const localRotation = localRotationForJoint(rig, pose, node.id);
  const localPosition: [number, number, number] = [
    node.bindPosition[0] + pose[node.id].position[0],
    node.bindPosition[1] + pose[node.id].position[1],
    node.bindPosition[2] + pose[node.id].position[2],
  ];
  const rotation: [number, number, number, number] = [...localRotation];

  const handleObjectChange = () => {
    const objectRotation = objectRef.current?.quaternion;
    if (!objectRotation) return;
    onRotateJoint(node.id, [
      objectRotation.x,
      objectRotation.y,
      objectRotation.z,
      objectRotation.w,
    ]);
  };
  const handlePartClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onSelectJoint(node.id);
  };
  const focusSelected = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    const worldPosition = objectRef.current?.getWorldPosition(new Vector3());
    if (worldPosition) onFocusJoint(node.id, worldPosition);
  };

  useEffect(() => {
    if (!selected) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "f" && objectRef.current) {
        onFocusJoint(node.id, objectRef.current.getWorldPosition(new Vector3()));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [node.id, onFocusJoint, selected]);

  const part = (
    <group
      ref={objectRef}
      position={localPosition}
      quaternion={rotation}
      name={node.id}
      onDoubleClick={focusSelected}
    >
      <mesh
        position={node.visual.offset}
        onClick={handlePartClick}
        castShadow
        receiveShadow
        userData={{ jointId: node.id }}
      >
        {node.visual.shape === "sphere" ? (
          <sphereGeometry args={[node.visual.size[0] / 2, 20, 16]} />
        ) : (
          <boxGeometry args={node.visual.size} />
        )}
        <meshStandardMaterial
          color={
            selected
              ? "#9db5ff"
              : node.side === "center"
                ? "#a6adbb"
                : node.side === "left"
                  ? "#68c6b4"
                  : "#d89175"
          }
          emissive={selected ? "#415da8" : "#000000"}
          emissiveIntensity={selected ? 0.42 : 0}
          roughness={0.65}
          transparent={node.id === rig.rootId}
          opacity={node.id === rig.rootId ? 0.16 : 1}
        />
      </mesh>
      {node.children.map((child) => (
        <RigPart
          key={child.id}
          node={child}
          rig={rig}
          pose={pose}
          selectedJointId={selectedJointId}
          onSelectJoint={onSelectJoint}
          onRotateJoint={onRotateJoint}
          onFocusJoint={onFocusJoint}
        />
      ))}
    </group>
  );

  if (!selected || !node.editableRotation) return part;
  return (
    <TransformControls
      object={objectRef}
      mode="rotate"
      space="local"
      size={0.78}
      onObjectChange={handleObjectChange}
    >
      {part}
    </TransformControls>
  );
}
