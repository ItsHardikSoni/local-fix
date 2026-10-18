import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import { useLocation } from '../../context/LocationContext';
import ThemedAlert from '../../components/ui/themed-alert';

const services = [
  { label: 'Plumbing', icon: 'plumbing' as const, color: '#E8F3FF', issue: 'Plumbing' },
  { label: 'Electrical', icon: 'electrical-services' as const, color: '#FFF2DE', issue: 'Electrical' },
  { label: 'Air conditioning', icon: 'ac-unit' as const, color: '#E8F7F4', issue: 'Air conditioning' },
  { label: 'General repair', icon: 'handyman' as const, color: '#F2EDFF', issue: 'General repair' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen() {
  const router = useRouter();
  const { session, profile } = useUser();
  const { district, locationLabel, locationLoading, locationError, refreshLocation } = useLocation();
  const [showWorkerAlert, setShowWorkerAlert] = useState(false);
  const metadataName = session?.user.user_metadata?.full_name;
  const userName = profile?.full_name
    || (typeof metadataName === 'string' ? metadataName : '')
    || 'there';
  const firstName = userName.trim().split(/\s+/)[0] || 'there';

  const openReport = (service?: string) => {
    router.push({
      pathname: '/report',
      params: service ? { type: service } : undefined,
    });
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityLabel="Refresh current location"
              accessibilityRole="button"
              onPress={() => { void refreshLocation(); }}
              style={styles.locationPill}
            >
              <MaterialIcons name="location-on" size={16} color={Colors.light.backgroundSelected} />
              <Text numberOfLines={1} style={styles.locationText}>
                {locationLabel || (locationLoading
                  ? 'Finding location…'
                  : locationError
                    ? 'Tap to enable location'
                    : 'Location unavailable')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Open profile"
              accessibilityRole="button"
              onPress={() => router.push('/profile')}
              style={styles.profileButton}
            >
              <MaterialIcons name="account-circle" size={28} color={Colors.light.backgroundElement} />
            </Pressable>
          </View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{firstName}!</Text>
          <Text style={styles.heroSubtitle}>Reliable help for your home, right around the corner.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => openReport()}
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
          >
            <MaterialIcons name="add-circle-outline" size={20} color={Colors.light.text} />
            <Text style={styles.heroButtonText}>Report a problem</Text>
            <MaterialIcons name="arrow-forward" size={18} color={Colors.light.text} />
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>How can we help?</Text>
            <Text style={styles.sectionSubtitle}>Choose a service to get started</Text>
          </View>
          <MaterialIcons name="home-repair-service" size={24} color={Colors.light.backgroundSelected} />
        </View>

        <View style={styles.serviceGrid}>
          {services.map((service) => (
            <Pressable
              accessibilityRole="button"
              key={service.label}
              onPress={() => openReport(service.issue)}
              style={({ pressed }) => [styles.serviceCard, pressed && styles.cardPressed]}
            >
              <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
                <MaterialIcons name={service.icon} size={24} color={Colors.light.text} />
              </View>
              <Text style={styles.serviceName}>{service.label}</Text>
              <MaterialIcons name="arrow-forward" size={17} color={Colors.light.textSecondary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Quick access</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/technicians')}
          style={({ pressed }) => [styles.quickCard, pressed && styles.cardPressed]}
        >
          <View style={styles.quickIcon}>
            <MaterialIcons name="engineering" size={23} color={Colors.light.backgroundSelected} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickTitle}>Browse local technicians</Text>
            <Text style={styles.quickSubtitle}>See trusted professionals in {district || 'your area'}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Colors.light.textSecondary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowWorkerAlert(true)}
          style={({ pressed }) => [styles.workerCard, pressed && styles.cardPressed]}
        >
          <View style={styles.workerCopy}>
            <Text style={styles.workerEyebrow}>ARE YOU A PROFESSIONAL?</Text>
            <Text style={styles.workerTitle}>Grow your local business with LocalFix</Text>
            <Text style={styles.workerLink}>Learn about joining  <MaterialIcons name="arrow-forward" size={15} color={Colors.light.backgroundElement} /></Text>
          </View>
          <MaterialIcons name="handyman" size={40} color="#F7C777" />
        </Pressable>

        <View style={styles.tipCard}>
          <MaterialIcons name="verified-user" size={21} color={Colors.light.backgroundSelected} />
          <Text style={styles.tipText}>
            A clear description helps us match you with the right home-repair professional.
          </Text>
        </View>
      </ScrollView>

      <ThemedAlert
        actionLabel="Got it"
        message="Professional registration is not available yet. Please check back soon."
        onAction={() => setShowWorkerAlert(false)}
        onClose={() => setShowWorkerAlert(false)}
        title="Coming soon"
        visible={showWorkerAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 28 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: Colors.light.text,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationPill: {
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  locationText: { flexShrink: 1, color: '#E5EAF1', fontSize: 13, fontWeight: '500' },
  profileButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  greeting: { marginTop: 18, color: '#C8D2DF', fontSize: 17, fontWeight: '500' },
  name: { marginTop: 3, color: Colors.light.backgroundElement, fontSize: 30, fontWeight: '800' },
  heroSubtitle: { maxWidth: 300, marginTop: 8, color: '#D6DFEA', fontSize: 14, lineHeight: 21 },
  heroButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSelected,
  },
  heroButtonText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { color: Colors.light.text, fontSize: 19, fontWeight: '700' },
  sectionSubtitle: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 13 },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  serviceCard: {
    width: '48%',
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundElement,
    elevation: 2,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderRadius: 13,
  },
  serviceName: { flex: 1, color: Colors.light.text, fontSize: 13, fontWeight: '600' },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  quickCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 13,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: Colors.light.backgroundElement,
    elevation: 1,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  quickIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 13,
    backgroundColor: '#FFF2DE',
  },
  quickCopy: { flex: 1 },
  quickTitle: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  quickSubtitle: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 12 },
  workerCard: {
    minHeight: 138,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#263D5D',
  },
  workerCopy: { flex: 1, paddingRight: 14 },
  workerEyebrow: { color: '#F7C777', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  workerTitle: { marginTop: 8, color: Colors.light.backgroundElement, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  workerLink: { flexDirection: 'row', marginTop: 10, color: Colors.light.backgroundElement, fontSize: 12, fontWeight: '600' },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F2E2C5',
    borderRadius: 14,
    backgroundColor: '#FFF9EE',
  },
  tipText: { flex: 1, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 18 },
});
