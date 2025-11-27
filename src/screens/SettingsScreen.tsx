import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import Slider from '@react-native-community/slider';
import { getLocales } from 'expo-localization';
import { getLanguagePreference, saveLanguagePreference, getHandwritingLanguage, saveHandwritingLanguage, getTTSEnabled, getTTSAutoPlay, setTTSAutoPlay, getTTSRate, setTTSRate, setTTSEnabled, getNotificationsEnabled, setNotificationsEnabled, getNotificationTime, setNotificationTime, getStreakRemindersEnabled, setStreakRemindersEnabled } from '../data/storage';
import { commonStyles } from '../styles/commonStyles';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../utils/constants';
import OptionPicker from '../components/OptionPicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleDailyReminder, cancelDailyReminder, scheduleStreakReminder, cancelStreakReminder, sendTestNotification } from '../utils/notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import SyncService, { SyncResult } from '../utils/syncService';

const APP_LANGUAGES = [
  { code: 'system', name: 'System Default', icon: '🌐' },
  { code: 'en', name: 'English', icon: '🇬🇧' },
  { code: 'fr', name: 'Français', icon: '🇫🇷' },
];

const HANDWRITING_LANGUAGES = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export default function SettingsScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [appLanguage, setAppLanguage] = useState(i18n.language);
  const [handwritingLanguage, setHandwritingLanguage] = useState('ko');
  const [ttsEnabled, setTTSEnabledState] = useState(true);
  const [ttsAutoPlay, setTTSAutoPlayState] = useState(false);
  const [ttsRate, setTTSRateState] = useState(1.0);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [notificationTime, setNotificationTimeState] = useState({ hour: 20, minute: 0 });
  const [streakRemindersEnabled, setStreakRemindersEnabledState] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

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
    setTTSEnabledState(savedTTSEnabled);
    setTTSAutoPlayState(savedTTSAutoPlay);
    setTTSRateState(savedTTSRate);
    setNotificationsEnabledState(savedNotificationsEnabled);
    setNotificationTimeState(savedNotificationTime);
    setStreakRemindersEnabledState(savedStreakRemindersEnabled);
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

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert(
        t('settings.notifications.testSent'),
        t('settings.notifications.testSentDescription')
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('settings.notifications.testError')
      );
    }
  };

  const handleSignOut = async (): Promise<void> => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert(
                t('common.error'),
                t('settings.signOutError')
              );
            }
          },
        },
      ]
    );
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleSync = async (): Promise<void> => {
    if (!user) {
      Alert.alert(
        t('common.error'),
        t('settings.sync.signInRequired')
      );
      return;
    }

    setIsSyncing(true);
    try {
      const result = await SyncService.syncAll();
      setLastSyncResult(result);

      if (result.success) {
        Alert.alert(
          t('settings.sync.success'),
          t('settings.sync.successMessage', {
            decksUp: result.decksUploaded,
            cardsUp: result.cardsUploaded,
            decksDown: result.decksDownloaded,
            cardsDown: result.cardsDownloaded,
            decksUpdated: result.decksUpdated,
            cardsUpdated: result.cardsUpdated,
            conflictsResolved: result.conflictsResolved,
          })
        );
      } else {
        Alert.alert(
          t('common.error'),
          result.error || t('settings.sync.error')
        );
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(
        t('common.error'),
        t('settings.sync.error')
      );
    } finally {
      setIsSyncing(false);
    }
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

              <TouchableOpacity 
                style={styles.testButton}
                onPress={handleTestNotification}
              >
                <Text style={styles.testButtonText}>{t('settings.notifications.testNotification')}</Text>
              </TouchableOpacity>
            </>
          )}

          {user && (
            <>
              <Text style={styles.sectionTitle}>{t('settings.sync.title')}</Text>

              <View style={styles.settingColumn}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{t('settings.sync.description')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('settings.sync.details')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
                onPress={handleSync}
                disabled={isSyncing}
              >
                <Ionicons 
                  name={isSyncing ? "sync" : "cloud-upload-outline"} 
                  size={20} 
                  color={COLORS.surface} 
                />
                <Text style={styles.syncButtonText}>
                  {isSyncing ? t('settings.sync.syncing') : t('settings.sync.syncNow')}
                </Text>
              </TouchableOpacity>

              {lastSyncResult && lastSyncResult.success && (
                <View style={styles.syncResultCard}>
                  <Text style={styles.syncResultText}>
                    {t('settings.sync.lastSync')}: {' '}
                    ↑ {lastSyncResult.decksUploaded}D/{lastSyncResult.cardsUploaded}C  {' '}
                    ↓ {lastSyncResult.decksDownloaded}D/{lastSyncResult.cardsDownloaded}C  {' '}
                    ✓ {lastSyncResult.decksUpdated}D/{lastSyncResult.cardsUpdated}C
                    {lastSyncResult.conflictsResolved > 0 && ` ⚡ ${lastSyncResult.conflictsResolved}`}
                  </Text>
                </View>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          
          {user ? (
            <>
              <View style={styles.accountCard}>
                <View style={styles.accountInfo}>
                  <Ionicons name="person-circle" size={48} color={COLORS.primary} />
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>{user.username}</Text>
                    <Text style={styles.accountEmail}>{user.email}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                <Text style={styles.signOutButtonText}>{t('settings.signOut')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.authCard}>
                <Ionicons name="cloud-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.authCardTitle}>{t('auth.createAccount')}</Text>
                <Text style={styles.authCardDescription}>
                  {t('auth.syncDescription')}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.signInButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Ionicons name="log-in-outline" size={20} color={COLORS.surface} />
                <Text style={styles.signInButtonText}>{t('auth.signIn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
                <Text style={styles.registerButtonText}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </>
          )}
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
  accountCard: {
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
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  accountName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  accountEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  signOutButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.danger,
    marginLeft: SPACING.sm,
    letterSpacing: 0.5,
  },
  authCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  authCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  authCardDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.surface,
    marginLeft: SPACING.sm,
    letterSpacing: 0.5,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  registerButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    letterSpacing: 0.5,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.surface,
    marginLeft: SPACING.sm,
    letterSpacing: 0.5,
  },
  syncResultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  syncResultText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
});
