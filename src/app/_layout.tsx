import React from 'react';
import { Stack } from 'expo-router';
import ThemeProvider from '../components/ThemeProvider';
import { UserProvider } from '../context/UserContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <UserProvider district="Muzaffarpur">
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0d0d0d' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
          }}
        >
          {/* Tabs group */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Additional screens */}
          <Stack.Screen name="report" options={{ title: 'Report Issue' }} />
          <Stack.Screen name="technicians" options={{ title: 'Available Technicians' }} />
          <Stack.Screen name="job" options={{ title: 'Job Details' }} />
          <Stack.Screen name="payment" options={{ title: 'Payment' }} />
          <Stack.Screen name="rating" options={{ title: 'Rate Service' }} />
        </Stack>
      </UserProvider>
    </ThemeProvider>
  );
}