import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getCardsByDeck } from "../data/storage";
import { commonStyles } from "../styles/commonStyles";
import { COLORS, SPACING } from "../utils/constants";
import { Ionicons } from "@expo/vector-icons";

interface Tile {
  id: string;
  text: string;
  type: 'front' | 'back';
  cardId: string;
  matched: boolean;
}

export default function MatchScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { deckId } = route.params;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tries, setTries] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    loadCardsAndGenerateTiles();
  }, [deckId]);

  useEffect(() => {
    if (loading || completed) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, completed, startTime]);

  const loadCardsAndGenerateTiles = async () => {
    const allCards = await getCardsByDeck(deckId);

    if (allCards.length === 0) {
      setCompleted(true);
      setLoading(false);
      return;
    }

    const numCards = Math.min(6, allCards.length);
    
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
    const cardsToUse = shuffledCards.slice(0, numCards);

    const generatedTiles: Tile[] = [];
    cardsToUse.forEach(card => {
      generatedTiles.push({
        id: `${card.id}-front`,
        text: card.front,
        type: 'front',
        cardId: card.id,
        matched: false,
      });
      generatedTiles.push({
        id: `${card.id}-back`,
        text: card.back,
        type: 'back',
        cardId: card.id,
        matched: false,
      });
    });

    const shuffledTiles = generatedTiles.sort(() => Math.random() - 0.5);
    setTiles(shuffledTiles);
    setLoading(false);
  };

  const handleTilePress = (tile: Tile) => {
    if (tile.matched || selectedTiles.find(t => t.id === tile.id)) {
      return;
    }

    const newSelected = [...selectedTiles, tile];
    setSelectedTiles(newSelected);

    if (newSelected.length === 2) {
      setTries(tries + 1);
      
      const [first, second] = newSelected;
      const isMatch = first.cardId === second.cardId && first.type !== second.type;

      if (isMatch) {
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
      } else {
        setTimeout(() => {
          setSelectedTiles([]);
        }, 800);
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
          <Ionicons name="checkmark-circle" size={80} color={COLORS.skyBlue} />
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
          return (
            <TouchableOpacity
              key={tile.id}
              style={[
                styles.tile,
                tile.matched && styles.tileMatched,
                isSelected && styles.tileSelected,
              ]}
              onPress={() => handleTilePress(tile)}
              disabled={tile.matched}
            >
              <Text
                style={[
                  styles.tileText,
                  tile.matched && styles.tileTextMatched,
                ]}
                numberOfLines={3}
              >
                {tile.text}
              </Text>
            </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  spacer: {
    width: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  tile: {
    width: '31.5%',
    aspectRatio: 0.75,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  tileSelected: {
    borderColor: COLORS.skyBlue,
    backgroundColor: '#B8D8E820',
  },
  tileMatched: {
    backgroundColor: '#51CF6620',
    borderColor: '#51CF66',
  },
  tileText: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
  },
  tileTextMatched: {
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
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
    backgroundColor: COLORS.textLight,
  },
});
