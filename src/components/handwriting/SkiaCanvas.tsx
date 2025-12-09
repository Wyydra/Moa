import React from 'react';
import { Canvas, Path, SkPath } from '@shopify/react-native-skia';

interface SkiaCanvasProps {
  paths: SkPath[];
  currentPath: SkPath | null;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: string;
}

export const SkiaCanvas: React.FC<SkiaCanvasProps> = ({
  paths,
  currentPath,
  width,
  height,
  strokeWidth = 3,
  strokeColor = '#FFD700',
}) => {
  return (
    <Canvas style={{ width, height }}>
      {/* Render completed strokes */}
      {paths.map((path, index) => (
        <Path
          key={`stroke-${index}`}
          path={path}
          color={strokeColor}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          strokeJoin="round"
        />
      ))}
      
      {/* Render current stroke being drawn */}
      {currentPath && (
        <Path
          path={currentPath}
          color="#FFD700"
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          strokeJoin="round"
        />
      )}
    </Canvas>
  );
};
