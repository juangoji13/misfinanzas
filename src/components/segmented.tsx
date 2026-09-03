import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '@/theme';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  activeColor,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  activeColor?: string;
}) {
  return (
    <View style={styles.switch}>
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.btn, on && { backgroundColor: activeColor || colors.elevated }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.text, on && styles.textOn]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  text: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  textOn: { color: colors.text },
});
