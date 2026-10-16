import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { district } = useUser();
  const [name, setName] = useState('');

  // Mock fetching resident name
  useEffect(() => {
    // In a real app: supabase.from('users').select('name').eq('id', userId).single()
    setName('Ayush');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good Morning, {name} 👋</Text>
      <Text style={styles.location}>📍 {district}, Bihar</Text>

      <Text style={styles.heading}>What do you need help with?</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.icon}>💧</Text>
          <Text style={styles.label}>Plumber</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.label}>Electrician</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.icon}>❄️</Text>
          <Text style={styles.label}>AC</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.icon}>🔧</Text>
          <Text style={styles.label}>General</Text>
        </View>
      </View>

      <Button title="Report a Problem" onPress={() => router.push('/create-job')} color={Colors.light.backgroundSelected} />
      <View style={{ height: 12 }} />
      <Button title="Worker Sign‑Up" onPress={() => router.push('/worker-register')} color={Colors.light.text} />
      <View style={{ height: 12 }} />
      <Button title="Resident Sign‑Up / Edit Profile" onPress={() => router.push('/register')} color={Colors.light.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.light.background },
  greeting: { fontSize: 24, color: Colors.light.text, marginBottom: 8 },
  location: { color: Colors.light.text, marginBottom: 16 },
  heading: { color: Colors.light.text, marginBottom: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: Colors.light.backgroundElement, padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  icon: { fontSize: 30, color: Colors.light.backgroundSelected, marginBottom: 6 },
  label: { color: Colors.light.text },
});
