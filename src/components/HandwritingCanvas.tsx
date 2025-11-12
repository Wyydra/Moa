import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, GestureResponderEvent, NativeModules, Alert } from 'react-native';
import { Skia, SkPath } from '@shopify/react-native-skia';
import { validateStrokeOrder, validateMultipleCharacters, validateJamoSequence } from '../utils/strokeOrder/validator';
import { ValidationResult } from '../utils/strokeOrder/types';
import { StrokeOrderFeedback, FeedbackMessage } from './StrokeOrderFeedback';
import { StrokeGuide, StrokeAnimation, AnimationControls } from './StrokeAnimation';
import { isCharacterSupported, decomposeHangul } from '../utils/strokeOrder/database';

const { HandwritingModule } = NativeModules;

export interface Point {
  x: number;
  y: number;
  t: number;
}

export interface Stroke {
  points: Point[];
}

interface HandwritingCanvasProps {
  onRecognitionResult?: (result: string[]) => void;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  practiceMode?: boolean;
  targetCharacter?: string;
  showGuides?: boolean;
  onValidationComplete?: (validation: ValidationResult) => void;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  onRecognitionResult,
  width = 300,
  height = 400,
  strokeColor = '#FFD700',
  strokeWidth = 3,
  practiceMode = false,
  targetCharacter = '',
  showGuides = false,
  onValidationComplete,
}) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('Checking model...');
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [strokeOrderCheckEnabled, setStrokeOrderCheckEnabled] = useState(false);
  const [detectedCharacter, setDetectedCharacter] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    initializeKoreanModel();
  }, []);

  const initializeKoreanModel = async () => {
    try {
      setDownloadStatus('Checking for Korean model...');
      const isDownloaded = await HandwritingModule.isModelDownloaded('ko');
      
      if (!isDownloaded) {
        Alert.alert(
          'Download Required',
          'Korean language model needs to be downloaded. This may take a moment (approx. 20-30MB).',
          [
            {
              text: 'Download',
              onPress: async () => {
                try {
                  setDownloadStatus('Downloading Korean model...');
                  await HandwritingModule.downloadModel('ko');
                  setDownloadStatus('Initializing recognizer...');
                  await HandwritingModule.initializeRecognizer('ko');
                  setModelReady(true);
                  setDownloadStatus('Ready!');
                  Alert.alert('Success', 'Korean model is ready to use!');
                } catch (error) {
                  console.error('Download error:', error);
                  setDownloadStatus('Download failed');
                  Alert.alert('Error', 'Failed to download model: ' + error);
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setDownloadStatus('Download cancelled'),
            },
          ]
        );
      } else {
        setDownloadStatus('Initializing recognizer...');
        await HandwritingModule.initializeRecognizer('ko');
        setModelReady(true);
        setDownloadStatus('Ready!');
      }
    } catch (error) {
      console.error('Model initialization error:', error);
      setDownloadStatus('Initialization failed');
      Alert.alert('Error', 'Failed to initialize handwriting recognition: ' + error);
    }
  };

  const handleTouchStart = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const adjustedX = locationX + offsetX;
    const newStroke: Stroke = {
      points: [{ x: adjustedX, y: locationY, t: Date.now() }],
    };
    setCurrentStroke(newStroke);
    
    const path = Skia.Path.Make();
    path.moveTo(locationX, locationY);
    setCurrentPath(path);
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    if (!currentStroke || !currentPath) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const adjustedX = locationX + offsetX;
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x: adjustedX, y: locationY, t: Date.now() }],
    };
    setCurrentStroke(updatedStroke);
    
    currentPath.lineTo(locationX, locationY);
    setCurrentPath(currentPath.copy());
  };

  const handleTouchEnd = () => {
    if (currentStroke && currentPath) {
      const updatedStrokes = [...strokes, currentStroke];
      const updatedPaths = [...paths, currentPath];
      setStrokes(updatedStrokes);
      setPaths(updatedPaths);
      setCurrentStroke(null);
      setCurrentPath(null);
      
      if (practiceMode && targetCharacter && isCharacterSupported(targetCharacter)) {
        const validationResult = validateStrokeOrder(
          updatedStrokes,
          targetCharacter,
          width,
          height
        );
        setValidation(validationResult);
        onValidationComplete?.(validationResult);
      }
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (recognitionTimerRef.current) {
        clearTimeout(recognitionTimerRef.current);
      }
      
      if (!practiceMode) {
        inactivityTimerRef.current = setTimeout(() => {
          setOffsetX(prev => prev + width * 0.4);
        }, 1500);
      }
      
      recognitionTimerRef.current = setTimeout(async () => {
        if (!modelReady || updatedStrokes.length === 0) return;
        
        try {
          const result = await HandwritingModule.recognize(updatedStrokes);
          if (result && result.length > 0) {
            if (strokeOrderCheckEnabled) {
              const firstRecognized = result[0];
              const decomposed = decomposeHangul(firstRecognized);
              const supportedJamo = decomposed.filter((jamo: string) => isCharacterSupported(jamo));
              
              if (supportedJamo.length > 0) {
                setDetectedCharacter(firstRecognized);
                
                const { validations, groups } = validateJamoSequence(
                  updatedStrokes,
                  supportedJamo,
                  width,
                  height
                );
                
                const allCorrect = validations.every((v: ValidationResult) => v.isCorrect);
                const firstError = validations.find((v: ValidationResult) => !v.isCorrect);
                
                if (allCorrect && validations.length > 0) {
                  const combinedValidation: ValidationResult = {
                    isCorrect: true,
                    correctStrokes: validations.reduce((sum: number, v: ValidationResult) => sum + v.correctStrokes, 0),
                    totalStrokes: validations.reduce((sum: number, v: ValidationResult) => sum + v.totalStrokes, 0),
                    errors: [],
                  };
                  setValidation(combinedValidation);
                } else if (firstError) {
                  setValidation(firstError);
                } else {
                  setValidation(null);
                }
                
                const strokesInfo = updatedStrokes.map((stroke, idx) => {
                  const centerX = stroke.points.reduce((sum, p) => sum + p.x, 0) / stroke.points.length;
                  const centerY = stroke.points.reduce((sum, p) => sum + p.y, 0) / stroke.points.length;
                  return `S${idx + 1}: (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`;
                }).join(', ');
                
                const jamoInfo = supportedJamo.map((jamo: string, idx: number) => {
                  const validation = validations[idx];
                  const status = validation?.isCorrect ? '✓' : '✗';
                  const group = groups[idx] || [];
                  return `${jamo}[${group.length}]${status}`;
                }).join(' ');
                
                const errorDetails: string[] = [];
                validations.forEach((validation: ValidationResult, idx: number) => {
                  if (!validation.isCorrect && validation.errors.length > 0) {
                    validation.errors.forEach(error => {
                      const jamo = supportedJamo[idx];
                      errorDetails.push(`  ${jamo} stroke ${error.strokeIndex + 1}: ${error.errorType} (${error.message})`);
                    });
                  }
                });
                
                const debugLines = [
                  `Recognized: ${result.slice(0, 3).join(', ')}`,
                  `Decomposed: ${decomposed.join(' + ')} → ${supportedJamo.join(' + ')}`,
                  `Sequential grouping: ${supportedJamo.map((j, i) => `${j}:${groups[i]?.length || 0}`).join(', ')}`,
                  `Strokes[${updatedStrokes.length}]: ${strokesInfo}`,
                  `Validation: ${jamoInfo}`,
                ];
                
                if (allCorrect) {
                  debugLines.push('All correct!');
                } else if (errorDetails.length > 0) {
                  debugLines.push('Errors:');
                  debugLines.push(...errorDetails);
                }
                
                const debugText = debugLines.join('\n');
                
                setDebugInfo(debugText);
                
                if (allCorrect && validations.length > 0) {
                  onRecognitionResult?.([firstRecognized]);
                  setTimeout(() => {
                    setStrokes([]);
                    setPaths([]);
                    setValidation(null);
                    setDetectedCharacter('');
                    setDebugInfo('');
                    setOffsetX(prev => prev + width * 0.4);
                  }, 800);
                }
              } else {
                onRecognitionResult?.(result);
              }
            } else {
              onRecognitionResult?.(result);
            }
          }
        } catch (error) {
          console.error('Recognition error:', error);
        }
      }, 1500);
    }
  };



  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    setPaths([]);
    setCurrentPath(null);
    setValidation(null);
    setDetectedCharacter('');
    setDebugInfo('');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (recognitionTimerRef.current) {
      clearTimeout(recognitionTimerRef.current);
    }
    setOffsetX(0);
  }, []);

  const scrollLeft = () => {
    setOffsetX(prev => Math.max(0, prev - width * 0.4));
  };

  const scrollRight = () => {
    setOffsetX(prev => prev + width * 0.4);
  };

  return (
    <View style={styles.container}>
      <View 
        style={[styles.canvasContainer, { width, height, overflow: 'hidden' }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
      >
        <View style={{ transform: [{ translateX: practiceMode ? 0 : -offsetX }] }}>
          {showGuides && targetCharacter && (
            <StrokeGuide
              character={targetCharacter}
              width={width}
              height={height}
            />
          )}
          {showAnimation && targetCharacter && (
            <StrokeAnimation
              character={targetCharacter}
              width={width}
              height={height}
              isPlaying={isAnimationPlaying}
              onComplete={() => setIsAnimationPlaying(false)}
            />
          )}
          {!showAnimation && (
            <StrokeOrderFeedback
              validation={(practiceMode || strokeOrderCheckEnabled) ? validation : null}
              paths={paths}
              currentPath={currentPath}
              width={width}
              height={height}
              strokeWidth={strokeWidth}
              strokes={strokes}
              showDebugCenters={strokeOrderCheckEnabled}
            />
          )}
        </View>
      </View>
      {practiceMode && targetCharacter && (
        <AnimationControls
          onPlay={() => {
            setShowAnimation(true);
            setIsAnimationPlaying(true);
          }}
          onPause={() => setIsAnimationPlaying(false)}
          onReset={() => {
            setShowAnimation(false);
            setIsAnimationPlaying(false);
          }}
          isPlaying={isAnimationPlaying}
        />
      )}
      <View style={styles.controlsContainer}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Stroke Order Check</Text>
          <TouchableOpacity
            style={[styles.toggle, strokeOrderCheckEnabled && styles.toggleActive]}
            onPress={() => {
              setStrokeOrderCheckEnabled(!strokeOrderCheckEnabled);
              setValidation(null);
              setDetectedCharacter('');
            }}
          >
            <View style={[styles.toggleThumb, strokeOrderCheckEnabled && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
        <View style={styles.navigationRow}>
          {!practiceMode && (
            <>
              <TouchableOpacity 
                style={[styles.arrowButton, offsetX === 0 && styles.disabledArrow]} 
                onPress={scrollLeft}
                disabled={offsetX === 0}
              >
                <Text style={styles.arrowText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowButton} onPress={scrollRight}>
                <Text style={styles.arrowText}>→</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      {(practiceMode || strokeOrderCheckEnabled) && validation && (
        <View style={styles.validationContainer}>
          {strokeOrderCheckEnabled && detectedCharacter && (
            <Text style={styles.detectedText}>Detected: {detectedCharacter}</Text>
          )}
          <FeedbackMessage validation={validation} />
        </View>
      )}
      {strokeOrderCheckEnabled && debugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}
      <View style={styles.infoRow}>
        {!modelReady && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{downloadStatus}</Text>
          </View>
        )}
        {modelReady && strokes.length > 0 && (
          <Text style={styles.strokeCounter}>{strokes.length} stroke{strokes.length !== 1 ? 's' : ''}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCCCCC',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  navigationRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  arrowButton: {
    width: 36,
    height: 36,
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledArrow: {
    backgroundColor: '#CCCCCC',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  canvasContainer: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderRadius: 8,
  },
  statusContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE08A',
  },
  statusText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoRow: {
    marginTop: 12,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeCounter: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  validationContainer: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  detectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 8,
  },
  debugContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#90CAF9',
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    color: '#1565C0',
    fontFamily: 'monospace',
  },
});
