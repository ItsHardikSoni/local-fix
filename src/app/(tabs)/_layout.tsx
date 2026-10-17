import { Tabs } from 'expo-router';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Colors } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
        tabBarActiveTintColor: Colors.light.backgroundSelected,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarStyle: {
          minHeight: 78,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: '#E8EDF2',
          backgroundColor: Colors.light.backgroundElement,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <MaterialIcons name="home" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Details', tabBarIcon: ({ color }) => <MaterialIcons name="work" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="report"
        options={{ title: 'Report', tabBarIcon: ({ color }) => <MaterialIcons name="report" color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="technicians"
          options={{ title: 'Techs', tabBarIcon: ({ color }) => <MaterialIcons name="engineering" color={color} size={22} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: ({ color }) => <MaterialIcons name="account-circle" color={color} size={22} /> }}
      />
    </Tabs>
  );
}
