import React, { useMemo, useState } from 'react';
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
import { useLocation } from '../../context/LocationContext';
import { useServiceCategories } from '../../context/ServiceCategoryContext';
import { useWorkerDirectory } from '../../context/WorkerDirectoryContext';
import { Colors } from '../../constants/theme';

export default function Technicians() {
  const router = useRouter();
  const { district, locationLabel, locationLoading, locationError, refreshLocation } = useLocation();
  const {
    workers,
    loading,
    error,
    realtimeConnected,
    realtimeError,
    refreshWorkers,
  } = useWorkerDirectory();
  const { categories } = useServiceCategories();
  const {
    type: issueType,
    categoryId: requestedCategoryId,
    districtId: requestedDistrictId,
    districtName: requestedDistrictName,
    stateName: requestedStateName,
    desc: issueDescription,
    addressLine,
    societyName,
    flatNumber,
    latitude,
    longitude,
  } = useLocalSearchParams<{
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
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState(
    typeof issueType === 'string' && issueType ? issueType : 'All',
  );
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [topRatedFirst, setTopRatedFirst] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const specialties = useMemo(() => [
    'All',
    ...categories.map((category) => category.name),
  ], [categories]);
  const activeSpecialty = specialties.includes(specialty)
    || (Boolean(issueType) && specialty === issueType)
    ? specialty
    : 'All';
  const activeCategoryId = activeSpecialty === 'All'
    ? (specialty === issueType && typeof requestedCategoryId === 'string' ? requestedCategoryId : '')
    : categories.find((category) => category.name === activeSpecialty)?.id
      ?? (activeSpecialty === issueType && typeof requestedCategoryId === 'string'
        ? requestedCategoryId
        : '');
  const selectedServiceName = activeSpecialty !== 'All'
    ? activeSpecialty
    : typeof issueType === 'string' ? issueType : '';
  const targetDistrictName = typeof requestedDistrictName === 'string' && requestedDistrictName
    ? requestedDistrictName
    : district;

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workers
      .filter((worker) => {
        if (typeof requestedDistrictId === 'string' && requestedDistrictId) {
          return worker.districtId === requestedDistrictId
            && (typeof requestedStateName !== 'string'
              || !requestedStateName
              || worker.state.toLowerCase() === requestedStateName.toLowerCase());
        }
        return targetDistrictName !== null
          && worker.district.toLowerCase() === targetDistrictName.toLowerCase();
      })
      .filter((worker) => !activeCategoryId || worker.services.some((service) => service.id === activeCategoryId))
      .filter((worker) => !favoritesOnly || favoriteIds.includes(worker.id))
      .filter((worker) => !query || `${worker.name} ${worker.services.map((service) => service.name).join(' ')}`.toLowerCase().includes(query))
      .sort((left, right) => topRatedFirst
        ? right.averageRating - left.averageRating
        : left.name.localeCompare(right.name));
  }, [
    activeCategoryId,
    favoriteIds,
    favoritesOnly,
    requestedDistrictId,
    requestedStateName,
    search,
    targetDistrictName,
    topRatedFirst,
    workers,
  ]);

  const select = (workerId: string) => {
    router.push({
      pathname: '/jobs',
      params: {
        workerId,
        type: selectedServiceName,
        categoryId: activeCategoryId,
        districtId: typeof requestedDistrictId === 'string' ? requestedDistrictId : '',
        districtName: targetDistrictName ?? '',
        stateName: typeof requestedStateName === 'string' ? requestedStateName : '',
        desc: typeof issueDescription === 'string' ? issueDescription : '',
        addressLine: typeof addressLine === 'string' ? addressLine : '',
        societyName: typeof societyName === 'string' ? societyName : '',
        flatNumber: typeof flatNumber === 'string' ? flatNumber : '',
        latitude: typeof latitude === 'string' ? latitude : '',
        longitude: typeof longitude === 'string' ? longitude : '',
      },
    });
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) => current.includes(id)
      ? current.filter((favoriteId) => favoriteId !== id)
      : [...current, id]);
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Pressable
            accessibilityLabel="Refresh current location"
            accessibilityRole="button"
            onPress={() => { void refreshLocation(); }}
            style={styles.locationPill}
          >
            <MaterialIcons name="location-on" size={16} color={Colors.light.backgroundSelected} />
            <Text numberOfLines={1} style={styles.locationText}>
              {locationLabel || (locationLoading
                ? 'Finding your location…'
                : locationError
                  ? 'Tap to enable location'
                  : 'Location unavailable')}
            </Text>
          </Pressable>
          <Text style={styles.title}>Find your local expert</Text>
          <Text style={styles.subtitle}>Trusted home service professionals, close to home.</Text>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={21} color={Colors.light.textSecondary} />
            <TextInput
              accessibilityLabel="Search technicians"
              onChangeText={setSearch}
              placeholder="Search by name or service"
              placeholderTextColor={Colors.light.textSecondary}
              returnKeyType="search"
              style={styles.searchInput}
              value={search}
            />
            {search ? (
              <Pressable
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setSearch('')}
              >
                <MaterialIcons name="cancel" size={19} color={Colors.light.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {typeof issueType === 'string' && issueType ? (
          <View style={styles.requestBanner}>
            <MaterialIcons name="assignment" size={18} color={Colors.light.backgroundSelected} />
            <Text style={styles.requestText}>Finding help for: <Text style={styles.requestStrong}>{issueType}</Text></Text>
          </View>
        ) : null}
        {targetDistrictName ? (
          <View style={styles.requestBanner}>
            <MaterialIcons name="place" size={18} color={Colors.light.backgroundSelected} />
            <Text style={styles.requestText}>
              Showing workers in{' '}
              <Text style={styles.requestStrong}>
                {[requestedDistrictName || targetDistrictName, requestedStateName].filter(Boolean).join(', ')}
              </Text>
            </Text>
          </View>
        ) : null}

        <View style={styles.filterHeading}>
          <Text style={styles.sectionTitle}>Service</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: topRatedFirst }}
            onPress={() => setTopRatedFirst((value) => !value)}
            style={({ pressed }) => [styles.sortButton, topRatedFirst && styles.sortButtonSelected, pressed && styles.pressed]}
          >
            <MaterialIcons name="star" size={15} color={topRatedFirst ? Colors.light.text : Colors.light.backgroundSelected} />
            <Text style={[styles.sortText, topRatedFirst && styles.sortTextSelected]}>
              {topRatedFirst ? 'Top rated' : 'Sort by rating'}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.filters}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {specialties.map((item) => {
            const selected = activeSpecialty === item;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={item}
                onPress={() => setSpecialty(item)}
                style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: favoritesOnly }}
            onPress={() => setFavoritesOnly((value) => !value)}
            style={({ pressed }) => [styles.filterChip, favoritesOnly && styles.filterChipSelected, pressed && styles.pressed]}
          >
            <MaterialIcons name="favorite" size={14} color={favoritesOnly ? Colors.light.backgroundElement : Colors.light.textSecondary} />
            <Text style={[styles.filterText, favoritesOnly && styles.filterTextSelected]}>Saved</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.resultsHeading}>
          <View>
            <Text style={styles.sectionTitle}>Verified professionals</Text>
            <Text style={styles.liveStatus}>
              {realtimeConnected
                ? 'Live worker updates enabled'
                : realtimeError
                  ? 'Live updates unavailable'
                  : 'Connecting to live updates…'}
            </Text>
          </View>
          <Text style={styles.resultCount}>{filteredWorkers.length} found</Text>
        </View>

        {error && workers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text accessibilityRole="alert" style={styles.emptyText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => { void refreshWorkers(); }} style={styles.resetButton}>
              <Text style={styles.resetText}>Try again</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.light.backgroundSelected} />
            <Text style={styles.emptyText}>Loading verified workers…</Text>
          </View>
        ) : null}
        {error && workers.length > 0 ? (
          <View style={styles.refreshNotice}>
            <Text accessibilityRole="alert" style={styles.emptyText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => { void refreshWorkers(); }}>
              <Text style={styles.resetText}>Refresh workers</Text>
            </Pressable>
          </View>
        ) : null}

        {filteredWorkers.map((worker) => {
          const isFavorite = favoriteIds.includes(worker.id);
          const rateParts = [
            worker.hourlyRate === null ? null : `₹${worker.hourlyRate}/hour`,
            worker.dailyRate === null ? null : `₹${worker.dailyRate}/day`,
          ].filter(Boolean);
          const availabilityLabel = worker.availabilityStatus[0].toUpperCase()
            + worker.availabilityStatus.slice(1);
          return (
            <View key={worker.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <MaterialIcons name="person" size={28} color={Colors.light.text} />
                </View>
                <View style={styles.techIdentity}>
                  <Text style={styles.techName}>{worker.name}</Text>
                  <Text style={styles.techSpecialty} numberOfLines={2}>
                    {worker.services.map((service) => service.name).join(' · ')}
                  </Text>
                  <View style={styles.verifiedRow}>
                    <MaterialIcons name="verified" size={13} color="#24734A" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel={isFavorite ? `Remove ${worker.name} from saved technicians` : `Save ${worker.name}`}
                  accessibilityRole="button"
                  accessibilityState={{ checked: isFavorite }}
                  hitSlop={8}
                  onPress={() => toggleFavorite(worker.id)}
                  style={styles.favoriteButton}
                >
                  <MaterialIcons name={isFavorite ? 'favorite' : 'favorite-border'} size={22} color={isFavorite ? '#B42318' : Colors.light.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.stats}>
                <View style={styles.ratingPill}>
                  <MaterialIcons name="star" size={15} color="#C27B00" />
                  <Text style={styles.ratingText}>{worker.averageRating.toFixed(1)}/5 · {worker.reviewCount} reviews</Text>
                </View>
                <Text style={styles.statDivider}>·</Text>
                <Text style={styles.statText}>{worker.completedJobsCount} jobs</Text>
                <Text style={styles.statDivider}>·</Text>
                <Text style={styles.statText}>{worker.experienceYears} yrs experience</Text>
              </View>

              <View style={styles.workerMeta}>
                <Text style={styles.workerDistrict}>{worker.district}</Text>
                <View style={[
                  styles.availabilityBadge,
                  worker.availabilityStatus === 'available'
                    ? styles.availabilityAvailable
                    : worker.availabilityStatus === 'busy'
                      ? styles.availabilityBusy
                      : styles.availabilityOffline,
                ]}>
                  <Text style={styles.availabilityText}>{availabilityLabel}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.rateCopy}>
                  <Text style={styles.rateLabel}>{rateParts.join(' · ') || 'Rate not set'}</Text>
                  {worker.ratesNegotiable ? <Text style={styles.rateNegotiable}>Rate negotiable</Text> : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => select(worker.id)}
                  style={({ pressed }) => [styles.bookButton, pressed && styles.pressed]}
                >
                  <Text style={styles.bookText}>View details</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={Colors.light.text} />
                </Pressable>
              </View>
            </View>
          );
        })}

        {!loading && !error && filteredWorkers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name={favoritesOnly ? 'favorite-border' : 'search-off'} size={28} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>
              {!targetDistrictName ? 'Location needed' : 'No matching workers yet'}
            </Text>
            <Text style={styles.emptyText}>
              {!targetDistrictName
                ? 'Allow location access to find professionals in your area.'
                : `There are no verified workers for ${activeSpecialty === 'All' ? 'this service' : activeSpecialty} in ${[requestedDistrictName || targetDistrictName, requestedStateName].filter(Boolean).join(', ')} yet.`}
            </Text>
            {!targetDistrictName ? (
              <Pressable
                accessibilityRole="button"
                disabled={locationLoading}
                onPress={() => { void refreshLocation(); }}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>{locationLoading ? 'Finding location…' : 'Try again'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: 28 },
  hero: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, backgroundColor: Colors.light.text },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' },
  locationText: { color: '#E5EAF1', fontSize: 12, fontWeight: '500' },
  title: { marginTop: 16, color: Colors.light.backgroundElement, fontSize: 25, fontWeight: '800' },
  subtitle: { marginTop: 6, color: '#D6DFEA', fontSize: 13, lineHeight: 19 },
  searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 17, paddingHorizontal: 13, borderRadius: 12, backgroundColor: Colors.light.backgroundElement },
  searchInput: { flex: 1, paddingVertical: 11, color: Colors.light.text, fontSize: 14 },
  requestBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 20, marginTop: 17, padding: 13, borderWidth: 1, borderColor: '#F2E2C5', borderRadius: 12, backgroundColor: '#FFF9EE' },
  requestText: { color: Colors.light.textSecondary, fontSize: 13 },
  requestStrong: { color: Colors.light.text, fontWeight: '700' },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginHorizontal: 20, marginBottom: 10 },
  sectionTitle: { color: Colors.light.text, fontSize: 17, fontWeight: '700' },
  sortButton: { minHeight: 33, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 17, backgroundColor: Colors.light.backgroundElement },
  sortButtonSelected: { borderColor: Colors.light.backgroundSelected, backgroundColor: '#FFF2DE' },
  sortText: { color: Colors.light.textSecondary, fontSize: 11, fontWeight: '600' },
  sortTextSelected: { color: Colors.light.text },
  filters: { gap: 8, paddingHorizontal: 20, paddingBottom: 17 },
  filterChip: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 13, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 18, backgroundColor: Colors.light.backgroundElement },
  filterChipSelected: { borderColor: Colors.light.text, backgroundColor: Colors.light.text },
  filterText: { color: Colors.light.textSecondary, fontSize: 12, fontWeight: '600' },
  filterTextSelected: { color: Colors.light.backgroundElement },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 12 },
  resultCount: { color: Colors.light.textSecondary, fontSize: 12 },
  liveStatus: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 11 },
  refreshNotice: { marginHorizontal: 20, marginBottom: 12, padding: 13, borderRadius: 12, backgroundColor: Colors.light.backgroundElement },
  card: { marginHorizontal: 20, marginBottom: 13, padding: 16, borderWidth: 1, borderColor: '#EDF1F5', borderRadius: 17, backgroundColor: Colors.light.backgroundElement, elevation: 2, shadowColor: Colors.light.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#FFF2DE' },
  techIdentity: { flex: 1, marginLeft: 12 },
  techName: { color: Colors.light.text, fontSize: 16, fontWeight: '700' },
  techSpecialty: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 13 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  verifiedText: { color: '#24734A', fontSize: 10, fontWeight: '700' },
  favoriteButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 15 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFF2DE' },
  ratingText: { color: Colors.light.text, fontSize: 12, fontWeight: '700' },
  statDivider: { color: '#A0AAB8', fontSize: 15 },
  statText: { color: Colors.light.textSecondary, fontSize: 12 },
  workerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  workerDistrict: { color: Colors.light.textSecondary, fontSize: 12 },
  availabilityBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  availabilityAvailable: { backgroundColor: '#E8F5EC' },
  availabilityBusy: { backgroundColor: '#FFF4D6' },
  availabilityOffline: { backgroundColor: '#EFF3F8' },
  availabilityText: { color: Colors.light.text, fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E8EDF2' },
  rateCopy: { flex: 1, paddingRight: 8 },
  rateLabel: { color: Colors.light.textSecondary, fontSize: 11 },
  rateNegotiable: { marginTop: 4, color: Colors.light.backgroundSelected, fontSize: 10, fontWeight: '700' },
  bookButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.light.backgroundSelected },
  bookText: { color: Colors.light.text, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  emptyState: { alignItems: 'center', marginHorizontal: 20, marginTop: 18, padding: 24, borderRadius: 17, backgroundColor: Colors.light.backgroundElement },
  emptyIcon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: '#EFF3F8' },
  emptyTitle: { marginTop: 13, color: Colors.light.text, fontSize: 16, fontWeight: '700' },
  emptyText: { marginTop: 6, color: Colors.light.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  resetButton: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFF2DE' },
  resetText: { color: Colors.light.text, fontSize: 13, fontWeight: '700' },
});
