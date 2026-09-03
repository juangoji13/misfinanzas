import { supabase } from '@/lib/supabase';
import type { Bill, Goal, Transaction } from '@/types/models';

/** Map of Supabase auth error messages → user-friendly Spanish messages */
const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos.',
  'Email not confirmed': 'Confirma tu correo antes de iniciar sesión.',
  'User already registered': 'Este correo ya está registrado.',
  'Password should be at least 6 characters':
    'La contraseña debe tener al menos 6 caracteres.',
  'Signup requires a valid password': 'Ingresa una contraseña válida.',
  'Unable to validate email address: invalid format':
    'El formato del correo no es válido.',
};

/** Translate a Supabase auth error message to Spanish. Falls back to original. */
export function translateAuthError(message: string): string {
  return AUTH_ERROR_MAP[message] ?? message;
}

/**
 * Atomically adjust an account balance using SQL arithmetic.
 * Avoids the SELECT-then-UPDATE race condition.
 */
export async function adjustAccountBalance(accountId: string, delta: number) {
  if (!delta) return;
  const { error } = await supabase.rpc('adjust_account_balance', {
    p_account_id: accountId,
    p_delta: delta,
  });
  if (error) {
    // Fallback to non-atomic approach if the RPC doesn't exist yet
    if (error.message?.includes('function') || error.code === '42883') {
      const { data, error: selErr } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single();
      if (selErr || !data) throw selErr ?? new Error('Cuenta no encontrada');
      const { error: upErr } = await supabase
        .from('accounts')
        .update({ balance: (data.balance || 0) + delta })
        .eq('id', accountId);
      if (upErr) throw upErr;
      return;
    }
    throw error;
  }
}

export async function bumpBudgetSpend(
  userId: string,
  categoryName: string,
  delta: number,
) {
  if (!categoryName || !delta) return;
  if (categoryName === 'Transferencia' || categoryName === 'Ahorro') return;
  const { data } = await supabase
    .from('budgets')
    .select('id, spent_amount')
    .eq('user_id', userId)
    .ilike('name', categoryName)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from('budgets')
    .update({ spent_amount: Math.max(0, (data.spent_amount || 0) + delta) })
    .eq('id', data.id);
}

export async function removeTransaction(userId: string, tx: Transaction) {
  const revert = tx.type === 'expense' ? tx.amount : -tx.amount;
  await adjustAccountBalance(tx.account_id, revert);
  if (tx.type === 'expense') {
    await bumpBudgetSpend(userId, tx.category_name || '', -(tx.amount || 0));
  }
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', tx.id);
  if (error) throw error;
}

export async function transferFunds(input: {
  userId: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}) {
  const { userId, fromId, fromName, toId, toName, amount } = input;
  if (fromId === toId) throw new Error('Elige dos cuentas distintas.');
  if (amount <= 0) throw new Error('El monto debe ser mayor a 0.');
  const now = new Date().toISOString();
  const { error } = await supabase.from('transactions').insert([
    {
      user_id: userId,
      account_id: fromId,
      type: 'expense',
      amount,
      concept: `Transferencia a ${toName}`,
      category_name: 'Transferencia',
      date: now,
    },
    {
      user_id: userId,
      account_id: toId,
      type: 'income',
      amount,
      concept: `Transferencia desde ${fromName}`,
      category_name: 'Transferencia',
      date: now,
    },
  ]);
  if (error) throw error;
  await adjustAccountBalance(fromId, -amount);
  await adjustAccountBalance(toId, amount);
}

export async function contributeToGoal(input: {
  userId: string;
  goal: Goal;
  accountId: string;
  amount: number;
}) {
  const { userId, goal, accountId, amount } = input;
  if (amount <= 0) throw new Error('El aporte debe ser mayor a 0.');
  const now = new Date().toISOString();
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    account_id: accountId,
    type: 'expense',
    amount,
    concept: `Ahorro: ${goal.name}`,
    category_name: 'Ahorro',
    date: now,
  });
  if (error) throw error;
  await adjustAccountBalance(accountId, -amount);
  const { error: gErr } = await supabase
    .from('goals')
    .update({ current_amount: (goal.current_amount || 0) + amount })
    .eq('id', goal.id);
  if (gErr) throw gErr;
}

export async function payBill(userId: string, bill: Bill) {
  if (!bill.account_id)
    throw new Error('Esta cuota no tiene una cuenta asociada.');
  const amount = bill.amount || 0;
  if (amount <= 0) throw new Error('Monto de cuota inválido.');
  const now = new Date().toISOString();
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    account_id: bill.account_id,
    type: 'expense',
    amount,
    concept: bill.name,
    category_name: 'Cuotas',
    date: now,
  });
  if (error) throw error;
  await adjustAccountBalance(bill.account_id, -amount);
  await bumpBudgetSpend(userId, 'Cuotas', amount);

  const nextInstallment = (bill.current_installment || 1) + 1;
  const total = bill.total_installments || 1;
  if (nextInstallment > total) {
    const { error: delErr } = await supabase
      .from('bills')
      .delete()
      .eq('id', bill.id);
    if (delErr) throw delErr;
    return;
  }
  const nextDate = new Date(bill.next_payment || Date.now());
  nextDate.setMonth(nextDate.getMonth() + 1);
  const { error: upErr } = await supabase
    .from('bills')
    .update({
      current_installment: nextInstallment,
      next_payment: nextDate.toISOString(),
    })
    .eq('id', bill.id);
  if (upErr) throw upErr;
}
