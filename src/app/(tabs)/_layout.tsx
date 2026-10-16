import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
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
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <MaterialIcons name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'My Jobs', tabBarIcon: ({ color, size }) => <MaterialIcons name="work" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="report"
        options={{ title: 'Report', tabBarIcon: ({ color, size }) => <MaterialIcons name="report" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="technicians"
        options={{ title: 'Technicians', tabBarIcon: ({ color, size }) => <MaterialIcons name="engineering" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
