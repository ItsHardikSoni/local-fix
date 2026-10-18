import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useUser } from '../context/UserContext';
import { Colors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import {
  loadCustomerServiceRequests,
  reviewServiceRequest,
  type CustomerServiceRequest,
} from '../lib/service-requests';

export default function MyRequests() {
  const { session } = useUser();
  const customerId = session?.user.id;
  const [requests, setRequests] = useState<CustomerServiceRequest[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const nextRequests = customerId ? await loadCustomerServiceRequests(customerId) : [];
        if (active) setRequests(nextRequests);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your requests.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const channel = customerId
      ? supabase
        .channel(`customer-service-requests:${customerId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `customer_id=eq.${customerId}`,
        }, () => {
          void load();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'worker_reviews',
          filter: `customer_id=eq.${customerId}`,
        }, () => {
          void load();
        })
        .subscribe()
      : null;

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [customerId, reloadKey]);

  const submitReview = async (request: CustomerServiceRequest) => {
    const rating = ratings[request.id] ?? 0;
    if (rating < 1) return;
    setSubmittingId(request.id);
    setError('');
    setMessage('');
    try {
      await reviewServiceRequest(request.id, rating);
      setRequests((current) => current.map((item) => (
        item.id === request.id ? { ...item, review_rating: rating } : item
      )));
      setMessage('Thanks for reviewing the completed work.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit your review.');
    } finally {
      setSubmittingId(null);
    }
  };

  const statusLabel = (status: CustomerServiceRequest['status']) => (
    status === 'pending' ? 'Waiting for a worker'
      : status === 'accepted' ? 'Worker accepted'
        : status === 'completed' ? 'Work completed'
          : 'Cancelled'
  );

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>YOUR REQUESTS</Text>
            <Text style={styles.title}>Service history</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh service history"
            accessibilityRole="button"
            disabled={loading}
            onPress={() => setReloadKey((value) => value + 1)}
            style={styles.refreshButton}
          >
            <MaterialIcons name="refresh" size={22} color={Colors.light.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View accessibilityRole="alert" style={styles.statusBox}>
            <MaterialIcons name="error-outline" size={20} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {message ? (
          <View accessibilityRole="summary" style={styles.statusBox}>
            <MaterialIcons name="check-circle" size={20} color="#24734A" />
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.light.backgroundSelected} />
            <Text style={styles.emptyText}>Loading service history…</Text>
          </View>
        ) : requests.length ? requests.map((request) => {
          const rating = ratings[request.id] ?? 0;
          const submitting = submittingId === request.id;
          return (
            <View key={request.id} style={styles.request}>
              <View style={styles.requestHeader}>
                <View style={styles.serviceIcon}>
                  <MaterialIcons name="home-repair-service" size={20} color={Colors.light.backgroundSelected} />
                </View>
                <View style={styles.requestTitleCopy}>
                  <Text style={styles.serviceName}>{request.service_category.name}</Text>
                  <Text style={styles.requestDate}>{new Date(request.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.status, request.status === 'completed' && styles.statusComplete]}>
                  {statusLabel(request.status)}
                </Text>
              </View>
              <Text style={styles.description}>{request.description}</Text>
              <Text style={styles.location}>
                {[request.district.district_name, request.district.state_name].join(', ')}
              </Text>
              {request.assigned_worker ? (
                <View style={styles.workerRow}>
                  <Text style={styles.workerName}>{request.assigned_worker.worker_name}</Text>
                  <View style={styles.workerRating}>
                    <MaterialIcons name="star" size={15} color="#C27B00" />
                    <Text style={styles.workerRatingText}>
                      {Number(request.assigned_worker.average_rating).toFixed(1)} · {request.assigned_worker.review_count} reviews
                    </Text>
                  </View>
                </View>
              ) : null}
              {request.status === 'completed' ? (
                <View style={styles.reviewSection}>
                  {request.review_rating !== null ? (
                    <View style={styles.reviewedRow}>
                      <Text style={styles.reviewLabel}>Your rating</Text>
                      <View style={styles.workerRating}>
                        <MaterialIcons name="star" size={17} color="#C27B00" />
                        <Text style={styles.reviewValue}>{request.review_rating}/5</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.reviewLabel}>Rate the completed work</Text>
                      <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Pressable
                            accessibilityLabel={`Rate ${value} out of 5`}
                            accessibilityRole="button"
                            accessibilityState={{ selected: value === rating }}
                            key={value}
                            onPress={() => setRatings((current) => ({ ...current, [request.id]: value }))}
                            style={styles.starButton}
                          >
                            <MaterialIcons name={value <= rating ? 'star' : 'star-border'} size={30} color="#C27B00" />
                          </Pressable>
                        ))}
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        disabled={rating === 0 || submitting}
                        onPress={() => { void submitReview(request); }}
                        style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, (rating === 0 || submitting) && styles.disabled]}
                      >
                        {submitting ? <ActivityIndicator color={Colors.light.backgroundElement} /> : null}
                        <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit review'}</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          );
        }) : !loading && !error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="receipt-long" size={27} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No service requests yet</Text>
            <Text style={styles.emptyText}>Requests you submit will appear here, with a review option after the worker completes the job.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 20, backgroundColor: Colors.light.text },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#F7C777', fontSize: 11, fontWeight: '700' },
  title: { marginTop: 6, color: Colors.light.backgroundElement, fontSize: 24, fontWeight: '800' },
  refreshButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: Colors.light.backgroundSelected },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  request: { marginBottom: 14, padding: 16, borderWidth: 1, borderColor: '#E4E9EF', borderRadius: 14, backgroundColor: Colors.light.backgroundElement },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFF2DE' },
  requestTitleCopy: { flex: 1 },
  serviceName: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  requestDate: { marginTop: 3, color: Colors.light.textSecondary, fontSize: 11 },
  status: { maxWidth: 96, color: Colors.light.textSecondary, fontSize: 10, fontWeight: '700', textAlign: 'right' },
  statusComplete: { color: '#24734A' },
  description: { marginTop: 13, color: Colors.light.text, fontSize: 13, lineHeight: 19 },
  location: { marginTop: 6, color: Colors.light.textSecondary, fontSize: 11 },
  workerRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E9EF' },
  workerName: { color: Colors.light.text, fontSize: 12, fontWeight: '700' },
  workerRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  workerRatingText: { color: Colors.light.textSecondary, fontSize: 11 },
  reviewSection: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E9EF' },
  reviewedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewLabel: { color: Colors.light.text, fontSize: 13, fontWeight: '700' },
  reviewValue: { color: Colors.light.text, fontSize: 13, fontWeight: '700' },
  stars: { flexDirection: 'row', gap: 7, marginTop: 8 },
  starButton: { minWidth: 38, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  submitButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 9, borderRadius: 10, backgroundColor: '#24734A' },
  submitText: { color: Colors.light.backgroundElement, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: Colors.light.backgroundElement },
  errorText: { flex: 1, color: '#B42318', fontSize: 12, lineHeight: 18 },
  messageText: { flex: 1, color: '#24734A', fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  emptyIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#EFF3F8' },
  emptyTitle: { marginTop: 14, color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  emptyText: { marginTop: 7, color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
