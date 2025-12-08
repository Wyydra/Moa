import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, StyleSheet, ActivityIndicator, Keyboard, Platform } from 'react-native';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Écouter les événements du clavier
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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

      {/* Modal */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => {
              setShowPicker(false);
              setSearchQuery('');
              Keyboard.dismiss();
            }}
          />
          <View style={[styles.modalContent, { 
            marginBottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom,
            paddingBottom: keyboardHeight > 0 ? 20 : 20 + insets.bottom 
          }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('deck.language')}</Text>
              <TouchableOpacity onPress={() => {
                setShowPicker(false);
                setSearchQuery('');
                Keyboard.dismiss();
              }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Recherche - toujours visible */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('deck.searchLanguage')}
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Liste des langues */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  searchContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  languageOptionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  languageCode: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
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
