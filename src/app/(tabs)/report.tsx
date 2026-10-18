import React, { useEffect, useState } from 'react';
import {
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

const issueTypes = [
  { label: 'Water leak', icon: 'water-drop' as const },
  { label: 'Electrical', icon: 'bolt' as const },
  { label: 'AC repair', icon: 'ac-unit' as const },
  { label: 'General repair', icon: 'handyman' as const },
];

export default function Report() {
  const router = useRouter();
  const { location, locationLoading, locationError, refreshLocation } = useLocation();
  const { type: initialType } = useLocalSearchParams<{ type?: string }>();
  const [type, setType] = useState('Water leak');
  const [desc, setDesc] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (typeof initialType === 'string' && initialType.trim()) {
      setType(initialType);
    }
  }, [initialType]);

  const typeError = attemptedSubmit && !type.trim();
  const descriptionError = attemptedSubmit && desc.trim().length < 8;

  const onSubmit = async () => {
    setAttemptedSubmit(true);
    if (!type.trim() || desc.trim().length < 8) return;

    const currentLocation = await refreshLocation();
    if (!currentLocation) return;

    router.push({
      pathname: '/technicians',
      params: {
        type: type.trim(),
        desc: desc.trim(),
        latitude: String(currentLocation.coords.latitude),
        longitude: String(currentLocation.coords.longitude),
      },
    });
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
          <View style={styles.typeGrid}>
            {issueTypes.map((item) => {
              const selected = type.toLowerCase() === item.label.toLowerCase();
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={item.label}
                  onPress={() => setType(item.label)}
                  style={({ pressed }) => [
                    styles.typeChip,
                    selected && styles.typeChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={17}
                    color={selected ? Colors.light.text : Colors.light.textSecondary}
                  />
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Issue type</Text>
          <TextInput
            accessibilityLabel="Issue type"
            maxLength={60}
            onChangeText={setType}
            placeholder="For example, a leaking kitchen tap"
            placeholderTextColor={Colors.light.textSecondary}
            returnKeyType="next"
            style={[styles.input, typeError && styles.inputError]}
            value={type}
          />
          {typeError ? <Text style={styles.errorText}>Please enter an issue type.</Text> : null}

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
          disabled={locationLoading}
          style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
        >
          <Text style={styles.submitText}>{locationLoading ? 'Getting location...' : 'Find technicians'}</Text>
          <MaterialIcons name={locationLoading ? 'my-location' : 'arrow-forward'} size={20} color={Colors.light.text} />
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
  submitText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
