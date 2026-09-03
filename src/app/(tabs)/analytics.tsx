import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { Skeleton } from '@/components/skeleton';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { useTransactionsQuery } from '@/lib/queries';
import { formatMoney } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Transaction } from '@/types/models';

type Filter = 'mes' | 'año' | 'todo';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { region } = useRegion();
  const [filter, setFilter] = useState<Filter>('mes');
  
  const { data: allTransactions = [], isLoading } = useTransactionsQuery(user?.id, 1000);

  const transactions = useMemo(() => {
    const now = new Date();
    if (filter === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return allTransactions.filter(t => new Date(t.date || t.created_at || 0).getTime() >= start);
    } else if (filter === 'año') {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      return allTransactions.filter(t => new Date(t.date || t.created_at || 0).getTime() >= start);
    }
    return allTransactions;
  }, [allTransactions, filter]);

  const expenses = transactions.filter((t) => t.type === 'expense');
  const income = transactions.filter((t) => t.type === 'income');
  const spent = expenses.reduce((s, t) => s + (t.amount || 0), 0);
  const earned = income.reduce((s, t) => s + (t.amount || 0), 0);

  const byCat = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      const k = t.category_name || 'Otros';
      map[k] = (map[k] || 0) + (t.amount || 0);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [expenses]);

  const bars = useMemo(() => {
    if (filter === 'año') {
      const months = Array.from({ length: 12 }, (_, i) => {
        const label = new Date(2000, i, 1).toLocaleDateString(region.locale, { month: 'short' });
        const value = expenses
          .filter((t) => new Date(t.date || t.created_at || 0).getMonth() === i)
          .reduce((s, t) => s + (t.amount || 0), 0);
        return { label: label.replace('.', ''), value };
      });
      const max = Math.max(...months.map((m) => m.value), 1);
      const nowM = new Date().getMonth();
      return months.map((m, i) => ({
        ...m,
        height: 8 + (m.value / max) * 104,
        active: i === nowM,
      }));
    }
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const value = expenses
        .filter((t) => {
          const dt = new Date(t.date || t.created_at || 0);
          dt.setHours(0, 0, 0, 0);
          return dt.getTime() === d.getTime();
        })
        .reduce((s, t) => s + (t.amount || 0), 0);
      return {
        label: d.toLocaleDateString(region.locale, { weekday: 'short' }).replace('.', ''),
        value,
        active: i === 6,
      };
    });
    const max = Math.max(...days.map((m) => m.value), 1);
    return days.map((m) => ({ ...m, height: 8 + (m.value / max) * 104 }));
  }, [expenses, filter, region.locale]);

  return (
    <Screen>
      <Text style={styles.title}>Analíticas</Text>
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'mes', label: 'Mes' },
          { value: 'año', label: 'Año' },
          { value: 'todo', label: 'Todo' },
        ]}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={styles.label}>Balance del periodo</Text>
          {isLoading ? (
            <View style={{ gap: 10, alignItems: 'center', marginTop: 8 }}>
              <Skeleton width={180} height={42} borderRadius={radius.sm} />
              <Skeleton width={140} height={20} borderRadius={radius.sm} />
            </View>
          ) : (
            <>
              <Text style={[styles.total, earned - spent < 0 && { color: colors.danger }]}>
                {formatMoney(earned - spent, region, true)}
              </Text>
              <View style={styles.split}>
                <Text style={styles.in}>+ {formatMoney(earned, region)}</Text>
                <Text style={styles.out}>− {formatMoney(spent, region)}</Text>
              </View>
            </>
          )}
        </View>

        <GlassCard colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']} style={styles.chartWrap}>
          <View style={styles.chart}>
            {isLoading ? (
              <View style={{ flex: 1, height: 120, justifyContent: 'center' }}>
                <Skeleton height="100%" borderRadius={radius.md} />
              </View>
            ) : (
              bars.map((b) => (
                <View key={b.label + String(b.active)} style={styles.barWrap}>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.bar,
                        { height: b.height, backgroundColor: b.active ? colors.accent : colors.elevated },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLbl, b.active && { color: colors.accent }]} numberOfLines={1}>
                    {b.label}
                  </Text>
                </View>
              ))
            )}
          </View>
        </GlassCard>
        <Text style={styles.caption}>
          {filter === 'año' ? 'Gastos por mes' : 'Gastos de los últimos 7 días'}
        </Text>

        <Text style={styles.section}>Categorías</Text>
        {isLoading ? (
          <View style={{ gap: 16 }}>
            <Skeleton height={24} borderRadius={radius.sm} />
            <Skeleton height={24} borderRadius={radius.sm} />
            <Skeleton height={24} borderRadius={radius.sm} />
          </View>
        ) : byCat.length === 0 ? (
          <EmptyState 
            title="Sin gastos" 
            description="No hay gastos registrados en este periodo."
            icon="pie-chart-outline" 
          />
        ) : (
          byCat.map((c) => {
            const pct = spent > 0 ? (c.amount / spent) * 100 : 0;
            return (
              <View key={c.name} style={styles.cat}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{c.name}</Text>
                  <View style={styles.pTrack}>
                    <View style={[styles.pFill, { width: `${pct}%` }]} />
                  </View>
                </View>
                <Text style={styles.catAmt}>{formatMoney(c.amount, region)}</Text>
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800', paddingVertical: spacing.md, fontFamily: typography.bold },
  summary: { alignItems: 'center', marginVertical: 24 },
  label: { color: colors.muted, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12, marginBottom: 6, fontFamily: typography.semiBold },
  total: { color: colors.text, fontSize: 36, fontWeight: '800', fontFamily: typography.bold },
  split: { flexDirection: 'row', gap: 16, marginTop: 10 },
  in: { color: colors.accent, fontWeight: '700', fontFamily: typography.bold },
  out: { color: colors.muted, fontWeight: '700', fontFamily: typography.bold },
  chartWrap: { padding: 0, paddingHorizontal: 16, paddingTop: 16, height: 180 },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
  },
  barWrap: { alignItems: 'center', flex: 1 },
  track: { height: 120, justifyContent: 'flex-end', marginBottom: 8 },
  bar: { width: 10, borderRadius: 5, alignSelf: 'center' },
  barLbl: { color: colors.muted, fontSize: 10, fontWeight: '600', fontFamily: typography.medium },
  caption: { color: colors.muted, fontSize: 12, marginTop: 10, marginBottom: 28, fontFamily: typography.medium },
  section: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 16, fontFamily: typography.semiBold },
  empty: { color: colors.muted, fontFamily: typography.medium },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  catName: { color: colors.text, fontWeight: '600', marginBottom: 8, fontFamily: typography.semiBold },
  pTrack: { height: 6, backgroundColor: colors.surface2, borderRadius: 3, overflow: 'hidden' },
  pFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  catAmt: { color: colors.text, fontWeight: '800', fontFamily: typography.bold },
});
