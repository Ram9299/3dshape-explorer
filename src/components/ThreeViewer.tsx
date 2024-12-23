import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { toast } from 'sonner';

interface ThreeViewerProps {
  stlUrl?: string;
}

const ThreeViewer: React.FC<ThreeViewerProps> = ({ stlUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const meshRef = useRef<THREE.Mesh>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a1a');
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load STL file when URL changes
  useEffect(() => {
    if (!stlUrl || !sceneRef.current) return;

    setIsLoading(true);
    console.log('Loading STL from URL:', stlUrl);

    const loader = new STLLoader();
    
    try {
      loader.load(
        stlUrl,
        (geometry) => {
          console.log('STL loaded successfully');
          
          if (meshRef.current) {
            sceneRef.current?.remove(meshRef.current);
          }

          const material = new THREE.MeshPhongMaterial({
            color: 0x00a8ff,
            specular: 0x111111,
            shininess: 200,
          });
          const mesh = new THREE.Mesh(geometry, material);

          // Center the model
          geometry.computeBoundingBox();
          const boundingBox = geometry.boundingBox;
          if (boundingBox) {
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            geometry.center();

            // Adjust camera to fit model
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = cameraRef.current?.fov || 75;
            const cameraDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));
            
            if (cameraRef.current) {
              cameraRef.current.position.z = cameraDistance * 1.5;
              cameraRef.current.updateProjectionMatrix();
            }
          }

          sceneRef.current?.add(mesh);
          meshRef.current = mesh;
          setIsLoading(false);
          toast.success('Model loaded successfully');
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
          console.error('Error loading STL:', error);
          setIsLoading(false);
          toast.error('Failed to load model');
        }
      );
    } catch (error) {
      console.error('Error in STL loading process:', error);
      setIsLoading(false);
      toast.error('Failed to load model');
    }
  }, [stlUrl]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          Loading model...
        </div>
      )}
    </div>
  );
};

export default ThreeViewer;