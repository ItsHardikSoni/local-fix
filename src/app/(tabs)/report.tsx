import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useLocation } from '../../context/LocationContext';
import { useUser } from '../../context/UserContext';
import { useCustomerAddress } from '../../context/CustomerAddressContext';
import { useServiceCategories } from '../../context/ServiceCategoryContext';
import { getServiceCategoryIcon } from '../../constants/service-category-visuals';
import StateDistrictPicker from '../../components/state-district-picker';
import { supabaseConfigured } from '../../lib/supabase';

export default function Report() {
  const router = useRouter();
  const { location, district: currentDistrict, locationLoading, locationError, refreshLocation } = useLocation();
  const { session } = useUser();
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
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refreshCategories,
  } = useServiceCategories();
  const { type: initialType } = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [addressDraftDirty, setAddressDraftDirty] = useState(false);
  const [addressTargetId, setAddressTargetId] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [societyName, setSocietyName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [stateName, setStateName] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [addressCoordinates, setAddressCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });
  const [saving, setSaving] = useState(false);
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    if (addressDraftDirty) return;
    if (address) {
      setAddressTargetId(address.id);
      setAddressLine(address.address_line);
      setSocietyName(address.society_name ?? '');
      setFlatNumber(address.flat_number ?? '');
      setDistrictId(address.district_id);
      setStateName(districts.find((item) => item.id === address.district_id)?.state_name ?? '');
      setAddressCoordinates({ latitude: address.latitude, longitude: address.longitude });
    } else {
      setAddressTargetId(null);
      setAddressLine('');
      setSocietyName('');
      setFlatNumber('');
      setDistrictId('');
      setStateName('');
      setAddressCoordinates({ latitude: null, longitude: null });
    }
  }, [address, addressDraftDirty, districts]);

  useEffect(() => {
    if (addressDraftDirty || districtId || !currentDistrict || districts.length === 0) return;
    const match = districts.find((item) => (
      item.district_name.toLowerCase() === currentDistrict.toLowerCase()
    ));
    if (match?.state_name) {
      setStateName(match.state_name);
      setDistrictId(match.id);
    }
  }, [addressDraftDirty, currentDistrict, districtId, districts]);

  const selectedCategory = type && categories.some((item) => item.name === type)
    ? type
    : (typeof initialType === 'string'
      ? categories.find((item) => item.name.toLowerCase() === initialType.trim().toLowerCase())?.name
      : undefined) ?? categories[0]?.name ?? '';
  const typeError = attemptedSubmit && !selectedCategory;
  const descriptionError = attemptedSubmit && desc.trim().length < 8;
  const addressLineError = attemptedSubmit && !addressLine.trim();
  const stateError = attemptedSubmit && !stateName;
  const districtError = attemptedSubmit && !districtId;

  const onSubmit = async () => {
    setAttemptedSubmit(true);
    if (!selectedCategory || desc.trim().length < 8) return;
    if (!addressLine.trim() || !stateName || !districtId) return;
    if (!session?.user.id || !supabaseConfigured) {
      setAddressError('Sign in and configure Supabase before saving your address.');
      return;
    }

    setSaving(true);
    setAddressError('');
    try {
      const currentLocation = await refreshLocation() ?? location;
      const latitude = currentLocation?.coords.latitude ?? addressCoordinates.latitude;
      const longitude = currentLocation?.coords.longitude ?? addressCoordinates.longitude;
      const savedAddress = await saveAddress(addressTargetId, {
        district_id: districtId,
        address_line: addressLine.trim(),
        society_name: societyName.trim() || null,
        flat_number: flatNumber.trim() || null,
        latitude,
        longitude,
      });
      setAddressTargetId(savedAddress.id);
      setAddressDraftDirty(false);

      router.push({
        pathname: '/technicians',
        params: {
          type: selectedCategory,
          desc: desc.trim(),
          latitude: latitude === null ? '' : String(latitude),
          longitude: longitude === null ? '' : String(longitude),
        },
      });
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Unable to save your address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.page}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="build-circle" size={27} color={Colors.light.text} />
          </View>
          <Text style={styles.eyebrow}>SERVICE REQUEST</Text>
          <Text style={styles.title}>Tell us what needs fixing</Text>
          <Text style={styles.subtitle}>A few details help us find the right local professional.</Text>
          <View style={styles.steps}>
            <View style={styles.activeStep}><Text style={styles.activeStepText}>1</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.inactiveStep}><Text style={styles.inactiveStepText}>2</Text></View>
            <View style={styles.stepLine} />
            <View style={styles.inactiveStep}><Text style={styles.inactiveStepText}>3</Text></View>
            <Text style={styles.stepCaption}>Request  ·  Match  ·  Book</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>What kind of help do you need?</Text>
          {categoriesLoading && categories.length === 0 ? (
            <View style={styles.categoryStatus}>
              <ActivityIndicator color={Colors.light.backgroundSelected} />
              <Text style={styles.addressHelper}>Loading available services…</Text>
            </View>
          ) : categoriesError && categories.length === 0 ? (
            <View style={styles.categoryStatus}>
              <Text accessibilityRole="alert" style={styles.errorText}>{categoriesError}</Text>
              <Pressable accessibilityRole="button" onPress={() => { void refreshCategories(); }}>
                <Text style={styles.addAddressText}>Retry loading services</Text>
              </Pressable>
            </View>
          ) : categories.length === 0 ? (
            <Text style={styles.errorText}>No services are currently available.</Text>
          ) : (
            <View style={styles.typeGrid}>
              {categories.map((item) => {
                const selected = selectedCategory === item.name;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={item.id}
                    onPress={() => setType(item.name)}
                    style={({ pressed }) => [
                      styles.typeChip,
                      selected && styles.typeChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialIcons
                      name={getServiceCategoryIcon(item.name)}
                      size={17}
                      color={selected ? Colors.light.text : Colors.light.textSecondary}
                    />
                    <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {categoriesError && categories.length > 0 ? (
            <View style={styles.categoryError}>
              <Text accessibilityRole="alert" style={styles.errorText}>{categoriesError}</Text>
              <Pressable accessibilityRole="button" onPress={() => { void refreshCategories(); }}>
                <Text style={styles.addAddressText}>Refresh services</Text>
              </Pressable>
            </View>
          ) : null}
          {typeError ? <Text style={styles.errorText}>Select an available service.</Text> : null}

          <View style={styles.descriptionLabel}>
            <Text style={styles.label}>Describe the problem</Text>
            <Text style={styles.counter}>{desc.length}/400</Text>
          </View>
          <TextInput
            accessibilityLabel="Describe the problem"
            maxLength={400}
            multiline
            onChangeText={setDesc}
            placeholder="Where is the issue? When did it start? Add any helpful details."
            placeholderTextColor={Colors.light.textSecondary}
            style={[styles.input, styles.descriptionInput, descriptionError && styles.inputError]}
            textAlignVertical="top"
            value={desc}
          />
          {descriptionError ? (
            <Text style={styles.errorText}>Add at least 8 characters so technicians know what to expect.</Text>
          ) : (
            <Text style={styles.helperText}>Avoid sharing personal or sensitive information.</Text>
          )}

          <View style={styles.addressHeader}>
            <Text style={styles.sectionTitle}>Where should the technician visit?</Text>
            {addressTargetId ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setAddressDraftDirty(true);
                  setAddressTargetId(null);
                  setAddressLine('');
                  setSocietyName('');
                  setFlatNumber('');
                  const matchedDistrict = districts.find((item) => (
                    item.district_name.toLowerCase() === currentDistrict?.toLowerCase()
                  ));
                  setStateName(matchedDistrict?.state_name ?? '');
                  setDistrictId(matchedDistrict?.id ?? '');
                  setAddressCoordinates({ latitude: null, longitude: null });
                }}
              >
                <Text style={styles.addAddressText}>Add another</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.addressSyncStatus}>
            {realtimeConnected
              ? 'Address data is live'
              : realtimeError
                ? 'Live updates unavailable'
                : 'Connecting to live address updates…'}
          </Text>
          <Text style={styles.addressHelper}>
            {addressTargetId ? 'Your saved address is filled in. You can update it or add another.' : 'Add your service address. Your GPS coordinates are included when available.'}
          </Text>

          {addressLoading ? (
            <View style={styles.addressLoading}>
              <ActivityIndicator color={Colors.light.backgroundSelected} />
              <Text style={styles.addressHelper}>Loading your address and districts…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Address</Text>
              <TextInput
                accessibilityLabel="Address"
                autoCapitalize="words"
                maxLength={500}
                onChangeText={(value) => {
                  setAddressDraftDirty(true);
                  setAddressLine(value);
                }}
                placeholder="House number, street, and area"
                placeholderTextColor={Colors.light.textSecondary}
                style={[styles.input, addressLineError && styles.inputError]}
                value={addressLine}
              />
              {addressLineError ? <Text style={styles.errorText}>Enter your street address.</Text> : null}

              <StateDistrictPicker
                districts={districts}
                districtError={districtError}
                districtId={districtId}
                onDistrictChange={(value) => {
                  setAddressDraftDirty(true);
                  setDistrictId(value);
                }}
                onStateChange={(nextStateId) => {
                  setAddressDraftDirty(true);
                  setStateName(nextStateId);
                  setDistrictId('');
                }}
                stateError={stateError}
                stateName={stateName}
                states={states}
              />

              <Text style={styles.label}>Society / Apartment (optional)</Text>
              <TextInput
                accessibilityLabel="Society or apartment"
                autoCapitalize="words"
                maxLength={160}
                onChangeText={(value) => {
                  setAddressDraftDirty(true);
                  setSocietyName(value);
                }}
                placeholder="Society or apartment name"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                value={societyName}
              />

              <Text style={styles.label}>Flat / House number (optional)</Text>
              <TextInput
                accessibilityLabel="Flat or house number"
                autoCapitalize="characters"
                maxLength={80}
                onChangeText={(value) => {
                  setAddressDraftDirty(true);
                  setFlatNumber(value);
                }}
                placeholder="Flat or house number"
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.input}
                value={flatNumber}
              />
            </>
          )}
          {addressSyncError || realtimeError ? (
            <View>
              <Text accessibilityRole="alert" style={styles.errorText}>
                {addressError || addressSyncError || realtimeError}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => { void refreshAddressData(); }}>
                <Text style={styles.addAddressText}>Refresh address data</Text>
              </Pressable>
            </View>
          ) : addressError ? <Text accessibilityRole="alert" style={styles.errorText}>{addressError}</Text> : null}

          <View style={styles.locationStatus}>
            <MaterialIcons
              name={locationLoading ? 'my-location' : location ? 'location-on' : 'location-off'}
              size={18}
              color={locationError ? '#B42318' : Colors.light.backgroundSelected}
            />
            <Text style={[styles.locationStatusText, locationError && styles.locationStatusError]}>
              {locationLoading
                ? 'Getting your current location...'
                : locationError
                  ? locationError
                  : location
                    ? 'Your current location will be included with this request.'
                    : 'Your current location is needed for this request.'}
            </Text>
          </View>

          <View style={styles.privacyNote}>
            <MaterialIcons name="lock-outline" size={18} color={Colors.light.backgroundSelected} />
            <Text style={styles.privacyText}>Your location is shared with this service request to help connect you with a technician.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={locationLoading || addressLoading || saving}
          style={({ pressed }) => [styles.submit, pressed && styles.pressed, (locationLoading || addressLoading || saving) && styles.submitDisabled]}
        >
          <Text style={styles.submitText}>
            {saving ? 'Saving address…' : addressLoading ? 'Loading address…' : locationLoading ? 'Getting location...' : 'Find technicians'}
          </Text>
          <MaterialIcons name={saving || locationLoading ? 'my-location' : 'arrow-forward'} size={20} color={Colors.light.text} />
        </Pressable>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 20 },
  hero: { padding: 24, paddingBottom: 22, backgroundColor: Colors.light.text, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: Colors.light.backgroundSelected },
  eyebrow: { marginTop: 17, color: '#F7C777', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  title: { marginTop: 7, color: Colors.light.backgroundElement, fontSize: 25, fontWeight: '800' },
  subtitle: { marginTop: 8, color: '#D6DFEA', fontSize: 14, lineHeight: 20 },
  steps: { flexDirection: 'row', alignItems: 'center', marginTop: 23 },
  activeStep: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: Colors.light.backgroundSelected },
  activeStepText: { color: Colors.light.text, fontSize: 12, fontWeight: '800' },
  inactiveStep: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#64748B', borderRadius: 12 },
  inactiveStepText: { color: '#D6DFEA', fontSize: 12, fontWeight: '600' },
  stepLine: { width: 28, height: 1, marginHorizontal: 7, backgroundColor: '#64748B' },
  stepCaption: { marginLeft: 10, color: '#D6DFEA', fontSize: 12 },
  form: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { color: Colors.light.text, fontSize: 16, fontWeight: '700' },
  addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  addAddressText: { color: Colors.light.backgroundSelected, fontSize: 12, fontWeight: '700' },
  addressSyncStatus: { marginTop: -3, marginBottom: 8, color: Colors.light.textSecondary, fontSize: 11 },
  addressHelper: { marginBottom: 15, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 17 },
  addressLoading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 12 },
  categoryStatus: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 20 },
  categoryError: { marginTop: -12, marginBottom: 14 },
  label: { marginBottom: 9, color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 22 },
  typeChip: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 20, backgroundColor: Colors.light.backgroundElement },
  typeChipSelected: { borderColor: Colors.light.backgroundSelected, backgroundColor: '#FFF2DE' },
  typeChipText: { color: Colors.light.textSecondary, fontSize: 12, fontWeight: '600' },
  typeChipTextSelected: { color: Colors.light.text },
  input: { minHeight: 52, marginBottom: 17, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 12, backgroundColor: Colors.light.backgroundElement, color: Colors.light.text, fontSize: 15 },
  inputError: { borderColor: '#B42318' },
  descriptionLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { marginBottom: 9, color: Colors.light.textSecondary, fontSize: 12 },
  descriptionInput: { minHeight: 132, marginBottom: 7, lineHeight: 21 },
  helperText: { marginBottom: 16, color: Colors.light.textSecondary, fontSize: 12 },
  errorText: { marginTop: -10, marginBottom: 16, color: '#B42318', fontSize: 12, lineHeight: 17 },
  locationStatus: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14, padding: 13, borderRadius: 12, backgroundColor: '#EFF3F8' },
  locationStatusText: { flex: 1, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 17 },
  locationStatusError: { color: '#B42318' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 12, backgroundColor: '#FFF9EE' },
  privacyText: { flex: 1, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 17 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D8E0E9', backgroundColor: Colors.light.background },
  submit: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 13, backgroundColor: Colors.light.backgroundSelected },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
