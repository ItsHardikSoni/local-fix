import { useRouter } from 'expo-router';
import { ScrollView, View, Text, Button } from 'react-native';
import { technicians } from '../data/technicians';
import { useUser } from '../context/UserContext';
import { Colors } from '../constants/theme';

export default function Technicians() {
  const router = useRouter();
  const { district } = useUser();
  const filtered = technicians.filter(t => t.district === district);

  const select = (tech: typeof technicians[0]) => {
    router.push({
      pathname: '/job',
      params: { techId: tech.id, type: tech.specialty, desc: '' }, // placeholder desc
    });
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.light.text, marginBottom: 12 }}>
        Technicians in {district}
      </Text>
      {filtered.map(t => (
        <View key={t.id} style={{ backgroundColor: Colors.light.backgroundElement, padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={{ color: Colors.light.text, fontSize: 16, fontWeight: '600' }}>{t.name}</Text>
          <Text style={{ color: Colors.light.textSecondary }}>{t.specialty}</Text>
          <Text style={{ color: Colors.light.textSecondary }}>₹{t.pricePerHour}/hr • ★{t.rating}</Text>
          <Button title="Book" onPress={() => select(t)} color={Colors.light.backgroundSelected} />
        </View>
      ))}
      {filtered.length === 0 && (
        <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.light.textSecondary }}>
          No technicians found in your district.
        </Text>
      )}
    </ScrollView>
  );
}
