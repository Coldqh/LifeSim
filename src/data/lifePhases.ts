import type { LongTermLifeEventChoice, LongTermLifeEventKind } from '../types/lifePhase';

export type LongTermLifeEventDefinition = {
  kind: LongTermLifeEventKind;
  cooldownDays: number;
  deadlineDays: number;
  choices: Record<string, LongTermLifeEventChoice>;
};

export const longTermLifeEventDefinitions: Record<LongTermLifeEventKind, LongTermLifeEventDefinition> = {
  career_review: {
    kind: 'career_review',
    cooldownDays: 28,
    deadlineDays: 7,
    choices: {
      accept_promotion: { id: 'accept_promotion', label: 'Принять повышение', description: 'Взять больше ответственности и подняться на следующий уровень должности.' },
      stay_role: { id: 'stay_role', label: 'Остаться на месте', description: 'Сохранить текущую роль без дополнительной нагрузки.' },
      performance_plan: { id: 'performance_plan', label: 'Взяться за исправление', description: 'Согласиться на план улучшения и сохранить работу.' },
      leave_job: { id: 'leave_job', label: 'Уйти самому', description: 'Закрыть эту работу до решения работодателя.' },
      dismissal: { id: 'dismissal', label: 'Не реагировать', description: 'Работодатель завершит трудовые отношения.' }
    }
  },
  academic_review: {
    kind: 'academic_review',
    cooldownDays: 21,
    deadlineDays: 7,
    choices: {
      scholarship: { id: 'scholarship', label: 'Принять поддержку', description: 'Получить учебную выплату и продолжить сильный семестр.' },
      academic_focus: { id: 'academic_focus', label: 'Сосредоточиться на учёбе', description: 'Закрыть один просроченный долг и снизить нагрузку.' },
      academic_ignore: { id: 'academic_ignore', label: 'Игнорировать', description: 'Задолженность останется и давление усилится.' }
    }
  },
  rent_review: {
    kind: 'rent_review',
    cooldownDays: 56,
    deadlineDays: 10,
    choices: {
      accept_rent: { id: 'accept_rent', label: 'Принять новые условия', description: 'Следующие платежи за аренду станут выше.' },
      negotiate_rent: { id: 'negotiate_rent', label: 'Торговаться', description: 'Результат зависит от самостоятельности и финансовой репутации.' }
    }
  },
  health_recovery: {
    kind: 'health_recovery',
    cooldownDays: 18,
    deadlineDays: 5,
    choices: {
      recovery_plan: { id: 'recovery_plan', label: 'Перейти на восстановление', description: 'Снизить нагрузку и ускорить лечение.' },
      push_through: { id: 'push_through', label: 'Продолжать в прежнем темпе', description: 'Сохранить планы, но ухудшить состояние.' }
    }
  },
  business_review: {
    kind: 'business_review',
    cooldownDays: 28,
    deadlineDays: 7,
    choices: {
      reinvest_growth: { id: 'reinvest_growth', label: 'Реинвестировать', description: 'Оставить прибыль в бизнесе и укрепить репутацию.' },
      take_profit: { id: 'take_profit', label: 'Забрать часть прибыли', description: 'Перевести часть денег бизнеса себе.' },
      cut_costs: { id: 'cut_costs', label: 'Сократить расходы', description: 'Уменьшить долг ценой репутации и настроения.' },
      business_ignore: { id: 'business_ignore', label: 'Ничего не менять', description: 'Кризис продолжится и долг вырастет.' }
    }
  },
  social_departure: {
    kind: 'social_departure',
    cooldownDays: 42,
    deadlineDays: 5,
    choices: {
      stay_in_touch: { id: 'stay_in_touch', label: 'Сохранить связь', description: 'Поддержать человека перед переездом.' },
      let_go: { id: 'let_go', label: 'Отпустить', description: 'Человек уедет без отдельного разговора.' }
    }
  },
  social_group_crisis: {
    kind: 'social_group_crisis',
    cooldownDays: 35,
    deadlineDays: 6,
    choices: {
      mediate_group: { id: 'mediate_group', label: 'Вмешаться', description: 'Попробовать снизить напряжение внутри круга.' },
      step_back: { id: 'step_back', label: 'Отойти в сторону', description: 'Не тратить силы, но дать конфликту развиваться.' }
    }
  },
  goal_milestone: {
    kind: 'goal_milestone',
    cooldownDays: 3,
    deadlineDays: 3,
    choices: {
      celebrate_milestone: { id: 'celebrate_milestone', label: 'Отметить этап', description: 'Потратить немного денег и сильно поднять настроение.' },
      keep_focus: { id: 'keep_focus', label: 'Идти дальше', description: 'Зафиксировать успех без дополнительных затрат.' }
    }
  }
};
