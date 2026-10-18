import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWorkerDirectory } from '../context/WorkerDirectoryContext';
import { Colors } from '../constants/theme';
import ThemedAlert from '../components/ui/themed-alert';

export default function Job() {
  const router = useRouter();
  const { workerId, type, desc, latitude, longitude } = useLocalSearchParams<{
    workerId?: string;
    type?: string;
    desc?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const { workers, loading } = useWorkerDirectory();
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const worker = workers.find((item) => item.id === workerId);
  const issueType = typeof type === 'string' && type ? type : worker?.services[0]?.name;
  const description = typeof desc === 'string' ? desc : '';
  const latitudeValue = typeof latitude === 'string' ? Number(latitude) : NaN;
  const longitudeValue = typeof longitude === 'string' ? Number(longitude) : NaN;
  const hasServiceLocation = typeof latitude === 'string' && latitude.trim() !== ''
    && typeof longitude === 'string' && longitude.trim() !== '';
  const serviceLocation = hasServiceLocation
    && Number.isFinite(latitudeValue) && latitudeValue >= -90 && latitudeValue <= 90
    && Number.isFinite(longitudeValue) && longitudeValue >= -180 && longitudeValue <= 180
    ? `${latitude}, ${longitude}`
    : null;

  if (!worker && loading) {
    return (
      <View style={styles.emptyPage}>
        <MaterialIcons name="hourglass-empty" size={30} color={Colors.light.backgroundSelected} />
        <Text style={styles.emptyText}>Loading worker details…</Text>
      </View>
    );
  }

  if (!worker) {
    const hasInvalidWorkerId = Boolean(workerId);
    return (
      <View style={styles.emptyPage}>
        <View style={styles.emptyIcon}>
          <MaterialIcons
            name={hasInvalidWorkerId ? 'person-search' : 'work-outline'}
            size={30}
            color={Colors.light.textSecondary}
          />
        </View>
        <Text style={styles.emptyTitle}>{hasInvalidWorkerId ? 'Worker not found' : 'No worker selected yet'}</Text>
        <Text style={styles.emptyText}>
          {hasInvalidWorkerId
            ? 'This worker may no longer be listed or verified. Browse the local directory to choose another.'
            : 'Start a service request and choose a technician to review the request details here.'}
        </Text>
        <Pressable
          onPress={() => router.replace(hasInvalidWorkerId ? '/technicians' : '/report')}
          style={styles.emptyButton}
        >
          <Text style={styles.emptyButtonText}>
            {hasInvalidWorkerId ? 'Browse technicians' : 'Start a request'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Pressable
              accessibilityLabel="Back to technicians"
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={21} color={Colors.light.backgroundElement} />
            </Pressable>
            <Text style={styles.heroEyebrow}>SERVICE MATCH</Text>
          </View>
          <Text style={styles.heroTitle}>Review your request</Text>
          <Text style={styles.heroSubtitle}>Confirm the professional and issue details before continuing.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={34} color={Colors.light.text} />
          </View>
          <View style={styles.techIdentity}>
            <Text style={styles.techName}>{worker.name}</Text>
            <Text style={styles.techSpecialty}>{worker.services.map((service) => service.name).join(' · ')}</Text>
            <View style={styles.ratingRow}>
              <MaterialIcons name="star" size={16} color="#C27B00" />
              <Text style={styles.rating}>{worker.averageRating.toFixed(1)}</Text>
              <Text style={styles.ratingCaption}>out of 5</Text>
            </View>
          </View>
          <View style={styles.serviceIcon}>
            <MaterialIcons name="home-repair-service" size={21} color={Colors.light.backgroundSelected} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Request details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="build" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Service needed</Text>
              <Text style={styles.detailValue}>{issueType || 'Home repair'}</Text>
            </View>
          </View>
          {description ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="description" size={19} color={Colors.light.backgroundSelected} />
                </View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailLabel}>Your description</Text>
                  <Text style={styles.description}>{description}</Text>
                </View>
              </View>
            </>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="location-on" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>{serviceLocation ? 'Your GPS location' : 'Service area'}</Text>
              <Text style={styles.detailValue}>{serviceLocation || worker.district}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="verified" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Verified · experience · completed jobs</Text>
              <Text style={styles.detailValue}>
                {worker.experienceYears} years · {worker.completedJobsCount} completed jobs
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="event-available" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Current availability</Text>
              <Text style={styles.detailValue}>
                {worker.availabilityStatus[0].toUpperCase() + worker.availabilityStatus.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>Technician rate</Text>
            <Text style={styles.priceCaption}>Final cost depends on the work required</Text>
          </View>
          <View style={styles.rateValues}>
            {worker.hourlyRate !== null ? (
              <Text style={styles.price}>₹{worker.hourlyRate}<Text style={styles.perHour}>/hour</Text></Text>
            ) : null}
            {worker.dailyRate !== null ? (
              <Text style={styles.price}>₹{worker.dailyRate}<Text style={styles.perHour}>/day</Text></Text>
            ) : null}
            {worker.ratesNegotiable ? <Text style={styles.negotiable}>Rates are negotiable</Text> : null}
          </View>
        </View>

        <View style={styles.notice}>
          <MaterialIcons name="info-outline" size={19} color={Colors.light.backgroundSelected} />
          <Text style={styles.noticeText}>No booking or payment is made on this screen. Contact and payment features will be added later.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowPaymentAlert(true)}
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        >
          <Text style={styles.continueText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.light.text} />
        </Pressable>
      </View>

      <ThemedAlert
        actionLabel="Got it"
        message="Online booking and payment are not available yet. Your request has not been submitted."
        onAction={() => setShowPaymentAlert(false)}
        onClose={() => setShowPaymentAlert(false)}
        title="Booking unavailable"
        visible={showPaymentAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 24 },
  hero: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: Colors.light.text },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroEyebrow: { color: '#F7C777', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { marginTop: 18, color: Colors.light.backgroundElement, fontSize: 25, fontWeight: '800' },
  heroSubtitle: { marginTop: 7, color: '#D6DFEA', fontSize: 13, lineHeight: 19 },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: Colors.light.backgroundElement, elevation: 2, shadowColor: Colors.light.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7 },
  avatar: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFF2DE' },
  techIdentity: { flex: 1, marginLeft: 13 },
  techName: { color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  techSpecialty: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 7 },
  rating: { color: Colors.light.text, fontSize: 12, fontWeight: '700' },
  ratingCaption: { marginLeft: 4, color: Colors.light.textSecondary, fontSize: 11 },
  serviceIcon: { alignSelf: 'flex-start' },
  sectionTitle: { marginHorizontal: 20, marginTop: 24, marginBottom: 11, color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  detailsCard: { marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 16, backgroundColor: Colors.light.backgroundElement },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 15 },
  detailIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#FFF2DE' },
  detailCopy: { flex: 1 },
  detailLabel: { color: Colors.light.textSecondary, fontSize: 12 },
  detailValue: { marginTop: 4, color: Colors.light.text, fontSize: 14, fontWeight: '600' },
  description: { marginTop: 5, color: Colors.light.text, fontSize: 14, lineHeight: 21 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8EDF2' },
  priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 15, padding: 16, borderWidth: 1, borderColor: '#F2E2C5', borderRadius: 15, backgroundColor: '#FFF9EE' },
  priceLabel: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  priceCaption: { maxWidth: 200, marginTop: 4, color: Colors.light.textSecondary, fontSize: 11, lineHeight: 16 },
  price: { color: Colors.light.text, fontSize: 20, fontWeight: '800' },
  rateValues: { alignItems: 'flex-end', gap: 3 },
  negotiable: { color: Colors.light.backgroundSelected, fontSize: 11, fontWeight: '700' },
  perHour: { fontSize: 12, fontWeight: '500' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginHorizontal: 20, marginTop: 15, padding: 13, borderRadius: 12, backgroundColor: '#EFF3F8' },
  noticeText: { flex: 1, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D8E0E9', backgroundColor: Colors.light.background },
  continueButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 13, backgroundColor: Colors.light.backgroundSelected },
  continueText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  emptyPage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: Colors.light.background },
  emptyIcon: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 31, backgroundColor: '#EFF3F8' },
  emptyTitle: { marginTop: 16, color: Colors.light.text, fontSize: 19, fontWeight: '700' },
  emptyText: { marginTop: 7, color: Colors.light.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyButton: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 11, backgroundColor: Colors.light.backgroundSelected },
  emptyButtonText: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
});
