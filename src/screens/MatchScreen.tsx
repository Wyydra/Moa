import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import { getCardsByDeck, getCardsByTags, saveStudySession, generateId, getTTSEnabled, getTTSRate } from "../data/storage";
import { StudySession } from "../data/model";
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "../utils/constants";
import { Ionicons } from "@expo/vector-icons";
import CardContentRenderer from '../components/CardContentRenderer';
import * as Speech from 'expo-speech';
import { detectLanguage } from '../utils/languageDetection';

const { height: screenHeight } = Dimensions.get('window');

interface Tile {
  id: string;
  text: string;
  type: 'front' | 'back';
  cardId: string;
  matched: boolean;
  animation: Animated.Value;
  language?: string;
}

export default function MatchScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { deckId, tags, reversed = false } = route.params;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tries, setTries] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [ttsEnabled, setTTSEnabled] = useState(true);
  const [ttsRate, setTTSRate] = useState(1.0);

  useEffect(() => {
    loadCardsAndGenerateTiles();
    loadTTSSettings();
  }, [deckId, tags]);

  useEffect(() => {
    if (loading || completed) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, completed, startTime]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const loadTTSSettings = async () => {
    const enabled = await getTTSEnabled();
    const rate = await getTTSRate();
    setTTSEnabled(enabled);
    setTTSRate(rate);
  };

  const loadCardsAndGenerateTiles = async () => {
    const allCards = tags 
      ? await getCardsByTags(tags)
      : await getCardsByDeck(deckId);

    if (allCards.length === 0) {
      setCompleted(true);
      setLoading(false);
      return;
    }

    const numCards = Math.min(6, allCards.length);
    
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
    const cardsToUse = shuffledCards.slice(0, numCards);

    const generatedTiles: Tile[] = [];
    for (const card of cardsToUse) {
      // Detect language for each side of the card
      const frontText = reversed ? card.back : card.front;
      const backText = reversed ? card.front : card.back;
      
      const frontLanguage = await detectLanguage(frontText);
      const backLanguage = await detectLanguage(backText);
      
      generatedTiles.push({
        id: `${card.id}-front`,
        text: frontText,
        type: 'front',
        cardId: card.id,
        matched: false,
        animation: new Animated.Value(0),
        language: frontLanguage,
      });
      generatedTiles.push({
        id: `${card.id}-back`,
        text: backText,
        type: 'back',
        cardId: card.id,
        matched: false,
        animation: new Animated.Value(0),
        language: backLanguage,
      });
    }

    const shuffledTiles = generatedTiles.sort(() => Math.random() - 0.5);
    setTiles(shuffledTiles);
    setLoading(false);
  };

  const handleTilePress = (tile: Tile) => {
    if (tile.matched || selectedTiles.find(t => t.id === tile.id)) {
      return;
    }

    // Play TTS for the tile text when pressed, using the tile's specific language
    if (ttsEnabled) {
      Speech.speak(tile.text, {
        rate: ttsRate,
        language: tile.language,
      });
    }

    const newSelected = [...selectedTiles, tile];
    setSelectedTiles(newSelected);

    if (newSelected.length === 2) {
      setTries(tries + 1);
      
      const [first, second] = newSelected;
      const isMatch = first.cardId === second.cardId && first.type !== second.type;

      if (isMatch) {
        Animated.parallel([
          Animated.timing(first.animation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(second.animation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();

        // Track successful match as study session
        (async () => {
          const matchedCard = tiles.find(t => t.cardId === first.cardId);
          if (matchedCard) {
            const session: StudySession = {
              id: generateId(),
              deckId: deckId || '',
              cardId: matchedCard.cardId,
              timestamp: Date.now(),
              response: 'good',
              correct: true,
            };
            await saveStudySession(session);
          }
        })();

        setTimeout(() => {
          setTiles(prevTiles =>
            prevTiles.map(t =>
              t.cardId === first.cardId ? { ...t, matched: true } : t
            )
          );
          setSelectedTiles([]);

          const allMatched = tiles.every(t => 
            t.cardId === first.cardId || t.matched
          );
          if (allMatched) {
            setCompleted(true);
          }
        }, 400);
      } else {
        setTimeout(() => {
          setSelectedTiles([]);
        }, 1000);
      }
    }
  };

  const handleNewGame = () => {
    setTiles([]);
    setSelectedTiles([]);
    setCompleted(false);
    setTries(0);
    setElapsedTime(0);
    loadCardsAndGenerateTiles();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <Text style={commonStyles.emptyText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (completed) {
    const matchedCount = tiles.filter(t => t.matched).length / 2;
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.completedTitle}>{t('modes.match.sessionComplete')}</Text>
          <Text style={styles.completedText}>
            {t('modes.match.stats', { matches: matchedCount, tries })}
          </Text>
          <Text style={styles.timeText}>{t('modes.match.time')}: {formatTime(elapsedTime)}</Text>
          <TouchableOpacity style={commonStyles.button} onPress={handleNewGame}>
            <Text style={commonStyles.buttonText}>{t('modes.match.newGame')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[commonStyles.button, styles.doneButton]} onPress={handleBack}>
            <Text style={commonStyles.buttonText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const matchedCount = tiles.filter(t => t.matched).length / 2;

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('modes.match.title')}</Text>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('modes.match.tries')}</Text>
          <Text style={styles.statValue}>{tries}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('modes.match.time')}</Text>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Matches</Text>
          <Text style={styles.statValue}>{matchedCount}/{tiles.length / 2}</Text>
        </View>
      </View>

      <Text style={styles.instruction}>{t('modes.match.selectTwo')}</Text>

      <View style={styles.grid}>
        {tiles.map(tile => {
          const isSelected = selectedTiles.find(t => t.id === tile.id);
          
          const isWrongMatch = selectedTiles.length === 2 && 
            isSelected && 
            selectedTiles[0].cardId !== selectedTiles[1].cardId;
          
          const scale = tile.animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.1, 0],
          });
          
          const opacity = tile.animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1, 0],
          });

          return (
            <Animated.View
              key={tile.id}
              style={[
                styles.tile,
                isSelected && !isWrongMatch && styles.tileSelected,
                isWrongMatch && styles.tileWrong,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.tileTouchable}
                onPress={() => handleTilePress(tile)}
                disabled={tile.matched}
              >
                <CardContentRenderer
                  content={tile.text}
                  textStyle={styles.tileText}
                  numberOfLines={3}
                />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: SPACING.md,
  },
  headerText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  spacer: {
    width: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.xs,
    flex: 1,
  },
  tile: {
    width: '31.5%',
    height: screenHeight * 0.12,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  tileTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  tileSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    ...SHADOWS.colored(COLORS.primary),
  },
  tileWrong: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger,
    ...SHADOWS.colored(COLORS.danger),
  },
  tileText: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
  },

  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  completedText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  doneButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.textMedium,
  },
});
