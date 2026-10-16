import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.brandMark}>LF</Text>
      </View>
      <Text style={styles.title}>LocalFix</Text>
      <View style={styles.rule} />
      <Text style={styles.subtitle}>Reliable help, right around you.</Text>
      <ActivityIndicator color={Colors.light.backgroundSelected} style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.text,
  },
  brand: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundSelected,
    transform: [{ rotate: '-7deg' }],
  },
  brandMark: {
    color: Colors.light.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0,
    transform: [{ rotate: '7deg' }],
  },
  title: {
    marginTop: 24,
    color: Colors.light.backgroundElement,
    fontSize: 34,
    fontWeight: '800',
  },
  rule: {
    width: 34,
    height: 3,
    marginTop: 15,
    borderRadius: 2,
    backgroundColor: Colors.light.backgroundSelected,
  },
  subtitle: {
    marginTop: 13,
    color: '#D6DFEA',
    fontSize: 15,
  },
  indicator: {
    position: 'absolute',
    bottom: 56,
  },
});