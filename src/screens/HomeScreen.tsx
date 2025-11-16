import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../utils/constants';
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useRef, useEffect } from 'react';
import { getAllDecks, getAllCards, getDueCards } from '../data/storage';
import { Deck } from '../data/model';

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [totalDue, setTotalDue] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [decksWithDue, setDecksWithDue] = useState<Array<{deck: Deck, dueCount: number}>>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const decks = await getAllDecks();
    const cards = await getAllCards();
    
    let totalDueCount = 0;
    const decksWithDueCards = [];
    
    for (const deck of decks) {
      const due = await getDueCards(deck.id);
      if (due.length > 0) {
        decksWithDueCards.push({ deck, dueCount: due.length });
        totalDueCount += due.length;
      }
    }
    
    setTotalDue(totalDueCount);
    setTotalCards(cards.length);
    setDecksWithDue(decksWithDueCards);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const handleDeckPress = (deckId: string) => {
    navigation.navigate('Library', { 
      screen: 'DeckDetails', 
      params: { deckId } 
    });
  };

  return (
    <ScrollView style={commonStyles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Moa</Text>
        <Text style={styles.subtitle}>{t('home.welcome')}</Text>
      </View>

      <Animated.View 
        style={[
          styles.statsGrid,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={[commonStyles.card, styles.statCard]}>
          <Ionicons name="today-outline" size={28} color={COLORS.skyBlue} />
          <Text style={styles.statNumber}>{totalDue}</Text>
          <Text style={styles.statLabel}>{t('home.cardsDue')}</Text>
        </View>

        <View style={[commonStyles.card, styles.statCard]}>
          <Ionicons name="library-outline" size={28} color={COLORS.mint} />
          <Text style={styles.statNumber}>{totalCards}</Text>
          <Text style={styles.statLabel}>{t('home.totalCards')}</Text>
        </View>
      </Animated.View>

      {decksWithDue.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.readyToStudy')}</Text>
          {decksWithDue.map(({ deck, dueCount }) => (
            <TouchableOpacity
              key={deck.id}
              style={[commonStyles.card, styles.deckCard]}
              onPress={() => handleDeckPress(deck.id)}
            >
              <View style={styles.deckInfo}>
                <Text style={styles.deckName}>{deck.name}</Text>
                <Text style={styles.deckDescription}>
                  {deck.description || t('library.cardCount', { count: deck.cardCount })}
                </Text>
              </View>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{dueCount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {decksWithDue.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.mint} />
          <Text style={styles.emptyTitle}>{t('home.allCaughtUp')}</Text>
          <Text style={styles.emptyText}>{t('home.noCardsDue')}</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.libraryButton]}
            onPress={() => navigation.navigate('Library')}
          >
            <Ionicons name="library-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={commonStyles.buttonText}>{t('home.browseLibrary')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 60,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  deckDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  dueBadge: {
    backgroundColor: COLORS.skyBlue,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  dueBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
