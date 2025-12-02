import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, View, Text, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import ErrorBoundary from './src/components/ErrorBoundary';

// Ignore VirtualizedList warning from react-native-pell-rich-editor's internal WebView
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested inside plain ScrollViews',
]);

import HomeScreen from './src/screens/HomeScreen';
import AddCardScreen from './src/screens/AddCardScreen';
import EditCardScreen from './src/screens/EditCardScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeckDetailsScreen from './src/screens/DeckDetailsScreen';
import CreateDeckScreen from './src/screens/CreateDeckScreen';
import EditDeckScreen from './src/screens/EditDeckScreen';
import StudyScreen from './src/screens/StudyScreen';
import WriteScreen from './src/screens/WriteScreen';
import { useEffect, useState, useRef } from 'react';
import { initializeStorage, getNotificationsEnabled, getNotificationTime, getStreakRemindersEnabled } from './src/data/storage';
import TestScreen from './src/screens/TestScreen';
import MatchScreen from './src/screens/MatchScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import './src/i18n/config';
import { useTranslation } from 'react-i18next';
import { handleImportURL } from './src/utils/deepLinking';
import * as Font from 'expo-font';
import { scheduleDailyReminder, scheduleStreakReminder, updateBadgeCount } from './src/utils/notifications';

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShown: false }}>
      <LibraryStack.Screen name='LibraryList' component={LibraryScreen} />
      <LibraryStack.Screen name='DeckDetails' component={DeckDetailsScreen} />
      <LibraryStack.Screen 
        name='AddCard' 
        component={AddCardScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen 
        name='EditCard' 
        component={EditCardScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen 
        name='CreateDeck' 
        component={CreateDeckScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen 
        name='EditDeck' 
        component={EditDeckScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen 
        name='StudyScreen' 
        component={StudyScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen 
        name='WriteScreen' 
        component={WriteScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen
        name='TestScreen'
        component={TestScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen
        name='MatchScreen'
        component={MatchScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen
        name='BrowseScreen'
        component={BrowseScreen}
        options={{ presentation: 'modal'}}
        />
    </LibraryStack.Navigator>
  )
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name='SettingsList' component={SettingsScreen} />
    </SettingsStack.Navigator>
  )
}

function MainNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#A1A1AA',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4E4E7',
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          height: 60 + Math.max(insets.bottom, 0),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name='Home'
        component={HomeScreen}
        options={{ 
          tabBarLabel: t('home.title'),
          tabBarIcon: ({color, size}) => (
            <Ionicons name='home' size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior
            e.preventDefault();
            // Always navigate to LibraryList when tab is pressed, resetting the stack
            navigation.navigate('Library', { screen: 'LibraryList' });
          },
        })}
        options={{ 
          tabBarLabel: t('library.title'),
          tabBarIcon: ({color, size}) => (
            <Ionicons name='library' size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ 
          tabBarLabel: t('progress.title'),
          tabBarIcon: ({color, size}) => (
            <Ionicons name='stats-chart' size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ 
          tabBarLabel: t('settings.title'),
          tabBarIcon: ({color, size}) => (
            <Ionicons name='settings' size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  
  useEffect(() => {
    async function initialize() {
      try {
        // Load fonts
        await Font.loadAsync({
          ...Ionicons.font,
        });
        
        // Initialize database and storage
        const { runMigrations } = await import('./src/data/migrations');
        await runMigrations();
        await initializeStorage();
        
        setIsReady(true);
      } catch (error) {
        console.error('Initialization failed:', error);
        
        // Provide specific error messages for different failure scenarios
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const isRecoveryError = errorMessage.includes('Migration failed but data was restored');
        const isBackupFailure = errorMessage.includes('backup restoration also failed');
        
        let title = 'Initialization Error';
        let message = 'Failed to initialize the app. Please restart the app.';
        
        if (isRecoveryError) {
          title = 'Database Update Required';
          message = 'A database update was attempted but failed. Your data has been restored. Please restart the app to try again.';
        } else if (isBackupFailure) {
          title = 'Critical Error';
          message = 'Database migration failed and recovery was unsuccessful. Please contact support with your error logs.';
        }
        
        Alert.alert(title, message, [{ text: 'OK' }]);
      }
    }
    initialize();
  }, []);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Update badge count on app start
        await updateBadgeCount();

        // Get user preferences
        const notificationsEnabled = await getNotificationsEnabled();
        const streakRemindersEnabled = await getStreakRemindersEnabled();
        const notificationTime = await getNotificationTime();

        // Schedule notifications if enabled
        if (notificationsEnabled) {
          await scheduleDailyReminder(notificationTime.hour, notificationTime.minute);
          
          if (streakRemindersEnabled) {
            await scheduleStreakReminder();
          }
        }

        // Setup notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notification received:', notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('Notification tapped:', response);
          // Handle notification tap - could navigate to specific screen
          const notificationType = response.notification.request.content.data?.type;
          
          if (notificationType === 'daily-reminder' || notificationType === 'streak-reminder') {
            // Navigate to Home screen to start studying
            // This would require access to navigation ref
            console.log('User wants to study from notification');
          }
        });
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup notification listeners
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      if (event.url.startsWith('moa://import-deck')) {
        console.log('Processing import-deck link...');
        const result = await handleImportURL(event.url);
        console.log('Import result:', result);

        if (result.success) {
          Alert.alert(
            t('common.success'),
            t('deck.importSuccess', { name: result.deckName }),
            [{ text: t('common.ok')}]
          );
        } else {
          Alert.alert(
            t('common.error'),
            `${result.error || t('deck.importError')}\n\nDebug info available in console`
          );
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink({ url });
      }
    });
    
    return () => subscription.remove();
  }, [t]);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#6366F1' }}>
            Moa
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <MainNavigator />
          <StatusBar style='auto'/>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
