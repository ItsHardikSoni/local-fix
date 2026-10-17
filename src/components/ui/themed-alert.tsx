import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Colors } from '../../constants/theme';

type ThemedAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
};

export default function ThemedAlert({
  visible,
  title,
  message,
  actionLabel,
  onAction,
  onClose,
  cancelLabel,
  onCancel,
}: ThemedAlertProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close dialog"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="info-outline" size={26} color={Colors.light.backgroundSelected} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {cancelLabel && onCancel ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={({ pressed }) => [styles.cancelAction, pressed && styles.actionPressed]}
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={onAction}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(12, 27, 51, 0.56)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundElement,
    elevation: 12,
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  iconWrap: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderRadius: 27,
    backgroundColor: '#FFF2DE',
  },
  title: { color: Colors.light.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: {
    marginTop: 10,
    color: Colors.light.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', alignSelf: 'stretch', gap: 10, marginTop: 22 },
  action: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSelected,
  },
  cancelAction: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EFF3F8',
  },
  actionPressed: { opacity: 0.82 },
  actionText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  cancelText: { color: Colors.light.textSecondary, fontSize: 15, fontWeight: '700' },
});
