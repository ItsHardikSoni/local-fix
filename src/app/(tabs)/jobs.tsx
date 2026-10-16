import { useLocalSearchParams } from 'expo-router';
import { Alert, View, Text, Button } from 'react-native';
import { technicians } from '../../data/technicians';
import { Colors } from '../../constants/theme';
export default function Job() {
  const { techId, type, desc } = useLocalSearchParams();
  const tech = technicians.find(t => t.id === Number(techId));

  const onConfirm = () => {
    Alert.alert('Payment unavailable', 'The payment screen is not available yet.');
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
      <Button title="View payment options" onPress={onConfirm} color={Colors.light.backgroundSelected} />
    </View>
  );
}
