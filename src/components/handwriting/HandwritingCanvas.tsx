import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, GestureResponderEvent, NativeModules, Alert, Animated, Easing, Dimensions, useColorScheme } from 'react-native';
import { Skia, SkPath } from '@shopify/react-native-skia';
import { StrokeOrderFeedback } from './StrokeOrderFeedback';
import { getHandwritingLanguage } from '../../data/storage';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../utils/constants';
import type { Stroke } from './types';

const { HandwritingModule } = NativeModules;

const SLIDE_OFFSET_RATIO = 0.15;
const SLIDE_DURATION = 300;
const INACTIVITY_DELAY = 1500;
const RECOGNITION_DELAY = 1500;
const CANVAS_WIDTH_PERCENT = 0.85; // 85% of screen width
const NEXT_COLUMN_SPACING = 40; // Spacing after last stroke before centering next writing zone

// Canvas background colors for light/dark themes
const CANVAS_BG = {
  light: '#F5F5F5',  // Light gray for light theme
  dark: '#0F0F0F',   // Deep black for dark theme
};

interface HandwritingCanvasProps {
  onRecognitionResult?: (result: string[]) => void;
  onClear?: () => void;
  onDone?: () => void;
  width?: number;
  height?: number;
  strokeWidth?: number;
  disableNavigation?: boolean;
}

const HandwritingCanvasComponent: React.FC<HandwritingCanvasProps> = ({
  onRecognitionResult,
  onClear,
  onDone,
  width: propWidth,
  height = 400,
  strokeWidth = 3,
  disableNavigation = false,
}) => {
  // Detect color scheme for adaptive canvas background
  const colorScheme = useColorScheme();
  const canvasBackgroundColor = colorScheme === 'dark' ? CANVAS_BG.dark : CANVAS_BG.light;
  
  // Calculate width as percentage of screen if not provided
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || Math.floor(screenWidth * CANVAS_WIDTH_PERCENT);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>('Checking model...');
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use ref to track current offset synchronously (no async state updates)
  const offsetXRef = useRef(0);
  const offsetXAnim = useRef(new Animated.Value(0)).current;
  const [isSliding, setIsSliding] = useState(false);
  const [offsetXDisplay, setOffsetXDisplay] = useState(0); // For UI only

  useEffect(() => {
    initializeHandwritingModel();
  }, []);

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      'ko': 'Korean',
      'ja': 'Japanese',
    };
    return names[code] || code;
  };

  const initializeHandwritingModel = async () => {
    try {
      const savedLanguage = await getHandwritingLanguage();
      const languageCode = savedLanguage || 'ko';
      const languageName = getLanguageName(languageCode);
      
      setDownloadStatus(`Checking for ${languageName} model...`);
      const isDownloaded = await HandwritingModule.isModelDownloaded(languageCode);
      
      if (!isDownloaded) {
        Alert.alert(
          'Download Required',
          `${languageName} language model needs to be downloaded. This may take a moment (approx. 20-30MB).`,
          [
            {
              text: 'Download',
              onPress: async () => {
                try {
                  setDownloadStatus(`Downloading ${languageName} model...`);
                  await HandwritingModule.downloadModel(languageCode);
                  setDownloadStatus('Initializing recognizer...');
                  await HandwritingModule.initializeRecognizer(languageCode);
                  setModelReady(true);
                  setDownloadStatus('Ready!');
                  Alert.alert('Success', `${languageName} model is ready to use!`);
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
        await HandwritingModule.initializeRecognizer(languageCode);
        setModelReady(true);
        setDownloadStatus('Ready!');
      }
    } catch (error) {
      console.error('Model initialization error:', error);
      setDownloadStatus('Initialization failed');
      Alert.alert('Error', 'Failed to initialize handwriting recognition: ' + error);
    }
  };

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (recognitionTimerRef.current) clearTimeout(recognitionTimerRef.current);
  }, []);

  const animateSlide = useCallback((newOffset: number) => {
    offsetXRef.current = newOffset; // Update ref immediately (synchronous)
    setOffsetXDisplay(newOffset); // Update display for UI
    setIsSliding(true);
    Animated.timing(offsetXAnim, {
      toValue: newOffset,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      setIsSliding(false);
    });
  }, [offsetXAnim]);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    // If sliding, cancel the animation and allow new stroke
    if (isSliding) {
      offsetXAnim.stopAnimation((value) => {
        offsetXRef.current = value;
        setOffsetXDisplay(value);
      });
      setIsSliding(false);
    }
    
    // Clear any pending auto-slide timer
    clearTimers();
    
    const { locationX, locationY } = event.nativeEvent;
    const currentOffset = offsetXRef.current;
    const globalX = locationX + currentOffset;
    
    // Store GLOBAL coordinates for recognition
    setCurrentStroke({ points: [{ x: globalX, y: locationY, t: Date.now() }] });
    
    // But use LOCAL coordinates for path drawing (viewport-relative)
    const path = Skia.Path.Make();
    path.moveTo(locationX, locationY);
    setCurrentPath(path);
  }, [isSliding, offsetXAnim, clearTimers]);

  const handleTouchMove = useCallback((event: GestureResponderEvent) => {
    if (!currentStroke || !currentPath) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const globalX = locationX + offsetXRef.current;
    
    // Store GLOBAL coordinates for recognition
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, { x: globalX, y: locationY, t: Date.now() }],
    });
    
    // But use LOCAL coordinates for path drawing (viewport-relative)
    currentPath.lineTo(locationX, locationY);
    setCurrentPath(currentPath.copy());
  }, [currentStroke, currentPath, isSliding]);

  const handleTouchEnd = useCallback(() => {
    if (!currentStroke || !currentPath) return;
    
    const updatedStrokes = [...strokes, currentStroke];
    const updatedPaths = [...paths, currentPath];
    setStrokes(updatedStrokes);
    setPaths(updatedPaths);
    setCurrentStroke(null);
    setCurrentPath(null);
    
    clearTimers();
    
    // Calculate the center position of the last stroke
    const lastStrokeCenterX = currentStroke.points.reduce((sum, p) => sum + p.x, 0) / currentStroke.points.length;
    const viewportCenter = offsetXRef.current + width / 2;
    
    // If the last stroke is at or past the center, slide to position it on the left
    if (lastStrokeCenterX >= viewportCenter) {
      inactivityTimerRef.current = setTimeout(() => {
        // Position the last stroke at 1/3 from the left (leaving 2/3 space on the right)
        // Formula: lastStrokeCenterX should be at (offset + width/3)
        // So: newOffset + width/3 = lastStrokeCenterX
        // Therefore: newOffset = lastStrokeCenterX - width/3
        const newOffset = lastStrokeCenterX - width / 3;
        
        // Make sure we don't go backwards
        if (newOffset > offsetXRef.current) {
          animateSlide(newOffset);
        }
      }, INACTIVITY_DELAY);
    }
    
    // Recognize handwriting
    recognitionTimerRef.current = setTimeout(async () => {
      if (!modelReady || updatedStrokes.length === 0) return;
      
      try {
        const result = await HandwritingModule.recognize(updatedStrokes);
        if (result && result.length > 0) {
          onRecognitionResult?.(result);
        }
      } catch (error) {
        console.error('Recognition error:', error);
      }
    }, RECOGNITION_DELAY);
  }, [isSliding, currentStroke, currentPath, strokes, paths, clearTimers, animateSlide, width, modelReady, onRecognitionResult]);

  const clearCanvas = useCallback(() => {
    clearTimers();
    
    // Clear strokes immediately (user doesn't see them slide)
    setStrokes([]);
    setCurrentStroke(null);
    setPaths([]);
    setCurrentPath(null);
    onClear?.();
    
    // Then slide back to origin if needed (smooth canvas reset)
    if (offsetXRef.current > 0) {
      setIsSliding(true);
      Animated.timing(offsetXAnim, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        offsetXRef.current = 0;
        setOffsetXDisplay(0);
        setIsSliding(false);
      });
    } else {
      // Already at origin, just reset offset state
      offsetXAnim.stopAnimation();
      offsetXAnim.setValue(0);
      offsetXRef.current = 0;
      setOffsetXDisplay(0);
      setIsSliding(false);
    }
  }, [onClear, offsetXAnim, clearTimers]);

  const undoLastStroke = useCallback(() => {
    if (strokes.length === 0 || isSliding) return;
    
    clearTimers();
    
    // Get the last stroke before removing it
    const lastStroke = strokes[strokes.length - 1];
    
    // Remove last stroke and path
    const newStrokes = strokes.slice(0, -1);
    const newPaths = paths.slice(0, -1);
    setStrokes(newStrokes);
    setPaths(newPaths);
    
    // Calculate if last stroke was before viewport center
    const strokeCenterX = lastStroke.points.reduce((sum, p) => sum + p.x, 0) / lastStroke.points.length;
    const viewportCenter = offsetXRef.current + width / 2;
    
    // If last stroke was BEFORE viewport center, slide back
    if (strokeCenterX < viewportCenter && offsetXRef.current > 0) {
      const newOffset = Math.max(0, offsetXRef.current - width * SLIDE_OFFSET_RATIO);
      animateSlide(newOffset);
    }
    
    // Re-trigger recognition if strokes remain
    if (newStrokes.length > 0 && modelReady) {
      recognitionTimerRef.current = setTimeout(async () => {
        try {
          const result = await HandwritingModule.recognize(newStrokes);
          if (result && result.length > 0) {
            onRecognitionResult?.(result);
          }
        } catch (error) {
          console.error('Recognition error:', error);
        }
      }, RECOGNITION_DELAY);
    }
  }, [strokes, paths, isSliding, clearTimers, width, animateSlide, modelReady, onRecognitionResult]);

  const scrollLeft = useCallback(() => {
    if (isSliding) return;
    const newOffset = Math.max(0, offsetXRef.current - width * SLIDE_OFFSET_RATIO);
    animateSlide(newOffset);
  }, [width, isSliding, animateSlide]);

  const scrollRight = useCallback(() => {
    if (isSliding || strokes.length === 0) return;
    
    // Get the last (most recent) stroke
    const lastStroke = strokes[strokes.length - 1];
    
    // Calculate center of last stroke
    const lastStrokeCenterX = lastStroke.points.reduce((sum, p) => sum + p.x, 0) / lastStroke.points.length;
    
    // Calculate viewport boundaries
    const viewportLeft = offsetXRef.current;
    const viewportCenter = offsetXRef.current + width / 2;
    
    // Don't scroll right if last stroke is already in the LEFT QUARTER of viewport
    // This allows one more scroll to center the stroke for comfortable drawing
    if (lastStrokeCenterX < viewportLeft + width * 0.25) return;
    
    const newOffset = offsetXRef.current + width * SLIDE_OFFSET_RATIO;
    animateSlide(newOffset);
  }, [width, isSliding, animateSlide, strokes]);

  return (
    <View style={styles.container}>
      <View 
        style={[styles.canvasContainer, { width, height, overflow: 'hidden', backgroundColor: canvasBackgroundColor }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
      >
        <Animated.View style={{ transform: [{ translateX: Animated.multiply(offsetXAnim, -1) }] }}>
          <StrokeOrderFeedback
            validation={null}
            paths={paths}
            currentPath={currentPath}
            width={width}
            height={height}
            strokeWidth={strokeWidth}
            strokes={strokes}
            showDebugCenters={false}
            strokeColor={colorScheme === 'dark' ? COLORS.primaryLight : COLORS.primary}
          />
        </Animated.View>
      </View>
      
      <View style={styles.controlsContainer}>
        {!modelReady ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{downloadStatus}</Text>
          </View>
        ) : (
          <View style={styles.navigationRow}>
            {strokes.length > 0 && (
              <View style={styles.strokeCounterContainer}>
                <Text style={styles.strokeCounter}>{strokes.length}</Text>
              </View>
            )}
            
            <View style={styles.navigationButtonsGroup}>
              {!disableNavigation && (
                <>
                  <TouchableOpacity 
                    style={[styles.arrowButton, (offsetXDisplay === 0 || isSliding) && styles.disabledArrow]} 
                    onPress={scrollLeft}
                    disabled={offsetXDisplay === 0 || isSliding}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.arrowText}>←</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.arrowButton, isSliding && styles.disabledArrow]} 
                    onPress={scrollRight}
                    disabled={isSliding}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.arrowText}>→</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity 
                style={[styles.arrowButton, (strokes.length === 0 || isSliding) && styles.disabledArrow]} 
                onPress={undoLastStroke}
                disabled={strokes.length === 0 || isSliding}
                activeOpacity={0.7}
              >
                <Text style={styles.arrowText}>⌫</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.rightButtonsGroup}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearCanvas}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              
              {onDone && (
                <TouchableOpacity 
                  style={styles.doneButton} 
                  onPress={onDone}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const arePropsEqual = (
  prevProps: HandwritingCanvasProps,
  nextProps: HandwritingCanvasProps
): boolean => {
  return (
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.strokeWidth === nextProps.strokeWidth &&
    prevProps.onRecognitionResult === nextProps.onRecognitionResult &&
    prevProps.onClear === nextProps.onClear &&
    prevProps.onDone === nextProps.onDone &&
    prevProps.disableNavigation === nextProps.disableNavigation
  );
};

export const HandwritingCanvas = React.memo(HandwritingCanvasComponent, arePropsEqual);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  navigationRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navigationButtonsGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  arrowButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  disabledArrow: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  arrowText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  canvasContainer: {
    // backgroundColor is set dynamically based on color scheme
    borderWidth: 0,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.lg,
    overflow: 'hidden',
  },
  statusContainer: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.warning + '20', // 20% opacity
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning + '40', // 40% opacity
  },
  statusText: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  strokeCounterContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  strokeCounter: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  rightButtonsGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  clearButtonSeparated: {
    // No margin needed - justifyContent: 'space-between' handles spacing
  },
  clearButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  doneButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  doneButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
