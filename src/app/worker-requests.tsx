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
  acceptServiceRequest,
  completeServiceRequest,
  ignoreServiceRequest,
  loadWorkerServiceRequests,
  setWorkerRequestAvailability,
  type WorkerRequestAvailability,
  type WorkerServiceRequest,
} from '../lib/service-requests';

export default function WorkerRequests() {
  const { session } = useUser();
  const workerId = session?.user.id;
  const [requests, setRequests] = useState<WorkerServiceRequest[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<WorkerRequestAvailability>('offline');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const inbox = workerId ? await loadWorkerServiceRequests(workerId) : null;
        if (active && inbox) {
          setRequests(inbox.requests);
          setAvailabilityStatus(inbox.availabilityStatus);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load service requests.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const channel = workerId
      ? supabase
        .channel(`worker-service-requests:${workerId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
          void load();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'service_request_responses',
          filter: `worker_id=eq.${workerId}`,
        }, () => {
          void load();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'worker_profiles',
          filter: `id=eq.${workerId}`,
        }, () => {
          void load();
        })
        .subscribe()
      : null;

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [reloadKey, workerId]);

  const respond = async (request: WorkerServiceRequest, response: 'accepted' | 'ignored') => {
    setActionId(request.id);
    setError('');
    setMessage('');
    try {
      if (response === 'accepted') {
        await acceptServiceRequest(request.id);
        setAvailabilityStatus('busy');
        setMessage('Request accepted. Complete the work before accepting another request.');
        setReloadKey((value) => value + 1);
      } else {
        await ignoreServiceRequest(request.id);
        setMessage('Request ignored. It will no longer appear in your inbox.');
        setRequests((current) => current.filter((item) => item.id !== request.id));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update this request.');
    } finally {
      setActionId(null);
    }
  };

  const completeWork = async (requestId: string) => {
    setActionId(requestId);
    setError('');
    try {
      await completeServiceRequest(requestId);
      setRequests((current) => current.filter((item) => item.id !== requestId));
      setAvailabilityStatus('available');
      setMessage('Work marked complete. You are available for the next service request.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to mark this work complete.');
    } finally {
      setActionId(null);
    }
  };

  const toggleAvailability = async () => {
    if (availabilityStatus === 'busy') return;
    const nextStatus = availabilityStatus === 'available' ? 'offline' : 'available';
    setAvailabilitySaving(true);
    setError('');
    try {
      await setWorkerRequestAvailability(nextStatus);
      setAvailabilityStatus(nextStatus);
      setMessage(nextStatus === 'available' ? 'You are now available for requests.' : 'You are now offline.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update availability.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>WORKER INBOX</Text>
            <Text style={styles.title}>Service requests</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh service requests"
            accessibilityRole="button"
            disabled={loading}
            onPress={() => setReloadKey((value) => value + 1)}
            style={styles.refreshButton}
          >
            <MaterialIcons name="refresh" size={22} color={Colors.light.text} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Requests appear only when your verified service and district match the customer&apos;s request.</Text>
        <View style={styles.availabilityRow}>
          <Text style={styles.availabilityLabel}>Status: {availabilityStatus}</Text>
          {availabilityStatus === 'busy' ? (
            <Text style={styles.busyHint}>Complete your active request to become available.</Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={availabilitySaving}
              onPress={() => { void toggleAvailability(); }}
              style={({ pressed }) => [styles.availabilityButton, pressed && styles.pressed, availabilitySaving && styles.disabled]}
            >
              {availabilitySaving ? <ActivityIndicator color={Colors.light.text} /> : null}
              <Text style={styles.availabilityButtonText}>
                {availabilitySaving ? 'Updating…' : availabilityStatus === 'available' ? 'Go offline' : 'Go available'}
              </Text>
            </Pressable>
          )}
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
            <Text style={styles.emptyText}>Loading requests…</Text>
          </View>
        ) : requests.length ? requests.map((request) => {
          const isBusy = actionId === request.id;
          const address = [
            request.flat_number ? `House / flat ${request.flat_number}` : '',
            request.society_name ?? '',
            request.address_line,
            request.district.district_name,
            request.district.state_name,
          ].filter(Boolean).join(', ');
          return (
            <View key={request.id} style={styles.request}>
              <View style={styles.requestHeading}>
                <View style={styles.serviceIcon}>
                  <MaterialIcons name="home-repair-service" size={20} color={Colors.light.backgroundSelected} />
                </View>
                <View style={styles.requestTitleCopy}>
                  <Text style={styles.serviceName}>{request.service_category.name}</Text>
                  <Text style={styles.requestDate}>{new Date(request.created_at).toLocaleDateString()}</Text>
                </View>
                  {request.status === 'accepted' ? <Text style={styles.activeBadge}>Active</Text> : null}
                {request.preferred_worker_id === workerId ? (
                  <Text style={styles.preferred}>Preferred</Text>
                ) : null}
              </View>
              <Text style={styles.description}>{request.description}</Text>
              <View style={styles.addressRow}>
                <MaterialIcons name="place" size={17} color={Colors.light.textSecondary} />
                <Text style={styles.address}>{address}</Text>
              </View>
              <View style={styles.offerRow}>
                <Text style={styles.offerCaption}>Customer offer</Text>
                <Text style={styles.offerValue}>
                  {request.proposed_amount === null ? 'Open to discuss' : `₹${request.proposed_amount}`}
                </Text>
              </View>
              <View style={styles.actions}>
                {request.status === 'accepted' ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isBusy}
                    onPress={() => { void completeWork(request.id); }}
                    style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed, isBusy && styles.disabled]}
                  >
                    {isBusy ? <ActivityIndicator color={Colors.light.backgroundElement} /> : <MaterialIcons name="task-alt" size={18} color={Colors.light.backgroundElement} />}
                    <Text style={styles.acceptText}>Mark work complete</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy}
                      onPress={() => { void respond(request, 'ignored'); }}
                      style={({ pressed }) => [styles.ignoreButton, pressed && styles.pressed, isBusy && styles.disabled]}
                    >
                      {isBusy ? <ActivityIndicator color={Colors.light.textSecondary} /> : <MaterialIcons name="close" size={18} color={Colors.light.text} />}
                      <Text style={styles.ignoreText}>Ignore</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isBusy || availabilityStatus !== 'available'}
                      onPress={() => { void respond(request, 'accepted'); }}
                      style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed, (isBusy || availabilityStatus !== 'available') && styles.disabled]}
                    >
                      <MaterialIcons name="check" size={18} color={Colors.light.backgroundElement} />
                      <Text style={styles.acceptText}>{availabilityStatus === 'available' ? 'Accept' : 'Unavailable'}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          );
        }) : !loading && !error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="inbox" size={27} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No matching requests</Text>
            <Text style={styles.emptyText}>New requests for your verified service and district will appear here.</Text>
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
  subtitle: { marginTop: 8, color: '#D6DFEA', fontSize: 13, lineHeight: 19 },
  refreshButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: Colors.light.backgroundSelected },
  availabilityRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 13 },
  availabilityLabel: { color: Colors.light.backgroundElement, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  busyHint: { color: '#D6DFEA', fontSize: 11 },
  availabilityButton: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 9, backgroundColor: Colors.light.backgroundSelected },
  availabilityButtonText: { color: Colors.light.text, fontSize: 11, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  request: { marginBottom: 14, padding: 16, borderWidth: 1, borderColor: '#E4E9EF', borderRadius: 14, backgroundColor: Colors.light.backgroundElement },
  requestHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  serviceIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFF2DE' },
  requestTitleCopy: { flex: 1 },
  serviceName: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  requestDate: { marginTop: 3, color: Colors.light.textSecondary, fontSize: 11 },
  preferred: { color: '#815600', fontSize: 10, fontWeight: '700' },
  activeBadge: { color: '#24734A', fontSize: 10, fontWeight: '700' },
  description: { marginTop: 14, color: Colors.light.text, fontSize: 14, lineHeight: 20 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 12 },
  address: { flex: 1, color: Colors.light.textSecondary, fontSize: 12, lineHeight: 18 },
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E4E9EF' },
  offerCaption: { color: Colors.light.textSecondary, fontSize: 12 },
  offerValue: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  ignoreButton: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 11 },
  ignoreText: { color: Colors.light.text, fontSize: 13, fontWeight: '700' },
  acceptButton: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 11, backgroundColor: '#24734A' },
  acceptText: { color: Colors.light.backgroundElement, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: Colors.light.backgroundElement },
  errorText: { flex: 1, color: '#B42318', fontSize: 12, lineHeight: 18 },
  messageText: { flex: 1, color: '#24734A', fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  emptyIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#EFF3F8' },
  emptyTitle: { marginTop: 14, color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  emptyText: { marginTop: 7, color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
