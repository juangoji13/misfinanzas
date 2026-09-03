export type AccountType =
  | 'Ahorros'
  | 'Corriente'
  | 'Efectivo'
  | 'Débito'
  | 'Crédito';

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  last_digits?: string | null;
  created_at?: string;
};

export type TransactionType = 'expense' | 'income';

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  concept: string;
  category_name?: string | null;
  date?: string | null;
  created_at?: string;
  icon?: string | null;
};

export type UserCategory = {
  id: string;
  user_id: string;
  name: string;
};

export type Bill = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  next_payment?: string | null;
  icon?: string | null;
  color?: string | null;
  total_installments?: number | null;
  current_installment?: number | null;
  account_id?: string | null;
  transaction_id?: string | null;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon?: string | null;
  color?: string | null;
};

export type Budget = {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  icon?: string | null;
  color?: string | null;
};
