import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function Report() {
  const router = useRouter();
  const [type, setType] = useState('Water Leak');
  const [desc, setDesc] = useState('');

  const onSubmit = () => {
    router.push({
      pathname: '/technicians',
      params: { type, desc },
    });
  };

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <Text style={{ color: Colors.light.text, fontSize: 20, fontWeight: 'bold' }}>
        Report Issue
      </Text>
      <TextInput
        placeholder="Issue type (e.g., Water Leak)"
        value={type}
        onChangeText={setType}
        style={{ borderWidth: 1, borderColor: Colors.light.backgroundElement, padding: 8, borderRadius: 4, backgroundColor: Colors.light.backgroundElement, color: Colors.light.text }}
      />
      <TextInput
        placeholder="Describe the problem"
        value={desc}
        onChangeText={setDesc}
        multiline
        numberOfLines={4}
        style={{ borderWidth: 1, borderColor: Colors.light.backgroundElement, padding: 8, borderRadius: 4, backgroundColor: Colors.light.backgroundElement, color: Colors.light.text }}
      />
      <Button title="Find Technicians" onPress={onSubmit} color={Colors.light.backgroundSelected} />
    </View>
  );
}
