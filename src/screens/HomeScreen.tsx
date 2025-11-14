import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../utils/constants';
import { commonStyles } from '../styles/commonStyles';

export default function HomeScreen() {
  const { t } = useTranslation();
  const reviewsDue = 0;

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Moa 🪶</Text>
      </View>

      <View style={[commonStyles.card, styles.progressCard]}>
        <Text style={styles.cardTitle}>{t('home.todaysReviews')}</Text>
        <Text style={styles.cardNumber}>{reviewsDue}</Text>
        <Text style={styles.cardSubtext}>{t('home.cardsDue')}</Text>
      </View>

      <TouchableOpacity style={[commonStyles.button, styles.startButton]}>
        <Text style={commonStyles.buttonText}>{t('home.startReviewing')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  progressCard: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  cardNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: COLORS.skyBlue,
  },
  cardSubtext: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  startButton: {
    marginTop: 40,
  },
});
