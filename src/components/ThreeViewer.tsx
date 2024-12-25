import React from 'react';
import { useThreeScene } from './three/useThreeScene';
import { useModelLoader } from './three/useModelLoader';

interface ThreeViewerProps {
  modelUrl?: string;
}

const ThreeViewer: React.FC<ThreeViewerProps> = ({ modelUrl }) => {
  const {
    mountRef,
    sceneRef,
    cameraRef,
    meshRef,
  } = useThreeScene();

  const { isLoading, error } = useModelLoader({
    modelUrl,
    sceneRef,
    cameraRef,
    meshRef,
  });

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          Loading model...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          Error loading model: {error}
        </div>
      )}
    </div>
  );
};

export default ThreeViewer;