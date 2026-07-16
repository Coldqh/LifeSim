import type { LifeGoalDefinition } from '../types/lifeGoal';

export const LIFE_GOAL_MILESTONE_IDS = {
  university: {
    application: 'university:application',
    enrollment: 'university:enrollment',
    firstSemester: 'university:first_semester',
    halfway: 'university:halfway',
    degree: 'university:degree'
  },
  career: {
    firstJob: 'career:first_job',
    shifts: 'career:ten_shifts',
    promotion: 'career:promotion',
    probation: 'career:probation',
    professional: 'career:professional'
  },
  boxing: {
    membership: 'boxing:membership',
    trainer: 'boxing:trainer',
    level: 'boxing:level_two',
    sparring: 'boxing:first_sparring',
    officialFight: 'boxing:first_official_fight',
    tournament: 'boxing:tournament_win'
  },
  business: {
    launch: 'business:launch',
    firstCustomers: 'business:first_customers',
    employee: 'business:first_employee',
    reputation: 'business:reputation',
    profitableDays: 'business:profitable_days'
  },
  housing: {
    debtFree: 'housing:debt_free',
    reserve: 'housing:reserve',
    studio: 'housing:studio',
    capital: 'housing:capital',
    homeFund: 'housing:home_fund'
  }
} as const;

export const lifeGoalDefinitions: LifeGoalDefinition[] = [
  {
    id: 'university',
    title: 'Получить высшее образование',
    shortTitle: 'Университет',
    description: 'Поступить, пройти семестры и получить диплом, который откроет профессиональные вакансии.',
    milestones: [
      { id: LIFE_GOAL_MILESTONE_IDS.university.application, title: 'Подать заявление', description: 'Выбрать программу и отправить документы.' },
      { id: LIFE_GOAL_MILESTONE_IDS.university.enrollment, title: 'Стать студентом', description: 'Сдать вступительный экзамен и зачислиться.' },
      { id: LIFE_GOAL_MILESTONE_IDS.university.firstSemester, title: 'Закрыть первый семестр', description: 'Сдать первый семестровый экзамен.' },
      { id: LIFE_GOAL_MILESTONE_IDS.university.halfway, title: 'Пройти половину программы', description: 'Удержать темп и закрыть половину семестров.' },
      { id: LIFE_GOAL_MILESTONE_IDS.university.degree, title: 'Получить диплом', description: 'Завершить программу и получить квалификацию.' }
    ]
  },
  {
    id: 'career',
    title: 'Построить карьеру',
    shortTitle: 'Карьера',
    description: 'Пройти путь от первой работы до устойчивой профессиональной позиции.',
    milestones: [
      { id: LIFE_GOAL_MILESTONE_IDS.career.firstJob, title: 'Получить первую работу', description: 'Устроиться на любую доступную должность.' },
      { id: LIFE_GOAL_MILESTONE_IDS.career.shifts, title: 'Закрепиться в ритме', description: 'Отработать десять смен суммарно.' },
      { id: LIFE_GOAL_MILESTONE_IDS.career.promotion, title: 'Получить повышение', description: 'Достичь второго уровня хотя бы на одной работе.' },
      { id: LIFE_GOAL_MILESTONE_IDS.career.probation, title: 'Пройти испытательный срок', description: 'Подтвердить себя на постоянной позиции.' },
      { id: LIFE_GOAL_MILESTONE_IDS.career.professional, title: 'Войти в профессию', description: 'Получить активную профессиональную работу.' }
    ]
  },
  {
    id: 'boxing',
    title: 'Стать сильным боксёром',
    shortTitle: 'Бокс',
    description: 'Записаться в зал, пройти первые проверки и выиграть официальный турнир.',
    milestones: [
      { id: LIFE_GOAL_MILESTONE_IDS.boxing.membership, title: 'Записаться в зал', description: 'Купить действующий абонемент.' },
      { id: LIFE_GOAL_MILESTONE_IDS.boxing.trainer, title: 'Выбрать тренера', description: 'Найти специалиста под свой стиль.' },
      { id: LIFE_GOAL_MILESTONE_IDS.boxing.level, title: 'Поднять базовый уровень', description: 'Достичь второго уровня боксёра.' },
      { id: LIFE_GOAL_MILESTONE_IDS.boxing.sparring, title: 'Провести первый спарринг', description: 'Проверить навыки в боевой работе.' },
      { id: LIFE_GOAL_MILESTONE_IDS.boxing.officialFight, title: 'Провести официальный бой', description: 'Выйти на ринг в турнире.' },
      { id: LIFE_GOAL_MILESTONE_IDS.boxing.tournament, title: 'Выиграть турнир', description: 'Забрать первую турнирную победу.' }
    ]
  },
  {
    id: 'business',
    title: 'Создать прибыльный бизнес',
    shortTitle: 'Бизнес',
    description: 'Открыть кофейню, собрать команду и доказать устойчивость несколькими прибыльными днями.',
    milestones: [
      { id: LIFE_GOAL_MILESTONE_IDS.business.launch, title: 'Открыть своё дело', description: 'Запустить первую кофейню.' },
      { id: LIFE_GOAL_MILESTONE_IDS.business.firstCustomers, title: 'Обслужить первых гостей', description: 'Получить первые реальные продажи.' },
      { id: LIFE_GOAL_MILESTONE_IDS.business.employee, title: 'Нанять сотрудника', description: 'Перестать держать всё только на себе.' },
      { id: LIFE_GOAL_MILESTONE_IDS.business.reputation, title: 'Заслужить репутацию', description: 'Поднять репутацию бизнеса до 55.' },
      { id: LIFE_GOAL_MILESTONE_IDS.business.profitableDays, title: 'Закрепить прибыль', description: 'Закрыть три прибыльных дня.' }
    ]
  },
  {
    id: 'housing',
    title: 'Собрать капитал на своё жильё',
    shortTitle: 'Жильё',
    description: 'Убрать жилищные долги, улучшить условия и сформировать серьёзный капитал.',
    milestones: [
      { id: LIFE_GOAL_MILESTONE_IDS.housing.debtFree, title: 'Закрыть долг по жилью', description: 'Не иметь задолженности по аренде.' },
      { id: LIFE_GOAL_MILESTONE_IDS.housing.reserve, title: 'Создать резерв', description: 'Накопить 50 000 ₽ ликвидных средств.' },
      { id: LIFE_GOAL_MILESTONE_IDS.housing.studio, title: 'Переехать в отдельное жильё', description: 'Снять студию или однокомнатную квартиру.' },
      { id: LIFE_GOAL_MILESTONE_IDS.housing.capital, title: 'Укрепить капитал', description: 'Накопить 150 000 ₽.' },
      { id: LIFE_GOAL_MILESTONE_IDS.housing.homeFund, title: 'Фонд собственного жилья', description: 'Накопить 300 000 ₽ и жить без арендного долга.' }
    ]
  }
];

export function getLifeGoalDefinition(id: LifeGoalDefinition['id'] | undefined): LifeGoalDefinition | undefined {
  return lifeGoalDefinitions.find((definition) => definition.id === id);
}
