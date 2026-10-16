import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Colors } from '../../constants/theme';
import { useUser } from '../../context/UserContext';

export default function ProfileScreen() {
  const { session, signOut } = useUser();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const user = session?.user;
  const fullName = typeof user?.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : 'LocalFix user';
  const phone = typeof user?.user_metadata?.phone === 'string'
    ? user.user_metadata.phone
    : 'Not provided';

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMessage('');

    try {
      const error = await signOut();
      if (error) {
        setErrorMessage(error.message);
        setBusy(false);
      }
    } catch {
      setErrorMessage('Unable to sign out. Please try again.');
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>

      <View style={styles.identity}>
        <MaterialIcons name="account-circle" size={64} color={Colors.light.backgroundSelected} />
        <Text style={styles.name}>{fullName}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? 'No email available'}</Text>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{phone}</Text>
      </View>

      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={handleSignOut}
        style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed, busy && styles.logoutDisabled]}
      >
        {busy ? <ActivityIndicator color={Colors.light.backgroundElement} /> : (
          <>
            <MaterialIcons name="logout" size={20} color={Colors.light.backgroundElement} />
            <Text style={styles.logoutText}>Log out</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: Colors.light.background },
  heading: { color: Colors.light.text, fontSize: 24, fontWeight: '700' },
  identity: { alignItems: 'center', paddingVertical: 32 },
  name: { marginTop: 12, color: Colors.light.text, fontSize: 20, fontWeight: '600' },
  details: { paddingVertical: 8 },
  label: { marginTop: 16, color: Colors.light.textSecondary, fontSize: 13, fontWeight: '600' },
  value: { marginTop: 5, color: Colors.light.text, fontSize: 16 },
  error: { marginTop: 18, color: '#B42318', fontSize: 14 },
  logout: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
    borderRadius: 8,
    backgroundColor: Colors.light.text,
  },
  logoutPressed: { opacity: 0.85 },
  logoutDisabled: { opacity: 0.7 },
  logoutText: { color: Colors.light.backgroundElement, fontSize: 15, fontWeight: '600' },
});