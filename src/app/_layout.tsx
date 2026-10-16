import React from 'react';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ThemeProvider from '../components/ThemeProvider';
import AuthScreen from '../components/auth-screen';
import SplashScreen from '../components/splash-screen';
import { UserProvider, useUser } from '../context/UserContext';
import { Colors } from '../constants/theme';

function AppEntry() {
  const { session, authLoading } = useUser();
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashElapsed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = !splashElapsed || authLoading;
  const isSignedIn = !showSplash && Boolean(session);
  const content = showSplash ? (
    <SplashScreen />
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
        backgroundColor: isSignedIn ? Colors.light.background : Colors.light.text,
      }}
    >
      <ThemeProvider>
        <StatusBar style={isSignedIn ? 'dark' : 'light'} animated />
        {content}
      </ThemeProvider>
    </SafeAreaView>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <UserProvider district="Muzaffarpur">
        <AppEntry />
      </UserProvider>
    </SafeAreaProvider>
  );
}