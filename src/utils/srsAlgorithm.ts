import { Card } from "../data/model";
import { TIME_CONSTANTS } from "./constants";

export enum StudyResponse {
  Again = 0,
  Hard = 1,
  Good = 2,
  Easy = 3,
}

  export const calculateNextReview = (card: Card, response: StudyResponse): Card => {
    let newInterval = card.interval;
    let newEaseFactor = card.easeFactor;
    let newRepetitions = card.repetitions;

    switch (response) {
      case StudyResponse.Again:
        newInterval = 1 / TIME_CONSTANTS.MINUTES_PER_DAY;
        newRepetitions = 0;
        newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
        break;
      case StudyResponse.Hard:
        if (card.repetitions === 0) {
          newInterval = 1 / TIME_CONSTANTS.HOURS_PER_DAY;
        } else {
          newInterval = Math.max(1 / TIME_CONSTANTS.HOURS_PER_DAY, card.interval * 1.2);
        }
        newRepetitions = card.repetitions + 1;
        newEaseFactor = Math.max(1.3, card.easeFactor - 0.15);
        break;
      case StudyResponse.Good:
        if (card.repetitions === 0) {
          newInterval = 1;
        } else if (card.repetitions === 1) {
          newInterval = 6;
        } else {
          newInterval = card.interval * card.easeFactor;
        }
        newRepetitions = card.repetitions + 1;
        break;
      case StudyResponse.Easy:
        if (card.repetitions === 0) {
          newInterval = 4;
        } else {
          newInterval = card.interval * card.easeFactor * 1.3;
        }
        newRepetitions = card.repetitions + 1;
        newEaseFactor = card.easeFactor + 0.15;
        break;
    }

    const nextReview = Date.now() + newInterval * TIME_CONSTANTS.MILLISECONDS_PER_DAY;

    return {
      ...card,
      interval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions,
      nextReview,
    };
  }
