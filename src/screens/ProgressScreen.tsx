import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles } from '../styles/commonStyles';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getAllDecks, 
  getAllCards, 
  getDueCards, 
  getStudyStreak,
  getTodayReviewCount,
  getWeekReviewCount,
  getOverallAccuracy
} from '../data/storage';
import { Deck } from '../data/model';

interface DeckProgress {
  deck: Deck;
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const [weekReviews, setWeekReviews] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [deckProgress, setDeckProgress] = useState<DeckProgress[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadProgressData();
    }, [])
  );

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // Load global stats
      const streakDays = await getStudyStreak();
      const todayCount = await getTodayReviewCount();
      const weekCount = await getWeekReviewCount();
      const accuracyPercent = await getOverallAccuracy();

      setStreak(streakDays);
      setTodayReviews(todayCount);
      setWeekReviews(weekCount);
      setAccuracy(accuracyPercent);

      // Load deck-specific progress
      const decks = await getAllDecks();
      const allCards = await getAllCards();
      
      let totalCardCount = 0;
      let totalDueCount = 0;
      
      const deckProgressData: DeckProgress[] = await Promise.all(
        decks.map(async (deck) => {
          const cards = allCards.filter(c => c.deckId === deck.id);
          const dueCards = await getDueCards(deck.id);
          
          // Categorize cards based on SRS algorithm state
          const mastered = cards.filter(c => c.repetitions >= 4 && c.easeFactor >= 2.5).length;
          const learning = cards.filter(c => c.repetitions > 0 && c.repetitions < 4).length;
          const newCards = cards.filter(c => c.repetitions === 0).length;
          
          totalCardCount += cards.length;
          totalDueCount += dueCards.length;
          
          return {
            deck,
            totalCards: cards.length,
            dueCards: dueCards.length,
            masteredCards: mastered,
            learningCards: learning,
            newCards: newCards,
          };
        })
      );

      setTotalCards(totalCardCount);
      setTotalDue(totalDueCount);
      setDeckProgress(deckProgressData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <LoadingSpinner fullScreen text={t('common.loading')} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + SPACING.md }}
      >
        <Text style={[commonStyles.screenTitle, styles.title]}>{t('progress.title')}</Text>
        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="flame" size={32} color={COLORS.danger} />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>{t('progress.dayStreak')}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{todayReviews}</Text>
            <Text style={styles.statLabel}>{t('progress.reviewsToday')}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color={COLORS.success} />
            <Text style={styles.statValue}>{weekReviews}</Text>
            <Text style={styles.statLabel}>{t('progress.reviewsThisWeek')}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy" size={32} color={COLORS.warning} />
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>{t('progress.accuracy')}</Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.overallProgress')}</Text>
          <View style={styles.overallCard}>
            <View style={styles.overallRow}>
              <Text style={styles.overallLabel}>{t('progress.totalCards')}</Text>
              <Text style={styles.overallValue}>{totalCards}</Text>
            </View>
            <View style={styles.overallRow}>
              <Text style={styles.overallLabel}>{t('progress.dueForReview')}</Text>
              <Text style={[styles.overallValue, totalDue > 0 && styles.overallValueDue]}>
                {totalDue}
              </Text>
            </View>
          </View>
        </View>

        {/* Per-Deck Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.deckProgress')}</Text>
          {deckProgress.length === 0 ? (
            <Text style={commonStyles.emptyText}>{t('progress.noDecks')}</Text>
          ) : (
            deckProgress.map((dp) => (
              <View key={dp.deck.id} style={styles.deckCard}>
                <View style={styles.deckHeader}>
                  <Text style={styles.deckName}>{dp.deck.name}</Text>
                  {dp.dueCards > 0 && (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueBadgeText}>{dp.dueCards} {t('progress.due')}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    {dp.totalCards > 0 && (
                      <>
                        <View 
                          style={[
                            styles.progressSegment, 
                            styles.progressMastered,
                            { width: `${(dp.masteredCards / dp.totalCards) * 100}%` }
                          ]} 
                        />
                        <View 
                          style={[
                            styles.progressSegment, 
                            styles.progressLearning,
                            { width: `${(dp.learningCards / dp.totalCards) * 100}%` }
                          ]} 
                        />
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.deckStats}>
                  <View style={styles.deckStat}>
                    <View style={[styles.statDot, styles.statDotMastered]} />
                    <Text style={styles.deckStatText}>
                      {t('progress.mastered')}: {dp.masteredCards}
                    </Text>
                  </View>
                  <View style={styles.deckStat}>
                    <View style={[styles.statDot, styles.statDotLearning]} />
                    <Text style={styles.deckStatText}>
                      {t('progress.learning')}: {dp.learningCards}
                    </Text>
                  </View>
                  <View style={styles.deckStat}>
                    <View style={[styles.statDot, styles.statDotNew]} />
                    <Text style={styles.deckStatText}>
                      {t('progress.new')}: {dp.newCards}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Motivational Message */}
        {streak >= 7 && (
          <View style={styles.motivationCard}>
            <Ionicons name="star" size={24} color={COLORS.warning} />
            <Text style={styles.motivationText}>
              {t('progress.keepItUp')}
            </Text>
          </View>
        )}

        {totalDue === 0 && totalCards > 0 && (
          <View style={styles.motivationCard}>
            <Ionicons name="checkmark-done-circle" size={24} color={COLORS.success} />
            <Text style={styles.motivationText}>
              {t('progress.allCaughtUp')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statCardPrimary: {
    ...SHADOWS.md,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.huge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  overallCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  overallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  overallLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
  },
  overallValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
  },
  overallValueDue: {
    color: COLORS.primary,
  },
  deckCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  deckName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    flex: 1,
  },
  dueBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  dueBadgeText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  progressBarContainer: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xs,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  progressMastered: {
    backgroundColor: COLORS.success,
  },
  progressLearning: {
    backgroundColor: COLORS.primary,
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  deckStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.xs,
    marginRight: SPACING.xs,
  },
  statDotMastered: {
    backgroundColor: COLORS.success,
  },
  statDotLearning: {
    backgroundColor: COLORS.primary,
  },
  statDotNew: {
    backgroundColor: COLORS.border,
  },
  deckStatText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  motivationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  motivationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});
