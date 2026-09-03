import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';
import { Segmented } from '@/components/segmented';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { supabase } from '@/lib/supabase';
import { formatAmountInput, formatMoney, parseAmount } from '@/lib/money';
import { accountPalette, colors, radius, spacing } from '@/theme';

export default function AddAccountScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { region } = useRegion();
  const params = useLocalSearchParams();
  const editId = params.editId as string | undefined;
  const [name, setName] = useState((params.editName as string) || '');
  const [category, setCategory] = useState<'Cuenta' | 'Tarjeta'>((params.editCategory as 'Cuenta' | 'Tarjeta') || 'Cuenta');
  const [type, setType] = useState((params.editType as string) || 'Ahorros');
  const [balance, setBalance] = useState(
    params.editBalance ? formatAmountInput(String(params.editBalance), region) : ''
  );
  const [digits, setDigits] = useState((params.editDigits as string) || '');
  const [color, setColor] = useState((params.editColor as string) || colors.accent);
  const [loading, setLoading] = useState(false);

  if (!authLoading && !user) return <Redirect href="/login" />;

  const types = category === 'Cuenta' ? ['Ahorros', 'Corriente', 'Efectivo'] : ['Débito', 'Crédito'];
  const preview = parseAmount(balance, region.fractionDigits);

  const save = async () => {
    if (!name) {
      Alert.alert('Nombre', 'Ponle un nombre al producto.');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        type,
        balance: parseAmount(balance, region.fractionDigits),
        color,
        last_digits: digits.replace(/\D/g, '').slice(-4) || null,
      };
      if (editId) {
        const { error } = await supabase.from('accounts').update(payload).eq('id', editId);
        if (error) {
          delete payload.last_digits;
          const { error: retry } = await supabase.from('accounts').update(payload).eq('id', editId);
          if (retry) throw retry;
        }
      } else {
        const insert: Record<string, unknown> = { ...payload, user_id: user.id };
        const { error } = await supabase.from('accounts').insert(insert);
        if (error) {
          delete insert.last_digits;
          const { error: retry } = await supabase.from('accounts').insert(insert);
          if (retry) throw retry;
        }
      }
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={editId ? 'Editar producto' : 'Nuevo producto'} onClose={() => router.back()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Segmented
            value={category}
            onChange={(c) => {
              setCategory(c);
              setType(c === 'Cuenta' ? 'Ahorros' : 'Débito');
            }}
            options={[
              { value: 'Cuenta', label: 'Cuenta' },
              { value: 'Tarjeta', label: 'Tarjeta' },
            ]}
          />

          <View style={[styles.preview, { borderColor: color }]}>
            <View style={[styles.orb, { backgroundColor: color }]} />
            <Text style={styles.prevType}>
              {category} · {type}
            </Text>
            <Text style={styles.prevBal}>{formatMoney(preview, region)}</Text>
            <Text style={styles.prevName}>{name || 'Nombre del producto'}</Text>
          </View>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder={category === 'Cuenta' ? 'Ahorros Bancolombia' : 'Tarjeta Nu'}
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>{category === 'Cuenta' ? 'Saldo actual' : 'Cupo / saldo'}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={balance}
            onChangeText={(t) => setBalance(formatAmountInput(t, region))}
          />

          <Text style={styles.label}>Últimos 4 dígitos (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="4092"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={4}
            value={digits}
            onChangeText={setDigits}
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.switch}>
            {types.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.switchBtn, type === t && styles.switchOn]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.switchText, type === t && styles.switchTextOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Color</Text>
          <View style={styles.colors}>
            {accountPalette.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.dot, { backgroundColor: c }, color === c && styles.dotOn]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
        <PrimaryButton
          label="Guardar"
          onPress={save}
          loading={loading}
          color={color === colors.white ? colors.white : color}
          style={{ marginBottom: spacing.md }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 168,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    padding: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 24,
  },
  orb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -40,
    top: -50,
    opacity: 0.22,
  },
  prevType: { color: colors.muted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' },
  prevBal: { color: colors.text, fontSize: 32, fontWeight: '800', marginVertical: 6 },
  prevName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    marginBottom: 16,
  },
  switch: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  switchOn: { backgroundColor: colors.elevated },
  switchText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  switchTextOn: { color: colors.text },
  colors: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  dot: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'transparent' },
  dotOn: { borderColor: colors.text },
});
