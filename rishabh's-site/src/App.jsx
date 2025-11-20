import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { X, ExternalLink, Github, MousePointer2 } from 'lucide-react';

// --- DATA: Your Projects as Art Exhibits ---
const PROJECTS = [
  {
    id: 1,
    title: "NEURAL NET",
    shortDesc: "WebGL Visualization",
    description: "An interactive 3D visualization of neural network layers. Built to help students understand deep learning architectures through visual exploration.",
    tech: ["React", "Three.js", "Python"],
    color: "#ff0055",
    position: new THREE.Vector3(0, 2, -9.9), // Back Wall Center
    rotation: new THREE.Euler(0, 0, 0)
  },
  {
    id: 2,
    title: "CRYPTO DASH",
    shortDesc: "Real-time Analytics",
    description: "A high-performance dashboard tracking 50+ cryptocurrencies in real-time using WebSockets. Features predictive charting and portfolio management.",
    tech: ["Next.js", "Tailwind", "D3.js"],
    color: "#00ffff",
    position: new THREE.Vector3(-9.9, 2, 0), // Left Wall
    rotation: new THREE.Euler(0, Math.PI / 2, 0)
  },
  {
    id: 3,
    title: "VIRTUAL NFT",
    shortDesc: "Metaverse Gallery",
    description: "A completely browser-based metaverse space for displaying NFT art collections. Supports multiplayer interaction and voice chat.",
    tech: ["WebGL", "Socket.io", "Solidity"],
    color: "#ffff00",
    position: new THREE.Vector3(9.9, 2, 0), // Right Wall
    rotation: new THREE.Euler(0, -Math.PI / 2, 0)
  },
  {
    id: 4,
    title: "AI CHATBOT",
    shortDesc: "Natural Language",
    description: "A context-aware customer support bot trained on custom datasets. Reduces support ticket volume by 40% through automated triage.",
    tech: ["OpenAI API", "Node.js", "Redis"],
    color: "#00ff55",
    position: new THREE.Vector3(0, 2, 9.9), // Front Wall (near start)
    rotation: new THREE.Euler(0, Math.PI, 0)
  }
];

export default function App() {
  const mountRef = useRef(null);
  const [isLocked, setIsLocked] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  
  // Mutable refs for 3D logic to avoid re-renders causing resets
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const requestRef = useRef(null); // To cancel animation frame

  useEffect(() => {
    const mount = mountRef.current;
    
    // 0. CLEANUP PREVIOUS SCENE (Strict Mode Fix)
    // This prevents double canvases when React 18/Vite mounts components twice in dev.
    while(mount.firstChild) {
        mount.removeChild(mount.firstChild);
    }

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 0, 25); // Atmospheric depth
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6; // Eye height
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // 3. ROOM CONSTRUCTION
    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x222222, 
      roughness: 0.1, 
      metalness: 0.5 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Helper (Aesthetic touch)
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(grid);

    // Ceiling
    const ceiling = new THREE.Mesh(floorGeo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 5;
    scene.add(ceiling);

    // 4. WALLS
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const createWall = (w, h, x, y, z, ry) => {
      const geo = new THREE.BoxGeometry(w, h, 0.5);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      mesh.receiveShadow = true;
      scene.add(mesh);
    };

    createWall(20, 5, 0, 2.5, -10, 0); // Back
    createWall(20, 5, 0, 2.5, 10, 0);  // Front
    createWall(20, 5, -10, 2.5, 0, Math.PI / 2); // Left
    createWall(20, 5, 10, 2.5, 0, Math.PI / 2);  // Right

    // 5. ARTWORK GENERATION
    const paintingGroup = new THREE.Group();
    scene.add(paintingGroup);

    PROJECTS.forEach(proj => {
      // Frame
      const frameGeo = new THREE.BoxGeometry(3.2, 2.2, 0.1);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      
      // Canvas (The "Art") - procedural texture from canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512; 
      canvas.height = 341; // 3:2 aspect approx
      const ctx = canvas.getContext('2d');
      
      // Draw cool placeholder art
      ctx.fillStyle = proj.color;
      ctx.fillRect(0, 0, 512, 341);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, 512, 341);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(proj.title, 256, 150);
      
      ctx.font = '30px Arial';
      ctx.fillStyle = '#cccccc';
      ctx.fillText(proj.shortDesc, 256, 210);

      const tex = new THREE.CanvasTexture(canvas);
      const artGeo = new THREE.PlaneGeometry(3, 2);
      const artMat = new THREE.MeshBasicMaterial({ map: tex });
      const art = new THREE.Mesh(artGeo, artMat);
      art.position.z = 0.06; // Slightly in front of frame
      
      frame.add(art);
      frame.position.copy(proj.position);
      frame.rotation.copy(proj.rotation);
      frame.userData = { id: proj.id, isInteractable: true }; // Tag for raycaster
      
      paintingGroup.add(frame);

      // Spotlight for each painting
      const spot = new THREE.SpotLight(0xffffff, 5); // Increased intensity
      spot.distance = 15;
      spot.angle = 0.5;
      spot.penumbra = 0.5;
      spot.castShadow = true;
      
      // Position spotlight above and in front
      const lightPos = proj.position.clone();
      lightPos.y = 4.5; // Ceiling height
      
      // Offset light towards center of room so it angles back at painting
      const offset = new THREE.Vector3(0, 0, 1).applyEuler(proj.rotation).multiplyScalar(3);
      spot.position.copy(lightPos).add(offset);
      
      spot.target = frame;
      scene.add(spot);
    });

    // 6. CONTROLS
    const controls = new PointerLockControls(camera, document.body);
    controlsRef.current = controls;

    const handleLock = () => setIsLocked(true);
    const handleUnlock = () => setIsLocked(false);

    controls.addEventListener('lock', handleLock);
    controls.addEventListener('unlock', handleUnlock);

    // 7. MOVEMENT LOGIC
    const onKeyDown = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.current.forward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.current.left = true; break;
        case 'ArrowDown':
        case 'KeyS': moveState.current.backward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveState.current.right = true; break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.current.forward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.current.left = false; break;
        case 'ArrowDown':
        case 'KeyS': moveState.current.backward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveState.current.right = false; break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 8. RAYCASTER (Interaction)
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);

    // 9. ANIMATION LOOP
    const clock = new THREE.Clock();
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      
      const delta = clock.getDelta();

      if (controls.isLocked) {
        // Movement Physics
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveState.current.forward) - Number(moveState.current.backward);
        direction.x = Number(moveState.current.right) - Number(moveState.current.left);
        direction.normalize();

        if (moveState.current.forward || moveState.current.backward) velocity.z -= direction.z * 40.0 * delta;
        if (moveState.current.left || moveState.current.right) velocity.x -= direction.x * 40.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        // Simple Wall Collision (Keep inside box)
        if (camera.position.x < -9) camera.position.x = -9;
        if (camera.position.x > 9) camera.position.x = 9;
        if (camera.position.z < -9) camera.position.z = -9;
        if (camera.position.z > 9) camera.position.z = 9;
      }

      // Interaction Raycasting
      raycaster.setFromCamera(center, camera);
      const intersects = raycaster.intersectObjects(paintingGroup.children, true); // Recursive for frame+art
      
      if (intersects.length > 0) {
        // Find the parent Group/Mesh that has userData
        let object = intersects[0].object;
        while (object.parent && !object.userData.isInteractable) {
          object = object.parent;
        }
        
        if (object.userData.isInteractable && intersects[0].distance < 5) {
          setHoveredProject(object.userData.id);
        } else {
          setHoveredProject(null);
        }
      } else {
        setHoveredProject(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function is critical for React Strict Mode
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      
      // Dispose controls properly
      controls.removeEventListener('lock', handleLock);
      controls.removeEventListener('unlock', handleUnlock);
      controls.dispose();

      if (mount) {
        mount.removeChild(renderer.domElement);
      }
      
      // Clean up Three.js resources
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(m => m.dispose());
            } else {
                object.material.dispose();
            }
        }
      });
      renderer.dispose();
    };
  }, []);

  // Handle Click to Interact
  const handleClick = () => {
    if (!isLocked && !activeProject) {
      controlsRef.current.lock();
    } else if (isLocked && hoveredProject) {
      const project = PROJECTS.find(p => p.id === hoveredProject);
      setActiveProject(project);
      controlsRef.current.unlock();
    }
  };

  const closeModal = () => {
    setActiveProject(null);
    // Optional: re-lock immediately or let user click to resume
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans select-none" onClick={handleClick}>
      
      {/* 3D Container */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* START SCREEN */}
      {!isLocked && !activeProject && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white">
          <div className="text-center animate-pulse cursor-pointer">
            <MousePointer2 className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
            <h1 className="text-4xl font-bold tracking-widest mb-2">DIGITAL MUSEUM</h1>
            <p className="text-gray-300">Click anywhere to Enter & Explore</p>
            <div className="mt-8 flex justify-center gap-4 text-sm text-gray-500 font-mono">
              <span className="border border-white/20 px-2 py-1 rounded">[W,A,S,D] Move</span>
              <span className="border border-white/20 px-2 py-1 rounded">[MOUSE] Look</span>
              <span className="border border-white/20 px-2 py-1 rounded">[CLICK] View Art</span>
            </div>
          </div>
        </div>
      )}

      {/* HUD CROSSHAIR */}
      {isLocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className={`transition-all duration-200 ${hoveredProject ? 'w-8 h-8 bg-cyan-400/50' : 'w-2 h-2 bg-white'} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]`} />
          {hoveredProject && (
             <p className="absolute top-10 left-1/2 -translate-x-1/2 text-cyan-400 font-bold text-sm whitespace-nowrap">
               CLICK TO VIEW
             </p>
          )}
        </div>
      )}

      {/* ESCAPE HINT */}
      {isLocked && (
        <div className="absolute top-6 left-6 text-white/50 text-xs font-mono z-20">
          <p>ESC to Unlock Cursor</p>
        </div>
      )}

      {/* PROJECT MODAL */}
      {activeProject && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-700 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div className="h-32 relative overflow-hidden" style={{ backgroundColor: activeProject.color }}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
              <button 
                onClick={(e) => { e.stopPropagation(); closeModal(); }} 
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white transition-colors"
              >
                <X size={24} />
              </button>
              <h2 className="absolute bottom-6 left-8 text-4xl font-bold text-white tracking-tighter">
                {activeProject.title}
              </h2>
            </div>

            {/* Content */}
            <div className="p-8 text-gray-300">
              <p className="text-lg leading-relaxed mb-6">
                {activeProject.description}
              </p>
              
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {activeProject.tech.map(t => (
                    <span key={t} className="bg-zinc-800 text-cyan-400 text-sm px-3 py-1 rounded-full border border-zinc-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  <ExternalLink size={18} /> View Live
                </button>
                <button className="flex-1 bg-zinc-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                  <Github size={18} /> Source Code
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}