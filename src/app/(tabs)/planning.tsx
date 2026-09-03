import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Skeleton } from '@/components/skeleton';
import { TextPromptModal } from '@/components/text-prompt-modal';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { supabase } from '@/lib/supabase';
import { contributeToGoal, payBill } from '@/lib/finance';
import { formatDate, formatMoney, parseAmount } from '@/lib/money';
import { useAccountsQuery, useBillsQuery, useBudgetsQuery, useGoalsQuery, queryKeys } from '@/lib/queries';
import { colors, radius, spacing, typography } from '@/theme';
import { EmptyState } from '@/components/ui/empty-state';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import type { Goal } from '@/types/models';

type Tab = 'Gastos' | 'Metas' | 'Presupuestos';

export default function PlanningScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { region } = useRegion();
  const [tab, setTab] = useState<Tab>('Gastos');

  const { data: accounts = [] } = useAccountsQuery(user?.id);
  const { data: bills = [], isLoading: loadingBills } = useBillsQuery(user?.id);
  const { data: goals = [], isLoading: loadingGoals } = useGoalsQuery(user?.id);
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgetsQuery(user?.id);

  const [goalForContribute, setGoalForContribute] = useState<Goal | null>(null);
  const [contributionAccountId, setContributionAccountId] = useState<string | null>(null);

  const remove = (table: 'bills' | 'goals' | 'budgets', id: string, label: string) => {
    Alert.alert('Eliminar', label, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from(table).delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else queryClient.invalidateQueries({ queryKey: queryKeys[table](user?.id || '') });
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión</Text>
        <AnimatedButton onPress={() => router.push('/add-plan')}>
          <View style={styles.add}>
            <Ionicons name="add" size={22} color={colors.accent} />
          </View>
        </AnimatedButton>
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'Gastos', label: 'Cuotas' },
          { value: 'Metas', label: 'Metas' },
          { value: 'Presupuestos', label: 'Límites' },
        ]}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}>
        {tab === 'Gastos' && (
          <>
            {loadingBills ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={110} borderRadius={radius.md} />
                <Skeleton height={110} borderRadius={radius.md} />
              </View>
            ) : bills.length === 0 ? (
              <EmptyState 
                title="Sin cuotas pendientes" 
                description="Un gasto a crédito con cuotas aparecerá aquí. Mantén pulsado para borrar." 
                icon="card-outline" 
              />
            ) : (
              bills.map((item) => (
                <AnimatedButton
                  key={item.id}
                  onLongPress={() => remove('bills', item.id, item.name)}
                  style={{ marginBottom: 12 }}
                >
                  <GlassCard colors={[item.color || colors.gold, (item.color || colors.gold) + '20']}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardAmt}>{formatMoney(item.amount || 0, region)}</Text>
                    <Text style={styles.cardMeta}>
                      Próximo {formatDate(item.next_payment, region)}
                      {item.total_installments ? ` · ${item.current_installment}/${item.total_installments}` : ''}
                    </Text>
                    <AnimatedButton
                      style={styles.pay}
                      onPress={async () => {
                        if (!user) return;
                        try {
                          await payBill(user.id, item);
                          queryClient.invalidateQueries({ queryKey: queryKeys.bills(user?.id || '') });
                          queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user?.id || '') });
                          queryClient.invalidateQueries({ queryKey: queryKeys.budgets(user?.id || '') });
                        } catch (e: unknown) {
                          Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo pagar');
                        }
                      }}
                    >
                      <Text style={styles.payText}>Registrar pago</Text>
                    </AnimatedButton>
                  </GlassCard>
                </AnimatedButton>
              ))
            )}
          </>
        )}
        {tab === 'Metas' && (
          <>
            {loadingGoals ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={110} borderRadius={radius.md} />
                <Skeleton height={110} borderRadius={radius.md} />
              </View>
            ) : goals.length === 0 ? (
              <EmptyState 
                title="Crea tu primera meta" 
                description="Usa el + de arriba. Luego toca la meta para aportar dinero." 
                icon="flag-outline" 
              />
            ) : (
              goals.map((item) => {
                const p = item.target_amount ? Math.min(100, (item.current_amount / item.target_amount) * 100) : 0;
                return (
                  <AnimatedButton
                    key={item.id}
                    style={{ marginBottom: 12 }}
                    onPress={() => {
                      if (accounts.length === 0) {
                        Alert.alert('Cuenta', 'Crea una cuenta antes de aportar.');
                        return;
                      }
                      if (accounts.length === 1) {
                        setContributionAccountId(accounts[0].id);
                        setGoalForContribute(item);
                        return;
                      }
                      Alert.alert(
                        'Elegir cuenta',
                        '¿Desde qué cuenta quieres aportar?',
                        [
                          ...accounts.map((a) => ({
                            text: a.name,
                            onPress: () => {
                              setContributionAccountId(a.id);
                              setGoalForContribute(item);
                            },
                          })),
                          { text: 'Cancelar', style: 'cancel' as const },
                        ],
                      );
                    }}
                    onLongPress={() => remove('goals', item.id, item.name)}
                  >
                    <GlassCard colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <Text style={styles.cardAmt}>
                        {formatMoney(item.current_amount || 0, region)} / {formatMoney(item.target_amount || 0, region)}
                      </Text>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${p}%`, backgroundColor: item.color || colors.accent }]} />
                      </View>
                      <Text style={styles.cardMeta}>Toca para aportar · mantén para eliminar</Text>
                    </GlassCard>
                  </AnimatedButton>
                );
              })
            )}
          </>
        )}
        {tab === 'Presupuestos' && (
          <>
            {loadingBudgets ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={110} borderRadius={radius.md} />
                <Skeleton height={110} borderRadius={radius.md} />
              </View>
            ) : budgets.length === 0 ? (
              <EmptyState 
                title="Sin límites de gasto" 
                description="Agrega un presupuesto con el mismo nombre de una categoría para controlarlo." 
                icon="pie-chart-outline" 
              />
            ) : (
              budgets.map((item) => {
                const p = item.total_amount ? Math.min(100, (item.spent_amount / item.total_amount) * 100) : 0;
                return (
                  <AnimatedButton
                    key={item.id}
                    style={{ marginBottom: 12 }}
                    onLongPress={() => remove('budgets', item.id, item.name)}
                  >
                    <GlassCard colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      <Text style={styles.cardAmt}>
                        {formatMoney(item.spent_amount || 0, region)} / {formatMoney(item.total_amount || 0, region)}
                      </Text>
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.fill,
                            {
                              width: `${p}%`,
                              backgroundColor: p > 90 ? colors.danger : item.color || colors.accent,
                            },
                          ]}
                        />
                      </View>
                    </GlassCard>
                  </AnimatedButton>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <TextPromptModal
        visible={!!goalForContribute}
        title={goalForContribute ? `Aportar a ${goalForContribute.name}` : ''}
        message={contributionAccountId ? `Se descuenta de ${accounts.find((a) => a.id === contributionAccountId)?.name ?? 'tu cuenta'}.` : undefined}
        placeholder="Monto"
        confirmLabel="Aportar"
        onClose={() => { setGoalForContribute(null); setContributionAccountId(null); }}
        onSubmit={async (raw) => {
          if (!user || !goalForContribute || !contributionAccountId) return;
          try {
            await contributeToGoal({
              userId: user.id,
              goal: goalForContribute,
              accountId: contributionAccountId,
              amount: parseAmount(raw, region.fractionDigits),
            });
            setGoalForContribute(null);
            setContributionAccountId(null);
            queryClient.invalidateQueries({ queryKey: queryKeys.goals(user?.id || '') });
            queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user?.id || '') });
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo aportar');
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', fontFamily: typography.bold },
  add: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { color: colors.muted, lineHeight: 20, fontFamily: typography.medium },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardName: { color: colors.text, fontWeight: '700', fontSize: 16, fontFamily: typography.bold },
  cardAmt: { color: colors.text, fontWeight: '800', fontSize: 18, marginTop: 6, fontFamily: typography.bold },
  cardMeta: { color: colors.muted, marginTop: 6, fontSize: 13, fontFamily: typography.regular },
  track: { height: 6, backgroundColor: colors.surface2, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  pay: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: colors.goldDim,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  payText: { color: colors.gold, fontWeight: '700', fontSize: 13, fontFamily: typography.bold },
});
