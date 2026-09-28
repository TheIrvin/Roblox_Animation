import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand-mark" aria-hidden="true">
          R
        </span>
        <span className="brand-name">Roblox Animator Desktop</span>
        <span className="status-pill">Bootstrap ready</span>
      </header>

      <section className="workspace" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <p className="eyebrow">ESPACIO LOCAL DE ANIMACIÓN</p>
          <h1 id="welcome-title">Un espacio claro para empezar a animar.</h1>
          <p className="description">
            La aplicación de escritorio y la vista 3D están listas. Las herramientas del
            editor se añadirán en las siguientes fases.
          </p>
        </div>

        <div className="preview-panel" aria-label="Vista de prueba del renderizador 3D">
          <Canvas camera={{ position: [3.5, 2.7, 4.5], fov: 38 }}>
            <color attach="background" args={["#171a21"]} />
            <ambientLight intensity={1.8} />
            <directionalLight position={[3, 5, 4]} intensity={2.2} />
            <mesh rotation={[0.35, 0.55, 0]}>
              <boxGeometry args={[1.25, 1.25, 1.25]} />
              <meshStandardMaterial color="#7297ff" roughness={0.42} />
            </mesh>
            <OrbitControls enablePan={false} />
          </Canvas>
          <span className="preview-caption">Vista previa 3D activa</span>
        </div>
      </section>
    </main>
  );
}

export default App;
