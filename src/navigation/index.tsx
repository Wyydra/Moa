import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/home';

const Tab = createBottomTabNavigator();

const TabNavigatorConfig = {
  initialRouteName: 'Home',
  screenOptions: {
    headerShown: false,
    tabBarActiveTintColor: '#000',
    tabBarInactiveTintColor: '#666',
  },
};

const Routes = [
  { 
    name: 'Home', 
    component: HomeScreen,
    label: 'Home',
    icon: 'home' as const,
    iconOutline: 'home-outline' as const,
  },
];

export default function Navigation() {
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
