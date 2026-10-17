import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Colors } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import ThemedAlert from '../../components/ui/themed-alert';

export default function ProfileScreen() {
  const { session, profile, profileLoading, profileError, signOut } = useUser();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignOutAlert, setShowSignOutAlert] = useState(false);
  const user = session?.user;
  const metadataFullName = typeof user?.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : null;
  const metadataPhone = typeof user?.user_metadata?.phone === 'string'
    ? user.user_metadata.phone
    : null;
  const fullName = profile?.full_name || metadataFullName || 'LocalFix user';
  const phone = profile?.phone || metadataPhone || 'Not provided';
  const email = profile?.email || user?.email || 'No email available';
  const emailVerified = Boolean(user?.email_confirmed_at);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  const handleSignOut = async () => {
    setBusy(true);
    setErrorMessage('');

    try {
      const error = await signOut();
      if (error) {
        setErrorMessage(error.message);
        setBusy(false);
        setShowSignOutAlert(false);
        return;
      }
      setShowSignOutAlert(false);
    } catch {
      setErrorMessage('Unable to sign out. Please try again.');
      setBusy(false);
      setShowSignOutAlert(false);
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your LocalFix account details</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={36} color={Colors.light.text} />
          </View>
          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.name}>{fullName}</Text>
            {memberSince ? <Text style={styles.memberSince}>Member since {memberSince}</Text> : null}
          </View>
          <MaterialIcons name="account-circle" size={23} color={Colors.light.backgroundSelected} />
        </View>

        {profileLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.light.backgroundSelected} />
            <Text style={styles.loadingText}>Updating your profile…</Text>
          </View>
        ) : null}
        {profileError ? (
          <View accessibilityRole="alert" style={styles.errorCard}>
            <MaterialIcons name="info-outline" size={19} color="#B42318" />
            <Text style={styles.error}>{profileError}</Text>
          </View>
        ) : null}
        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

        <Text style={styles.sectionTitle}>Contact information</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="mail-outline" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.label}>Email address</Text>
              <Text selectable style={styles.value}>{email}</Text>
            </View>
            <View style={[styles.status, emailVerified ? styles.statusSuccess : styles.statusPending]}>
              <MaterialIcons
                name={emailVerified ? 'check-circle' : 'schedule'}
                size={14}
                color={emailVerified ? '#24734A' : '#9A6700'}
              />
              <Text style={[styles.statusText, emailVerified ? styles.statusTextSuccess : styles.statusTextPending]}>
                {emailVerified ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="phone" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.label}>Phone number</Text>
              <Text selectable style={styles.value}>{phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.securityNote}>
          <MaterialIcons name="shield" size={20} color={Colors.light.backgroundSelected} />
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>Your account is private</Text>
            <Text style={styles.securityText}>Your personal profile is only visible to your account.</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => setShowSignOutAlert(true)}
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed, busy && styles.logoutDisabled]}
        >
          {busy ? <ActivityIndicator color={Colors.light.backgroundElement} /> : (
            <>
              <MaterialIcons name="logout" size={20} color={Colors.light.backgroundElement} />
              <Text style={styles.logoutText}>Log out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <ThemedAlert
        actionLabel={busy ? 'Logging out…' : 'Log out'}
        cancelLabel="Cancel"
        message="You can sign back in any time to manage your home-service requests."
        onAction={handleSignOut}
        onCancel={() => setShowSignOutAlert(false)}
        onClose={() => setShowSignOutAlert(false)}
        title="Log out of LocalFix?"
        visible={showSignOutAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 28 },
  hero: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 28, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: Colors.light.text },
  eyebrow: { color: '#F7C777', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { marginTop: 8, color: Colors.light.backgroundElement, fontSize: 27, fontWeight: '800' },
  subtitle: { marginTop: 5, color: '#D6DFEA', fontSize: 13 },
  identityCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 17, backgroundColor: Colors.light.backgroundElement, elevation: 2, shadowColor: Colors.light.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7 },
  avatar: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFF2DE' },
  identityCopy: { flex: 1, marginLeft: 13 },
  name: { color: Colors.light.text, fontSize: 18, fontWeight: '700' },
  memberSince: { marginTop: 5, color: Colors.light.textSecondary, fontSize: 12 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 20, marginTop: 14 },
  loadingText: { color: Colors.light.textSecondary, fontSize: 12 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 20, marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#FEF3F2' },
  error: { flex: 1, color: '#B42318', fontSize: 13, lineHeight: 18 },
  sectionTitle: { marginHorizontal: 20, marginTop: 24, marginBottom: 11, color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  detailsCard: { marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 16, backgroundColor: Colors.light.backgroundElement },
  detailRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13 },
  detailIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFF2DE' },
  detailCopy: { flex: 1 },
  label: { color: Colors.light.textSecondary, fontSize: 11 },
  value: { marginTop: 5, color: Colors.light.text, fontSize: 14, fontWeight: '600' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 10 },
  statusSuccess: { backgroundColor: '#E8F5EC' },
  statusPending: { backgroundColor: '#FFF4D6' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextSuccess: { color: '#24734A' },
  statusTextPending: { color: '#9A6700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8EDF2' },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: '#FFF9EE' },
  securityCopy: { flex: 1 },
  securityTitle: { color: Colors.light.text, fontSize: 13, fontWeight: '700' },
  securityText: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 17 },
  logout: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 24, borderRadius: 12, backgroundColor: Colors.light.text },
  logoutPressed: { opacity: 0.85 },
  logoutDisabled: { opacity: 0.7 },
  logoutText: { color: Colors.light.backgroundElement, fontSize: 15, fontWeight: '600' },
});
