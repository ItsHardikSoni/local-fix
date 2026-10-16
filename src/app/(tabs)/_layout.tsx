import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => '🏠' }} />
      <Tabs.Screen name="myjobs" options={{ title: 'My Jobs', tabBarIcon: () => '🛠️' }} />
      <Tabs.Screen name="services" options={{ title: 'Services', tabBarIcon: () => '🔧' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', tabBarIcon: () => '🔔' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => '👤' }} />
    </Tabs>
  );
}
