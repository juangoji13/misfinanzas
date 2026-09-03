import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { supabase } from '@/lib/supabase';
import { transferFunds } from '@/lib/finance';
import { formatAmountInput, formatMoney, parseAmount } from '@/lib/money';
import { colors, radius, spacing } from '@/theme';
import type { Account } from '@/types/models';

export default function TransferScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { region } = useRegion();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        const { data } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        const list = (data as Account[]) || [];
        setAccounts(list);
        if (list[0]) setFromId((prev) => prev || list[0].id);
        if (list[1]) setToId((prev) => prev || list[1].id);
      })();
    }, [user])
  );

  if (!authLoading && !user) return <Redirect href="/login" />;

  const from = accounts.find((a) => a.id === fromId);
  const to = accounts.find((a) => a.id === toId);

  const save = async () => {
    if (!user || !from || !to) return;
    const num = parseAmount(amount, region.fractionDigits);
    setLoading(true);
    try {
      await transferFunds({
        userId: user.id,
        fromId: from.id,
        fromName: from.name,
        toId: to.id,
        toName: to.name,
        amount: num,
      });
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo transferir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Entre cuentas" onClose={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {accounts.length < 2 ? (
          <Text style={styles.hint}>Necesitas al menos dos productos para mover saldo.</Text>
        ) : (
          <>
            <Text style={styles.label}>Sale de</Text>
            <View style={styles.pills}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.pill, fromId === a.id && styles.pillOn]}
                  onPress={() => {
                    setFromId(a.id);
                    if (a.id === toId) {
                      const other = accounts.find((x) => x.id !== a.id);
                      if (other) setToId(other.id);
                    }
                  }}
                >
                  <Text style={styles.pillName}>{a.name}</Text>
                  <Text style={styles.pillBal}>{formatMoney(a.balance || 0, region)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Entra a</Text>
            <View style={styles.pills}>
              {accounts
                .filter((a) => a.id !== fromId)
                .map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.pill, toId === a.id && styles.pillOn]}
                    onPress={() => setToId(a.id)}
                  >
                    <Text style={styles.pillName}>{a.name}</Text>
                    <Text style={styles.pillBal}>{formatMoney(a.balance || 0, region)}</Text>
                  </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(t) => setAmount(formatAmountInput(t, region))}
            />
          </>
        )}
        <View style={{ flex: 1 }} />
        <PrimaryButton
          label="Mover saldo"
          onPress={save}
          loading={loading}
          disabled={accounts.length < 2}
          style={{ marginBottom: spacing.md }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.muted, marginTop: 12, lineHeight: 20 },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  pills: { gap: 8, marginBottom: 8 },
  pill: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillOn: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  pillName: { color: colors.text, fontWeight: '700' },
  pillBal: { color: colors.muted, marginTop: 4, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
  },
});
