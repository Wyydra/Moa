import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home';
import SettingsScreen from '../screens/settings';

import { useTheme } from '../theme';
import LibraryScreen from '../screens/library';

const Tab = createBottomTabNavigator();

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
    component: LibraryScreen,
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
];

export default function Navigation() {
  const { theme } = useTheme();

  const TabNavigatorConfig = {
    initialRouteName: 'Home' as const,
    screenOptions: {
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.secondary,
    },
  };

  return (
    <NavigationContainer>
      <Tab.Navigator {...TabNavigatorConfig}>
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
