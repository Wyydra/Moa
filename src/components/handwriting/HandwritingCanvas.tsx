import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, GestureResponderEvent, NativeModules, Alert, Animated, Easing, Dimensions } from 'react-native';
import { Skia, SkPath } from '@shopify/react-native-skia';
import { SkiaCanvas } from './SkiaCanvas';
import { getHandwritingLanguage } from '../../data/storage';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';
import type { Stroke } from './types';
import type { Theme } from '../../utils/themes';

const { HandwritingModule } = NativeModules;

const SLIDE_OFFSET_RATIO = 0.15; // 15% of width per slide
const SLIDE_DURATION = 300;
const INACTIVITY_DELAY = 1500;
const RECOGNITION_DELAY = 1500;
const CANVAS_WIDTH_PERCENT = 0.85;
const EMPTY_SPACE_TARGET = 0.8; // 80% empty space (20% occupied)

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  ja: 'Japanese',
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
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const width = propWidth || Math.floor(Dimensions.get('window').width * CANVAS_WIDTH_PERCENT);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('Checking model...');
  const [isSliding, setIsSliding] = useState(false);
  const [offsetXDisplay, setOffsetXDisplay] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(width);
  
  const offsetXRef = useRef(0);
  const strokeStartOffsetRef = useRef(0); // Capture offset when stroke starts
  const isDrawingRef = useRef(false); // Track if currently drawing
  const containerRef = useRef<View>(null); // Reference to container for pageX calculations
  const containerPageXRef = useRef(0); // Store container's pageX position
  const lastStrokePageXRef = useRef(0); // Store last stroke's true screen position
  const offsetXAnim = useRef(new Animated.Value(0)).current;
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeHandwritingModel();
  }, []);

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (recognitionTimerRef.current) clearTimeout(recognitionTimerRef.current);
  }, []);

  const initializeHandwritingModel = async () => {
    try {
      const languageCode = (await getHandwritingLanguage()) || 'ko';
      const languageName = LANGUAGE_NAMES[languageCode] || languageCode;
      
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

  const animateSlide = useCallback((newOffset: number) => {
    setIsSliding(true);
    offsetXRef.current = newOffset;
    setOffsetXDisplay(newOffset);
    // Extend canvas width to accommodate the new offset + viewport
    setCanvasWidth(newOffset + width);
    Animated.timing(offsetXAnim, {
      toValue: newOffset,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => setIsSliding(false));
  }, [offsetXAnim, width]);

  const getEmptySpaceRatio = useCallback((strokeList: Stroke[]) => {
    const allPoints = strokeList.flatMap(stroke => stroke.points.map(p => p.x));
    if (allPoints.length === 0) return 1;
    
    // Convert global coordinates to viewport coordinates (0 to width)
    const rightmostXGlobal = Math.max(...allPoints);
    const rightmostXInViewport = rightmostXGlobal - offsetXRef.current;
    
    // Calculate empty space from rightmost stroke to right edge of viewport
    const emptySpace = width - rightmostXInViewport;
    const ratio = emptySpace / width;
    
    return ratio;
  }, [width]);

  const triggerRecognition = useCallback((strokeList: Stroke[]) => {
    if (!modelReady || strokeList.length === 0) return;
    
    recognitionTimerRef.current = setTimeout(async () => {
      try {
        const result = await HandwritingModule.recognize(strokeList);
        if (result?.length > 0) {
          onRecognitionResult?.(result);
        }
      } catch (error) {
        console.error('Recognition error:', error);
      }
    }, RECOGNITION_DELAY);
  }, [modelReady, onRecognitionResult]);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    if (isSliding) {
      offsetXAnim.stopAnimation((value) => {
        offsetXRef.current = value;
        setOffsetXDisplay(value);
      });
      setIsSliding(false);
    }
    
    clearTimers();
    
    const { locationX, locationY, pageX } = event.nativeEvent;
    const globalX = locationX + offsetXRef.current;
    
    // Capture the offset at stroke start for accurate viewport calculation later
    strokeStartOffsetRef.current = offsetXRef.current;
    isDrawingRef.current = true;
    
    // Capture pageX for this stroke (will be updated in touchMove to get rightmost)
    lastStrokePageXRef.current = pageX;
    
    setCurrentStroke({ points: [{ x: globalX, y: locationY, t: Date.now() }] });
    
    // Path uses local coordinates because the canvas itself is translated
    const path = Skia.Path.Make();
    path.moveTo(locationX, locationY);
    setCurrentPath(path);
  }, [isSliding, offsetXAnim, clearTimers]);

  const handleTouchMove = useCallback((event: GestureResponderEvent) => {
    if (!currentStroke || !currentPath) return;
    
    const { locationX, locationY, pageX } = event.nativeEvent;
    const globalX = locationX + offsetXRef.current;
    
    // Track the rightmost pageX of this stroke
    if (pageX > lastStrokePageXRef.current) {
      lastStrokePageXRef.current = pageX;
    }
    
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, { x: globalX, y: locationY, t: Date.now() }],
    });
    
    // Path uses local coordinates because the canvas itself is translated
    currentPath.lineTo(locationX, locationY);
    setCurrentPath(currentPath.copy());
  }, [currentStroke, currentPath]);

  const handleTouchEnd = useCallback(() => {
    if (!currentStroke || !currentPath) return;
    
    const updatedStrokes = [...strokes, currentStroke];
    const updatedPaths = [...paths, currentPath];
    
    setStrokes(updatedStrokes);
    setPaths(updatedPaths);
    setCurrentStroke(null);
    setCurrentPath(null);
    isDrawingRef.current = false; // Mark as not drawing
    
    // Clear all timers (restart fresh on each stroke)
    clearTimers();
    
    // Check if we need to auto-slide
    const allPoints = updatedStrokes.flatMap(stroke => stroke.points.map(p => p.x));
    if (allPoints.length === 0) return;
    
    // Calculate last stroke's TRUE position in viewport using pageX (screen coordinates)
    const lastStrokeTruePositionInViewport = lastStrokePageXRef.current - containerPageXRef.current;
    
    // Calculate how much empty space we have from the last stroke's TRUE position
    const emptySpaceFromLastStroke = width - lastStrokeTruePositionInViewport;
    const emptyRatioFromLastStroke = emptySpaceFromLastStroke / width;
    
    if (emptyRatioFromLastStroke < EMPTY_SPACE_TARGET) {
      // Schedule auto-slide after inactivity
      inactivityTimerRef.current = setTimeout(() => {
        // Only slide if not currently drawing (use ref, not state)
        if (isDrawingRef.current) {
          inactivityTimerRef.current = null;
          return;
        }
        
        // Calculate exactly how much to slide to reach 80% empty space from where user drew
        const targetEmptySpace = width * EMPTY_SPACE_TARGET;
        const slideAmount = targetEmptySpace - emptySpaceFromLastStroke;
        const targetOffset = offsetXRef.current + slideAmount;
        
        
        if (slideAmount > 5) { // Only slide if meaningful
          animateSlide(targetOffset);
        }
        inactivityTimerRef.current = null;
      }, INACTIVITY_DELAY);
    }
    
    triggerRecognition(updatedStrokes);
  }, [currentStroke, currentPath, strokes, paths, clearTimers, animateSlide, triggerRecognition, width]);

  const clearCanvas = useCallback(() => {
    clearTimers();
    setStrokes([]);
    setCurrentStroke(null);
    setPaths([]);
    setCurrentPath(null);
    onClear?.();
    
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
      offsetXAnim.setValue(0);
      offsetXRef.current = 0;
      setOffsetXDisplay(0);
    }
  }, [onClear, offsetXAnim, clearTimers]);
  
  const undoLastStroke = useCallback(() => {
    if (strokes.length === 0 || isSliding) return;
    
    clearTimers();
    
    const lastStroke = strokes[strokes.length - 1];
    const newStrokes = strokes.slice(0, -1);
    const newPaths = paths.slice(0, -1);
    
    setStrokes(newStrokes);
    setPaths(newPaths);
    
    // Slide back if last stroke was before viewport center
    const strokeCenterX = lastStroke.points.reduce((sum, p) => sum + p.x, 0) / lastStroke.points.length;
    const viewportCenter = offsetXRef.current + width / 2;
    
    if (strokeCenterX < viewportCenter && offsetXRef.current > 0) {
      const newOffset = Math.max(0, offsetXRef.current - width * SLIDE_OFFSET_RATIO);
      animateSlide(newOffset);
    }
    
    triggerRecognition(newStrokes);
  }, [strokes, paths, isSliding, clearTimers, width, animateSlide, triggerRecognition]);

  const scrollLeft = useCallback(() => {
    if (isSliding || strokes.length === 0) return;
    
    // Calculate what the new empty space ratio would be after sliding left
    const potentialNewOffset = Math.max(0, offsetXRef.current - width * SLIDE_OFFSET_RATIO);
    const allPoints = strokes.flatMap(stroke => stroke.points.map(p => p.x));
    if (allPoints.length === 0) return;
    
    const rightmostX = Math.max(...allPoints);
    const potentialViewportRightEdge = potentialNewOffset + width;
    const potentialEmptySpace = potentialViewportRightEdge - rightmostX;
    const potentialEmptyRatio = potentialEmptySpace / width;
    
    // Don't slide left if it would create more than 80% empty space
    if (potentialEmptyRatio > EMPTY_SPACE_TARGET) return;
    
    animateSlide(potentialNewOffset);
  }, [width, isSliding, animateSlide, strokes]);

  const scrollRight = useCallback(() => {
    if (isSliding || strokes.length === 0) return;
    if (getEmptySpaceRatio(strokes) >= EMPTY_SPACE_TARGET) return;
    
    // Always slide by fixed ratio to keep incremental and predictable
    const slideDistance = width * SLIDE_OFFSET_RATIO;
    const newOffset = offsetXRef.current + slideDistance;
    
    animateSlide(newOffset);
  }, [isSliding, strokes, getEmptySpaceRatio, animateSlide, width]);
  
  const shouldDisableScrollRight = () => {
    if (strokes.length === 0) return true;
    try {
      const emptyRatio = getEmptySpaceRatio(strokes);
      return emptyRatio >= EMPTY_SPACE_TARGET;
    } catch {
      return true;
    }
  };

  const shouldDisableScrollLeft = () => {
    if (offsetXDisplay === 0 || strokes.length === 0) return true;
    try {
      // Check if sliding left would create more than 80% empty space
      const potentialNewOffset = Math.max(0, offsetXRef.current - width * SLIDE_OFFSET_RATIO);
      const allPoints = strokes.flatMap(stroke => stroke.points.map(p => p.x));
      if (allPoints.length === 0) return true;
      
      const rightmostX = Math.max(...allPoints);
      const potentialViewportRightEdge = potentialNewOffset + width;
      const potentialEmptySpace = potentialViewportRightEdge - rightmostX;
      const potentialEmptyRatio = potentialEmptySpace / width;
      
      return potentialEmptyRatio > EMPTY_SPACE_TARGET;
    } catch {
      return true;
    }
  };

  const canvasBackgroundColor = isDark ? '#0F0F0F' : '#F5F5F5';
  const strokeColor = isDark ? theme.primaryLight : theme.primary;

  return (
    <View style={styles.container}>
      <View 
        ref={containerRef}
        style={[styles.canvasContainer, { width, height, backgroundColor: canvasBackgroundColor }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouchStart}
        onResponderMove={handleTouchMove}
        onResponderRelease={handleTouchEnd}
        onLayout={(event) => {
          // Capture container's position on screen
          event.target.measure((x, y, w, h, pageX, pageY) => {
            containerPageXRef.current = pageX;
          });
        }}
      >
        <Animated.View style={{ transform: [{ translateX: Animated.multiply(offsetXAnim, -1) }] }}>
          <SkiaCanvas
            paths={paths}
            currentPath={currentPath}
            width={canvasWidth}
            height={height}
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
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
                    style={[styles.arrowButton, (isSliding || shouldDisableScrollLeft()) && styles.disabledArrow]} 
                    onPress={scrollLeft}
                    disabled={isSliding || shouldDisableScrollLeft()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.arrowText}>←</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.arrowButton, (isSliding || shouldDisableScrollRight()) && styles.disabledArrow]} 
                    onPress={scrollRight}
                    disabled={isSliding || shouldDisableScrollRight()}
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

const arePropsEqual = (prev: HandwritingCanvasProps, next: HandwritingCanvasProps) => (
  prev.width === next.width &&
  prev.height === next.height &&
  prev.strokeWidth === next.strokeWidth &&
  prev.onRecognitionResult === next.onRecognitionResult &&
  prev.onClear === next.onClear &&
  prev.onDone === next.onDone &&
  prev.disableNavigation === next.disableNavigation
);

export const HandwritingCanvas = React.memo(HandwritingCanvasComponent, arePropsEqual);

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    width: '100%',
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
    backgroundColor: theme.primary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  disabledArrow: {
    backgroundColor: theme.border,
    opacity: 0.5,
  },
  arrowText: {
    color: theme.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  canvasContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  statusContainer: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: theme.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.warning + '40',
  },
  statusText: {
    color: theme.warning,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textAlign: 'center',
  },
  strokeCounterContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: theme.surfaceAlt,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  strokeCounter: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: theme.textMedium,
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
    backgroundColor: theme.danger,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  clearButtonText: {
    color: theme.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  doneButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: theme.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  doneButtonText: {
    color: theme.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
