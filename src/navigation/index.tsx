import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home';
import SettingsScreen from '../screens/settings';
import LibraryScreen from '../screens/library';
import DeckScreen from '../screens/deck';

import { useTheme } from '../theme';
import { LibraryStackParamList, MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={{ headerShown: false }}>
      <LibraryStack.Screen name="LibraryList" component={LibraryScreen} />
      <LibraryStack.Screen
        name="DeckDetail"
        component={DeckScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: '',
        }}
      />
    </LibraryStack.Navigator>
  );
}

const Routes = [
  {
    name: 'Home',
    component: HomeScreen,
    label: 'Home',
    icon: 'home' as const,
    iconOutline: 'home-outline' as const,
  },
  {
    name: 'Library',
    component: LibraryStackNavigator,
    label: 'Library',
    icon: 'library' as const,
    iconOutline: 'library-outline' as const,
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    label: 'Settings',
    icon: 'settings' as const,
    iconOutline: 'settings-outline' as const,
  },
] as const;

export default function Navigation() {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.secondary,
        }}
      >
        {Routes.map((route) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={route.component}
            options={{
              tabBarLabel: route.label,
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons
                  name={focused ? route.icon : route.iconOutline}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
