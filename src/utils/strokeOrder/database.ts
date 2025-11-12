import { CharacterStrokeOrder, StrokeDirection, StrokePosition } from './types';

export const hangulStrokeDatabase: Record<string, CharacterStrokeOrder> = {
  'ㄱ': {
    character: 'ㄱ',
    strokeCount: 2,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_LEFT,
        startX: 0.2,
        startY: 0.3,
        endX: 0.7,
        endY: 0.3,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.7,
        startY: 0.3,
        endX: 0.7,
        endY: 0.8,
      },
    ],
  },
  
  'ㄴ': {
    character: 'ㄴ',
    strokeCount: 2,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.3,
        startY: 0.2,
        endX: 0.3,
        endY: 0.7,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.BOTTOM_CENTER,
        startX: 0.3,
        startY: 0.7,
        endX: 0.8,
        endY: 0.7,
      },
    ],
  },
  
  'ㄷ': {
    character: 'ㄷ',
    strokeCount: 3,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_CENTER,
        startX: 0.2,
        startY: 0.3,
        endX: 0.7,
        endY: 0.3,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.7,
        startY: 0.3,
        endX: 0.7,
        endY: 0.7,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.BOTTOM_CENTER,
        startX: 0.2,
        startY: 0.7,
        endX: 0.7,
        endY: 0.7,
      },
    ],
  },
  
  'ㄹ': {
    character: 'ㄹ',
    strokeCount: 5,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_CENTER,
        startX: 0.2,
        startY: 0.25,
        endX: 0.6,
        endY: 0.25,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.6,
        startY: 0.25,
        endX: 0.6,
        endY: 0.5,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.2,
        startY: 0.5,
        endX: 0.6,
        endY: 0.5,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.6,
        startY: 0.5,
        endX: 0.6,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.BOTTOM_CENTER,
        startX: 0.2,
        startY: 0.75,
        endX: 0.6,
        endY: 0.75,
      },
    ],
  },
  
  'ㅁ': {
    character: 'ㅁ',
    strokeCount: 4,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.25,
        startY: 0.25,
        endX: 0.25,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_CENTER,
        startX: 0.25,
        startY: 0.25,
        endX: 0.75,
        endY: 0.25,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.75,
        startY: 0.25,
        endX: 0.75,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.BOTTOM_CENTER,
        startX: 0.25,
        startY: 0.75,
        endX: 0.75,
        endY: 0.75,
      },
    ],
  },
  
  'ㅂ': {
    character: 'ㅂ',
    strokeCount: 4,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.25,
        startY: 0.25,
        endX: 0.25,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.75,
        startY: 0.25,
        endX: 0.75,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.25,
        startY: 0.5,
        endX: 0.75,
        endY: 0.5,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.BOTTOM_CENTER,
        startX: 0.25,
        startY: 0.75,
        endX: 0.75,
        endY: 0.75,
      },
    ],
  },
  
  'ㅅ': {
    character: 'ㅅ',
    strokeCount: 2,
    strokes: [
      {
        direction: StrokeDirection.DIAGONAL_DOWN_RIGHT,
        position: StrokePosition.TOP_LEFT,
        startX: 0.3,
        startY: 0.3,
        endX: 0.5,
        endY: 0.6,
      },
      {
        direction: StrokeDirection.DIAGONAL_DOWN_LEFT,
        position: StrokePosition.TOP_RIGHT,
        startX: 0.7,
        startY: 0.3,
        endX: 0.5,
        endY: 0.6,
      },
    ],
  },
  
  'ㅇ': {
    character: 'ㅇ',
    strokeCount: 1,
    strokes: [
      {
        direction: StrokeDirection.CURVED,
        position: StrokePosition.CENTER,
        startX: 0.5,
        startY: 0.25,
        endX: 0.5,
        endY: 0.25,
      },
    ],
  },
  
  'ㅈ': {
    character: 'ㅈ',
    strokeCount: 3,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_CENTER,
        startX: 0.25,
        startY: 0.3,
        endX: 0.75,
        endY: 0.3,
      },
      {
        direction: StrokeDirection.DIAGONAL_DOWN_RIGHT,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.3,
        startY: 0.45,
        endX: 0.5,
        endY: 0.7,
      },
      {
        direction: StrokeDirection.DIAGONAL_DOWN_LEFT,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.7,
        startY: 0.45,
        endX: 0.5,
        endY: 0.7,
      },
    ],
  },
  
  'ㅊ': {
    character: 'ㅊ',
    strokeCount: 4,
    strokes: [
      {
        direction: StrokeDirection.DIAGONAL_DOWN_RIGHT,
        position: StrokePosition.TOP_LEFT,
        startX: 0.3,
        startY: 0.2,
        endX: 0.45,
        endY: 0.35,
      },
      {
        direction: StrokeDirection.DIAGONAL_DOWN_LEFT,
        position: StrokePosition.TOP_RIGHT,
        startX: 0.7,
        startY: 0.2,
        endX: 0.55,
        endY: 0.35,
      },
      {
        direction: StrokeDirection.DIAGONAL_DOWN_RIGHT,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.3,
        startY: 0.45,
        endX: 0.5,
        endY: 0.7,
      },
      {
        direction: StrokeDirection.DIAGONAL_DOWN_LEFT,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.7,
        startY: 0.45,
        endX: 0.5,
        endY: 0.7,
      },
    ],
  },
  
  'ㅋ': {
    character: 'ㅋ',
    strokeCount: 3,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_LEFT,
        startX: 0.2,
        startY: 0.25,
        endX: 0.6,
        endY: 0.25,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.2,
        startY: 0.45,
        endX: 0.6,
        endY: 0.45,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.6,
        startY: 0.25,
        endX: 0.6,
        endY: 0.75,
      },
    ],
  },
  
  'ㅌ': {
    character: 'ㅌ',
    strokeCount: 4,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_CENTER,
        startX: 0.2,
        startY: 0.25,
        endX: 0.7,
        endY: 0.25,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.2,
        startY: 0.45,
        endX: 0.7,
        endY: 0.45,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.7,
        startY: 0.25,
        endX: 0.7,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.BOTTOM_CENTER,
        startX: 0.2,
        startY: 0.75,
        endX: 0.7,
        endY: 0.75,
      },
    ],
  },
  
  'ㅍ': {
    character: 'ㅍ',
    strokeCount: 4,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.25,
        startY: 0.25,
        endX: 0.25,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.75,
        startY: 0.25,
        endX: 0.75,
        endY: 0.75,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.TOP_CENTER,
        startX: 0.25,
        startY: 0.25,
        endX: 0.75,
        endY: 0.25,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.25,
        startY: 0.5,
        endX: 0.75,
        endY: 0.5,
      },
    ],
  },
  
  'ㅎ': {
    character: 'ㅎ',
    strokeCount: 3,
    strokes: [
      {
        direction: StrokeDirection.CURVED,
        position: StrokePosition.TOP_CENTER,
        startX: 0.3,
        startY: 0.35,
        endX: 0.7,
        endY: 0.35,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.3,
        startY: 0.35,
        endX: 0.3,
        endY: 0.7,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.7,
        startY: 0.35,
        endX: 0.7,
        endY: 0.7,
      },
    ],
  },
  
  'ㅏ': {
    character: 'ㅏ',
    strokeCount: 2,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.4,
        startY: 0.2,
        endX: 0.4,
        endY: 0.8,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.4,
        startY: 0.5,
        endX: 0.7,
        endY: 0.5,
      },
    ],
  },
  
  'ㅓ': {
    character: 'ㅓ',
    strokeCount: 2,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.6,
        startY: 0.2,
        endX: 0.6,
        endY: 0.8,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.3,
        startY: 0.5,
        endX: 0.6,
        endY: 0.5,
      },
    ],
  },
  
  'ㅗ': {
    character: 'ㅗ',
    strokeCount: 2,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.2,
        startY: 0.55,
        endX: 0.8,
        endY: 0.55,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER,
        startX: 0.5,
        startY: 0.3,
        endX: 0.5,
        endY: 0.55,
      },
    ],
  },
  
  'ㅜ': {
    character: 'ㅜ',
    strokeCount: 2,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.2,
        startY: 0.45,
        endX: 0.8,
        endY: 0.45,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER,
        startX: 0.5,
        startY: 0.45,
        endX: 0.5,
        endY: 0.7,
      },
    ],
  },
  
  'ㅡ': {
    character: 'ㅡ',
    strokeCount: 1,
    strokes: [
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.2,
        startY: 0.5,
        endX: 0.8,
        endY: 0.5,
      },
    ],
  },
  
  'ㅣ': {
    character: 'ㅣ',
    strokeCount: 1,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER,
        startX: 0.5,
        startY: 0.2,
        endX: 0.5,
        endY: 0.8,
      },
    ],
  },
  
  'ㅐ': {
    character: 'ㅐ',
    strokeCount: 3,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.35,
        startY: 0.2,
        endX: 0.35,
        endY: 0.8,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.35,
        startY: 0.5,
        endX: 0.6,
        endY: 0.5,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.55,
        startY: 0.2,
        endX: 0.55,
        endY: 0.8,
      },
    ],
  },
  
  'ㅔ': {
    character: 'ㅔ',
    strokeCount: 3,
    strokes: [
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_RIGHT,
        startX: 0.65,
        startY: 0.2,
        endX: 0.65,
        endY: 0.8,
      },
      {
        direction: StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
        position: StrokePosition.CENTER,
        startX: 0.4,
        startY: 0.5,
        endX: 0.65,
        endY: 0.5,
      },
      {
        direction: StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
        position: StrokePosition.CENTER_LEFT,
        startX: 0.45,
        startY: 0.2,
        endX: 0.45,
        endY: 0.8,
      },
    ],
  },
};

export function getCharacterStrokes(character: string): CharacterStrokeOrder | null {
  return hangulStrokeDatabase[character] || null;
}

export function getSupportedCharacters(): string[] {
  return Object.keys(hangulStrokeDatabase);
}

export function isCharacterSupported(character: string): boolean {
  return character in hangulStrokeDatabase;
}

export function decomposeHangul(syllable: string): string[] {
  const code = syllable.charCodeAt(0);
  
  if (code < 0xAC00 || code > 0xD7A3) {
    return [syllable];
  }
  
  const syllableIndex = code - 0xAC00;
  const initialIndex = Math.floor(syllableIndex / 588);
  const medialIndex = Math.floor((syllableIndex % 588) / 28);
  const finalIndex = syllableIndex % 28;
  
  const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const medials = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const finals = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  const jamo = [initials[initialIndex], medials[medialIndex]];
  if (finalIndex > 0) {
    jamo.push(finals[finalIndex]);
  }
  
  return jamo;
}
