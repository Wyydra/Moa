import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import { commonStyles } from '../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useRef, useEffect } from 'react';
import { getAllDecks, getDueCards, getStudyStreak, getTodayReviewCount } from '../data/storage';
import { updateBadgeCount } from '../utils/notifications';
import { Deck } from '../data/model';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
      
      // Update app badge count with due cards
      await updateBadgeCount();
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

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={commonStyles.container} 
      contentContainerStyle={{ paddingTop: insets.top + SPACING.md }}
      showsVerticalScrollIndicator={false}
    >
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
            <Ionicons name="albums" size={28} color={COLORS.info} />
            <Text style={styles.statNumber}>{totalDecks}</Text>
            <Text style={styles.statLabel}>{t('library.totalDecks')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="layers" size={28} color={COLORS.success} />
            <Text style={styles.statNumber}>{totalCards}</Text>
            <Text style={styles.statLabel}>{t('library.totalCards')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Ionicons name="time" size={28} color={COLORS.textInverse} />
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
              <Ionicons name="flame" size={28} color={COLORS.warning} />
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>{t('progress.dayStreak')}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
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
          <Ionicons name="checkmark-circle-outline" size={72} color={COLORS.success} />
          <Text style={styles.emptyTitle}>{t('home.allCaughtUp')}</Text>
          <Text style={styles.emptyText}>{t('home.noCardsDue')}</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.libraryButton]}
            onPress={() => navigation.navigate('Library')}
          >
            <Ionicons name="library-outline" size={22} color={COLORS.textInverse} />
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
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.display,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  statCardHighlight: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.colored(COLORS.primary),
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  statNumberHighlight: {
    color: COLORS.textInverse,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelHighlight: {
    color: COLORS.textInverse,
    opacity: 0.85,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  deckCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.2,
  },
  deckDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
  },
  dueBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored(COLORS.primary),
  },
  dueBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textLight,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  bottomPadding: {
    height: 40,
  },
});
