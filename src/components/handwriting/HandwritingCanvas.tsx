import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, GestureResponderEvent, NativeModules, Alert, Animated, Easing } from 'react-native';
import { Skia, SkPath } from '@shopify/react-native-skia';
import { StrokeOrderFeedback } from './StrokeOrderFeedback';
import { getHandwritingLanguage } from '../../data/storage';
import type { Stroke } from './types';

const { HandwritingModule } = NativeModules;

const SLIDE_OFFSET_RATIO = 0.15;
const SLIDE_DURATION = 300;
const INACTIVITY_DELAY = 1500;
const RECOGNITION_DELAY = 1500;

interface HandwritingCanvasProps {
  onRecognitionResult?: (result: string[]) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  strokeWidth?: number;
  disableNavigation?: boolean;
}

const HandwritingCanvasComponent: React.FC<HandwritingCanvasProps> = ({
  onRecognitionResult,
  onClear,
  width = 300,
  height = 400,
  strokeWidth = 3,
  disableNavigation = false,
}) => {
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
    console.log('🎬 AnimateSlide:', {
      from: offsetXRef.current.toFixed(1),
      to: newOffset.toFixed(1)
    });
    
    offsetXRef.current = newOffset; // Update ref immediately (synchronous)
    setOffsetXDisplay(newOffset); // Update display for UI
    setIsSliding(true);
    Animated.timing(offsetXAnim, {
      toValue: newOffset,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      console.log('✅ Animation complete, offsetX now:', offsetXRef.current.toFixed(1));
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
    
    console.log('🖊️ TouchStart:', {
      locationX: locationX.toFixed(1),
      currentOffset: currentOffset.toFixed(1),
      globalX: globalX.toFixed(1)
    });
    
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
    
    // Auto-slide after inactivity
    inactivityTimerRef.current = setTimeout(() => {
      const newOffset = offsetXRef.current + width * SLIDE_OFFSET_RATIO;
      animateSlide(newOffset);
    }, INACTIVITY_DELAY);
    
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

  const scrollLeft = useCallback(() => {
    if (isSliding) return;
    const newOffset = Math.max(0, offsetXRef.current - width * SLIDE_OFFSET_RATIO);
    animateSlide(newOffset);
  }, [width, isSliding, animateSlide]);

  const scrollRight = useCallback(() => {
    if (isSliding) return;
    const newOffset = offsetXRef.current + width * SLIDE_OFFSET_RATIO;
    animateSlide(newOffset);
  }, [width, isSliding, animateSlide]);

  console.log('🎨 Canvas render:', {
    offsetXDisplay: offsetXDisplay.toFixed(1),
    pathsCount: paths.length,
    isSliding
  });

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
          />
        </Animated.View>
      </View>
      
      <View style={styles.controlsContainer}>
        <View style={styles.navigationRow}>
          {!disableNavigation && (
            <>
              <TouchableOpacity 
                style={[styles.arrowButton, (offsetXDisplay === 0 || isSliding) && styles.disabledArrow]} 
                onPress={scrollLeft}
                disabled={offsetXDisplay === 0 || isSliding}
              >
                <Text style={styles.arrowText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.arrowButton, isSliding && styles.disabledArrow]} 
                onPress={scrollRight}
                disabled={isSliding}
              >
                <Text style={styles.arrowText}>→</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      
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
    prevProps.disableNavigation === nextProps.disableNavigation
  );
};

export const HandwritingCanvas = React.memo(HandwritingCanvasComponent, arePropsEqual);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
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
});
