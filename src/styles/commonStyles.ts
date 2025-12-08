import { StyleSheet } from 'react-native';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';
import type { Theme } from '../utils/themes';

export const createCommonStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: SPACING.xl,
  },

  screenTitle: {
    fontSize: TYPOGRAPHY.fontSize.huge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: theme.text,
    marginBottom: SPACING.xl,
    letterSpacing: -0.5,
  },

  card: {
    backgroundColor: theme.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.md,
    borderWidth: 0,
  },

  cardSubtle: {
    backgroundColor: theme.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },

  button: {
    backgroundColor: theme.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored(theme.primary),
  },

  buttonSecondary: {
    backgroundColor: theme.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
  },

  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: theme.textInverse,
    letterSpacing: 0.3,
  },

  buttonTextSecondary: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: theme.primary,
    letterSpacing: 0.3,
  },

  input: {
    backgroundColor: theme.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: theme.text,
    borderWidth: 2,
    borderColor: theme.border,
  },

  inputFocused: {
    borderColor: theme.primary,
    ...SHADOWS.sm,
  },

  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: theme.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: theme.textLight,
    textAlign: 'center',
    marginTop: SPACING.xxxl,
    lineHeight: TYPOGRAPHY.fontSize.base * TYPOGRAPHY.lineHeight.relaxed,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    paddingBottom: 40,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: theme.text,
    letterSpacing: -0.3,
  },

  modalCloseButton: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    color: theme.textLight,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
});
