import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { PrimaryButton } from '@/components/primary-button';

export function TextPromptModal({
  visible,
  title,
  message,
  placeholder,
  confirmLabel,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  confirmLabel?: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState('');

  // Clear input when modal opens/closes
  useEffect(() => {
    if (visible) setValue('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.msg}>{message}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            value={value}
            onChangeText={setValue}
            autoFocus
          />
          <PrimaryButton
            label={confirmLabel ?? 'Guardar'}
            onPress={() => {
              const t = value.trim();
              setValue('');
              if (t) onSubmit(t);
              else onClose();
            }}
          />
          <TouchableOpacity
            onPress={() => {
              setValue('');
              onClose();
            }}
            style={styles.cancel}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  msg: {
    color: colors.muted,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  cancel: {
    alignItems: 'center',
    marginTop: 14,
  },
  cancelText: {
    color: colors.muted,
    fontWeight: '600',
  },
});
