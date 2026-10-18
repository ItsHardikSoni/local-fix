import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.light.backgroundSelected} size="large" />
      <Text style={styles.label}>Loading your account…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  label: {
    marginTop: 16,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
});
