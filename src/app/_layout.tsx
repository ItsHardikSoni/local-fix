import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ThemeProvider from '../components/ThemeProvider';
import AuthScreen from '../components/auth-screen';
import LoadingScreen from '../components/loading-screen';
import SplashScreen from '../components/splash-screen';
import { UserProvider, useUser } from '../context/UserContext';
import { LocationProvider } from '../context/LocationContext';
import { CustomerAddressProvider } from '../context/CustomerAddressContext';
import { Colors } from '../constants/theme';

function AppEntry() {
  const { session, authLoading } = useUser();
  const [showSplash, setShowSplash] = useState(true);
  const previousUserId = useRef<string | null>(null);
  const initialAuthResolved = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    const userId = session?.user.id ?? null;
    if (!initialAuthResolved.current) {
      previousUserId.current = userId;
      initialAuthResolved.current = true;
      return;
    }

    if (previousUserId.current !== userId) {
      previousUserId.current = userId;
      setShowSplash(true);
    }
  }, [authLoading, session?.user.id]);

  useEffect(() => {
    if (!showSplash) return;

    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  const content = showSplash ? (
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
      <UserProvider>
        <LocationProvider>
          <CustomerAddressProvider>
            <AppEntry />
          </CustomerAddressProvider>
        </LocationProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}