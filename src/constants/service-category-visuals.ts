import type { MaterialIconsIconName } from '@react-native-vector-icons/material-icons';

const categoryIcons: Record<string, MaterialIconsIconName> = {
  plumbing: 'plumbing',
  electrical: 'electrical-services',
  'air conditioning': 'ac-unit',
  'general repair': 'handyman',
  painting: 'format-paint',
  cleaning: 'cleaning-services',
  carpentry: 'carpenter',
};

export function getServiceCategoryIcon(name: string): MaterialIconsIconName {
  return categoryIcons[name.trim().toLowerCase()] ?? 'home-repair-service';
}
