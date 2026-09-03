import { useEffect, useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { PrimaryButton } from '@/components/primary-button';
import { Segmented } from '@/components/segmented';
import { TextPromptModal } from '@/components/text-prompt-modal';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { supabase } from '@/lib/supabase';
import { adjustAccountBalance, bumpBudgetSpend } from '@/lib/finance';
import { formatAmountInput, formatMoney, parseAmount, formatDate } from '@/lib/money';
import { queryKeys } from '@/lib/queries';
import { colors, radius, spacing, typography } from '@/theme';
import type { Account, TransactionType, UserCategory } from '@/types/models';

const DEFAULTS = ['Comida', 'Transporte', 'Servicios', 'Salud', 'General'];

export default function AddTransactionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { region } = useRegion();
  const params = useLocalSearchParams();
  const editId = params.editId as string | undefined;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState((params.accountId as string) || '');
  const [type, setType] = useState<TransactionType>((params.type as TransactionType) || 'expense');
  const [amount, setAmount] = useState(params.amount ? formatAmountInput(String(params.amount), region) : '');
  const [concept, setConcept] = useState((params.concept as string) || '');
  const [installments, setInstallments] = useState('');
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [category, setCategory] = useState((params.category as string) || 'General');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: acc }, { data: cats }] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('user_categories').select('*').eq('user_id', user.id),
      ]);
      const list = (acc as Account[]) || [];
      setAccounts(list);
      if (!accountId && list[0]) setAccountId(list[0].id);

      if (cats && cats.length > 0) {
        setCategories(cats as UserCategory[]);
        setCategory((prev) => (cats.some((c) => c.name === prev) ? prev : cats[0].name));
        return;
      }
      await supabase.from('user_categories').insert(DEFAULTS.map((name) => ({ user_id: user.id, name })));
      const { data: next } = await supabase.from('user_categories').select('*').eq('user_id', user.id);
      setCategories((next as UserCategory[]) || []);
    })();
  }, [user]);

  if (!authLoading && !user) return <Redirect href="/login" />;

  const selected = accounts.find((a) => a.id === accountId);
  const accountType = selected?.type || (params.accountType as string | undefined);

  const handleSave = async () => {
    if (!amount || !concept) {
      Alert.alert('Falta información', 'Monto y concepto son obligatorios.');
      return;
    }
    if (!accountId) {
      Alert.alert('Cuenta', 'No hay cuenta seleccionada.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const numAmount = parseAmount(amount, region.fractionDigits);
      if (numAmount <= 0) throw new Error('El monto debe ser mayor a 0.');
      const delta = type === 'expense' ? -numAmount : numAmount;

      if (editId) {
        const old = parseAmount(String(params.amount ?? '0'), region.fractionDigits);
        const oldDelta = params.type === 'expense' ? -old : old;
        const { error } = await supabase
          .from('transactions')
          .update({ type, amount: numAmount, concept, category_name: category, account_id: accountId })
          .eq('id', editId);
        if (error) throw error;
        await adjustAccountBalance(accountId, delta - oldDelta);
        if (params.type === 'expense') {
          await bumpBudgetSpend(user.id, String(params.category || ''), -old);
        }
        if (type === 'expense') await bumpBudgetSpend(user.id, category, numAmount);
      } else {
        const { data: newTx, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: accountId,
            type,
            amount: numAmount,
            concept,
            category_name: category,
            date: date.toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        await adjustAccountBalance(accountId, delta);
        if (type === 'expense') await bumpBudgetSpend(user.id, category, numAmount);

        if (accountType?.toLowerCase() === 'crédito' && type === 'expense' && newTx) {
          let n = parseInt(installments, 10);
          if (!n || n < 1) n = 1;
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const { error: billError } = await supabase.from('bills').insert({
            user_id: user.id,
            name: n > 1 ? `${concept} (${n} cuotas)` : concept,
            amount: Math.round(numAmount / n),
            next_payment: nextMonth.toISOString(),
            color: colors.gold,
            total_installments: n,
            current_installment: 1,
            account_id: accountId,
            transaction_id: newTx.id,
          });
          if (billError) throw new Error(billError.message);
        }
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets(user.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bills(user.id) });
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title={editId ? 'Editar movimiento' : 'Nuevo movimiento'} onClose={() => router.back()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Segmented
            value={type}
            onChange={setType}
            options={[
              { value: 'expense', label: 'Gasto' },
              { value: 'income', label: 'Ingreso' },
            ]}
            activeColor={type === 'income' ? colors.accentDim : colors.elevated}
          />

          <View style={styles.amountRow}>
            <Text style={[styles.sym, type === 'income' && { color: colors.accent }]}>{region.currencySymbol}</Text>
            <TextInput
              style={[styles.amount, type === 'income' && { color: colors.accent }]}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(t) => setAmount(formatAmountInput(t, region))}
              autoFocus
            />
          </View>

          <Text style={styles.label}>Concepto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Mercado, Nómina…"
            placeholderTextColor={colors.muted}
            value={concept}
            onChangeText={setConcept}
          />

          {!editId && (
            <>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.text, fontFamily: typography.regular }}>
                  {date.toLocaleDateString(region.locale, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
            </>
          )}

          {accountType === 'Crédito' && type === 'expense' && !editId ? (
            <>
              <Text style={styles.label}>Cuotas</Text>
              <TextInput
                style={styles.input}
                placeholder="1, 6, 12…"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={installments}
                onChangeText={setInstallments}
              />
            </>
          ) : null}

          <Text style={styles.label}>Cuenta</Text>
          {accounts.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.account, accountId === a.id && styles.accountOn]}
              onPress={() => setAccountId(a.id)}
            >
              <Text style={styles.accountName}>{a.name}</Text>
              <Text style={styles.accountBal}>{formatMoney(a.balance || 0, region)}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, category === cat.name && styles.pillOn]}
                onPress={() => setCategory(cat.name)}
                onLongPress={() => {
                  Alert.alert('Eliminar categoría', cat.name, [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: async () => {
                        await supabase.from('user_categories').delete().eq('id', cat.id);
                        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                      },
                    },
                  ]);
                }}
              >
                <Text style={[styles.pillText, category === cat.name && styles.pillTextOn]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.pill, styles.pillDash]} onPress={() => setPromptOpen(true)}>
              <Text style={styles.pillText}>+ Nueva</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={{ height: 28 }} />
        </ScrollView>

        <PrimaryButton
          label={type === 'expense' ? 'Guardar gasto' : 'Guardar ingreso'}
          onPress={handleSave}
          loading={loading}
          color={type === 'expense' ? colors.white : colors.accent}
          style={{ marginBottom: spacing.md }}
        />
      </KeyboardAvoidingView>

      <TextPromptModal
        visible={promptOpen}
        title="Nueva categoría"
        placeholder="Nombre"
        onClose={() => setPromptOpen(false)}
        onSubmit={async (name) => {
          setPromptOpen(false);
          if (!user) return;
          await supabase.from('user_categories').insert({ user_id: user.id, name });
          const { data } = await supabase.from('user_categories').select('*').eq('user_id', user.id);
          setCategories((data as UserCategory[]) || []);
          setCategory(name);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 28 },
  sym: { fontSize: 36, color: colors.text, marginRight: 6, fontWeight: '300', fontFamily: typography.medium },
  amount: { fontSize: 48, fontWeight: '800', color: colors.text, minWidth: 80, textAlign: 'center', fontFamily: typography.bold },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
    fontFamily: typography.bold,
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
    marginBottom: 8,
    fontFamily: typography.regular,
  },
  account: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountOn: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  accountName: { color: colors.text, fontWeight: '600', fontFamily: typography.semiBold },
  accountBal: { color: colors.muted, fontSize: 13, fontFamily: typography.regular },
  pill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillOn: { borderColor: colors.border, backgroundColor: colors.elevated },
  pillDash: { borderColor: colors.border, borderStyle: 'dashed' },
  pillText: { color: colors.muted, fontWeight: '600', fontFamily: typography.semiBold },
  pillTextOn: { color: colors.text },
});
