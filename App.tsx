import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Link, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import AddCardScreen from './src/screens/AddCardScreen';
import EditCardScreen from './src/screens/EditCardScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeckDetailsScreen from './src/screens/DeckDetailsScreen';
import CreateDeckScreen from './src/screens/CreateDeckScreen';
import EditDeckScreen from './src/screens/EditDeckScreen';
import StudyScreen from './src/screens/StudyScreen';
import WriteScreen from './src/screens/WriteScreen';
import { useEffect } from 'react';
import { initializeStorage } from './src/data/storage';
import TestScreen from './src/screens/TestScreen';
import './src/i18n/config';
import { useTranslation } from 'react-i18next';
import { handleImportURL } from './src/utils/deepLinking';
import { t } from 'i18next';

const Tab = createBottomTabNavigator();
const LibraryStack = createNativeStackNavigator();

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
    </LibraryStack.Navigator>
  )
}

export default function App() {
  const { t } = useTranslation();
  
  useEffect(() => {
    initializeStorage();
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

  return (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#B8D8E8',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFF8F0',
          borderTopColor: '#E0E0E0',
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
        options={{ 
          tabBarLabel: t('library.title'),
          tabBarIcon: ({color, size}) => (
            <Ionicons name='library' size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ 
          tabBarLabel: t('settings.title'),
          tabBarIcon: ({color, size}) => (
            <Ionicons name='settings' size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    <StatusBar style='auto'/>
  </NavigationContainer>
  );
}
