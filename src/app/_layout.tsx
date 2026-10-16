import React from 'react';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import ThemeProvider from '../components/ThemeProvider';
import AuthScreen from '../components/auth-screen';
import SplashScreen from '../components/splash-screen';
import { UserProvider, useUser } from '../context/UserContext';

function AppEntry() {
  const { session, authLoading } = useUser();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!splashElapsed || authLoading) return <SplashScreen />;
  if (!session) return <AuthScreen />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0d0d0d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="report" options={{ title: 'Report Issue' }} />
      <Stack.Screen name="technicians" options={{ title: 'Available Technicians' }} />
      <Stack.Screen name="job" options={{ title: 'Job Details' }} />
      <Stack.Screen name="payment" options={{ title: 'Payment' }} />
      <Stack.Screen name="rating" options={{ title: 'Rate Service' }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <UserProvider district="Muzaffarpur">
        <AppEntry />
      </UserProvider>
    </ThemeProvider>
  );
}