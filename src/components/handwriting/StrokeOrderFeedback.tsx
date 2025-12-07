import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, SkPath, Circle } from '@shopify/react-native-skia';
import { ValidationResult } from '../../utils/strokeOrder/types';
import { COLORS } from '../../utils/constants';
import type { Stroke } from './types';

interface StrokeOrderFeedbackProps {
  validation: ValidationResult | null;
  paths: SkPath[];
  currentPath: SkPath | null;
  width: number;
  height: number;
  strokeWidth?: number;
  strokes?: Stroke[];
  showDebugCenters?: boolean;
  virtualWidth?: number;
  strokeColor?: string;
}

export const StrokeOrderFeedback: React.FC<StrokeOrderFeedbackProps> = ({
  validation,
  paths,
  currentPath,
  width,
  height,
  strokeWidth = 3,
  strokes = [],
  showDebugCenters = false,
  virtualWidth,
  strokeColor = COLORS.primary,
}) => {
  const getStrokeColor = (index: number): string => {
    if (!validation) {
      return strokeColor;
    }
    
    const error = validation.errors.find(e => e.strokeIndex === index);
    
    if (error) {
      return COLORS.danger;
    }
    
    if (index < validation.correctStrokes) {
      return COLORS.success;
    }
    
    return strokeColor;
  };

  const canvasWidth = virtualWidth || width;

  return (
    <Canvas style={{ width: canvasWidth, height }}>
      {paths.map((path, index) => (
        <Path
          key={`stroke-${index}`}
          path={path}
          color={getStrokeColor(index)}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          strokeJoin="round"
        />
      ))}
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
      
      {showDebugCenters && validation && validation.errors.length > 0 && strokes.length > 0 && (
        <>
          {validation.errors.map((error, idx) => {
            if (error.errorType !== 'position' && error.errorType !== 'direction') return null;
            
            const stroke = strokes[error.strokeIndex];
            if (!stroke || stroke.points.length === 0) return null;
            
            const actualCenterX = stroke.points.reduce((sum, p) => sum + p.x, 0) / stroke.points.length;
            const actualCenterY = stroke.points.reduce((sum, p) => sum + p.y, 0) / stroke.points.length;
            
            const expectedCenterX = (error.expected.startX + error.expected.endX) / 2 * width;
            const expectedCenterY = (error.expected.startY + error.expected.endY) / 2 * height;
            
            return (
              <React.Fragment key={`debug-${idx}`}>
                <Circle
                  cx={actualCenterX}
                  cy={actualCenterY}
                  r={8}
                  color="rgba(255, 68, 68, 0.7)"
                  style="fill"
                />
                <Circle
                  cx={expectedCenterX}
                  cy={expectedCenterY}
                  r={8}
                  color="rgba(76, 175, 80, 0.7)"
                  style="fill"
                />
                <Circle
                  cx={expectedCenterX}
                  cy={expectedCenterY}
                  r={8}
                  color="rgba(76, 175, 80, 1)"
                  style="stroke"
                  strokeWidth={2}
                />
              </React.Fragment>
            );
          })}
        </>
      )}
    </Canvas>
  );
};

interface FeedbackMessageProps {
  validation: ValidationResult | null;
}

export const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ validation }) => {
  if (!validation) {
    return null;
  }

  const getMessage = () => {
    if (validation.isCorrect) {
      return { text: '완벽해요! Perfect! 🎉', color: '#4CAF50' };
    }

    if (validation.errors.length > 0) {
      const firstError = validation.errors[0];
      let message = '';

      switch (firstError.errorType) {
        case 'count':
          message = firstError.message;
          break;
        case 'direction':
          message = `Stroke ${firstError.strokeIndex + 1}: Check direction`;
          break;
        case 'position':
          message = `Stroke ${firstError.strokeIndex + 1}: Check position`;
          break;
        case 'sequence':
          message = `Stroke ${firstError.strokeIndex + 1}: Wrong order`;
          break;
        default:
          message = 'Try again';
      }

      return { text: message, color: '#FF6B6B' };
    }

    const progress = Math.round(
      (validation.correctStrokes / validation.totalStrokes) * 100
    );
    return { text: `${progress}% correct`, color: '#FFA500' };
  };

  const { text, color } = getMessage();

  return (
    <View style={styles.messageContainer}>
      <Text style={[styles.messageText, { color }]}>{text}</Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(validation.correctStrokes / validation.totalStrokes) * 100}%`,
              backgroundColor: validation.isCorrect ? '#4CAF50' : '#FFA500',
            },
          ]}
        />
      </View>
    </View>
  );
};

interface StrokeNumberOverlayProps {
  paths: SkPath[];
  width: number;
  height: number;
  showNumbers: boolean;
}

export const StrokeNumberOverlay: React.FC<StrokeNumberOverlayProps> = ({
  paths,
  showNumbers,
}) => {
  if (!showNumbers || paths.length === 0) {
    return null;
  }

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {paths.map((path, index) => {
        const bounds = path.computeTightBounds();
        if (!bounds) return null;

        const x = bounds.x + bounds.width / 2;
        const y = bounds.y + bounds.height / 2;

        return (
          <View
            key={`number-${index}`}
            style={[
              styles.strokeNumber,
              {
                left: x - 12,
                top: y - 12,
              },
            ]}
          >
            <Text style={styles.strokeNumberText}>{index + 1}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    minWidth: 200,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  strokeNumber: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});
