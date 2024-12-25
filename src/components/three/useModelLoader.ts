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

  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;

    setIsLoading(true);

    const loader = new STLLoader();
    loader.load(
      modelUrl,
      (geometry) => {
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
          const maxDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));

          if (cameraRef.current) {
            cameraRef.current.position.z = maxDistance * 1.5;
            cameraRef.current.updateProjectionMatrix();
          }
        }

        setIsLoading(false);
        toast.success('Model loaded successfully');
      },
      undefined,
      (error) => {
        console.error('Error loading STL:', error);
        setIsLoading(false);
        toast.error('Failed to load model');
      }
    );
  }, [modelUrl]);

  return { isLoading };
};