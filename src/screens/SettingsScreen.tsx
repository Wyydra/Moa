import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { getLanguagePreference, saveLanguagePreference, getHandwritingLanguage, saveHandwritingLanguage } from '../data/storage';
import { commonStyles } from '../styles/commonStyles';
import { COLORS, SPACING } from '../utils/constants';

export default function SettingsScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const [appLanguage, setAppLanguage] = useState(i18n.language);
  const [handwritingLanguage, setHandwritingLanguage] = useState('ko');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const savedAppLang = await getLanguagePreference();
    const savedHandwritingLang = await getHandwritingLanguage();
    
    if (savedAppLang) {
      setAppLanguage(savedAppLang);
    }
    if (savedHandwritingLang) {
      setHandwritingLanguage(savedHandwritingLang);
    }
  };

  const handleAppLanguageChange = async (lang: string) => {
    await saveLanguagePreference(lang);
    await i18n.changeLanguage(lang);
    setAppLanguage(lang);
  };

  const handleHandwritingLanguageChange = async (lang: string) => {
    await saveHandwritingLanguage(lang);
    setHandwritingLanguage(lang);
  };

  const handleImportDeck = () => {
    navigation.getParent()?.navigate('Library', {
      screen: 'ImportScreen'
    });
  };

  const appLanguages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
  ];

  const handwritingLanguages = [
    { code: 'ko', label: '한국어 (Korean)' },
    { code: 'ja', label: '日本語 (Japanese)' },
  ];

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.screenTitle}>{t('settings.title')}</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appLanguage')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.appLanguageDescription')}</Text>
          {appLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                appLanguage === lang.code && styles.optionSelected
              ]}
              onPress={() => handleAppLanguageChange(lang.code)}
            >
              <Text style={[
                styles.optionText,
                appLanguage === lang.code && styles.optionTextSelected
              ]}>
                {lang.label}
              </Text>
              {appLanguage === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.handwritingLanguage')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.handwritingLanguageDescription')}</Text>
          {handwritingLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                handwritingLanguage === lang.code && styles.optionSelected
              ]}
              onPress={() => handleHandwritingLanguageChange(lang.code)}
            >
              <Text style={[
                styles.optionText,
                handwritingLanguage === lang.code && styles.optionTextSelected
              ]}>
                {lang.label}
              </Text>
              {handwritingLanguage === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.import')}</Text>
          <TouchableOpacity
            style={[commonStyles.card, styles.importButton]}
            onPress={handleImportDeck}
          >
            <View style={styles.importContent}>
              <Ionicons name="cloud-download" size={24} color={COLORS.skyBlue} />
              <View style={styles.importText}>
                <Text style={styles.importTitle}>{t('import.importQuizlet')}</Text>
                <Text style={styles.importDescription}>{t('import.importDescription')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.skyBlue,
    backgroundColor: COLORS.cardBg,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: COLORS.skyBlue,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.skyBlue,
    fontWeight: 'bold',
  },
  importButton: {
    padding: SPACING.md,
  },
  importContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  importText: {
    flex: 1,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  importDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});
