export type FinanceCategory =
  | 'income'
  | 'housing'
  | 'food'
  | 'transport'
  | 'sport'
  | 'education'
  | 'business'
  | 'shopping'
  | 'health'
  | 'transfer'
  | 'other';

export type FinanceAccount = 'bank' | 'cash' | 'savings' | 'salary';

export type FinanceTransaction = {
  id: string;
  totalMinutes: number;
  title: string;
  amount: number;
  category: FinanceCategory;
  account: FinanceAccount;
  balanceAfter?: number;
};

export type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  createdDay: number;
};

export type PersonalFinanceState = {
  cash: number;
  savings: number;
  pendingSalary: number;
  nextSalaryPayoutDay: number;
  autoSavePercent: number;
  transactions: FinanceTransaction[];
  goals: SavingsGoal[];
  lastObservedBankBalance: number;
  lastProcessedDay: number;
};

export type UpcomingPayment = {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  category: FinanceCategory;
};

export type FinanceOperationResult = {
  ok: boolean;
  title: string;
  message: string;
};
