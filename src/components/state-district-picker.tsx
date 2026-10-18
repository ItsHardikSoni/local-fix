import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Colors } from '../constants/theme';
import type { DistrictOption, StateOption } from '../lib/customer-addresses';

type Props = {
  states: StateOption[];
  districts: DistrictOption[];
  stateName: string;
  districtId: string;
  onStateChange: (stateName: string) => void;
  onDistrictChange: (districtId: string) => void;
  stateError?: boolean;
  districtError?: boolean;
};

export default function StateDistrictPicker({
  states,
  districts,
  stateName,
  districtId,
  onStateChange,
  onDistrictChange,
  stateError = false,
  districtError = false,
}: Props) {
  const [picker, setPicker] = useState<'state' | 'district' | null>(null);
  const availableDistricts = districts.filter((item) => item.state_name === stateName);
  const options = picker === 'state'
    ? states.map((item) => ({ value: item.state_name, label: item.state_name }))
    : availableDistricts.map((item) => ({ value: item.id, label: item.district_name }));

  return (
    <>
      <Text style={styles.label}>State</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose state"
        disabled={states.length === 0}
        onPress={() => setPicker('state')}
        style={[styles.select, stateError && styles.selectError]}
      >
        <Text style={[styles.selectText, !stateName && styles.placeholder]}>
          {stateName || 'Select your state'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={Colors.light.textSecondary} />
      </Pressable>
      {stateError ? <Text style={styles.error}>Choose your state.</Text> : null}

      <Text style={styles.label}>District</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose district"
        disabled={!stateName || availableDistricts.length === 0}
        onPress={() => setPicker('district')}
        style={[styles.select, districtError && styles.selectError, (!stateName || availableDistricts.length === 0) && styles.disabled]}
      >
        <Text style={[styles.selectText, !districtId && styles.placeholder]}>
          {availableDistricts.find((item) => item.id === districtId)?.district_name
            ?? (stateName ? 'Select your district' : 'Select a state first')}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={Colors.light.textSecondary} />
      </Pressable>
      {districtError ? <Text style={styles.error}>Choose your district.</Text> : null}

      <Modal
        animationType="slide"
        onRequestClose={() => setPicker(null)}
        transparent
        visible={picker !== null}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose {picker}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close selector"
                hitSlop={8}
                onPress={() => setPicker(null)}
              >
                <MaterialIcons name="close" size={23} color={Colors.light.text} />
              </Pressable>
            </View>
            <ScrollView>
              {options.map((item) => {
                const optionValue = item.value;
                const selectedValue = picker === 'state' ? stateName : districtId;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedValue === optionValue }}
                    key={optionValue}
                    onPress={() => {
                      if (picker === 'state') {
                        if (item.value !== stateName) onStateChange(item.value);
                      } else {
                        onDistrictChange(item.value);
                      }
                      setPicker(null);
                    }}
                    style={styles.option}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {selectedValue === optionValue ? (
                      <MaterialIcons name="check" size={20} color={Colors.light.backgroundSelected} />
                    ) : null}
                  </Pressable>
                );
              })}
              {options.length === 0 ? (
                <Text style={styles.empty}>
                  {picker === 'state'
                    ? 'No states are available. Add states in Supabase first.'
                    : 'No districts are assigned to this state yet.'}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 9, color: Colors.light.text, fontSize: 14, fontWeight: '700' },
  select: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D8E0E9', borderRadius: 12, backgroundColor: Colors.light.backgroundElement },
  selectError: { borderColor: '#B42318' },
  disabled: { opacity: 0.6 },
  selectText: { color: Colors.light.text, fontSize: 15 },
  placeholder: { color: Colors.light.textSecondary },
  error: { marginTop: -10, marginBottom: 16, color: '#B42318', fontSize: 12 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,27,51,0.45)' },
  sheet: { maxHeight: '75%', paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: Colors.light.background },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { color: Colors.light.text, fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  option: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D8E0E9' },
  optionText: { color: Colors.light.text, fontSize: 15 },
  empty: { paddingVertical: 20, color: Colors.light.textSecondary, fontSize: 14 },
});
