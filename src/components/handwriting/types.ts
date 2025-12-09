export interface Point {
  x: number;
  y: number;
  t: number;
}

export interface Stroke {
  points: Point[];
}

export interface RecognitionResult {
  text: string;
  confidence?: number;
}
