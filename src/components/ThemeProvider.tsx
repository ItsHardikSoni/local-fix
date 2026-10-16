import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { Colors } from '../constants/theme';

type ThemeProviderProps = {
  children: ReactNode;
};

export default function ThemeProvider({ children }: ThemeProviderProps) {
  // Simple wrapper that could provide theme context in the future.
  // Currently applies the background color from the theme.
  return <View style={{ flex: 1, backgroundColor: Colors.light.background }}>{children}</View>;
}
