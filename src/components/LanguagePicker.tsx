import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAvailableLanguages } from '../hooks/useAvailableLanguages';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../utils/constants';

interface LanguagePickerProps {
  value: string | undefined;
  onChange: (code: string | undefined) => void;
}

export default function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { languages, loading } = useAvailableLanguages();
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les langues selon la recherche (strict includes)
  const filteredLanguages = languages.filter(lang => {
    if (!lang.code) return true; // Auto-detect toujours visible
    return lang.code.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Afficher la valeur sélectionnée
  const displayValue = value ? value : t('deck.languageAuto');

  const handleSelect = (code: string | undefined) => {
    onChange(code);
    setShowPicker(false);
    setSearchQuery(''); // Reset search
  };

  return (
    <>
      {/* Bouton de sélection */}
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.selectorText}>
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      {/* Modal plein écran */}
      <Modal
        visible={showPicker}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowPicker(false);
                setSearchQuery('');
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('deck.language')}</Text>
            <View style={styles.spacer} />
          </View>

          {/* Recherche */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('deck.searchLanguage')}
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Liste des langues */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: insets.bottom }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {filteredLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code || 'auto'}
                  style={[
                    styles.languageOption,
                    value === lang.code && styles.languageOptionSelected
                  ]}
                  onPress={() => handleSelect(lang.code)}
                >
                  <Text style={styles.languageCode}>
                    {lang.code ? lang.code : `🌐 ${t('deck.languageAuto')}`}
                  </Text>
                  {value === lang.code && (
                    <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {filteredLanguages.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('deck.noLanguagesFound')}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  selectorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  spacer: {
    width: 40,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    padding: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  languageOptionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  languageCode: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textMedium,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
  },
});
