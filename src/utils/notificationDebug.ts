import * as Notifications from 'expo-notifications';

/**
 * Get statistics about currently scheduled notifications
 */
export const getNotificationStats = async (): Promise<{
  total: number;
  daily: number;
  streak: number;
  other: number;
}> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    const stats = {
      total: scheduled.length,
      daily: scheduled.filter(n => n.content.data?.type === 'daily-reminder').length,
      streak: scheduled.filter(n => n.content.data?.type === 'streak-reminder').length,
      other: scheduled.filter(n => {
        const type = n.content.data?.type;
        return type !== 'daily-reminder' && type !== 'streak-reminder';
      }).length,
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return { total: 0, daily: 0, streak: 0, other: 0 };
  }
};

/**
 * Log all scheduled notifications for debugging purposes
 */
export const logScheduledNotifications = async (): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    if (scheduled.length === 0) {
      console.log('[Notifications] No scheduled notifications');
      return;
    }
    
    console.log(`[Notifications] ${scheduled.length} scheduled notification(s):`);
    
    const byType: Record<string, number> = {};
    scheduled.forEach((notif) => {
      const type = (notif.content.data?.type as string) || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    console.log('[Notifications] By type:', byType);
    
    if (__DEV__) {
      scheduled.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.content.title} (${notif.content.data?.type || 'no-type'})`);
      });
    }
  } catch (error) {
    console.error('[Notifications] Error logging scheduled notifications:', error);
  }
};

/**
 * Verify that only one notification of each type exists
 * Returns true if duplicates are found
 */
export const checkForDuplicates = async (): Promise<boolean> => {
  try {
    const stats = await getNotificationStats();
    const hasDuplicates = stats.daily > 1 || stats.streak > 1;
    
    if (hasDuplicates) {
      console.warn('[Notifications] Duplicates detected:', stats);
    }
    
    return hasDuplicates;
  } catch (error) {
    console.error('[Notifications] Error checking for duplicates:', error);
    return false;
  }
};
