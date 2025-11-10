import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './src/screens/HomeScreen';
import AddCardScreen from './src/screens/AddCardScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeckDetailsScreen from './src/screens/DeckDetailsScreen';
import CreateDeckScreen from './src/screens/CreateDeckScreen';
import EditDeckScreen from './src/screens/EditDeckScreen';

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
        name='CreateDeck' 
        component={CreateDeckScreen}
        options={{ presentation: 'modal'}}
        />
      <LibraryStack.Screen 
        name='EditDeck' 
        component={EditDeckScreen}
        options={{ presentation: 'modal'}}
        />
    </LibraryStack.Navigator>
  )
}

export default function App() {
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
          tabBarIcon: ({color, size}) => (
            <Ionicons name='home' size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryStackNavigator}
        options={{ 
          tabBarIcon: ({color, size}) => (
            <Ionicons name='library' size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    <StatusBar style='auto'/>
  </NavigationContainer>
  );
}
