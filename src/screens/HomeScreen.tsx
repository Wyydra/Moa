import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../utils/constants';
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useRef, useEffect } from 'react';
import { getAllDecks, getDueCards, getStudyStreak, getTodayReviewCount } from '../data/storage';
import { Deck } from '../data/model';

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [totalDue, setTotalDue] = useState(0);
  const [totalDecks, setTotalDecks] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const [topDecks, setTopDecks] = useState<Array<{deck: Deck, dueCount: number}>>([]);
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
    try {
      // Load decks and due cards
      const decks = await getAllDecks();
      
      let totalDueCount = 0;
      let totalCardsCount = 0;
      const decksWithDueCards = [];
      
      for (const deck of decks) {
        totalCardsCount += deck.cardCount;
        const due = await getDueCards(deck.id);
        if (due.length > 0) {
          decksWithDueCards.push({ deck, dueCount: due.length });
          totalDueCount += due.length;
        }
      }
      
      // Sort by most urgent (highest due count) and take top 3
      decksWithDueCards.sort((a, b) => b.dueCount - a.dueCount);
      const topPriorityDecks = decksWithDueCards.slice(0, 3);
      
      // Load progress stats
      const streakDays = await getStudyStreak();
      const todayCount = await getTodayReviewCount();
      
      setTotalDecks(decks.length);
      setTotalCards(totalCardsCount);
      setTotalDue(totalDueCount);
      setStreak(streakDays);
      setTodayReviews(todayCount);
      setTopDecks(topPriorityDecks);
    } catch (error) {
      console.error('Error loading home stats:', error);
    } finally {
      setLoading(false);
    }
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

      {/* Library Stats Section */}
      <Animated.View
        style={[
          styles.statsSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="albums" size={24} color={COLORS.skyBlue} />
            <Text style={styles.statNumber}>{totalDecks}</Text>
            <Text style={styles.statLabel}>{t('library.totalDecks')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="layers" size={24} color={COLORS.mintGreen} />
            <Text style={styles.statNumber}>{totalCards}</Text>
            <Text style={styles.statLabel}>{t('library.totalCards')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Ionicons name="time" size={24} color="white" />
            <Text style={[styles.statNumber, styles.statNumberHighlight]}>{totalDue}</Text>
            <Text style={[styles.statLabel, styles.statLabelHighlight]}>{t('library.cardsDue')}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Personal Stats Section */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Progress')}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color={COLORS.coral} />
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>{t('progress.dayStreak')}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.mintGreen} />
              <Text style={styles.statNumber}>{todayReviews}</Text>
              <Text style={styles.statLabel}>{t('progress.reviewsToday')}</Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Top Priority Decks */}
      {topDecks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.topPriority')}</Text>
            {topDecks.length < totalDue / 10 && (
              <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {topDecks.map(({ deck, dueCount }) => (
            <TouchableOpacity
              key={deck.id}
              style={styles.deckCard}
              onPress={() => handleDeckPress(deck.id)}
            >
              <View style={styles.deckInfo}>
                <Text style={styles.deckName}>{deck.name}</Text>
                {deck.description && (
                  <Text style={styles.deckDescription} numberOfLines={1}>
                    {deck.description}
                  </Text>
                )}
              </View>
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{dueCount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {topDecks.length === 0 && !loading && (
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
  statsSection: {
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardHighlight: {
    backgroundColor: COLORS.skyBlue,
    borderColor: COLORS.skyBlue,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statNumberHighlight: {
    color: 'white',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  statLabelHighlight: {
    color: 'white',
    opacity: 0.9,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.skyBlue,
  },
  deckCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  dueBadge: {
    backgroundColor: COLORS.skyBlue,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 36,
    alignItems: 'center',
  },
  dueBadgeText: {
    fontSize: 14,
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
