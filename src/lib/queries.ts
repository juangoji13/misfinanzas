import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Account, Budget, Goal, Bill, Transaction } from '@/types/models';

export const queryKeys = {
  all: ['finanzas'] as const,
  accounts: (userId: string) => [...queryKeys.all, 'accounts', userId] as const,
  transactions: (userId: string) => [...queryKeys.all, 'transactions', userId] as const,
  budgets: (userId: string) => [...queryKeys.all, 'budgets', userId] as const,
  goals: (userId: string) => [...queryKeys.all, 'goals', userId] as const,
  bills: (userId: string) => [...queryKeys.all, 'bills', userId] as const,
};

export function useAccountsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.accounts(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as Account[]) || [];
    },
    enabled: !!userId,
  });
}

export function useTransactionsQuery(userId?: string, limit = 120) {
  return useQuery({
    queryKey: [...queryKeys.transactions(userId || ''), { limit }],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!userId,
  });
}

export function useBudgetsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.budgets(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      if (error) throw error;
      return (data as Budget[]) || [];
    },
    enabled: !!userId,
  });
}

export function useGoalsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.goals(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      if (error) throw error;
      return (data as Goal[]) || [];
    },
    enabled: !!userId,
  });
}

export function useBillsQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.bills(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      if (error) throw error;
      return (data as Bill[]) || [];
    },
    enabled: !!userId,
  });
}
