import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import { getCharacterStrokes } from '../../utils/strokeOrder/database';

interface StrokeAnimationProps {
  character: string;
  width: number;
  height: number;
  strokeColor?: string;
  strokeWidth?: number;
  isPlaying: boolean;
  onComplete?: () => void;
  speed?: number;
}

export const StrokeAnimation: React.FC<StrokeAnimationProps> = ({
  character,
  width,
  height,
  strokeColor = '#4A90E2',
  strokeWidth = 3,
  isPlaying,
  onComplete,
  speed = 1000,
}) => {
  const [animatedPaths, setAnimatedPaths] = useState<SkPath[]>([]);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      setAnimatedPaths([]);
      setCurrentStrokeIndex(0);
      return;
    }

    const characterData = getCharacterStrokes(character);
    if (!characterData) return;

    const timer = setTimeout(() => {
      if (currentStrokeIndex < characterData.strokes.length) {
        const stroke = characterData.strokes[currentStrokeIndex];
        const path = Skia.Path.Make();

        const startX = stroke.startX * width;
        const startY = stroke.startY * height;
        const endX = stroke.endX * width;
        const endY = stroke.endY * height;

        path.moveTo(startX, startY);
        path.lineTo(endX, endY);

        setAnimatedPaths(prev => [...prev, path]);
        setCurrentStrokeIndex(prev => prev + 1);
      } else {
        onComplete?.();
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStrokeIndex, character, width, height, speed, onComplete]);

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        {animatedPaths.map((path, index) => (
          <Path
            key={`animated-stroke-${index}`}
            path={path}
            color={strokeColor}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}
      </Canvas>
      {currentStrokeIndex < (getCharacterStrokes(character)?.strokes.length || 0) && (
        <View style={styles.strokeIndicator}>
          <Text style={styles.strokeIndicatorText}>
            Stroke {currentStrokeIndex + 1}
          </Text>
        </View>
      )}
    </View>
  );
};

interface StrokeGuideProps {
  character: string;
  width: number;
  height: number;
  guideColor?: string;
  strokeWidth?: number;
  showNumbers?: boolean;
}

export const StrokeGuide: React.FC<StrokeGuideProps> = ({
  character,
  width,
  height,
  guideColor = 'rgba(74, 144, 226, 0.3)',
  strokeWidth = 2,
  showNumbers = true,
}) => {
  const characterData = getCharacterStrokes(character);

  if (!characterData) {
    return null;
  }

  const guidePaths = characterData.strokes.map(stroke => {
    const path = Skia.Path.Make();
    const startX = stroke.startX * width;
    const startY = stroke.startY * height;
    const endX = stroke.endX * width;
    const endY = stroke.endY * height;

    path.moveTo(startX, startY);
    path.lineTo(endX, endY);

    return { path, startX, startY };
  });

  return (
    <View style={styles.guideContainer} pointerEvents="none">
      <Canvas style={{ width, height }}>
        {guidePaths.map((guide, index) => (
          <Path
            key={`guide-${index}`}
            path={guide.path}
            color={guideColor}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            strokeJoin="round"
          />
        ))}
      </Canvas>
      {showNumbers && (
        <View style={StyleSheet.absoluteFill}>
          {guidePaths.map((guide, index) => (
            <View
              key={`guide-number-${index}`}
              style={[
                styles.guideNumber,
                {
                  left: guide.startX - 16,
                  top: guide.startY - 16,
                },
              ]}
            >
              <Text style={styles.guideNumberText}>{index + 1}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

interface AnimationControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  isPlaying: boolean;
}

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  onPlay,
  onPause,
  onReset,
  isPlaying,
}) => {
  return (
    <View style={styles.controls}>
      {!isPlaying ? (
        <TouchableOpacity style={styles.controlButton} onPress={onPlay}>
          <Text style={styles.controlButtonText}>▶ Play</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.controlButton} onPress={onPause}>
          <Text style={styles.controlButtonText}>⏸ Pause</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.controlButton} onPress={onReset}>
        <Text style={styles.controlButtonText}>↻ Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  strokeIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  strokeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  guideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  guideNumber: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  guideNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
    justifyContent: 'center',
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 6,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
