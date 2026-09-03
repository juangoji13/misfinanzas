import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RegionConfig } from '@/config/regions';
import { formatDate, formatMoney } from '@/lib/money';
import { colors, radius } from '@/theme';
import type { Transaction } from '@/types/models';

export function TxRow({
  item,
  region,
  onPress,
  onLongPress,
}: {
  item: Transaction;
  region: RegionConfig;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const income = item.type === 'income';
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onLongPress}>
      <View style={[styles.icon, { backgroundColor: income ? colors.accentDim : colors.surface2 }]}>
        <Ionicons name={income ? 'arrow-down' : 'arrow-up'} size={18} color={income ? colors.accent : colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.concept}</Text>
        <Text style={styles.sub}>
          {item.category_name || 'General'} · {formatDate(item.date || item.created_at, region)}
        </Text>
      </View>
      <Text style={[styles.amt, income && { color: colors.accent }]}>
        {income ? '+' : '−'}
        {formatMoney(Math.abs(item.amount || 0), region)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 3 },
  amt: { color: colors.text, fontWeight: '800', fontSize: 15 },
});
