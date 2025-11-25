import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAllCards } from '../data/storage';

export interface NotificationPreferences {
  enabled: boolean;
  dailyReminderTime: { hour: number; minute: number };
  streakReminders: boolean;
  studyGoalReminders: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  dailyReminderTime: { hour: 20, minute: 0 }, // 8 PM default
  streakReminders: true,
  studyGoalReminders: true,
};

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // Configure notification channels for Android
    if (Platform.OS === 'android') {
      await configureAndroidChannels();
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Configure Android notification channels
 */
const configureAndroidChannels = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;

  try {
    // Daily reminder channel
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Study Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Streak reminder channel
    await Notifications.setNotificationChannelAsync('streak-reminder', {
      name: 'Streak Protection',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Goal reminder channel
    await Notifications.setNotificationChannelAsync('goal-reminder', {
      name: 'Study Goal Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  } catch (error) {
    console.error('Error configuring Android channels:', error);
  }
};

/**
 * Schedule daily study reminder notification
 */
export const scheduleDailyReminder = async (
  hour: number,
  minute: number
): Promise<string | null> => {
  try {
    // Cancel existing daily reminder
    await cancelDailyReminder();

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Schedule notification to trigger daily at specified time
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Time to Study!',
        body: 'Keep your streak going! Review your cards now.',
        data: { type: 'daily-reminder' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          channelId: 'daily-reminder',
        }),
      },
      trigger,
    });

    console.log(`Daily reminder scheduled at ${hour}:${minute}, ID: ${id}`);
    return id;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
};

/**
 * Cancel daily study reminder
 */
export const cancelDailyReminder = async (): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const dailyReminders = scheduled.filter(
      (notif) => notif.content.data?.type === 'daily-reminder'
    );

    for (const notif of dailyReminders) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }

    console.log(`Cancelled ${dailyReminders.length} daily reminders`);
  } catch (error) {
    console.error('Error cancelling daily reminder:', error);
  }
};

/**
 * Schedule streak protection reminder
 * Triggers if user hasn't studied today
 */
export const scheduleStreakReminder = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Schedule for 9 PM daily if user hasn't studied
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Don\'t Break Your Streak!',
        body: 'You haven\'t studied yet today. Keep your streak alive!',
        data: { type: 'streak-reminder' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && {
          channelId: 'streak-reminder',
        }),
      },
      trigger,
    });

    console.log(`Streak reminder scheduled, ID: ${id}`);
    return id;
  } catch (error) {
    console.error('Error scheduling streak reminder:', error);
    return null;
  }
};

/**
 * Cancel streak reminder
 */
export const cancelStreakReminder = async (): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const streakReminders = scheduled.filter(
      (notif) => notif.content.data?.type === 'streak-reminder'
    );

    for (const notif of streakReminders) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }

    console.log(`Cancelled ${streakReminders.length} streak reminders`);
  } catch (error) {
    console.error('Error cancelling streak reminder:', error);
  }
};

/**
 * Update badge count with number of due cards
 */
export const updateBadgeCount = async (): Promise<void> => {
  try {
    const cards = await getAllCards();
    const now = Date.now();
    const dueCount = cards.filter((card) => card.nextReview <= now).length;

    await Notifications.setBadgeCountAsync(dueCount);
    console.log(`Badge count updated: ${dueCount} due cards`);
  } catch (error) {
    console.error('Error updating badge count:', error);
  }
};

/**
 * Clear badge count
 */
export const clearBadgeCount = async (): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(0);
    console.log('Badge count cleared');
  } catch (error) {
    console.error('Error clearing badge count:', error);
  }
};

/**
 * Send immediate notification with due card count
 */
export const sendDueCardsNotification = async (
  dueCount: number
): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    if (dueCount === 0) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📝 Cards Due for Review',
        body: `You have ${dueCount} card${dueCount > 1 ? 's' : ''} ready to review!`,
        data: { type: 'due-cards' },
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: 'goal-reminder',
        }),
      },
      trigger: null, // Send immediately
    });

    console.log(`Sent due cards notification: ${dueCount} cards`);
  } catch (error) {
    console.error('Error sending due cards notification:', error);
  }
};

/**
 * Send congratulations notification after study session
 */
export const sendCongratsNotification = async (
  cardsStudied: number,
  streakDays: number
): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Great Job!',
        body: `You've studied ${cardsStudied} cards today! Current streak: ${streakDays} days 🔥`,
        data: { type: 'congrats' },
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: 'goal-reminder',
        }),
      },
      trigger: null, // Send immediately
    });

    console.log(`Sent congrats notification: ${cardsStudied} cards, ${streakDays} day streak`);
  } catch (error) {
    console.error('Error sending congrats notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * Get all scheduled notifications (for debugging)
 */
export const getScheduledNotifications = async (): Promise<
  Notifications.NotificationRequest[]
> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Test notification (for settings UI)
 */
export const sendTestNotification = async (): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Test Notification',
        body: 'Notifications are working correctly!',
        data: { type: 'test' },
        sound: 'default',
      },
      trigger: null, // Send immediately
    });

    console.log('Test notification sent');
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

export { DEFAULT_PREFERENCES };
