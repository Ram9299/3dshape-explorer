import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { toast } from 'sonner';

interface ModelLoaderProps {
  modelUrl?: string;
  sceneRef: React.MutableRefObject<THREE.Scene | undefined>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | undefined>;
  meshRef: React.MutableRefObject<THREE.Mesh | undefined>;
}

export const useModelLoader = ({
  modelUrl,
  sceneRef,
  cameraRef,
  meshRef,
}: ModelLoaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelUrl || !sceneRef.current || !cameraRef.current) return;

    setIsLoading(true);
    setError(null);

    const loader = new STLLoader();
    
    // Log the URL being loaded
    console.log('Loading STL from URL:', modelUrl);

    loader.load(
      modelUrl,
      (geometry) => {
        try {
          console.log('STL loaded successfully, creating mesh...');
          
          const material = new THREE.MeshPhongMaterial({
            color: 0x00a8ff,
            specular: 0x111111,
            shininess: 200,
          });

          if (meshRef.current) {
            console.log('Removing existing mesh...');
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
            const maxDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));

            if (cameraRef.current) {
              cameraRef.current.position.z = maxDistance * 1.5;
              cameraRef.current.updateProjectionMatrix();
            }
          }

          setIsLoading(false);
          setError(null);
          toast.success('Model loaded successfully');
          console.log('Model setup complete');
        } catch (err) {
          console.error('Error setting up model:', err);
          setError('Error setting up model');
          setIsLoading(false);
          toast.error('Failed to setup model');
        }
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
      },
      (error) => {
        console.error('Error loading STL:', error);
        setError('Failed to load model');
        setIsLoading(false);
        toast.error('Failed to load model');
      }
    );

    return () => {
      // Cleanup
      if (meshRef.current && sceneRef.current) {
        sceneRef.current.remove(meshRef.current);
      }
    };
  }, [modelUrl]);

  return { isLoading, error };
};