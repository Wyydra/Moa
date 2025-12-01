import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import Slider from '@react-native-community/slider';
import { getLocales } from 'expo-localization';
import { getLanguagePreference, saveLanguagePreference, getHandwritingLanguage, saveHandwritingLanguage, getTTSEnabled, getTTSAutoPlay, setTTSAutoPlay, getTTSRate, setTTSRate, setTTSEnabled, getNotificationsEnabled, setNotificationsEnabled, getNotificationTime, setNotificationTime, getStreakRemindersEnabled, setStreakRemindersEnabled, exportAllData, importAllData, getStorageSize, cleanupOldSessions, getOldSessionsCount } from '../data/storage';
import { commonStyles } from '../styles/commonStyles';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../utils/constants';
import OptionPicker from '../components/OptionPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleDailyReminder, cancelDailyReminder, scheduleStreakReminder, cancelStreakReminder } from '../utils/notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const getAppLanguages = (t: any) => [
  { code: 'system', name: t('settings.systemDefault'), icon: '🌐' },
  { code: 'en', name: 'English', icon: '🇬🇧' },
  { code: 'fr', name: 'Français', icon: '🇫🇷' },
];

const HANDWRITING_LANGUAGES = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [appLanguage, setAppLanguage] = useState(i18n.language);
  const [handwritingLanguage, setHandwritingLanguage] = useState('ko');
  const [ttsEnabled, setTTSEnabledState] = useState(true);
  const [ttsAutoPlay, setTTSAutoPlayState] = useState(false);
  const [ttsRate, setTTSRateState] = useState(1.0);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [notificationTime, setNotificationTimeState] = useState({ hour: 20, minute: 0 });
  const [streakRemindersEnabled, setStreakRemindersEnabledState] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [storageSize, setStorageSize] = useState(0);
  const [oldSessionsCount, setOldSessionsCount] = useState(0);
  const [retentionDays] = useState(365);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const savedAppLang = await getLanguagePreference();
    const savedHandwritingLang = await getHandwritingLanguage();
    const savedTTSEnabled = await getTTSEnabled();
    const savedTTSAutoPlay = await getTTSAutoPlay();
    const savedTTSRate = await getTTSRate();
    const savedNotificationsEnabled = await getNotificationsEnabled();
    const savedNotificationTime = await getNotificationTime();
    const savedStreakRemindersEnabled = await getStreakRemindersEnabled();
    const size = await getStorageSize();
    const oldSessions = await getOldSessionsCount(retentionDays);
    
    // Default to 'system' if no preference saved
    setAppLanguage(savedAppLang || 'system');
    if (savedHandwritingLang) {
      setHandwritingLanguage(savedHandwritingLang);
    }
    setTTSEnabledState(savedTTSEnabled);
    setTTSAutoPlayState(savedTTSAutoPlay);
    setTTSRateState(savedTTSRate);
    setNotificationsEnabledState(savedNotificationsEnabled);
    setNotificationTimeState(savedNotificationTime);
    setStreakRemindersEnabledState(savedStreakRemindersEnabled);
    setStorageSize(size);
    setOldSessionsCount(oldSessions);
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

  const handleNotificationsEnabledChange = async (value: boolean) => {
    await setNotificationsEnabled(value);
    setNotificationsEnabledState(value);
    
    if (value) {
      // Schedule notifications
      await scheduleDailyReminder(notificationTime.hour, notificationTime.minute);
      if (streakRemindersEnabled) {
        await scheduleStreakReminder();
      }
    } else {
      // Cancel all notifications
      await cancelDailyReminder();
      await cancelStreakReminder();
    }
  };

  const handleNotificationTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedDate && event.type !== 'dismissed') {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      
      await setNotificationTime(hour, minute);
      setNotificationTimeState({ hour, minute });
      
      if (notificationsEnabled) {
        await scheduleDailyReminder(hour, minute);
      }
    }
  };

  const handleStreakRemindersChange = async (value: boolean) => {
    await setStreakRemindersEnabled(value);
    setStreakRemindersEnabledState(value);
    
    if (value && notificationsEnabled) {
      await scheduleStreakReminder();
    } else {
      await cancelStreakReminder();
    }
  };



  const handleExportData = async () => {
    try {
      const jsonData = await exportAllData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `moa_backup_${timestamp}.json`;
      const file = new File(Paths.cache, fileName);

      await file.write(jsonData);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Moa Backup',
          UTI: 'public.json',
        });
      } else {
        Alert.alert(
          'Export Complete',
          `Backup saved to: ${fileName}`
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const file = new File(fileUri);
      const fileContent = await file.text();

      Alert.alert(
        'Import Data',
        'Do you want to merge with existing data or replace all data?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Merge',
            onPress: async () => {
              try {
                await importAllData(fileContent, false);
                await loadPreferences();
                Alert.alert('Success', 'Data imported and merged successfully!');
              } catch (error) {
                console.error('Error importing data:', error);
                Alert.alert('Error', 'Failed to import data. Please check the file format.');
              }
            },
          },
          {
            text: 'Replace All',
            style: 'destructive',
            onPress: async () => {
              try {
                await importAllData(fileContent, true);
                await loadPreferences();
                Alert.alert('Success', 'Data replaced successfully!');
              } catch (error) {
                console.error('Error importing data:', error);
                Alert.alert('Error', 'Failed to import data. Please check the file format.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to import data. Please try again.');
    }
  };

  const handleReportBug = async () => {
    try {
      const subject = encodeURIComponent('Moa - Bug Report');
      const body = encodeURIComponent(`App Version: ${require('../../package.json').version}\nPlatform: ${Platform.OS}\n\nDescribe the bug:\n\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\n\nActual behavior:\n\n`);
      const url = `mailto:moafeedback@wydry.dev?subject=${subject}&body=${body}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t('common.error'),
          t('settings.feedback.emailError')
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        t('common.error'),
        t('settings.feedback.emailError')
      );
    }
  };

  const handleFeatureRequest = async () => {
    try {
      const subject = encodeURIComponent('Moa - Feature Request');
      const body = encodeURIComponent(`App Version: ${require('../../package.json').version}\nPlatform: ${Platform.OS}\n\nFeature Request:\n\n\nWhy would this be useful:\n\n\nHow should it work:\n\n`);
      const url = `mailto:moafeedback@wydry.dev?subject=${subject}&body=${body}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t('common.error'),
          t('settings.feedback.emailError')
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert(
        t('common.error'),
        t('settings.feedback.emailError')
      );
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleCleanupOldData = async () => {
    if (oldSessionsCount === 0) {
      Alert.alert('No Data to Clean', 'There are no old study sessions to remove.');
      return;
    }

    Alert.alert(
      'Clean Up Old Data',
      `This will permanently delete ${oldSessionsCount} study session${oldSessionsCount !== 1 ? 's' : ''} older than ${retentionDays} days. This action cannot be undone.\n\nYour decks and cards will not be affected.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedCount = await cleanupOldSessions(retentionDays);
              const newSize = await getStorageSize();
              const newOldSessionsCount = await getOldSessionsCount(retentionDays);
              
              setStorageSize(newSize);
              setOldSessionsCount(newOldSessionsCount);
              
              Alert.alert(
                'Cleanup Complete',
                `Successfully deleted ${deletedCount} old study session${deletedCount !== 1 ? 's' : ''}.`
              );
            } catch (error) {
              console.error('Error cleaning up data:', error);
              Alert.alert('Error', 'Failed to clean up old data. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + SPACING.md }}
      >
        <Text style={commonStyles.screenTitle}>{t('settings.title')}</Text>
        
        <View style={styles.content}>
          <OptionPicker
            label={t('settings.appLanguage')}
            description={t('settings.appLanguageDescription')}
            value={appLanguage}
            options={getAppLanguages(t)}
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
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
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
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.surface}
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
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={COLORS.primary}
                  />
                  <Text style={styles.sliderValue}>2.0x</Text>
                </View>
                <Text style={styles.currentRateValue}>{ttsRate.toFixed(1)}x</Text>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>{t('settings.notifications.title')}</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.notifications.enabled')}</Text>
              <Text style={styles.settingDescription}>{t('settings.notifications.enabledDescription')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsEnabledChange}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>

          {notificationsEnabled && (
            <>
              <TouchableOpacity 
                style={styles.settingRow}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{t('settings.notifications.dailyReminderTime')}</Text>
                  <Text style={styles.settingDescription}>{t('settings.notifications.dailyReminderTimeDescription')}</Text>
                </View>
                <Text style={styles.timeValue}>{formatTime(notificationTime.hour, notificationTime.minute)}</Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={new Date(0, 0, 0, notificationTime.hour, notificationTime.minute)}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleNotificationTimeChange}
                />
              )}

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{t('settings.notifications.streakReminders')}</Text>
                  <Text style={styles.settingDescription}>{t('settings.notifications.streakRemindersDescription')}</Text>
                </View>
                <Switch
                  value={streakRemindersEnabled}
                  onValueChange={handleStreakRemindersChange}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.surface}
                />
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>{t('settings.feedback.title')}</Text>

          <View style={styles.settingColumn}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.feedback.description')}</Text>
              <Text style={styles.settingDescription}>{t('settings.feedback.subtitle')}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleReportBug}
          >
            <Text style={styles.actionButtonText}>{t('settings.feedback.reportBug')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleFeatureRequest}
          >
            <Text style={styles.actionButtonText}>{t('settings.feedback.featureRequest')}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Data & Backup</Text>
          
          <View style={styles.settingColumn}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Storage Used</Text>
              <Text style={styles.settingDescription}>Current app data size</Text>
            </View>
            <Text style={styles.storageValue}>{formatStorageSize(storageSize)}</Text>
          </View>

          <View style={styles.settingColumn}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Old Study Sessions</Text>
              <Text style={styles.settingDescription}>Sessions older than {retentionDays} days</Text>
            </View>
            <Text style={styles.storageValue}>{oldSessionsCount}</Text>
          </View>

          {oldSessionsCount > 0 && (
            <TouchableOpacity 
              style={styles.cleanupButton}
              onPress={handleCleanupOldData}
            >
              <Text style={styles.cleanupButtonText}>Clean Up Old Data</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.compactButton}
            onPress={handleExportData}
          >
            <Text style={styles.compactButtonText}>Export All Data</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactButton}
            onPress={handleImportData}
          >
            <Text style={styles.compactButtonText}>Import Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    marginTop: SPACING.lg,
    letterSpacing: -0.3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingColumn: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.2,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: SPACING.md,
  },
  sliderValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  currentRateValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  timeValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  storageValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  actionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  compactButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  compactButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  cleanupButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  cleanupButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.danger,
  },
});
