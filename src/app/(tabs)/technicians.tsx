import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { technicians } from '../../data/technicians';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../constants/theme';

const specialties = ['All', 'Plumber', 'Electrician', 'AC Technician'];

export default function Technicians() {
  const router = useRouter();
  const { district } = useUser();
  const { type: issueType, desc: issueDescription, latitude, longitude } = useLocalSearchParams<{
    type?: string;
    desc?: string;
    latitude?: string;
    longitude?: string;
  }>();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [topRatedFirst, setTopRatedFirst] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const filteredTechnicians = useMemo(() => {
    const query = search.trim().toLowerCase();
    return technicians
      .filter((tech) => tech.district === district)
      .filter((tech) => specialty === 'All' || tech.specialty === specialty)
      .filter((tech) => !favoritesOnly || favoriteIds.includes(tech.id))
      .filter((tech) => !query || `${tech.name} ${tech.specialty}`.toLowerCase().includes(query))
      .sort((left, right) => topRatedFirst ? right.rating - left.rating : left.name.localeCompare(right.name));
  }, [district, favoriteIds, favoritesOnly, search, specialty, topRatedFirst]);

  const select = (tech: typeof technicians[number]) => {
    router.push({
      pathname: '/jobs',
      params: {
        techId: String(tech.id),
        type: typeof issueType === 'string' && issueType ? issueType : tech.specialty,
        desc: typeof issueDescription === 'string' ? issueDescription : '',
        latitude: typeof latitude === 'string' ? latitude : '',
        longitude: typeof longitude === 'string' ? longitude : '',
      },
    });
  };

  const toggleFavorite = (id: number) => {
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
          <View style={styles.locationPill}>
            <MaterialIcons name="location-on" size={16} color={Colors.light.backgroundSelected} />
            <Text style={styles.locationText}>{district}, Bihar</Text>
          </View>
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
            const selected = specialty === item;
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
          <Text style={styles.sectionTitle}>Available professionals</Text>
          <Text style={styles.resultCount}>{filteredTechnicians.length} found</Text>
        </View>

        {filteredTechnicians.map((tech) => {
          const isFavorite = favoriteIds.includes(tech.id);
          return (
            <View key={tech.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <MaterialIcons name="person" size={28} color={Colors.light.text} />
                </View>
                <View style={styles.techIdentity}>
                  <Text style={styles.techName}>{tech.name}</Text>
                  <Text style={styles.techSpecialty}>{tech.specialty}</Text>
                </View>
                <Pressable
                  accessibilityLabel={isFavorite ? `Remove ${tech.name} from saved technicians` : `Save ${tech.name}`}
                  accessibilityRole="button"
                  accessibilityState={{ checked: isFavorite }}
                  hitSlop={8}
                  onPress={() => toggleFavorite(tech.id)}
                  style={styles.favoriteButton}
                >
                  <MaterialIcons name={isFavorite ? 'favorite' : 'favorite-border'} size={22} color={isFavorite ? '#B42318' : Colors.light.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.stats}>
                <View style={styles.ratingPill}>
                  <MaterialIcons name="star" size={15} color="#C27B00" />
                  <Text style={styles.ratingText}>{tech.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.statDivider}>·</Text>
                <Text style={styles.statText}>In {tech.district}</Text>
                <Text style={styles.statDivider}>·</Text>
                <Text style={styles.statText}>₹{tech.pricePerHour}/hr</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.rateLabel}>Transparent hourly rate</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => select(tech)}
                  style={({ pressed }) => [styles.bookButton, pressed && styles.pressed]}
                >
                  <Text style={styles.bookText}>View details</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={Colors.light.text} />
                </Pressable>
              </View>
            </View>
          );
        })}

        {filteredTechnicians.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name={favoritesOnly ? 'favorite-border' : 'search-off'} size={28} color={Colors.light.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No matches just yet</Text>
            <Text style={styles.emptyText}>Try another search or service filter to see available professionals.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSearch('');
                setSpecialty('All');
                setFavoritesOnly(false);
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>Clear filters</Text>
            </Pressable>
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
  card: { marginHorizontal: 20, marginBottom: 13, padding: 16, borderWidth: 1, borderColor: '#EDF1F5', borderRadius: 17, backgroundColor: Colors.light.backgroundElement, elevation: 2, shadowColor: Colors.light.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#FFF2DE' },
  techIdentity: { flex: 1, marginLeft: 12 },
  techName: { color: Colors.light.text, fontSize: 16, fontWeight: '700' },
  techSpecialty: { marginTop: 4, color: Colors.light.textSecondary, fontSize: 13 },
  favoriteButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFF2DE' },
  ratingText: { color: Colors.light.text, fontSize: 12, fontWeight: '700' },
  statDivider: { color: '#A0AAB8', fontSize: 15 },
  statText: { color: Colors.light.textSecondary, fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E8EDF2' },
  rateLabel: { color: Colors.light.textSecondary, fontSize: 11 },
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
