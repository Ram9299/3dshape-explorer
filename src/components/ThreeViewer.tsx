import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { toast } from 'sonner';

interface ThreeViewerProps {
  modelUrl?: string;
}

interface OptimizedMesh {
  format: string;
  version: number;
  levels: {
    vertices: number[][];
    faces: number[][];
    normals: number[][];
    detail: number;
  }[];
}

const ThreeViewer: React.FC<ThreeViewerProps> = ({ modelUrl }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const meshRef = useRef<THREE.Mesh>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentLOD, setCurrentLOD] = useState(0);

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

  const loadOptimizedModel = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch model');
      
      const data: OptimizedMesh = await response.json();
      if (data.format !== 'optimized-mesh') {
        throw new Error('Invalid format');
      }
      
      // Start with highest detail level
      const level = data.levels[0];
      
      // Create geometry
      const geometry = new THREE.BufferGeometry();
      
      // Set vertices
      const vertices = new Float32Array(level.vertices.flat());
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      
      // Set faces
      const indices = new Uint32Array(level.faces.flat());
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      
      // Set normals
      const normals = new Float32Array(level.normals.flat());
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      
      // Create mesh
      const material = new THREE.MeshPhongMaterial({
        color: 0x00a8ff,
        specular: 0x111111,
        shininess: 200,
      });
      
      if (meshRef.current) {
        sceneRef.current?.remove(meshRef.current);
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      sceneRef.current?.add(mesh);
      meshRef.current = mesh;
      
      // Center and scale model
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox;
      if (boundingBox) {
        geometry.center();
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
      
      setIsLoading(false);
      toast.success('Model loaded successfully');
      
      // Add LOD control based on camera distance
      if (controlsRef.current) {
        controlsRef.current.addEventListener('change', () => {
          if (!cameraRef.current || !meshRef.current) return;
          
          const distance = cameraRef.current.position.distanceTo(meshRef.current.position);
          const maxDistance = cameraDistance * 2;
          const lodIndex = Math.min(
            Math.floor((distance / maxDistance) * data.levels.length),
            data.levels.length - 1
          );
          
          if (lodIndex !== currentLOD) {
            setCurrentLOD(lodIndex);
            updateLOD(data.levels[lodIndex]);
          }
        });
      }
      
    } catch (error) {
      console.error('Error loading model:', error);
      setIsLoading(false);
      toast.error('Failed to load model');
    }
  };
  
  const updateLOD = (level: OptimizedMesh['levels'][0]) => {
    if (!meshRef.current) return;
    
    const geometry = meshRef.current.geometry;
    
    // Update geometry with new LOD data
    const vertices = new Float32Array(level.vertices.flat());
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const indices = new Uint32Array(level.faces.flat());
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    const normals = new Float32Array(level.normals.flat());
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    geometry.computeBoundingSphere();
  };

  // Load model when URL changes
  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;

    setIsLoading(true);
    
    if (modelUrl.endsWith('.json')) {
      loadOptimizedModel(modelUrl);
    } else {
      const loader = new STLLoader();
      loader.load(modelUrl, (geometry) => {
        const material = new THREE.MeshPhongMaterial({
          color: 0x00a8ff,
          specular: 0x111111,
          shininess: 200,
        });
        
        if (meshRef.current) {
          sceneRef.current?.remove(meshRef.current);
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        sceneRef.current?.add(mesh);
        meshRef.current = mesh;
        
        // Center and scale model
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
          geometry.center();
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
        
        setIsLoading(false);
        toast.success('Model loaded successfully');
      }, undefined, (error) => {
        console.error('Error loading STL:', error);
        setIsLoading(false);
        toast.error('Failed to load model');
      });
    }
  }, [modelUrl]);

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
