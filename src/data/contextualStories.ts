import type { ContextualStoryDefinition } from '../types/contextualStory';
import type { ProductId } from '../types/ids';

const groceries = 'groceries_basic' as ProductId;

export const contextualStoryDefinitions: ContextualStoryDefinition[] = [
  {
    id: 'story_work_understaffed', category: 'work', tone: 'warning', trigger: 'work_understaffed',
    title: 'На смене не хватает людей', text: '{organization} работает в сокращённом составе. Коллеги просят задержаться и закрыть тяжёлый участок.', responseDays: 1, cooldownDays: 10, defaultChoiceId: 'leave_on_time',
    choices: [
      { id: 'help_shift', label: 'Остаться и помочь', description: 'Потратить два часа, получить опыт и укрепить отношения.', resultText: 'Ты помог вытянуть тяжёлую смену.', durationMinutes: 120, effects: [{ kind: 'needs', delta: { energy: -14, hunger: -6, mood: -2 } }, { kind: 'job_experience', amount: 2 }, { kind: 'relationship', delta: { trust: 5, affinity: 3 }, memoryKey: 'story_helped_shift', memoryText: 'Ты помог на тяжёлой смене.', memoryTone: 'positive' }], followUp: { templateId: 'story_work_understaffed_followup', delayDays: 4 } },
      { id: 'leave_on_time', label: 'Уйти вовремя', description: 'Сохранить силы, но оставить нагрузку коллегам.', resultText: 'Ты ушёл вовремя. Коллектив запомнил, что ты не остался.', effects: [{ kind: 'relationship', delta: { trust: -3, tension: 3 }, memoryKey: 'story_left_shift', memoryText: 'Ты отказался помогать на тяжёлой смене.', memoryTone: 'negative' }] }
    ]
  },
  {
    id: 'story_work_pay_delay', category: 'work', tone: 'critical', trigger: 'work_pay_delay',
    title: 'Работодатель задерживает выплаты', text: '{organization} предупреждает о проблемах с деньгами. Сотрудникам предлагают подождать или уйти со смены раньше.', responseDays: 2, cooldownDays: 20, defaultChoiceId: 'wait',
    choices: [
      { id: 'work_anyway', label: 'Продолжить работать', description: 'Сохранить позицию, но принять риск.', resultText: 'Ты продолжил работать, несмотря на проблемы компании.', durationMinutes: 60, effects: [{ kind: 'job_experience', amount: 1 }, { kind: 'organization', reputationDelta: -2, budgetDelta: 1500 }, { kind: 'needs', delta: { mood: -5, energy: -6 } }] },
      { id: 'wait', label: 'Не брать лишние часы', description: 'Не рисковать временем.', resultText: 'Ты отказался вкладывать дополнительные часы без гарантий.', effects: [{ kind: 'organization', reputationDelta: -1 }, { kind: 'needs', delta: { mood: -2 } }] }
    ]
  },
  {
    id: 'story_work_coworker_sick', category: 'work', tone: 'neutral', trigger: 'work_coworker_sick',
    title: 'Коллега не вышел на смену', text: '{npc} заболел. Нужно срочно перераспределить работу.', responseDays: 1, cooldownDays: 9, defaultChoiceId: 'decline',
    choices: [
      { id: 'cover', label: 'Подменить коллегу', description: 'Потратить три часа и заработать 1 400 ₽.', resultText: 'Ты подменил коллегу и получил дополнительную оплату.', durationMinutes: 180, effects: [{ kind: 'money', amount: 1400 }, { kind: 'needs', delta: { energy: -20, hunger: -8 } }, { kind: 'relationship', delta: { trust: 6, affinity: 3 }, memoryKey: 'story_covered_shift', memoryText: 'Ты подменил меня во время болезни.', memoryTone: 'positive' }] },
      { id: 'decline', label: 'Отказаться', description: 'Сохранить время.', resultText: 'Ты отказался от подмены.', effects: [{ kind: 'relationship', delta: { trust: -1 }, memoryKey: 'story_declined_cover', memoryText: 'Ты не смог подменить меня.', memoryTone: 'neutral' }] }
    ]
  },
  {
    id: 'story_university_peer_help', category: 'education', tone: 'neutral', trigger: 'university_peer_help',
    title: 'Одногруппнику нужна помощь', text: '{npc} просит вместе разобрать сложную тему перед занятием.', responseDays: 2, cooldownDays: 10, defaultChoiceId: 'send_notes',
    choices: [
      { id: 'study_together', label: 'Готовиться вместе', description: 'Потратить полтора часа, укрепить знания и отношения.', resultText: 'Вы вместе разобрали тему.', durationMinutes: 90, effects: [{ kind: 'university_knowledge', amount: 5 }, { kind: 'university_load', amount: -4 }, { kind: 'needs', delta: { energy: -7, mood: 3 } }, { kind: 'relationship', delta: { trust: 6, familiarity: 4 }, memoryKey: 'story_studied_together', memoryText: 'Ты помог мне подготовиться.', memoryTone: 'positive' }], followUp: { templateId: 'story_university_peer_followup', delayDays: 4 } },
      { id: 'send_notes', label: 'Отправить конспект', description: 'Быстро помочь без встречи.', resultText: 'Ты отправил конспект.', durationMinutes: 10, effects: [{ kind: 'relationship', delta: { trust: 2, familiarity: 1 }, memoryKey: 'story_sent_notes', memoryText: 'Ты поделился конспектом.', memoryTone: 'positive' }] }
    ]
  },
  {
    id: 'story_university_deadline', category: 'education', tone: 'critical', trigger: 'university_deadline_pressure',
    title: 'Учебный дедлайн горит', text: 'До сдачи задания почти не осталось времени. Нужно выделить вечер или принять последствия.', responseDays: 1, cooldownDays: 7, defaultChoiceId: 'postpone',
    choices: [
      { id: 'finish_now', label: 'Сесть и закончить', description: 'Потратить три часа и снизить учебное давление.', resultText: 'Ты закрыл срочную часть работы.', durationMinutes: 180, effects: [{ kind: 'university_load', amount: -16 }, { kind: 'university_knowledge', amount: 4 }, { kind: 'needs', delta: { energy: -18, mood: 2 } }] },
      { id: 'postpone', label: 'Отложить', description: 'Сохранить вечер, но увеличить нагрузку.', resultText: 'Ты снова отложил задание. Давление выросло.', effects: [{ kind: 'university_load', amount: 12 }, { kind: 'needs', delta: { mood: -6 } }] }
    ]
  },
  {
    id: 'story_university_group', category: 'education', tone: 'positive', trigger: 'university_campus_group',
    title: 'Одногруппники собираются после пар', text: '{npc} зовёт присоединиться к группе в кампусе.', responseDays: 1, cooldownDays: 12, defaultChoiceId: 'skip',
    choices: [
      { id: 'join', label: 'Присоединиться', description: 'Потратить два часа и укрепить связи.', resultText: 'Ты провёл время с группой и стал ближе к одногруппникам.', durationMinutes: 120, effects: [{ kind: 'needs', delta: { energy: -7, mood: 9 } }, { kind: 'relationship', delta: { familiarity: 7, affinity: 5 }, memoryKey: 'story_joined_campus_group', memoryText: 'Ты пришёл на встречу группы.', memoryTone: 'positive' }] },
      { id: 'skip', label: 'Не идти', description: 'Сохранить время.', resultText: 'Ты не пошёл на встречу.', effects: [{ kind: 'relationship', delta: { familiarity: -1 }, memoryKey: 'story_skipped_group', memoryText: 'Ты пропустил встречу группы.', memoryTone: 'neutral' }] }
    ]
  },
  {
    id: 'story_housing_inspection', category: 'housing', tone: 'warning', trigger: 'housing_inspection',
    title: 'Хозяин хочет проверить жильё', text: 'Владелец жилья предупредил о проверке. В квартире грязно, а времени мало.', responseDays: 2, cooldownDays: 18, defaultChoiceId: 'do_nothing',
    choices: [
      { id: 'clean', label: 'Срочно убраться', description: 'Потратить два часа и привести жильё в порядок.', resultText: 'Ты подготовил жильё к проверке.', durationMinutes: 120, effects: [{ kind: 'household_cleanliness', amount: 35 }, { kind: 'needs', delta: { energy: -12, mood: 2 } }], followUp: { templateId: 'story_housing_inspection_followup', delayDays: 3 } },
      { id: 'pay_cleaning', label: 'Заказать уборку', description: 'Потратить 1 800 ₽.', resultText: 'Клининг быстро привёл жильё в порядок.', durationMinutes: 20, effects: [{ kind: 'money', amount: -1800 }, { kind: 'household_cleanliness', amount: 45 }] },
      { id: 'do_nothing', label: 'Ничего не делать', description: 'Рискнуть отношением владельца.', resultText: 'Ты не подготовился к проверке.', effects: [{ kind: 'needs', delta: { mood: -7 } }] }
    ]
  },
  {
    id: 'story_housing_breakdown', category: 'housing', tone: 'critical', trigger: 'housing_breakdown',
    title: 'Поломка мешает жить', text: 'Поломка в жилье ухудшается. Сосед предлагает контакт мастера.', responseDays: 2, cooldownDays: 12, defaultChoiceId: 'wait',
    choices: [
      { id: 'call_master', label: 'Вызвать мастера', description: 'Потратить 2 500 ₽ и устранить проблему.', resultText: 'Мастер устранил поломку.', durationMinutes: 90, effects: [{ kind: 'money', amount: -2500 }, { kind: 'household_condition', amount: 25, clearBreakdown: true }, { kind: 'needs', delta: { mood: 5 } }] },
      { id: 'repair_self', label: 'Разобраться самому', description: 'Потратить три часа.', resultText: 'Ты временно исправил проблему своими силами.', durationMinutes: 180, effects: [{ kind: 'household_condition', amount: 15, clearBreakdown: true }, { kind: 'needs', delta: { energy: -16, mood: 1 } }] },
      { id: 'wait', label: 'Подождать', description: 'Не тратить деньги сейчас.', resultText: 'Поломка осталась и продолжает мешать.', effects: [{ kind: 'household_condition', amount: -5 }, { kind: 'needs', delta: { mood: -5 } }] }
    ]
  },
  {
    id: 'story_housing_empty_pantry', category: 'housing', tone: 'warning', trigger: 'housing_empty_pantry',
    title: 'Дома почти нет еды', text: 'Запасы заканчиваются. Магазин рядом предлагает набор продуктов со скидкой до вечера.', responseDays: 1, cooldownDays: 8, defaultChoiceId: 'go_without',
    choices: [
      { id: 'bulk_buy', label: 'Купить набор', description: 'Потратить 1 100 ₽ и пополнить запас.', resultText: 'Ты пополнил домашние запасы.', durationMinutes: 35, effects: [{ kind: 'money', amount: -1100 }, { kind: 'household_food', productId: groceries, units: 5, shelfLifeDays: 6 }, { kind: 'needs', delta: { energy: -2, mood: 2 } }] },
      { id: 'delivery', label: 'Заказать готовую еду', description: 'Потратить 750 ₽ и быстро поесть.', resultText: 'Доставка решила проблему на сегодня.', durationMinutes: 20, effects: [{ kind: 'money', amount: -750 }, { kind: 'needs', delta: { hunger: 28, mood: 3 } }] },
      { id: 'go_without', label: 'Ничего не покупать', description: 'Остаться без запаса еды.', resultText: 'Ты ничего не купил. Дома по-прежнему почти нет еды.', effects: [{ kind: 'needs', delta: { hunger: -8, mood: -3 } }], expiryOnly: true }
    ]
  },
  {
    id: 'story_finance_emergency', category: 'finance', tone: 'warning', trigger: 'finance_emergency_expense',
    title: 'Незапланированный расход', text: 'Появился срочный бытовой платёж на 1 400 ₽.', responseDays: 2, cooldownDays: 16, defaultChoiceId: 'defer',
    choices: [
      { id: 'pay', label: 'Оплатить сейчас', description: 'Потратить деньги и не создавать новый долг.', resultText: 'Ты закрыл незапланированный расход.', effects: [{ kind: 'money', amount: -1400 }, { kind: 'needs', delta: { mood: -2 } }] },
      { id: 'defer', label: 'Перенести платёж', description: 'Сохранить деньги, но увеличить счёт.', resultText: 'Платёж перенесён. Бытовой долг вырос.', effects: [{ kind: 'household_bill', billKind: 'electricity', amount: 1650 }, { kind: 'needs', delta: { mood: -4 } }] }
    ]
  },
  {
    id: 'story_finance_short_gig', category: 'finance', tone: 'positive', trigger: 'finance_short_gig',
    title: 'Разовая подработка', text: 'В районе ищут человека на короткую оплачиваемую задачу. Предложение действует только сегодня.', responseDays: 1, cooldownDays: 9, defaultChoiceId: 'skip',
    choices: [
      { id: 'take_gig', label: 'Взять подработку', description: 'Потратить три часа и заработать 2 200 ₽.', resultText: 'Ты выполнил разовую работу и получил оплату.', durationMinutes: 180, effects: [{ kind: 'money', amount: 2200 }, { kind: 'needs', delta: { energy: -18, hunger: -8, mood: 2 } }], followUp: { templateId: 'story_finance_gig_followup', delayDays: 4 } },
      { id: 'skip', label: 'Отказаться', description: 'Сохранить свободное время.', resultText: 'Ты пропустил разовую подработку.', effects: [{ kind: 'needs', delta: { energy: 1 } }] }
    ]
  },
  {
    id: 'story_finance_debt_call', category: 'finance', tone: 'critical', trigger: 'finance_debt_call',
    title: 'Напоминание о долге', text: 'Пришло жёсткое напоминание по неоплаченным обязательствам.', responseDays: 2, cooldownDays: 7, defaultChoiceId: 'ignore',
    choices: [
      { id: 'partial_payment', label: 'Внести 1 000 ₽', description: 'Снизить давление.', resultText: 'Ты внёс часть долга и выиграл время.', effects: [{ kind: 'money', amount: -1000 }, { kind: 'household_bill', billKind: 'water', amount: -1000 }, { kind: 'needs', delta: { mood: 2 } }] },
      { id: 'ignore', label: 'Игнорировать', description: 'Увеличить долг и стресс.', resultText: 'Ты проигнорировал напоминание. Долг и давление выросли.', effects: [{ kind: 'household_bill', billKind: 'water', amount: 450 }, { kind: 'needs', delta: { mood: -7 } }] }
    ]
  },
  {
    id: 'story_social_friend_loan', category: 'social', tone: 'warning', trigger: 'social_friend_loan',
    title: 'Просьба занять денег', text: '{npc} просит занять 1 500 ₽ до следующей недели.', responseDays: 2, cooldownDays: 18, defaultChoiceId: 'refuse',
    choices: [
      { id: 'lend', label: 'Дать в долг', description: 'Потратить 1 500 ₽.', resultText: 'Ты дал деньги в долг.', effects: [{ kind: 'money', amount: -1500 }, { kind: 'relationship', delta: { trust: 7, affinity: 4 }, memoryKey: 'story_lent_money', memoryText: 'Ты помог деньгами в сложный момент.', memoryTone: 'positive' }], followUp: { templateId: 'story_social_loan_followup', delayDays: 7 } },
      { id: 'refuse', label: 'Отказать', description: 'Сохранить деньги.', resultText: 'Ты отказался давать деньги.', effects: [{ kind: 'relationship', delta: { trust: -2, tension: 2 }, memoryKey: 'story_refused_loan', memoryText: 'Ты отказался давать деньги в долг.', memoryTone: 'neutral' }] }
    ]
  },
  {
    id: 'story_social_job_loss', category: 'social', tone: 'warning', trigger: 'social_friend_job_loss',
    title: 'Знакомый потерял работу', text: '{npc} остался без работы и просит помочь с вакансиями.', responseDays: 3, cooldownDays: 20, defaultChoiceId: 'send_link',
    choices: [
      { id: 'help_search', label: 'Помочь с поиском', description: 'Потратить час.', resultText: 'Вы вместе разобрали вакансии и составили план.', durationMinutes: 60, effects: [{ kind: 'needs', delta: { energy: -5, mood: 2 } }, { kind: 'relationship', delta: { trust: 8, affinity: 5 }, memoryKey: 'story_helped_job_search', memoryText: 'Ты помог с поиском работы.', memoryTone: 'positive' }] },
      { id: 'send_link', label: 'Отправить ссылку', description: 'Быстро подсказать направление.', resultText: 'Ты отправил несколько подходящих вакансий.', durationMinutes: 5, effects: [{ kind: 'relationship', delta: { trust: 2, familiarity: 1 }, memoryKey: 'story_sent_job_link', memoryText: 'Ты прислал вакансии.', memoryTone: 'positive' }] }
    ]
  },
  {
    id: 'story_social_missed_promise', category: 'social', tone: 'critical', trigger: 'social_missed_promise',
    title: 'Накопившаяся обида', text: '{npc} говорит, что ты несколько раз исчезал и не выполнял обещания.', responseDays: 2, cooldownDays: 16, defaultChoiceId: 'deflect',
    choices: [
      { id: 'apologize', label: 'Извиниться и поговорить', description: 'Потратить время и снять напряжение.', resultText: 'Разговор был неприятным, но напряжение снизилось.', durationMinutes: 45, effects: [{ kind: 'needs', delta: { energy: -3, mood: -2 } }, { kind: 'relationship', delta: { trust: 5, tension: -12, affinity: 2 }, memoryKey: 'story_apologized', memoryText: 'Ты признал ошибку и извинился.', memoryTone: 'positive' }] },
      { id: 'deflect', label: 'Отмахнуться', description: 'Не признавать проблему.', resultText: 'Ты отмахнулся от разговора. Обида усилилась.', effects: [{ kind: 'relationship', delta: { trust: -8, tension: 12, affinity: -5 }, memoryKey: 'story_deflected_conflict', memoryText: 'Ты отказался обсуждать обиду.', memoryTone: 'negative' }] }
    ]
  },
  {
    id: 'story_district_transport', category: 'district', tone: 'warning', trigger: 'district_transport',
    title: 'Район встал в пробке', text: 'Транспортная нагрузка в районе резко выросла.', responseDays: 1, cooldownDays: 10, defaultChoiceId: 'ignore',
    choices: [
      { id: 'learn_route', label: 'Разобраться с маршрутом', description: 'Потратить 30 минут и помочь местным.', resultText: 'Ты разобрался с обходным маршрутом.', durationMinutes: 30, effects: [{ kind: 'needs', delta: { energy: -2, mood: 2 } }, { kind: 'district', transportDelta: -4, popularityDelta: 1 }] },
      { id: 'ignore', label: 'Не вмешиваться', description: 'Оставить проблему службам.', resultText: 'Ты не стал вмешиваться. Перегрузка сохранилась.', effects: [{ kind: 'district', transportDelta: 2 }] }
    ]
  },
  {
    id: 'story_district_cleanup', category: 'district', tone: 'neutral', trigger: 'district_cleanup',
    title: 'Субботник во дворе', text: 'Жители собираются привести двор в порядок.', responseDays: 2, cooldownDays: 18, defaultChoiceId: 'skip',
    choices: [
      { id: 'join', label: 'Присоединиться', description: 'Потратить два часа.', resultText: 'Вы очистили двор и привели территорию в порядок.', durationMinutes: 120, effects: [{ kind: 'needs', delta: { energy: -10, mood: 5 } }, { kind: 'district', servicesDelta: 5, popularityDelta: 4 }], followUp: { templateId: 'story_district_cleanup_followup', delayDays: 5 } },
      { id: 'donate', label: 'Дать 600 ₽ на материалы', description: 'Помочь без участия.', resultText: 'Ты оплатил часть расходников.', effects: [{ kind: 'money', amount: -600 }, { kind: 'district', servicesDelta: 3, popularityDelta: 2 }] },
      { id: 'skip', label: 'Не участвовать', description: 'Сохранить время и деньги.', resultText: 'Ты не участвовал в инициативе.', effects: [] }
    ]
  },
  {
    id: 'story_district_local_sale', category: 'district', tone: 'warning', trigger: 'district_local_sale',
    title: 'Заведение распродаёт остатки', text: '{organization} переживает тяжёлый период и распродаёт запасы.', responseDays: 1, cooldownDays: 15, defaultChoiceId: 'pass',
    choices: [
      { id: 'support', label: 'Поддержать покупкой', description: 'Потратить 900 ₽ и получить продукты.', resultText: 'Ты купил набор и поддержал заведение.', durationMinutes: 25, effects: [{ kind: 'money', amount: -900 }, { kind: 'household_food', productId: groceries, units: 4, shelfLifeDays: 5 }, { kind: 'organization', budgetDelta: 900, reputationDelta: 1 }] },
      { id: 'pass', label: 'Пройти мимо', description: 'Не тратить деньги.', resultText: 'Ты прошёл мимо распродажи.', effects: [] }
    ]
  },

  { id: 'story_work_understaffed_followup', category: 'work', tone: 'positive', trigger: 'follow_up', title: 'Помощь не забыли', text: '{npc} сообщает, что руководство отметило твою помощь.', responseDays: 2, cooldownDays: 0, defaultChoiceId: 'acknowledge', choices: [{ id: 'acknowledge', label: 'Принять благодарность', description: 'Зафиксировать результат.', resultText: 'Твоя позиция в коллективе стала крепче.', effects: [{ kind: 'relationship', delta: { trust: 4, affinity: 3 }, memoryKey: 'story_shift_help_remembered', memoryText: 'Коллектив запомнил твою помощь.', memoryTone: 'positive' }, { kind: 'job_experience', amount: 1 }] }] },
  { id: 'story_university_peer_followup', category: 'education', tone: 'positive', trigger: 'follow_up', title: 'Результат совместной подготовки', text: '{npc} пишет, что тема помогла на занятии.', responseDays: 2, cooldownDays: 0, defaultChoiceId: 'reply', choices: [{ id: 'reply', label: 'Ответить', description: 'Поддержать контакт.', resultText: 'Вы договорились ещё раз готовиться вместе.', durationMinutes: 5, effects: [{ kind: 'relationship', delta: { trust: 3, affinity: 2 }, memoryKey: 'story_study_result', memoryText: 'Совместная подготовка дала результат.', memoryTone: 'positive' }, { kind: 'university_knowledge', amount: 2 }] }] },
  { id: 'story_housing_inspection_followup', category: 'housing', tone: 'positive', trigger: 'follow_up', title: 'Проверка прошла спокойно', text: 'Владелец жилья не нашёл серьёзных проблем.', responseDays: 2, cooldownDays: 0, defaultChoiceId: 'close', choices: [{ id: 'close', label: 'Закрыть вопрос', description: 'Продолжить жить дальше.', resultText: 'Проверка завершилась без последствий.', effects: [{ kind: 'needs', delta: { mood: 4 } }] }] },
  { id: 'story_social_loan_followup', category: 'social', tone: 'neutral', trigger: 'follow_up', title: 'Долг возвращают', text: '{npc} возвращает деньги и благодарит за помощь.', responseDays: 3, cooldownDays: 0, defaultChoiceId: 'accept', choices: [{ id: 'accept', label: 'Принять деньги', description: 'Получить 1 500 ₽ обратно.', resultText: 'Деньги вернулись, доверие укрепилось.', effects: [{ kind: 'money', amount: 1500 }, { kind: 'relationship', delta: { trust: 5, affinity: 2 }, memoryKey: 'story_repaid_loan', memoryText: 'Долг был возвращён вовремя.', memoryTone: 'positive' }] }] },
  { id: 'story_finance_gig_followup', category: 'finance', tone: 'positive', trigger: 'follow_up', title: 'Новая рекомендация', text: 'Заказчик остался доволен разовой работой и передал твой контакт знакомому.', responseDays: 2, cooldownDays: 0, defaultChoiceId: 'accept', choices: [{ id: 'accept', label: 'Принять рекомендацию', description: 'Укрепить рабочую репутацию.', resultText: 'Тебя стали воспринимать как надёжного исполнителя.', effects: [{ kind: 'needs', delta: { mood: 4 } }] }] },
  { id: 'story_district_cleanup_followup', category: 'district', tone: 'positive', trigger: 'follow_up', title: 'Двор изменился', text: 'После уборки жители стали чаще проводить время во дворе.', responseDays: 2, cooldownDays: 0, defaultChoiceId: 'notice', choices: [{ id: 'notice', label: 'Посмотреть результат', description: 'Увидеть последствия решения.', resultText: 'Район стал немного приятнее и живее.', durationMinutes: 10, effects: [{ kind: 'district', servicesDelta: 2, popularityDelta: 2 }, { kind: 'needs', delta: { mood: 3 } }] }] }
];

export function getContextualStoryDefinition(id: string | undefined): ContextualStoryDefinition | undefined {
  return contextualStoryDefinitions.find((entry) => entry.id === id);
}
