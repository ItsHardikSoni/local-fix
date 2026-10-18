import React from 'react';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ThemeProvider from '../components/ThemeProvider';
import AuthScreen from '../components/auth-screen';
import LoadingScreen from '../components/loading-screen';
import SplashScreen from '../components/splash-screen';
import { UserProvider, useUser } from '../context/UserContext';
import { LocationProvider } from '../context/LocationContext';
import { Colors } from '../constants/theme';

function AppEntry() {
  const { session, authLoading } = useUser();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const content = !splashElapsed ? (
    <SplashScreen />
  ) : authLoading ? (
    <LoadingScreen />
  ) : !session ? (
    <AuthScreen />
  ) : (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontFamily: 'Inter', fontWeight: '600' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: Colors.light.text,
      }}
    >
      <ThemeProvider>
        <StatusBar style="light" animated />
        {content}
      </ThemeProvider>
    </SafeAreaView>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <UserProvider district="Muzaffarpur">
        <LocationProvider>
          <AppEntry />
        </LocationProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}