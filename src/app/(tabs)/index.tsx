import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { AccountCarousel } from '@/components/account-carousel';
import { TxRow } from '@/components/tx-row';
import { Skeleton } from '@/components/skeleton';
import { AnimatedButton } from '@/components/ui/animated-button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/lib/auth-context';
import { useRegion } from '@/lib/region-context';
import { supabase } from '@/lib/supabase';
import { removeTransaction } from '@/lib/finance';
import { formatMoney } from '@/lib/money';
import { useAccountsQuery, useTransactionsQuery, queryKeys } from '@/lib/queries';
import { colors, radius, spacing, typography, shadows } from '@/theme';
import type { Account, Transaction } from '@/types/models';

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { region } = useRegion();

  const { data: accounts = [], isLoading: loadingAccounts, refetch: refetchAccounts } = useAccountsQuery(user?.id);
  const { data: transactions = [], isLoading: loadingTx, refetch: refetchTx } = useTransactionsQuery(user?.id);

  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAccounts(), refetchTx()]);
    setRefreshing(false);
  };

  const active = accounts[activeIndex] ?? null;
  const currentTx = useMemo(() => {
    let txs = active ? transactions.filter((t) => t.account_id === active.id) : [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter(t => t.concept.toLowerCase().includes(q) || String(t.amount).includes(q));
    }
    return txs;
  }, [active, transactions, searchQuery]);

  const netWorth = useMemo(() => accounts.reduce((s, a) => s + (a.balance || 0), 0), [accounts]);
  const displayName = user?.email?.split('@')[0] ?? 'tú';

  const openAdd = () => {
    if (!active) {
      router.push('/add-account');
      return;
    }
    router.push({
      pathname: '/add',
      params: {
        accountId: active.id,
        accountName: active.name,
        lastDigits: active.last_digits ?? '',
        accountType: active.type,
      },
    });
  };

  const editAccount = (item: Account) => {
    router.push({
      pathname: '/add-account',
      params: {
        editId: item.id,
        editName: item.name,
        editType: item.type,
        editBalance: String(item.balance),
        editColor: item.color,
        editDigits: item.last_digits ?? '',
        editCategory: item.type === 'Débito' || item.type === 'Crédito' ? 'Tarjeta' : 'Cuenta',
      },
    });
  };

  const deleteAccount = (item: Account) => {
    Alert.alert(item.name, 'Se eliminará el producto. Los movimientos pueden quedar huérfanos si el servidor no los borra en cascada.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('accounts').delete().eq('id', item.id);
          if (error) Alert.alert('Error', error.message);
          else {
            queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user?.id || '') });
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user?.id || '') });
          }
        },
      },
    ]);
  };

  const deleteTx = (tx: Transaction) => {
    Alert.alert('Eliminar movimiento', tx.concept, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!user) return;
            await removeTransaction(user.id, tx);
            queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user?.id || '') });
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user?.id || '') });
            queryClient.invalidateQueries({ queryKey: queryKeys.budgets(user?.id || '') });
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.hello}>Hola, {displayName}</Text>
          <Text style={styles.meta}>
            Patrimonio {formatMoney(netWorth, region)}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/add-account')}>
          <Ionicons name="add" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {loadingAccounts ? (
        <View style={{ marginHorizontal: spacing.lg, marginVertical: 20 }}>
          <Skeleton height={180} borderRadius={radius.lg} />
        </View>
      ) : (
        <AccountCarousel
          accounts={accounts}
          region={region}
          onIndexChange={setActiveIndex}
          onPress={editAccount}
          onLongPress={deleteAccount}
        />
      )}

      <View style={styles.actions}>
        <AnimatedButton style={styles.action} onPress={openAdd}>
          <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="add" size={24} color={colors.black} />
          </View>
          <Text style={styles.actionText}>Movimiento</Text>
        </AnimatedButton>
        <AnimatedButton style={styles.action} onPress={() => router.push('/transfer')}>
          <View style={styles.actionIcon}>
            <Ionicons name="swap-horizontal" size={22} color={colors.text} />
          </View>
          <Text style={styles.actionText}>Entre cuentas</Text>
        </AnimatedButton>
      </View>

      <View style={[styles.listHead, { paddingHorizontal: spacing.lg }]}>
        <Text style={styles.section}>Movimientos</Text>
        <Text style={styles.count}>{loadingTx ? '-' : currentTx.length}</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginBottom: 12 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={currentTx}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: spacing.lg }}
        ListEmptyComponent={
          loadingTx ? (
            <View style={{ gap: 12 }}>
              <Skeleton height={60} borderRadius={radius.md} />
              <Skeleton height={60} borderRadius={radius.md} />
              <Skeleton height={60} borderRadius={radius.md} />
            </View>
          ) : (
            <EmptyState 
              title={accounts.length === 0 ? "Crea una cuenta para empezar" : searchQuery ? "No hay resultados" : "Sin movimientos recientes"} 
              description={searchQuery ? undefined : "Los gastos e ingresos de este producto aparecerán aquí."}
              icon="wallet-outline" 
            />
          )
        }
        renderItem={({ item }) => (
          <TxRow
            item={item}
            region={region}
            onLongPress={() => deleteTx(item)}
            onPress={() =>
              router.push({
                pathname: '/add',
                params: {
                  editId: item.id,
                  accountId: item.account_id,
                  accountName: accounts.find((a) => a.id === item.account_id)?.name || '',
                  amount: String(item.amount),
                  concept: item.concept,
                  type: item.type,
                  category: item.category_name ?? '',
                  accountType: accounts.find((a) => a.id === item.account_id)?.type || '',
                },
              })
            }
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  hello: { color: colors.text, fontSize: 22, fontWeight: '800', fontFamily: typography.bold },
  meta: { color: colors.muted, marginTop: 2, fontSize: 13, fontFamily: typography.regular },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 8,
    marginBottom: 8,
  },
  action: { alignItems: 'center' },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...shadows.sm,
  },
  actionText: { color: colors.muted, fontSize: 12, fontWeight: '600', fontFamily: typography.medium },
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  section: { color: colors.text, fontSize: 17, fontWeight: '700', fontFamily: typography.semiBold },
  count: { color: colors.muted, fontWeight: '600', fontFamily: typography.semiBold },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 32, fontFamily: typography.medium },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.regular,
    marginLeft: 8,
    fontSize: 14,
  },
});
