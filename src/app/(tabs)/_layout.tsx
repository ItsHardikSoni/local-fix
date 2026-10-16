import React from 'react';
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
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <MaterialIcons name="home" color={color} size={28} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'My Jobs', tabBarIcon: ({ color }) => <MaterialIcons name="work" color={color} size={28} /> }}
      />
      <Tabs.Screen
        name="report"
        options={{ title: 'Report', tabBarIcon: ({ color }) => <MaterialIcons name="report" color={color} size={28} /> }}
      />
      <Tabs.Screen
        name="technicians"
          options={{ title: 'Techs', tabBarIcon: ({ color }) => <MaterialIcons name="engineering" color={color} size={28} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile', tabBarIcon: ({ color }) => <MaterialIcons name="account-circle" color={color} size={28} /> }}
      />
    </Tabs>
  );
}
