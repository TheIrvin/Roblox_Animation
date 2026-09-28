import { Suspense, useCallback, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { RigPose } from "../../core/rigs/pose";
import type { RigDefinition } from "../../core/rigs/types";
import { RobloxRig } from "./RobloxRig";

interface ViewportProps {
  rig: RigDefinition;
  pose: RigPose;
  selectedJointId: string | null;
  onSelectJoint: (jointId: string | null) => void;
  onRotateJoint: (jointId: string, rotation: [number, number, number, number]) => void;
  onClearSelection: () => void;
}

export function Viewport({
  rig,
  pose,
  selectedJointId,
  onSelectJoint,
  onRotateJoint,
  onClearSelection,
}: ViewportProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const focusTarget = useCallback(
    (jointId: string, position: Vector3) => {
      onSelectJoint(jointId);
      if (controlsRef.current) {
        controlsRef.current.target.copy(position);
        controlsRef.current.update();
      }
    },
    [onSelectJoint],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      if (event.key === "Escape") onClearSelection();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClearSelection, selectedJointId]);

  return (
    <div className="viewport-canvas" aria-label="Viewport 3D">
      <Canvas
        camera={{ position: [5, 3.8, -7], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        shadows
        onPointerMissed={(event) => {
          if (event.type === "click") onSelectJoint(null);
        }}
      >
        <color attach="background" args={["#171a21"]} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 8, -3]} intensity={2.3} castShadow />
        <gridHelper args={[12, 24, "#363d4d", "#252a34"]} position={[0, -2.05, 0]} />
        <Suspense fallback={null}>
          <RobloxRig
            rig={rig}
            pose={pose}
            selectedJointId={selectedJointId}
            onSelectJoint={(jointId) => onSelectJoint(jointId)}
            onRotateJoint={onRotateJoint}
            onFocusJoint={focusTarget}
          />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          enablePan
          enableZoom
          enableRotate
          mouseButtons={{ LEFT: null as never, MIDDLE: 2, RIGHT: 0 }}
        />
      </Canvas>
      <div className="viewport-help" aria-hidden="true">
        Clic: seleccionar · Arrastrar gizmo: rotar · Rueda: zoom · Botón derecho: orbitar
        · F: enfocar
      </div>
    </div>
  );
}
