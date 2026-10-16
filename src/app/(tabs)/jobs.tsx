import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Button } from 'react-native';
import { technicians } from '../../data/technicians';
import { Colors } from '../../constants/theme';
export default function Job() {
  const { techId, type, desc } = useLocalSearchParams();
  const router = useRouter();
  const tech = technicians.find(t => t.id === Number(techId));

  const onConfirm = () => {
    // In a real app you'd submit the job to backend here.
    router.push('/payment');
  };

  if (!tech) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: Colors.light.textSecondary }}>Technician not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: Colors.light.text }}>Job Details</Text>
      <Text>Issue: {type}</Text>
      <Text>Description: {desc}</Text>
      <Text>Technician: {tech.name} ({tech.specialty})</Text>
      <Text>Rate: ₹{tech.pricePerHour}/hr</Text>
      <Button title="Confirm & Proceed to Payment" onPress={onConfirm} color={Colors.light.backgroundSelected} />
    </View>
  );
}
