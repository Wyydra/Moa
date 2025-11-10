import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },

  screenTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 60,
    marginBottom: 20,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
 buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },

  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 40,
  },
});
