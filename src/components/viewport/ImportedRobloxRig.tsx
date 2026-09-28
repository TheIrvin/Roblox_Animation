import { useEffect, useMemo } from "react";
import { TransformControls, useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Group, Mesh, Object3D, Quaternion, Vector3 } from "three";
import { inverseQuaternion, multiplyQuaternions } from "../../core/math/quaternion";
import type { RigPose } from "../../core/rigs/pose";
import type { RigDefinition } from "../../core/rigs/types";

interface ImportedRobloxRigProps {
  rig: RigDefinition;
  pose: RigPose;
  selectedJointId: string | null;
  onSelectJoint: (jointId: string) => void;
  onRotateJoint: (jointId: string, rotation: [number, number, number, number]) => void;
  onBeginRotate: (jointId: string) => void;
  onEndRotate: () => void;
  onFocusJoint: (jointId: string, position: Vector3) => void;
}

const MODEL_URLS = {
  R6: "/models/roblox-r6.gltf",
  R15: "/models/roblox-r15.gltf",
} as const;

const R6_SOURCE_NAMES: Readonly<Record<string, string>> = {
  HumanoidRootPart: "",
  Torso: "Torso",
  Head: "Head_Geo",
  "Left Arm": "Left_Arm",
  "Right Arm": "Right_Arm",
  "Left Leg": "Left_Leg",
  "Right Leg": "Right_Leg",
};

interface RigInstance {
  readonly root: Group;
  readonly joints: ReadonlyMap<string, Object3D>;
  readonly basePositions: ReadonlyMap<string, Vector3>;
  readonly baseRotations: ReadonlyMap<string, Object3D["quaternion"]>;
}

function makeRigInstance(scene: Group, rig: RigDefinition): RigInstance {
  const root = scene.clone(true);
  const assetRoot = root.getObjectByName("Rig") ?? root;
  // Roblox exports the top-level Rig pivot in Studio world coordinates. The
  // animation preview uses a local origin at the humanoid root height.
  assetRoot.position.set(0, 0, 0);

  const joints = new Map<string, Object3D>();
  if (rig.id === "R6") {
    const sourceParts = new Map<string, Object3D>();
    for (const joint of rig.joints) {
      const sourceName = R6_SOURCE_NAMES[joint.id];
      if (sourceName) {
        const source = assetRoot.getObjectByName(sourceName);
        if (!source) throw new Error(`The R6 GLTF is missing ${sourceName}.`);
        sourceParts.set(joint.id, source);
      }
    }

    for (const joint of rig.joints) {
      const pivot = new Group();
      pivot.name = joint.id;
      pivot.position.set(...joint.bindPosition);
      joints.set(joint.id, pivot);
      const parent = joint.parentId ? joints.get(joint.parentId) : undefined;
      (parent ?? assetRoot).add(pivot);
    }
    assetRoot.updateMatrixWorld(true);
    for (const [jointId, part] of sourceParts) {
      const pivot = joints.get(jointId);
      if (pivot) pivot.attach(part);
    }
  } else {
    for (const joint of rig.joints) {
      const sourceName = joint.id === rig.rootId ? "Root" : joint.id;
      const pivot = assetRoot.getObjectByName(sourceName);
      if (!pivot) throw new Error(`The R15 GLTF is missing ${sourceName}.`);
      joints.set(joint.id, pivot);
    }
  }

  const basePositions = new Map<string, Vector3>();
  const baseRotations = new Map<string, Object3D["quaternion"]>();
  for (const [jointId, pivot] of joints) {
    basePositions.set(jointId, pivot.position.clone());
    baseRotations.set(jointId, pivot.quaternion.clone());
  }

  const pivotIds = new Map([...joints].map(([id, pivot]) => [pivot, id]));
  assetRoot.traverse((object) => {
    if (
      object.name.endsWith("_attachments") ||
      object.name.endsWith("_Att") ||
      object.name === "roblox"
    ) {
      object.visible = false;
      return;
    }
    let ancestor: Object3D | null = object;
    while (ancestor && !pivotIds.has(ancestor)) ancestor = ancestor.parent;
    const jointId = ancestor ? pivotIds.get(ancestor) : undefined;
    if (jointId) object.userData.jointId = jointId;
    if (object instanceof Mesh) {
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => material.clone())
        : object.material.clone();
    }
  });

  return { root, joints, basePositions, baseRotations };
}

function ImportedRobloxRig({
  rig,
  pose,
  selectedJointId,
  onSelectJoint,
  onRotateJoint,
  onBeginRotate,
  onEndRotate,
  onFocusJoint,
}: ImportedRobloxRigProps) {
  const { scene } = useGLTF(MODEL_URLS[rig.id]);
  const instance = useMemo(() => makeRigInstance(scene, rig), [rig, scene]);
  const selectedJoint = rig.joints.find((joint) => joint.id === selectedJointId);
  const selectedPivot = selectedJointId
    ? instance.joints.get(selectedJointId)
    : undefined;

  for (const joint of rig.joints) {
    const pivot = instance.joints.get(joint.id);
    const basePosition = instance.basePositions.get(joint.id);
    const baseRotation = instance.baseRotations.get(joint.id);
    if (!pivot || !basePosition || !baseRotation) continue;
    const offset = pose[joint.id].position;
    pivot.position.set(
      basePosition.x + offset[0],
      basePosition.y + offset[1],
      basePosition.z + offset[2],
    );
    pivot.quaternion
      .copy(baseRotation)
      .multiply(new Quaternion(...pose[joint.id].rotation));
  }

  instance.root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const isSelected = object.userData.jointId === selectedJointId;
    for (const material of materials) {
      if ("emissive" in material) {
        material.emissive.set(isSelected ? "#415da8" : "#000000");
        material.emissiveIntensity = isSelected ? 0.38 : 0;
      }
    }
  });

  useEffect(() => {
    if (!selectedJoint || !selectedPivot) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "f")
        onFocusJoint(selectedJoint.id, selectedPivot.getWorldPosition(new Vector3()));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFocusJoint, selectedJoint, selectedPivot]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    const jointId = event.object.userData.jointId as string | undefined;
    if (!jointId) return;
    event.stopPropagation();
    onSelectJoint(jointId);
  };

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    const jointId = event.object.userData.jointId as string | undefined;
    const pivot = jointId ? instance.joints.get(jointId) : undefined;
    if (!jointId || !pivot) return;
    event.stopPropagation();
    onFocusJoint(jointId, pivot.getWorldPosition(new Vector3()));
  };

  const handleObjectChange = () => {
    if (!selectedJointId || !selectedPivot) return;
    const bindRotation = instance.baseRotations.get(selectedJointId);
    if (!bindRotation) return;
    const delta = multiplyQuaternions(
      inverseQuaternion([bindRotation.x, bindRotation.y, bindRotation.z, bindRotation.w]),
      [
        selectedPivot.quaternion.x,
        selectedPivot.quaternion.y,
        selectedPivot.quaternion.z,
        selectedPivot.quaternion.w,
      ],
    );
    onRotateJoint(selectedJointId, delta);
  };

  return (
    <>
      <primitive
        object={instance.root}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      {selectedPivot && selectedJoint?.editableRotation ? (
        <TransformControls
          object={selectedPivot}
          mode="rotate"
          space="local"
          size={0.78}
          onObjectChange={handleObjectChange}
          onMouseDown={() => onBeginRotate(selectedJoint.id)}
          onMouseUp={onEndRotate}
        />
      ) : null}
    </>
  );
}

export default ImportedRobloxRig;
