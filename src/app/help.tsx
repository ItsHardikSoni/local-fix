import React, { useState } from 'react';
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
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';

type HelpTopic = 'about' | 'guide' | 'faq' | 'report' | 'terms';

const topicTitles: Record<HelpTopic, string> = {
  about: 'About LocalFix',
  guide: 'How to use the app',
  faq: 'Frequently asked questions',
  report: 'Report an app issue',
  terms: 'Terms and conditions',
};

const faqs = [
  {
    question: 'How do I request help?',
    answer: 'Open Report, choose the service type, describe the problem, add your service address, and browse the available technicians.',
  },
  {
    question: 'Does sending a request confirm a booking?',
    answer: 'No. LocalFix currently helps you describe a service need and browse technicians. Booking and payment are not available yet.',
  },
  {
    question: 'Why does the app ask for my location?',
    answer: 'If you grant location permission, LocalFix can include your current coordinates with a service request. You can manage your saved service address from Profile.',
  },
  {
    question: 'How can I change my service address?',
    answer: 'Open Profile, edit the Service address section, then save your changes. Your saved address is shared across the address forms in the app.',
  },
  {
    question: 'Where do app issue reports go?',
    answer: 'The issue report opens your device email app. LocalFix has no support email configured yet, so enter the recipient address yourself before sending.',
  },
] as const;

const guideSteps = [
  ['Choose a service', 'Open Report and select the type of repair you need.'],
  ['Describe the issue', 'Add a short description so a technician can understand the request.'],
  ['Set the visit address', 'Choose a state and district, then enter your street address. Allow location access if you want GPS coordinates included.'],
  ['Browse technicians', 'Review the technicians shown for your request and open a profile to review its details.'],
  ['Check availability', 'The app does not complete bookings or payments yet. Continuing from a technician profile will explain when booking is unavailable.'],
] as const;

function getHelpTopic(value: unknown): HelpTopic {
  if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(topicTitles, value)) {
    return value as HelpTopic;
  }
  return 'about';
}

export default function HelpScreen() {
  const { topic: requestedTopic } = useLocalSearchParams<{ topic?: string }>();
  const topic = getHelpTopic(requestedTopic);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [issueSummary, setIssueSummary] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [emailOpening, setEmailOpening] = useState(false);
  const [emailError, setEmailError] = useState('');

  const openIssueEmail = async () => {
    if (!issueSummary.trim() || !issueDetails.trim()) {
      setEmailError('Add a short summary and describe what happened before continuing.');
      return;
    }

    setEmailOpening(true);
    setEmailError('');
    const subject = `LocalFix app issue: ${issueSummary.trim()}`;
    const body = [
      'I would like to report an issue with LocalFix.',
      '',
      `Issue: ${issueSummary.trim()}`,
      '',
      'What happened:',
      issueDetails.trim(),
      '',
      'Please add the support recipient in the To field before sending.',
    ].join('\n');

    try {
      await Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } catch {
      setEmailError('Could not open an email app. Check that an email app is set up on your device.');
    } finally {
      setEmailOpening(false);
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>LOCALFIX HELP</Text>
          <Text style={styles.title}>{topicTitles[topic]}</Text>
          <Text style={styles.subtitle}>
            {topic === 'about'
              ? 'Local home-service requests, in one place.'
              : 'Helpful information for using LocalFix.'}
          </Text>
        </View>

        {topic === 'about' ? (
          <>
            <View style={styles.introCard}>
              <View style={styles.brandIcon}>
                <MaterialIcons name="home-repair-service" size={26} color={Colors.light.backgroundSelected} />
              </View>
              <Text style={styles.cardTitle}>A simpler way to describe a home repair</Text>
              <Text style={styles.body}>
                LocalFix helps you describe a service need, save the address where help is needed, and browse available technicians.
              </Text>
            </View>
            <InfoRow icon="location-on" title="Location-aware" body="With permission, your current location can be included with a service request." />
            <InfoRow icon="home" title="Saved service address" body="Manage your address from Profile and use it in your service requests." />
            <InfoRow icon="handyman" title="Service directory" body="Browse the technician listings available in the app." />
            <View style={styles.notice}>
              <MaterialIcons name="info-outline" size={19} color={Colors.light.backgroundSelected} />
              <Text style={styles.noticeText}>Online booking and payment are not currently available in LocalFix.</Text>
            </View>
          </>
        ) : null}

        {topic === 'guide' ? (
          <View style={styles.card}>
            {guideSteps.map(([title, description], index) => (
              <View key={title} style={styles.stepRow}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                <View style={styles.stepCopy}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text style={styles.body}>{description}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {topic === 'faq' ? (
          <View style={styles.card}>
            {faqs.map((item, index) => {
              const expanded = openFaq === index;
              return (
                <View key={item.question}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    onPress={() => setOpenFaq(expanded ? null : index)}
                    style={styles.faqQuestion}
                  >
                    <Text style={styles.faqTitle}>{item.question}</Text>
                    <MaterialIcons
                      name={expanded ? 'expand-less' : 'expand-more'}
                      size={22}
                      color={Colors.light.textSecondary}
                    />
                  </Pressable>
                  {expanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {topic === 'report' ? (
          <View style={styles.card}>
            <View style={styles.notice}>
              <MaterialIcons name="email" size={19} color={Colors.light.backgroundSelected} />
              <Text style={styles.noticeText}>
                Your device email app will open with a draft. Support email is not configured, so enter the recipient in the To field.
              </Text>
            </View>
            <Text style={styles.label}>Issue summary</Text>
            <TextInput
              accessibilityLabel="Issue summary"
              editable={!emailOpening}
              maxLength={120}
              onChangeText={setIssueSummary}
              placeholder="For example, I cannot save my address"
              placeholderTextColor={Colors.light.textSecondary}
              style={styles.input}
              value={issueSummary}
            />
            <Text style={styles.label}>What happened?</Text>
            <TextInput
              accessibilityLabel="Issue details"
              editable={!emailOpening}
              maxLength={2000}
              multiline
              onChangeText={setIssueDetails}
              placeholder="Tell us what you expected and what happened instead"
              placeholderTextColor={Colors.light.textSecondary}
              style={[styles.input, styles.multilineInput]}
              textAlignVertical="top"
              value={issueDetails}
            />
            {emailError ? <Text accessibilityRole="alert" style={styles.error}>{emailError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={emailOpening}
              onPress={() => { void openIssueEmail(); }}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, emailOpening && styles.disabledButton]}
            >
              {emailOpening ? <ActivityIndicator color={Colors.light.text} /> : (
                <>
                  <MaterialIcons name="open-in-new" size={18} color={Colors.light.text} />
                  <Text style={styles.primaryButtonText}>Open email app</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}

        {topic === 'terms' ? (
          <View style={styles.card}>
            <TermsSection title="Using LocalFix">
              Use LocalFix respectfully and provide accurate information when describing a service need or setting a visit address. Keep your sign-in details private and use only accounts you are authorized to access.
            </TermsSection>
            <TermsSection title="Location and address">
              Location access is optional. If granted, the app may use your current coordinates for a service request. You can also enter and update a service address in Profile.
            </TermsSection>
            <TermsSection title="Requests and availability">
              Submitting request details does not confirm a booking. Technician availability, service coverage, and any service terms may vary. LocalFix does not currently complete bookings or payments in the app.
            </TermsSection>
            <TermsSection title="Respect and safety">
              Do not use the app to submit unlawful, misleading, abusive, or harmful content. Do not share sensitive information that is not needed to describe the service.
            </TermsSection>
            <TermsSection title="Changes">
              App features and these usage guidelines may change as LocalFix is updated. Any separate terms shown by a service provider for a confirmed service should be reviewed before agreeing to that service.
            </TermsSection>
            <Text style={styles.termsNote}>
              These guidelines describe the app’s current functionality and are not a substitute for a formal service-provider agreement.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, title, body }: { icon: 'location-on' | 'home' | 'handyman'; title: string; body: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><MaterialIcons name={icon} size={19} color={Colors.light.backgroundSelected} /></View>
      <View style={styles.infoCopy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

function TermsSection({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.termsSection}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  heading: { marginBottom: 18 },
  eyebrow: { color: Colors.light.backgroundSelected, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 6, color: Colors.light.text, fontSize: 25, fontWeight: '800' },
  subtitle: { marginTop: 6, color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19 },
  card: { padding: 16, borderRadius: 16, backgroundColor: Colors.light.backgroundElement },
  introCard: { padding: 17, borderRadius: 16, backgroundColor: Colors.light.backgroundElement },
  brandIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 13, borderRadius: 15, backgroundColor: '#FFF2DE' },
  cardTitle: { color: Colors.light.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  body: { marginTop: 5, color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12, padding: 15, borderRadius: 15, backgroundColor: Colors.light.backgroundElement },
  infoIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFF2DE' },
  infoCopy: { flex: 1, paddingTop: 2 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 12, borderRadius: 12, backgroundColor: '#FFF9EE' },
  noticeText: { flex: 1, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 18 },
  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 11 },
  stepNumber: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFF2DE' },
  stepNumberText: { color: Colors.light.backgroundSelected, fontSize: 13, fontWeight: '800' },
  stepCopy: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8EDF2' },
  faqQuestion: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqTitle: { flex: 1, color: Colors.light.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  faqAnswer: { marginTop: -2, marginBottom: 15, color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19 },
  label: { marginTop: 16, marginBottom: 6, color: Colors.light.text, fontSize: 12, fontWeight: '700' },
  input: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 10, backgroundColor: Colors.light.background, color: Colors.light.text, fontSize: 14 },
  multilineInput: { minHeight: 130, paddingTop: 12 },
  error: { marginTop: 10, color: '#B42318', fontSize: 13, lineHeight: 18 },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, borderRadius: 12, backgroundColor: Colors.light.backgroundSelected },
  primaryButtonText: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabledButton: { opacity: 0.65 },
  termsSection: { paddingVertical: 12 },
  termsNote: { marginTop: 8, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E8EDF2', color: Colors.light.textSecondary, fontSize: 11, lineHeight: 17 },
});
