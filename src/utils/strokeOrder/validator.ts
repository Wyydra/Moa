import { Stroke } from '../../components/handwriting/types';
import { analyzeStroke } from './analyzer';
import { getCharacterStrokes } from './database';
import {
  StrokeDefinition,
  StrokeFeatures,
  ValidationResult,
  StrokeDirection,
} from './types';
import i18n from '../../i18n/config';

const POSITION_TOLERANCE = 0.25;

export function validateStrokeOrder(
  userStrokes: Stroke[],
  targetCharacter: string,
  canvasWidth: number,
  canvasHeight: number
): ValidationResult {
  const characterData = getCharacterStrokes(targetCharacter);
  
  if (!characterData) {
    return {
      isCorrect: false,
      correctStrokes: 0,
      totalStrokes: 0,
      errors: [
        {
          strokeIndex: 0,
          expected: {} as StrokeDefinition,
          actual: {} as StrokeFeatures,
          errorType: 'count',
          message: `Character '${targetCharacter}' is not supported`,
        },
      ],
    };
  }
  
  const expectedStrokes = characterData.strokes;
  const errors: ValidationResult['errors'] = [];
  
  if (userStrokes.length !== expectedStrokes.length) {
    return {
      isCorrect: false,
      correctStrokes: 0,
      totalStrokes: expectedStrokes.length,
      errors: [
        {
          strokeIndex: 0,
          expected: expectedStrokes[0],
          actual: {} as StrokeFeatures,
          errorType: 'count',
          message: `Expected ${expectedStrokes.length} strokes, but got ${userStrokes.length}`,
        },
      ],
    };
  }
  
  let correctStrokes = 0;
  
  for (let i = 0; i < userStrokes.length; i++) {
    const userStroke = userStrokes[i];
    const expectedStroke = expectedStrokes[i];
    
    const actualFeatures = analyzeStroke(userStroke, canvasWidth, canvasHeight);
    
    const directionMatch = compareDirection(actualFeatures.direction, expectedStroke.direction);
    const positionMatch = comparePosition(
      actualFeatures.centerPoint,
      {
        x: (expectedStroke.startX + expectedStroke.endX) / 2,
        y: (expectedStroke.startY + expectedStroke.endY) / 2,
      },
      canvasWidth,
      canvasHeight
    );
    
    if (!directionMatch || !positionMatch) {
      let bestMatchIndex = -1;
      let foundMatch = false;
      
      for (let j = 0; j < expectedStrokes.length; j++) {
        if (j === i) continue;
        
        const otherExpected = expectedStrokes[j];
        const otherDirMatch = compareDirection(actualFeatures.direction, otherExpected.direction);
        const otherPosMatch = comparePosition(
          actualFeatures.centerPoint,
          {
            x: (otherExpected.startX + otherExpected.endX) / 2,
            y: (otherExpected.startY + otherExpected.endY) / 2,
          },
          canvasWidth,
          canvasHeight
        );
        
        if (otherDirMatch && otherPosMatch) {
          bestMatchIndex = j;
          foundMatch = true;
          break;
        }
      }
      
      if (foundMatch) {
        errors.push({
          strokeIndex: i,
          expected: expectedStroke,
          actual: actualFeatures,
          errorType: 'sequence',
          message: `Stroke ${i + 1}: This stroke belongs at position ${bestMatchIndex + 1}. Draw strokes in order!`,
        });
      } else if (!directionMatch) {
        errors.push({
          strokeIndex: i,
          expected: expectedStroke,
          actual: actualFeatures,
          errorType: 'direction',
          message: `Stroke ${i + 1}: Expected ${expectedStroke.direction} direction, but got ${actualFeatures.direction}`,
        });
      } else {
        errors.push({
          strokeIndex: i,
          expected: expectedStroke,
          actual: actualFeatures,
          errorType: 'position',
          message: `Stroke ${i + 1}: Stroke position is incorrect`,
        });
      }
    } else {
      correctStrokes++;
    }
  }
  
  return {
    isCorrect: errors.length === 0,
    correctStrokes,
    totalStrokes: expectedStrokes.length,
    errors,
  };
}

function compareDirection(actual: StrokeDirection, expected: StrokeDirection): boolean {
  if (actual === expected) {
    return true;
  }
  
  if (expected === StrokeDirection.CURVED && actual === StrokeDirection.CURVED) {
    return true;
  }
  
  const directionCompatibility: Record<StrokeDirection, StrokeDirection[]> = {
    [StrokeDirection.HORIZONTAL]: [
      StrokeDirection.HORIZONTAL,
      StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
      StrokeDirection.HORIZONTAL_RIGHT_TO_LEFT,
    ],
    [StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT]: [
      StrokeDirection.HORIZONTAL,
      StrokeDirection.HORIZONTAL_LEFT_TO_RIGHT,
    ],
    [StrokeDirection.HORIZONTAL_RIGHT_TO_LEFT]: [
      StrokeDirection.HORIZONTAL,
      StrokeDirection.HORIZONTAL_RIGHT_TO_LEFT,
    ],
    [StrokeDirection.VERTICAL]: [
      StrokeDirection.VERTICAL,
      StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
      StrokeDirection.VERTICAL_BOTTOM_TO_TOP,
    ],
    [StrokeDirection.VERTICAL_TOP_TO_BOTTOM]: [
      StrokeDirection.VERTICAL,
      StrokeDirection.VERTICAL_TOP_TO_BOTTOM,
    ],
    [StrokeDirection.VERTICAL_BOTTOM_TO_TOP]: [
      StrokeDirection.VERTICAL,
      StrokeDirection.VERTICAL_BOTTOM_TO_TOP,
    ],
    [StrokeDirection.DIAGONAL_DOWN_RIGHT]: [
      StrokeDirection.DIAGONAL_DOWN_RIGHT,
    ],
    [StrokeDirection.DIAGONAL_DOWN_LEFT]: [
      StrokeDirection.DIAGONAL_DOWN_LEFT,
    ],
    [StrokeDirection.CURVED]: [StrokeDirection.CURVED],
  };
  
  return directionCompatibility[expected]?.includes(actual) ?? false;
}

function comparePosition(
  actualCenter: { x: number; y: number },
  expectedCenter: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const normalizedActualX = actualCenter.x / canvasWidth;
  const normalizedActualY = actualCenter.y / canvasHeight;
  
  const distanceX = Math.abs(normalizedActualX - expectedCenter.x);
  const distanceY = Math.abs(normalizedActualY - expectedCenter.y);
  
  return distanceX <= POSITION_TOLERANCE && distanceY <= POSITION_TOLERANCE;
}

export function getStrokeOrderFeedback(validation: ValidationResult): string {
  if (validation.isCorrect) {
    return i18n.t('strokeOrder.perfect');
  }
  
  if (validation.errors.length === 0) {
    return i18n.t('strokeOrder.goodJob');
  }
  
  const firstError = validation.errors[0];
  
  switch (firstError.errorType) {
    case 'count':
      return firstError.message;
    case 'direction':
      return i18n.t('strokeOrder.checkDirection', {
        index: firstError.strokeIndex + 1,
        direction: firstError.expected.direction,
      });
    case 'position':
      return i18n.t('strokeOrder.checkPosition', {
        index: firstError.strokeIndex + 1,
      });
    case 'sequence':
      return i18n.t('strokeOrder.wrongSequence', {
        index: firstError.strokeIndex + 1,
      });
    default:
      return i18n.t('strokeOrder.tryAgain');
  }
}

export function getProgressPercentage(validation: ValidationResult): number {
  if (validation.totalStrokes === 0) {
    return 0;
  }
  return Math.round((validation.correctStrokes / validation.totalStrokes) * 100);
}

export function validateMultipleCharacters(
  allStrokes: Stroke[],
  characters: string[],
  canvasWidth: number,
  canvasHeight: number
): { validatedCharacters: string[]; validations: ValidationResult[] } {
  if (characters.length === 0 || allStrokes.length === 0) {
    return { validatedCharacters: [], validations: [] };
  }
  
  const characterWidth = canvasWidth / characters.length;
  const groups: Stroke[][] = Array.from({ length: characters.length }, () => []);
  
  for (const stroke of allStrokes) {
    const centerX = stroke.points.reduce((sum, p) => sum + p.x, 0) / stroke.points.length;
    const charIndex = Math.min(
      Math.floor(centerX / characterWidth),
      characters.length - 1
    );
    groups[charIndex].push(stroke);
  }
  
  const validatedCharacters: string[] = [];
  const validations: ValidationResult[] = [];
  
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const strokeGroup = groups[i];
    
    if (strokeGroup.length === 0) {
      validatedCharacters.push(char);
      continue;
    }
    
    const validation = validateStrokeOrder(
      strokeGroup,
      char,
      characterWidth,
      canvasHeight
    );
    
    validations.push(validation);
    
    if (validation.isCorrect) {
      validatedCharacters.push(char);
    }
  }
  
  return { validatedCharacters, validations };
}

export function validateJamoSequence(
  allStrokes: Stroke[],
  jamoList: string[],
  canvasWidth: number,
  canvasHeight: number
): { validations: ValidationResult[]; groups: Stroke[][] } {
  const { getCharacterStrokes } = require('./database');
  
  const expectedStrokeCounts = jamoList.map(jamo => {
    const charData = getCharacterStrokes(jamo);
    return charData?.strokeCount || 0;
  });
  
  const totalExpectedStrokes = expectedStrokeCounts.reduce((sum, count) => sum + count, 0);
  
  if (allStrokes.length !== totalExpectedStrokes) {
    return {
      validations: [{
        isCorrect: false,
        correctStrokes: 0,
        totalStrokes: totalExpectedStrokes,
        errors: [{
          strokeIndex: 0,
          expected: {} as StrokeDefinition,
          actual: {} as StrokeFeatures,
          errorType: 'count',
          message: `Expected ${totalExpectedStrokes} strokes (${jamoList.map((j, i) => `${j}:${expectedStrokeCounts[i]}`).join(', ')}), but got ${allStrokes.length}`,
        }],
      }],
      groups: [],
    };
  }
  
  const groups: Stroke[][] = [];
  const validations: ValidationResult[] = [];
  let strokeIndex = 0;
  
  for (let i = 0; i < jamoList.length; i++) {
    const jamo = jamoList[i];
    const strokeCount = expectedStrokeCounts[i];
    const jamoStrokes = allStrokes.slice(strokeIndex, strokeIndex + strokeCount);
    groups.push(jamoStrokes);
    
    const validation = validateStrokeOrder(
      jamoStrokes,
      jamo,
      canvasWidth,
      canvasHeight
    );
    
    validations.push(validation);
    strokeIndex += strokeCount;
  }
  
  return { validations, groups };
}
