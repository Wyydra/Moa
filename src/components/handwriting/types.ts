export interface Point {
  x: number;
  y: number;
  t: number;
}

export interface Stroke {
  points: Point[];
}

export interface ValidationResult {
  isCorrect: boolean;
  correctStrokes: number;
  totalStrokes: number;
  errors: Array<{
    strokeIndex: number;
    errorType: string;
    message: string;
  }>;
}

export interface RecognitionResult {
  text: string;
  confidence?: number;
}
