import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, SPACING } from '../utils/constants';
import { commonStyles } from '../styles/commonStyles';

export default function HomeScreen() {
  const reviewsDue = 0;

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Moa 🪶</Text>
      </View>

      <View style={[commonStyles.card, styles.progressCard]}>
        <Text style={styles.cardTitle}>Today's Reviews</Text>
        <Text style={styles.cardNumber}>{reviewsDue}</Text>
        <Text style={styles.cardSubtext}>cards due</Text>
      </View>

      <TouchableOpacity style={[commonStyles.button, styles.startButton]}>
        <Text style={commonStyles.buttonText}>Start Reviewing</Text>
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
