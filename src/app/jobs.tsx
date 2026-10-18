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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWorkerDirectory } from '../context/WorkerDirectoryContext';
import { useUser } from '../context/UserContext';
import { Colors } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createServiceRequest } from '../lib/service-requests';

export default function Job() {
  const router = useRouter();
  const {
    workerId,
    type,
    categoryId,
    districtId,
    districtName,
    stateName,
    desc,
    addressLine,
    societyName,
    flatNumber,
    latitude,
    longitude,
  } = useLocalSearchParams<{
    workerId?: string;
    type?: string;
    categoryId?: string;
    districtId?: string;
    districtName?: string;
    stateName?: string;
    desc?: string;
    addressLine?: string;
    societyName?: string;
    flatNumber?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const { workers, loading } = useWorkerDirectory();
  const { session } = useUser();
  const [offerAmount, setOfferAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestCreated, setRequestCreated] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const worker = workers.find((item) => item.id === workerId);
  const issueType = typeof type === 'string' && type ? type : worker?.services[0]?.name;
  const description = typeof desc === 'string' ? desc : '';
  const insets = useSafeAreaInsets();
  const latitudeValue = typeof latitude === 'string' ? Number(latitude) : NaN;
  const longitudeValue = typeof longitude === 'string' ? Number(longitude) : NaN;
  const hasServiceLocation = typeof latitude === 'string' && latitude.trim() !== ''
    && typeof longitude === 'string' && longitude.trim() !== '';
  const requestCoordinates = hasServiceLocation
    && Number.isFinite(latitudeValue) && latitudeValue >= -90 && latitudeValue <= 90
    && Number.isFinite(longitudeValue) && longitudeValue >= -180 && longitudeValue <= 180
    ? { latitude: latitudeValue, longitude: longitudeValue }
    : { latitude: null, longitude: null };
  const requestAddress = [
    typeof flatNumber === 'string' && flatNumber ? `House / flat ${flatNumber}` : '',
    typeof societyName === 'string' ? societyName : '',
    typeof addressLine === 'string' ? addressLine : '',
  ].filter(Boolean).join(', ');
  const workerAddress = worker?.addressLine?.trim()
    || [worker?.district, worker?.state].filter(Boolean).join(', ');

  const submitRequest = async () => {
    setSubmitError('');
    const normalizedOffer = offerAmount.trim();
    const proposedAmount = normalizedOffer ? Number(normalizedOffer) : null;
    if (proposedAmount !== null && (!Number.isFinite(proposedAmount) || proposedAmount <= 0 || proposedAmount > 99999999)) {
      setSubmitError('Enter a valid offer amount greater than zero, or leave it blank.');
      return;
    }
    if (!session?.user.id || !categoryId || !districtId || !workerId) {
      setSubmitError('Your request details are incomplete. Return to the service form and try again.');
      return;
    }

    setSubmitting(true);
    try {
      await createServiceRequest({
        customer_id: session.user.id,
        service_category_id: categoryId,
        district_id: districtId,
        description,
        address_line: typeof addressLine === 'string' ? addressLine : '',
        society_name: typeof societyName === 'string' && societyName ? societyName : null,
        flat_number: typeof flatNumber === 'string' && flatNumber ? flatNumber : null,
        latitude: requestCoordinates.latitude,
        longitude: requestCoordinates.longitude,
        proposed_amount: proposedAmount,
        preferred_worker_id: workerId,
      });
      setRequestCreated(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit your service request.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(24, insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
              <Text style={styles.ratingCaption}>· {worker.reviewCount} reviews</Text>
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
              <Text style={styles.detailLabel}>Worker address</Text>
              <Text style={styles.detailValue}>{workerAddress || 'Address not provided'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="verified" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Verification status · experience · completed jobs</Text>
              <Text style={styles.detailValue}>
                {worker.verificationStatus === 'verified' ? 'Verified' : 'Not verified'} · {worker.experienceYears} years · {worker.completedJobsCount} completed jobs
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MaterialIcons name="home" size={19} color={Colors.light.backgroundSelected} />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Your service address</Text>
              <Text style={styles.detailValue}>
                {requestAddress || [districtName, stateName].filter(Boolean).join(', ') || 'Address not provided'}
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
          <Text style={styles.priceCaption}>You can suggest an amount for the worker to review.</Text>
        </View>

        <View style={styles.rateValues}>
          {worker?.hourlyRate !== null && (
            <Text style={styles.price}>
              ₹{worker.hourlyRate}
              <Text style={styles.perHour}>/hour</Text>
            </Text>
          )}
          {worker?.dailyRate !== null && (
            <Text style={styles.price}>
              ₹{worker.dailyRate}
              <Text style={styles.perHour}>/day</Text>
            </Text>
          )}
          {worker?.ratesNegotiable && (
            <Text style={styles.negotiable}>Rates are negotiable</Text>
          )}
        </View>
      </View>


        <View style={styles.offerCard}>
          <Text style={styles.offerLabel}>Your offer (₹, optional)</Text>
          <Text style={styles.offerCaption}>Leave blank to discuss the rate with the worker.</Text>
          <TextInput
            accessibilityLabel="Your offer amount in rupees"
            editable={!requestCreated && !submitting}
            keyboardType="numeric"
            maxLength={10}
            onChangeText={setOfferAmount}
            placeholder="Enter an amount"
            placeholderTextColor={Colors.light.textSecondary}
            style={styles.offerInput}
            value={offerAmount}
          />
        </View>

        <View style={styles.notice}>
          <MaterialIcons
            name={requestCreated ? 'check-circle' : submitError ? 'error-outline' : 'info-outline'}
            size={19}
            color={requestCreated ? '#24734A' : submitError ? '#B42318' : Colors.light.backgroundSelected}
          />
          <Text style={[styles.noticeText, submitError && styles.noticeError]}>
            {requestCreated
              ? 'Your request was sent to verified workers offering this service in the same district. The selected worker is marked as your preference.'
              : submitError || 'Your request and optional offer will be shared only with verified workers for this service in the selected district.'}
          </Text>
        </View>
      </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          accessibilityRole="button"
          disabled={submitting || requestCreated}
          onPress={() => { void submitRequest(); }}
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed, (submitting || requestCreated) && styles.disabledButton]}
        >
          {submitting ? <ActivityIndicator color={Colors.light.text} /> : null}
          <Text style={styles.continueText}>{requestCreated ? 'Request sent' : submitting ? 'Sending request…' : 'Send service request'}</Text>
          {!submitting && !requestCreated ? <MaterialIcons name="send" size={19} color={Colors.light.text} /> : null}
        </Pressable>
      </View>
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
  priceCard: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 15, padding: 16, borderWidth: 1, borderColor: '#F2E2C5', borderRadius: 15, backgroundColor: '#FFF9EE' },
  priceLabel: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  priceCaption: { maxWidth: 200, marginTop: 4, color: Colors.light.textSecondary, fontSize: 11, lineHeight: 16 },
  price: { color: Colors.light.text, fontSize: 20, fontWeight: '800' },
  rateValues: { alignItems: 'flex-end', gap: 4, marginTop: 8 },
  negotiable: { color: Colors.light.backgroundSelected, fontSize: 11, fontWeight: '700' },
  perHour: { fontSize: 12, fontWeight: '500' },
  offerCard: { marginHorizontal: 20, marginTop: 15, padding: 16, borderRadius: 15, backgroundColor: Colors.light.backgroundElement },
  offerLabel: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  offerCaption: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 17 },
  offerInput: { minHeight: 48, marginTop: 12, paddingHorizontal: 13, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 10, color: Colors.light.text, fontSize: 15 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginHorizontal: 20, marginTop: 15, padding: 13, borderRadius: 12, backgroundColor: '#EFF3F8' },
  noticeText: { flex: 1, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 18 },
  noticeError: { color: '#B42318' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D8E0E9', backgroundColor: Colors.light.background },
  continueButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 13, backgroundColor: Colors.light.backgroundSelected },
  continueText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  pressed: { opacity: 0.82 },
  emptyPage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: Colors.light.background },
  emptyIcon: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 31, backgroundColor: '#EFF3F8' },
  emptyTitle: { marginTop: 16, color: Colors.light.text, fontSize: 19, fontWeight: '700' },
  emptyText: { marginTop: 7, color: Colors.light.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyButton: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 11, backgroundColor: Colors.light.backgroundSelected },
  emptyButtonText: { color: Colors.light.text, fontSize: 14, fontWeight: '700' },
});
