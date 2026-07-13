import type { Player } from '../../types/player';
import type {
  FinanceCategory,
  FinanceOperationResult,
  FinanceTransaction,
  PersonalFinanceState,
  SavingsGoal
} from '../../types/finance';

const TRANSACTION_LIMIT = 120;
const SALARY_INTERVAL_DAYS = 7;

function createTransaction(input: Omit<FinanceTransaction, 'id'>): FinanceTransaction {
  return {
    ...input,
    id: `finance_${input.totalMinutes}_${Math.random().toString(36).slice(2, 8)}`
  };
}

function appendTransaction(state: PersonalFinanceState, transaction: FinanceTransaction): PersonalFinanceState {
  return {
    ...state,
    transactions: [transaction, ...state.transactions].slice(0, TRANSACTION_LIMIT)
  };
}

function classifyAction(title?: string): FinanceCategory {
  const normalized = (title ?? '').toLowerCase();
  if (normalized.includes('аренд') || normalized.includes('жиль') || normalized.includes('переезд')) return 'housing';
  if (normalized.includes('магаз') || normalized.includes('покуп') || normalized.includes('еда') || normalized.includes('напит')) return 'food';
  if (normalized.includes('поезд') || normalized.includes('такси') || normalized.includes('метро') || normalized.includes('автобус') || normalized.includes('автомоб') || normalized.includes('машин') || normalized.includes('заправ') || normalized.includes('техническое обслуживание') || normalized.includes('то выполнено')) return 'transport';
  if (normalized.includes('врач') || normalized.includes('клиник') || normalized.includes('аптек') || normalized.includes('лечен') || normalized.includes('медицин') || normalized.includes('терапевт') || normalized.includes('травматолог') || normalized.includes('анализ') || normalized.includes('лекар')) return 'health';
  if (normalized.includes('бокс') || normalized.includes('трениров') || normalized.includes('абонемент')) return 'sport';
  if (normalized.includes('курс') || normalized.includes('обуч') || normalized.includes('учёб')) return 'education';
  if (normalized.includes('бизнес') || normalized.includes('кофейн') || normalized.includes('закуп')) return 'business';
  if (normalized.includes('смен') || normalized.includes('зарплат') || normalized.includes('доход')) return 'income';
  return 'other';
}

export function createInitialFinanceState(bankBalance: number, day = 1): PersonalFinanceState {
  return {
    cash: 1000,
    savings: 0,
    pendingSalary: 0,
    nextSalaryPayoutDay: Math.max(day + 6, 7),
    autoSavePercent: 0,
    transactions: [],
    goals: [],
    lastObservedBankBalance: Math.max(0, Math.floor(bankBalance)),
    lastProcessedDay: Math.max(1, Math.floor(day))
  };
}

export function reconcileExternalBankBalance(input: {
  state: PersonalFinanceState;
  bankBalance: number;
  totalMinutes: number;
  actionTitle?: string;
}): PersonalFinanceState {
  const bankBalance = Math.max(0, Math.floor(input.bankBalance));
  const delta = bankBalance - input.state.lastObservedBankBalance;
  if (delta === 0) return input.state;

  const title = input.actionTitle?.trim() || (delta > 0 ? 'Пополнение счёта' : 'Расход по карте');
  const transaction = createTransaction({
    totalMinutes: input.totalMinutes,
    title,
    amount: delta,
    category: classifyAction(title),
    account: 'bank',
    balanceAfter: bankBalance
  });

  return appendTransaction({ ...input.state, lastObservedBankBalance: bankBalance }, transaction);
}

export function accrueSalary(state: PersonalFinanceState, amount: number, totalMinutes: number, title: string): PersonalFinanceState {
  const safeAmount = Math.max(0, Math.floor(amount));
  if (safeAmount <= 0) return state;
  const next = {
    ...state,
    pendingSalary: state.pendingSalary + safeAmount
  };
  return appendTransaction(next, createTransaction({
    totalMinutes,
    title: `Начислено: ${title}`,
    amount: safeAmount,
    category: 'income',
    account: 'salary'
  }));
}

export function processFinanceDay(input: {
  state: PersonalFinanceState;
  player: Player;
  currentDay: number;
  totalMinutes: number;
}): { state: PersonalFinanceState; player: Player; messages: string[] } {
  let state = input.state;
  let player = input.player;
  const messages: string[] = [];

  while (input.currentDay >= state.nextSalaryPayoutDay) {
    const gross = state.pendingSalary;
    const autoSave = Math.floor(gross * state.autoSavePercent / 100);
    const toBank = gross - autoSave;

    if (gross > 0) {
      player = { ...player, money: player.money + toBank };
      state = appendTransaction({
        ...state,
        pendingSalary: 0,
        savings: state.savings + autoSave,
        lastObservedBankBalance: player.money
      }, createTransaction({
        totalMinutes: input.totalMinutes,
        title: 'Недельная зарплата',
        amount: toBank,
        category: 'income',
        account: 'bank',
        balanceAfter: player.money
      }));

      if (autoSave > 0) {
        state = appendTransaction(state, createTransaction({
          totalMinutes: input.totalMinutes,
          title: `Автосбережение ${state.autoSavePercent}%`,
          amount: autoSave,
          category: 'transfer',
          account: 'savings',
          balanceAfter: state.savings
        }));
      }
      messages.push(`Выплачена недельная зарплата: ${gross} ₽${autoSave > 0 ? `. В накопления отправлено ${autoSave} ₽` : ''}.`);
    }

    state = {
      ...state,
      nextSalaryPayoutDay: state.nextSalaryPayoutDay + SALARY_INTERVAL_DAYS
    };
  }

  const processedDay = Math.max(state.lastProcessedDay, input.currentDay);
  const finalState = processedDay === state.lastProcessedDay ? state : { ...state, lastProcessedDay: processedDay };
  return { state: finalState, player, messages };
}

function transferFailure(message: string): FinanceOperationResult {
  return { ok: false, title: 'Перевод не выполнен', message };
}

export function transferFinanceFunds(input: {
  state: PersonalFinanceState;
  player: Player;
  direction: 'bank_to_cash' | 'cash_to_bank' | 'bank_to_savings' | 'savings_to_bank';
  amount: number;
  totalMinutes: number;
}): { state: PersonalFinanceState; player: Player; result: FinanceOperationResult } {
  const amount = Math.max(100, Math.floor(input.amount / 100) * 100);
  let state = input.state;
  let player = input.player;

  if (input.direction === 'bank_to_cash') {
    if (player.money < amount) return { state, player, result: transferFailure('На банковском счёте недостаточно денег.') };
    player = { ...player, money: player.money - amount };
    state = { ...state, cash: state.cash + amount, lastObservedBankBalance: player.money };
  } else if (input.direction === 'cash_to_bank') {
    if (state.cash < amount) return { state, player, result: transferFailure('Недостаточно наличных.') };
    player = { ...player, money: player.money + amount };
    state = { ...state, cash: state.cash - amount, lastObservedBankBalance: player.money };
  } else if (input.direction === 'bank_to_savings') {
    if (player.money < amount) return { state, player, result: transferFailure('На банковском счёте недостаточно денег.') };
    player = { ...player, money: player.money - amount };
    state = { ...state, savings: state.savings + amount, lastObservedBankBalance: player.money };
  } else {
    if (state.savings < amount) return { state, player, result: transferFailure('В накоплениях недостаточно денег.') };
    player = { ...player, money: player.money + amount };
    state = { ...state, savings: state.savings - amount, lastObservedBankBalance: player.money };
  }

  const labels = {
    bank_to_cash: 'Снятие наличных',
    cash_to_bank: 'Внесение наличных',
    bank_to_savings: 'Перевод в накопления',
    savings_to_bank: 'Возврат из накоплений'
  } as const;
  const account = input.direction.includes('cash') ? 'cash' : 'savings';
  state = appendTransaction(state, createTransaction({
    totalMinutes: input.totalMinutes,
    title: labels[input.direction],
    amount: input.direction === 'bank_to_cash' || input.direction === 'bank_to_savings' ? -amount : amount,
    category: 'transfer',
    account,
    balanceAfter: account === 'cash' ? state.cash : state.savings
  }));

  return {
    state,
    player,
    result: { ok: true, title: labels[input.direction], message: `${amount} ₽ переведено.` }
  };
}

export function setFinanceAutoSave(state: PersonalFinanceState, percent: number): PersonalFinanceState {
  const allowed = [0, 5, 10, 20, 30];
  const normalized = allowed.reduce((best, value) => Math.abs(value - percent) < Math.abs(best - percent) ? value : best, 0);
  return { ...state, autoSavePercent: normalized };
}

export function createSavingsGoal(input: {
  state: PersonalFinanceState;
  title: string;
  targetAmount: number;
  day: number;
}): { state: PersonalFinanceState; result: FinanceOperationResult } {
  const title = input.title.trim().slice(0, 40);
  const targetAmount = Math.max(1000, Math.floor(input.targetAmount / 1000) * 1000);
  if (!title) return { state: input.state, result: { ok: false, title: 'Цель не создана', message: 'Укажи название цели.' } };
  if (input.state.goals.length >= 5) return { state: input.state, result: { ok: false, title: 'Цель не создана', message: 'Одновременно можно вести до пяти целей.' } };

  const goal: SavingsGoal = {
    id: `goal_${input.day}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    targetAmount,
    currentAmount: 0,
    createdDay: input.day
  };
  return {
    state: { ...input.state, goals: [goal, ...input.state.goals] },
    result: { ok: true, title: 'Цель создана', message: `${title}: ${targetAmount} ₽.` }
  };
}

export function fundSavingsGoal(input: {
  state: PersonalFinanceState;
  player: Player;
  goalId: string;
  amount: number;
  totalMinutes: number;
}): { state: PersonalFinanceState; player: Player; result: FinanceOperationResult } {
  const goal = input.state.goals.find((entry) => entry.id === input.goalId);
  if (!goal) return { state: input.state, player: input.player, result: { ok: false, title: 'Пополнение недоступно', message: 'Цель не найдена.' } };
  const amount = Math.max(100, Math.floor(input.amount / 100) * 100);
  if (input.player.money < amount) return { state: input.state, player: input.player, result: transferFailure('На банковском счёте недостаточно денег.') };

  const player = { ...input.player, money: input.player.money - amount };
  let state: PersonalFinanceState = {
    ...input.state,
    savings: input.state.savings + amount,
    lastObservedBankBalance: player.money,
    goals: input.state.goals.map((entry) => entry.id === goal.id
      ? { ...entry, currentAmount: Math.min(entry.targetAmount, entry.currentAmount + amount) }
      : entry)
  };
  state = appendTransaction(state, createTransaction({
    totalMinutes: input.totalMinutes,
    title: `Цель: ${goal.title}`,
    amount: -amount,
    category: 'transfer',
    account: 'savings',
    balanceAfter: state.savings
  }));
  return { state, player, result: { ok: true, title: 'Цель пополнена', message: `${amount} ₽ отложено на «${goal.title}».` } };
}
