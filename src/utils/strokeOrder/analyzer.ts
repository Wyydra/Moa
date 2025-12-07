import { Point, Stroke } from '../../components/handwriting/types';
import { StrokeDirection, StrokeFeatures, StrokePosition } from './types';

const ANGLE_THRESHOLD = 30;

export function analyzeStroke(stroke: Stroke, canvasWidth: number, canvasHeight: number): StrokeFeatures {
  const { points } = stroke;
  
  if (points.length < 2) {
    throw new Error('Stroke must have at least 2 points');
  }
  
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  const length = Math.sqrt(dx * dx + dy * dy);
  
  const centerX = (startPoint.x + endPoint.x) / 2;
  const centerY = (startPoint.y + endPoint.y) / 2;
  
  const direction = determineDirection(angle, points);
  const position = determinePosition(centerX, centerY, canvasWidth, canvasHeight);
  
  return {
    direction,
    position,
    angle,
    length,
    startPoint: { x: startPoint.x, y: startPoint.y },
    endPoint: { x: endPoint.x, y: endPoint.y },
    centerPoint: { x: centerX, y: centerY },
  };
}

function determineDirection(angle: number, points: Point[]): StrokeDirection {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  if (isCurvedStroke(points)) {
    return StrokeDirection.CURVED;
  }
  
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  
  const isHorizontal = 
    (normalizedAngle >= 0 - ANGLE_THRESHOLD && normalizedAngle <= 0 + ANGLE_THRESHOLD) ||
    (normalizedAngle >= 180 - ANGLE_THRESHOLD && normalizedAngle <= 180 + ANGLE_THRESHOLD);
  
  const isVertical = 
    (normalizedAngle >= 90 - ANGLE_THRESHOLD && normalizedAngle <= 90 + ANGLE_THRESHOLD) ||
    (normalizedAngle >= 270 - ANGLE_THRESHOLD && normalizedAngle <= 270 + ANGLE_THRESHOLD);
  
  if (isHorizontal) {
    if (dx > 0) {
      return StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT;
    } else {
      return StrokeDirection.HORIZONTAL_RIGHT_TO_LEFT;
    }
  }
  
  if (isVertical) {
    if (dy > 0) {
      return StrokeDirection.VERTICAL_TOP_TO_BOTTOM;
    } else {
      return StrokeDirection.VERTICAL_BOTTOM_TO_TOP;
    }
  }
  
  if (normalizedAngle >= 30 && normalizedAngle <= 60) {
    return StrokeDirection.DIAGONAL_DOWN_RIGHT;
  }
  
  if (normalizedAngle >= 120 && normalizedAngle <= 150) {
    return StrokeDirection.DIAGONAL_DOWN_LEFT;
  }
  
  return normalizedAngle < 90 || normalizedAngle > 270
    ? StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT
    : StrokeDirection.VERTICAL_TOP_TO_BOTTOM;
}

function isCurvedStroke(points: Point[]): boolean {
  if (points.length < 5) {
    return false;
  }
  
  const angles: number[] = [];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dx1 = points[i].x - points[i - 1].x;
    const dy1 = points[i].y - points[i - 1].y;
    const dx2 = points[i + 1].x - points[i].x;
    const dy2 = points[i + 1].y - points[i].y;
    
    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    
    let angleDiff = Math.abs(angle2 - angle1) * (180 / Math.PI);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    
    angles.push(angleDiff);
  }
  
  const avgAngleChange = angles.reduce((sum, a) => sum + a, 0) / angles.length;
  
  const totalAngleChange = angles.reduce((sum, a) => sum + a, 0);
  
  return avgAngleChange > 10 || totalAngleChange > 90;
}

function determinePosition(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number
): StrokePosition {
  const normalizedX = x / canvasWidth;
  const normalizedY = y / canvasHeight;
  
  let verticalPosition: 'top' | 'center' | 'bottom';
  if (normalizedY < 0.33) {
    verticalPosition = 'top';
  } else if (normalizedY < 0.66) {
    verticalPosition = 'center';
  } else {
    verticalPosition = 'bottom';
  }
  
  let horizontalPosition: 'left' | 'center' | 'right';
  if (normalizedX < 0.33) {
    horizontalPosition = 'left';
  } else if (normalizedX < 0.66) {
    horizontalPosition = 'center';
  } else {
    horizontalPosition = 'right';
  }
  
  const positionMap: Record<string, StrokePosition> = {
    'top_left': StrokePosition.TOP_LEFT,
    'top_center': StrokePosition.TOP_CENTER,
    'top_right': StrokePosition.TOP_RIGHT,
    'center_left': StrokePosition.CENTER_LEFT,
    'center_center': StrokePosition.CENTER,
    'center_right': StrokePosition.CENTER_RIGHT,
    'bottom_left': StrokePosition.BOTTOM_LEFT,
    'bottom_center': StrokePosition.BOTTOM_CENTER,
    'bottom_right': StrokePosition.BOTTOM_RIGHT,
  };
  
  const key = `${verticalPosition}_${horizontalPosition}`;
  return positionMap[key] || StrokePosition.CENTER;
}

export function normalizeStrokeCoordinates(
  stroke: Stroke,
  canvasWidth: number,
  canvasHeight: number
): Stroke {
  const normalizedPoints = stroke.points.map(point => ({
    x: point.x / canvasWidth,
    y: point.y / canvasHeight,
    t: point.t,
  }));
  
  return {
    points: normalizedPoints,
  };
}

export function groupStrokesByCharacter(
  strokes: Stroke[],
  characterCount: number,
  canvasWidth: number
): Stroke[][] {
  if (strokes.length === 0 || characterCount === 0) {
    return [];
  }
  
  const groups: Stroke[][] = Array.from({ length: characterCount }, () => []);
  
  const characterWidth = canvasWidth / characterCount;
  
  for (const stroke of strokes) {
    const centerX = stroke.points.reduce((sum, p) => sum + p.x, 0) / stroke.points.length;
    
    const charIndex = Math.min(
      Math.floor(centerX / characterWidth),
      characterCount - 1
    );
    
    groups[charIndex].push(stroke);
  }
  
  return groups;
}
