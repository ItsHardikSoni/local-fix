import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Colors } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import { useLocation } from '../../context/LocationContext';
import { useCustomerAddress } from '../../context/CustomerAddressContext';
import StateDistrictPicker from '../../components/state-district-picker';
import ThemedAlert from '../../components/ui/themed-alert';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\d{10}$/;

export default function ProfileScreen() {
  const {
    session,
    profile,
    profileLoading,
    profileError,
    signOut,
    updateProfile,
  } = useUser();
  const { location } = useLocation();
  const {
    address,
    states,
    districts,
    addressLoading,
    addressError: addressSyncError,
    realtimeConnected,
    realtimeError,
    saveAddress,
    refreshAddressData,
  } = useCustomerAddress();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [draftFullName, setDraftFullName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [showSignOutAlert, setShowSignOutAlert] = useState(false);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [addressSociety, setAddressSociety] = useState('');
  const [addressFlat, setAddressFlat] = useState('');
  const [addressStateName, setAddressStateName] = useState('');
  const [addressDistrictId, setAddressDistrictId] = useState('');
  const [addressCoordinates, setAddressCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressEditing, setAddressEditing] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');
  const [addressAttemptedSave, setAddressAttemptedSave] = useState(false);
  const user = session?.user;
  const metadataFullName = typeof user?.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : null;
  const metadataPhone = typeof user?.user_metadata?.phone === 'string'
    ? user.user_metadata.phone
    : null;
  const fullName = profile?.full_name || metadataFullName || 'LocalFix user';
  const phone = profile?.phone || metadataPhone || 'Not provided';
  const email = user?.email || profile?.email || 'No email available';
  const emailVerified = Boolean(user?.email_confirmed_at);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
  const addressDistrictName = districts.find((item) => item.id === address?.district_id)?.district_name;

  useEffect(() => {
    if (addressEditing) return;
    if (!address) {
      setAddressId(null);
      setAddressLine('');
      setAddressSociety('');
      setAddressFlat('');
      setAddressDistrictId('');
      setAddressStateName('');
      setAddressCoordinates({ latitude: null, longitude: null });
      return;
    }
    const district = districts.find((item) => item.id === address.district_id);
    setAddressId(address.id);
    setAddressLine(address.address_line);
    setAddressSociety(address.society_name ?? '');
    setAddressFlat(address.flat_number ?? '');
    setAddressDistrictId(address.district_id);
    setAddressStateName(district?.state_name ?? '');
    setAddressCoordinates({
      latitude: address.latitude,
      longitude: address.longitude,
    });
  }, [address, addressEditing, districts]);

  const handleSaveAddress = async () => {
    setAddressAttemptedSave(true);
    setAddressError('');
    setAddressSuccess('');
    if (!addressLine.trim() || !addressStateName || !addressDistrictId || !user?.id) return;

    setAddressSaving(true);
    try {
      const latitude = location?.coords.latitude ?? addressCoordinates.latitude;
      const longitude = location?.coords.longitude ?? addressCoordinates.longitude;
      const saved = await saveAddress(addressId, {
        district_id: addressDistrictId,
        address_line: addressLine.trim(),
        society_name: addressSociety.trim() || null,
        flat_number: addressFlat.trim() || null,
        latitude,
        longitude,
      });
      setAddressId(saved.id);
      setAddressCoordinates({ latitude, longitude });
      setAddressEditing(false);
      setAddressAttemptedSave(false);
      setAddressSuccess('Your service address has been saved.');
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Unable to save your address.');
    } finally {
      setAddressSaving(false);
    }
  };

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

  const startEditing = () => {
    setDraftFullName(fullName === 'LocalFix user' ? '' : fullName);
    setDraftEmail(user?.email ?? email);
    setDraftPhone(profile?.phone ?? metadataPhone ?? '');
    setErrorMessage('');
    setSuccessMessage('');
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    const normalizedName = draftFullName.trim();
    const normalizedEmail = draftEmail.trim();
    const normalizedPhone = draftPhone.replace(/\D/g, '');

    if (!normalizedName) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (normalizedPhone && !PHONE_PATTERN.test(normalizedPhone)) {
      setErrorMessage('Enter a 10-digit phone number or leave it blank.');
      return;
    }

    setBusy(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const result = await updateProfile(normalizedName, normalizedEmail, normalizedPhone);
      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      setEditing(false);
      setSuccessMessage(result.emailConfirmationRequired
        ? `A confirmation link was sent to ${normalizedEmail}. Follow it to finish changing your email.`
        : 'Your profile has been updated.');
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`Unable to update your profile: ${details}`);
    } finally {
      setBusy(false);
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
        {successMessage ? <Text accessibilityRole="summary" style={styles.success}>{successMessage}</Text> : null}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Contact information</Text>
          {!editing ? (
            <Pressable
              accessibilityRole="button"
              disabled={busy || profileLoading}
              onPress={startEditing}
              style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
            >
              <MaterialIcons name="edit" size={16} color={Colors.light.backgroundSelected} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="person-outline" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              {editing ? (
                <>
                  <Text style={styles.label}>Full name</Text>
                  <TextInput
                    accessibilityLabel="Full name"
                    autoCapitalize="words"
                    editable={!busy}
                    onChangeText={setDraftFullName}
                    placeholder="Your full name"
                    placeholderTextColor={Colors.light.textSecondary}
                    style={styles.input}
                    value={draftFullName}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Full name</Text>
                  <Text selectable style={styles.value}>{fullName}</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="mail-outline" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.label}>Email address</Text>
              {editing ? (
                <TextInput
                  accessibilityLabel="Email address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!busy}
                  keyboardType="email-address"
                  onChangeText={setDraftEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.light.textSecondary}
                  style={styles.input}
                  value={draftEmail}
                />
              ) : (
                <Text selectable style={styles.value}>{email}</Text>
              )}
            </View>
            {!editing ? (
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
            ) : null}
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="phone" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.label}>Phone number</Text>
              {editing ? (
                <TextInput
                  accessibilityLabel="Phone number"
                  autoComplete="tel"
                  editable={!busy}
                  keyboardType="phone-pad"
                  maxLength={15}
                  onChangeText={setDraftPhone}
                  placeholder="10-digit phone number"
                  placeholderTextColor={Colors.light.textSecondary}
                  style={styles.input}
                  value={draftPhone}
                />
              ) : (
                <Text selectable style={styles.value}>{phone}</Text>
              )}
            </View>
          </View>
        </View>

        {editing ? (
          <View style={styles.editActions}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setEditing(false);
                setErrorMessage('');
              }}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={handleSaveProfile}
              style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed, busy && styles.saveButtonDisabled]}
            >
              {busy ? <ActivityIndicator color={Colors.light.text} /> : (
                <>
                  <MaterialIcons name="check" size={18} color={Colors.light.text} />
                  <Text style={styles.saveText}>Save changes</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        <View style={styles.addressHeading}>
          <View>
            <Text style={styles.sectionTitle}>Service address</Text>
            <Text style={styles.addressCaption}>
              {realtimeConnected
                ? 'Live updates enabled'
                : realtimeError
                  ? 'Live updates unavailable'
                  : 'Connecting to live updates…'}
            </Text>
          </View>
          {!addressEditing && !addressLoading ? (
            <Pressable
              accessibilityRole="button"
              disabled={addressSaving}
              onPress={() => {
                setAddressError('');
                setAddressSuccess('');
                setAddressAttemptedSave(false);
                setAddressEditing(true);
              }}
              style={styles.editButton}
            >
              <MaterialIcons name={addressId ? 'edit' : 'add'} size={16} color={Colors.light.backgroundSelected} />
              <Text style={styles.editButtonText}>{addressId ? 'Edit' : 'Add address'}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.addressCard}>
          {addressLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.light.backgroundSelected} />
              <Text style={styles.loadingText}>Loading your address…</Text>
            </View>
          ) : addressEditing ? (
            <>
              <Text style={styles.label}>Street address</Text>
              <TextInput
                accessibilityLabel="Street address"
                autoCapitalize="words"
                editable={!addressSaving}
                maxLength={500}
                onChangeText={setAddressLine}
                placeholder="House number, street, and area"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                value={addressLine}
              />
              {addressAttemptedSave && !addressLine.trim() ? (
                <Text style={styles.error}>Enter your street address.</Text>
              ) : null}
              <StateDistrictPicker
                districts={districts}
                districtError={addressAttemptedSave && !addressDistrictId}
                districtId={addressDistrictId}
                onDistrictChange={setAddressDistrictId}
                onStateChange={(nextStateId) => {
                  setAddressStateName(nextStateId);
                  setAddressDistrictId('');
                }}
                stateError={addressAttemptedSave && !addressStateName}
                stateName={addressStateName}
                states={states}
              />
              <Text style={styles.label}>Society / Apartment (optional)</Text>
              <TextInput
                accessibilityLabel="Society or apartment"
                autoCapitalize="words"
                editable={!addressSaving}
                maxLength={160}
                onChangeText={setAddressSociety}
                placeholder="Society or apartment name"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                value={addressSociety}
              />
              <Text style={styles.label}>Flat / House number (optional)</Text>
              <TextInput
                accessibilityLabel="Flat or house number"
                autoCapitalize="characters"
                editable={!addressSaving}
                maxLength={80}
                onChangeText={setAddressFlat}
                placeholder="Flat or house number"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                value={addressFlat}
              />
              <View style={styles.addressActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={addressSaving}
                  onPress={() => {
                    setAddressEditing(false);
                    setAddressError('');
                    setAddressAttemptedSave(false);
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={addressSaving}
                  onPress={handleSaveAddress}
                  style={[styles.saveButton, addressSaving && styles.saveButtonDisabled]}
                >
                  {addressSaving ? <ActivityIndicator color={Colors.light.text} /> : (
                    <>
                      <MaterialIcons name="check" size={18} color={Colors.light.text} />
                      <Text style={styles.saveText}>Save address</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          ) : address ? (
            <>
              <Text style={styles.addressValue}>{addressLine}</Text>
              {addressFlat ? <Text style={styles.addressDetail}>Flat / House {addressFlat}</Text> : null}
              {addressSociety ? <Text style={styles.addressDetail}>{addressSociety}</Text> : null}
              <Text style={styles.addressDetail}>
                {[addressDistrictName, addressStateName].filter(Boolean).join(', ')}
              </Text>
            </>
          ) : (
            <Text style={styles.addressCaption}>No service address saved yet.</Text>
          )}
          {addressError || addressSyncError || realtimeError ? (
            <>
              <Text accessibilityRole="alert" style={styles.error}>
                {addressError || addressSyncError || realtimeError}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => { void refreshAddressData(); }}>
                <Text style={styles.editButtonText}>Refresh address data</Text>
              </Pressable>
            </>
          ) : null}
          {addressSuccess ? <Text accessibilityRole="summary" style={styles.success}>{addressSuccess}</Text> : null}
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
  success: { marginHorizontal: 20, marginTop: 14, color: '#24734A', fontSize: 13, lineHeight: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 24, marginBottom: 11 },
  sectionTitle: { color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  editButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, borderRadius: 10, backgroundColor: '#FFF2DE' },
  editButtonPressed: { opacity: 0.8 },
  editButtonText: { color: Colors.light.backgroundSelected, fontSize: 13, fontWeight: '700' },
  detailsCard: { marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 16, backgroundColor: Colors.light.backgroundElement },
  addressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 24, marginBottom: 11 },
  addressCaption: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 12 },
  addressCard: { marginHorizontal: 20, padding: 15, borderRadius: 16, backgroundColor: Colors.light.backgroundElement },
  addressValue: { color: Colors.light.text, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  addressDetail: { marginTop: 5, color: Colors.light.textSecondary, fontSize: 13 },
  addressActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  detailRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13 },
  detailIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFF2DE' },
  detailCopy: { flex: 1 },
  label: { color: Colors.light.textSecondary, fontSize: 11 },
  value: { marginTop: 5, color: Colors.light.text, fontSize: 14, fontWeight: '600' },
  input: { minHeight: 42, marginTop: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 9, color: Colors.light.text, fontSize: 14 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 10 },
  statusSuccess: { backgroundColor: '#E8F5EC' },
  statusPending: { backgroundColor: '#FFF4D6' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusTextSuccess: { color: '#24734A' },
  statusTextPending: { color: '#9A6700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8EDF2' },
  editActions: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 14 },
  cancelButton: { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 12, backgroundColor: Colors.light.backgroundElement },
  cancelText: { color: Colors.light.textSecondary, fontSize: 14, fontWeight: '700' },
  saveButton: { minHeight: 48, flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, backgroundColor: Colors.light.backgroundSelected },
  saveButtonDisabled: { opacity: 0.7 },
  saveText: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  buttonPressed: { opacity: 0.8 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: '#FFF9EE' },
  securityCopy: { flex: 1 },
  securityTitle: { color: Colors.light.text, fontSize: 13, fontWeight: '700' },
  securityText: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 17 },
  logout: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 24, borderRadius: 12, backgroundColor: Colors.light.text },
  logoutPressed: { opacity: 0.85 },
  logoutDisabled: { opacity: 0.7 },
  logoutText: { color: Colors.light.backgroundElement, fontSize: 15, fontWeight: '600' },
});
