export enum StrokeDirection {
  HORIZONTAL = 'horizontal',
  HORIZONTAL_LEFT_TO_RIGHT = 'horizontal_left_to_right',
  HORIZONTAL_RIGHT_TO_LEFT = 'horizontal_right_to_left',
  VERTICAL = 'vertical',
  VERTICAL_TOP_TO_BOTTOM = 'vertical_top_to_bottom',
  VERTICAL_BOTTOM_TO_TOP = 'vertical_bottom_to_top',
  DIAGONAL_DOWN_RIGHT = 'diagonal_down_right',
  DIAGONAL_DOWN_LEFT = 'diagonal_down_left',
  CURVED = 'curved',
}

export enum StrokePosition {
  TOP_LEFT = 'top_left',
  TOP_CENTER = 'top_center',
  TOP_RIGHT = 'top_right',
  CENTER_LEFT = 'center_left',
  CENTER = 'center',
  CENTER_RIGHT = 'center_right',
  BOTTOM_LEFT = 'bottom_left',
  BOTTOM_CENTER = 'bottom_center',
  BOTTOM_RIGHT = 'bottom_right',
}

export interface StrokeDefinition {
  direction: StrokeDirection;
  position: StrokePosition;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface CharacterStrokeOrder {
  character: string;
  strokes: StrokeDefinition[];
  strokeCount: number;
}

export interface StrokeFeatures {
  direction: StrokeDirection;
  position: StrokePosition;
  angle: number;
  length: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  centerPoint: { x: number; y: number };
}

export interface ValidationResult {
  isCorrect: boolean;
  correctStrokes: number;
  totalStrokes: number;
  errors: {
    strokeIndex: number;
    expected: StrokeDefinition;
    actual: StrokeFeatures;
    errorType: 'direction' | 'position' | 'sequence' | 'count';
    message: string;
  }[];
}
