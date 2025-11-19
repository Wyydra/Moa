import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import Slider from '@react-native-community/slider';
import { getLocales } from 'expo-localization';
import { getLanguagePreference, saveLanguagePreference, getHandwritingLanguage, saveHandwritingLanguage, getTTSEnabled, getTTSAutoPlay, setTTSAutoPlay, getTTSRate, setTTSRate, setTTSEnabled } from '../data/storage';
import { commonStyles } from '../styles/commonStyles';
import { COLORS, SPACING } from '../utils/constants';
import OptionPicker from '../components/OptionPicker';

const APP_LANGUAGES = [
  { code: 'system', name: 'System Default', icon: '🌐' },
  { code: 'en', name: 'English', icon: '🇬🇧' },
  { code: 'fr', name: 'Français', icon: '🇫🇷' },
];

const HANDWRITING_LANGUAGES = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [appLanguage, setAppLanguage] = useState(i18n.language);
  const [handwritingLanguage, setHandwritingLanguage] = useState('ko');
  const [ttsEnabled, setTTSEnabledState] = useState(true);
  const [ttsAutoPlay, setTTSAutoPlayState] = useState(false);
  const [ttsRate, setTTSRateState] = useState(1.0);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const savedAppLang = await getLanguagePreference();
    const savedHandwritingLang = await getHandwritingLanguage();
    const savedTTSEnabled = await getTTSEnabled();
    const savedTTSAutoPlay = await getTTSAutoPlay();
    const savedTTSRate = await getTTSRate();
    
    if (savedAppLang) {
      setAppLanguage(savedAppLang);
    } else {
      // If no saved preference, use system default
      const systemLocale = getLocales()[0]?.languageCode || 'en';
      const supportedLang = systemLocale === 'fr' ? 'fr' : 'en';
      setAppLanguage(supportedLang);
    }
    if (savedHandwritingLang) {
      setHandwritingLanguage(savedHandwritingLang);
    }
    setTTSEnabled(savedTTSEnabled);
    setTTSAutoPlayState(savedTTSAutoPlay);
    setTTSRateState(savedTTSRate);
  };

  const handleAppLanguageChange = async (lang: string) => {
    let actualLang = lang;
    if (lang === 'system') {
      // Detect system language
      const systemLocale = getLocales()[0]?.languageCode || 'en';
      actualLang = systemLocale === 'fr' ? 'fr' : 'en';
    }
    await saveLanguagePreference(lang);
    await i18n.changeLanguage(actualLang);
    setAppLanguage(lang);
  };

  const handleHandwritingLanguageChange = async (lang: string) => {
    await saveHandwritingLanguage(lang);
    setHandwritingLanguage(lang);
  };

  const handleTTSEnabledChange = async (value: boolean) => {
    await setTTSEnabled(value);
    setTTSEnabledState(value);
  };

  const handleTTSAutoPlayChange = async (value: boolean) => {
    await setTTSAutoPlay(value);
    setTTSAutoPlayState(value);
  };

  const handleTTSRateChange = async (value: number) => {
    await setTTSRate(value);
    setTTSRateState(value);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={commonStyles.screenTitle}>{t('settings.title')}</Text>
        
        <View style={styles.content}>
          <OptionPicker
            label={t('settings.appLanguage')}
            description={t('settings.appLanguageDescription')}
            value={appLanguage}
            options={APP_LANGUAGES}
            onValueChange={handleAppLanguageChange}
          />

          <OptionPicker
            label={t('settings.handwritingLanguage')}
            description={t('settings.handwritingLanguageDescription')}
            value={handwritingLanguage}
            options={HANDWRITING_LANGUAGES}
            onValueChange={handleHandwritingLanguageChange}
          />

          <Text style={styles.sectionTitle}>{t('settings.pronunciation')}</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.ttsEnabled')}</Text>
              <Text style={styles.settingDescription}>{t('settings.ttsEnabledDescription')}</Text>
            </View>
            <Switch
              value={ttsEnabled}
              onValueChange={handleTTSEnabledChange}
              trackColor={{ false: COLORS.border, true: COLORS.skyBlue }}
              thumbColor={COLORS.cardBg}
            />
          </View>

          {ttsEnabled && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{t('settings.ttsAutoPlay')}</Text>
                  <Text style={styles.settingDescription}>{t('settings.ttsAutoPlayDescription')}</Text>
                </View>
                <Switch
                  value={ttsAutoPlay}
                  onValueChange={handleTTSAutoPlayChange}
                  trackColor={{ false: COLORS.border, true: COLORS.skyBlue }}
                  thumbColor={COLORS.cardBg}
                />
              </View>

              <View style={styles.settingColumn}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{t('settings.ttsRate')}</Text>
                  <Text style={styles.settingDescription}>{t('settings.ttsRateDescription')}</Text>
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>0.5x</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.5}
                    maximumValue={2.0}
                    step={0.1}
                    value={ttsRate}
                    onValueChange={handleTTSRateChange}
                    minimumTrackTintColor={COLORS.skyBlue}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={COLORS.skyBlue}
                  />
                  <Text style={styles.sliderValue}>2.0x</Text>
                </View>
                <Text style={styles.currentRateValue}>{ttsRate.toFixed(1)}x</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingRow: {
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
  settingColumn: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: SPACING.sm,
  },
  sliderValue: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  currentRateValue: {
    fontSize: 16,
    color: COLORS.skyBlue,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

});
