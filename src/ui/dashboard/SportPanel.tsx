import { useState } from 'react';
import { formatRubles } from '../../core/economy';
import type {
  BoxingGym,
  BoxingLevelProgress,
  BoxingOpponent,
  BoxingProfile,
  BoxingTournament,
  BoxingTrainer,
  BoxingTraining
} from '../../types/boxing';
import type {
  BoxingGymId,
  BoxingOpponentId,
  BoxingTournamentId,
  BoxingTrainerId,
  BoxingTrainingId
} from '../../types/ids';
import type { District, Location } from '../../types/location';
import type { NeedsState } from '../../types/needs';
import type { ScheduleStatus } from '../../types/schedule';
import { Icon } from '../icons';
import { createNeedsEffectItems, EffectList } from './EffectList';

const STAT_LABELS: Record<keyof BoxingProfile['stats'], string> = {
  technique: 'Техника',
  speed: 'Скорость',
  power: 'Удар',
  defense: 'Защита',
  stamina: 'Выносливость'
};

const SPECIALTY_LABELS: Record<BoxingTrainer['specialty'], string> = {
  balanced: 'Общий профиль',
  technique: 'Техника',
  speed: 'Скорость',
  power: 'Сила удара',
  defense: 'Защита',
  stamina: 'Выносливость'
};

const STYLE_LABELS: Record<BoxingOpponent['style'], string> = {
  outboxer: 'Дистанционный',
  pressure: 'Темповик',
  counterpuncher: 'Контрпанчер',
  slugger: 'Силовик',
  balanced: 'Универсал'
};

export type BoxingPanelState = {
  profile: BoxingProfile;
  hasStartedBoxing: boolean;
  availableGyms: Array<{
    gym: BoxingGym;
    location?: Location;
    district?: District;
    scheduleStatus: ScheduleStatus;
    isAtGym: boolean;
    membershipActive: boolean;
    membershipFailure?: string;
  }>;
  levelProgress: BoxingLevelProgress;
  fatigueLabel: string;
  gym?: BoxingGym;
  gymLocation?: Location;
  gymScheduleStatus: ScheduleStatus;
  isAtGym: boolean;
  membershipActive: boolean;
  membershipFailure?: string;
  selectedTrainer?: BoxingTrainer;
  trainers: Array<{
    trainer: BoxingTrainer;
    selected: boolean;
    canSelect: boolean;
    failure?: string;
  }>;
  trainings: Array<{
    training: BoxingTraining;
    canTrain: boolean;
    failure?: string;
    sessionPrice: number;
    effectiveNeedsDelta: Partial<NeedsState>;
  }>;
  opponents: Array<{
    opponent: BoxingOpponent;
    canSpar: boolean;
    failure?: string;
  }>;
  tournaments: Array<{
    tournament: BoxingTournament;
    canEnter: boolean;
    failure?: string;
  }>;
};

type SportPanelProps = {
  state: BoxingPanelState;
  currentDay: number;
  onOpenCity: () => void;
  onBuyMembership: (gymId: BoxingGymId) => void;
  onChooseTrainer: (trainerId: BoxingTrainerId) => void;
  onTraining: (trainingId: BoxingTrainingId) => void;
  onSparring: (opponentId: BoxingOpponentId) => void;
  onTournament: (tournamentId: BoxingTournamentId) => void;
};

type CareerTab = 'overview' | 'training' | 'fights';

function SportCatalog({ onStart }: { onStart: () => void }) {
  return (
    <section className="sport-catalog">
      <header className="sport-catalog__header">
        <div><span className="section-kicker">Доступные направления</span><h2>Выбери спорт</h2></div>
        <p>Профиль спортсмена появится только после вступления в зал.</p>
      </header>
      <article className="sport-discipline-card panel">
        <span className="sport-discipline-card__icon"><Icon name="boxing" size={28} /></span>
        <div className="sport-discipline-card__copy">
          <strong>Бокс</strong>
          <span>Тренировки, тренер, спарринги и любительские турниры.</span>
        </div>
        <button className="primary-action" type="button" onClick={onStart}>Начать заниматься</button>
      </article>
    </section>
  );
}

function GymSelection({ state, onBack, onOpenCity, onBuyMembership }: {
  state: BoxingPanelState;
  onBack: () => void;
  onOpenCity: () => void;
  onBuyMembership: (gymId: BoxingGymId) => void;
}) {
  return (
    <section className="sport-gym-selection">
      <header className="sport-section-header">
        <button className="icon-button" type="button" aria-label="Назад" onClick={onBack}><Icon name="arrow" size={17} /></button>
        <div><span className="section-kicker">Бокс</span><h2>Выбери зал</h2></div>
      </header>
      {state.availableGyms.length > 0 ? (
        <div className="sport-gym-list">
          {state.availableGyms.map(({ gym, location, district, scheduleStatus, isAtGym, membershipFailure }) => (
            <article className="sport-gym-card panel" key={gym.id}>
              <div className="sport-gym-card__main">
                <span className="sport-gym-card__icon"><Icon name="gym" size={22} /></span>
                <div><strong>{gym.name}</strong><span>{district?.name ?? 'Район'} · {location?.address ?? 'Адрес не указан'}</span></div>
              </div>
              <div className="sport-gym-card__meta">
                <span className={scheduleStatus.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>{scheduleStatus.label}</span>
                <strong>{formatRubles(gym.monthlyPrice)} / 30 дней</strong>
              </div>
              {isAtGym ? (
                <button className="primary-action" disabled={Boolean(membershipFailure)} type="button" onClick={() => onBuyMembership(gym.id)}>Оформить абонемент</button>
              ) : (
                <button className="secondary-command-button" type="button" onClick={onOpenCity}><Icon name="pin" size={16} />Найти в городе</button>
              )}
              {isAtGym && membershipFailure ? <small className="unavailable-reason">{membershipFailure}</small> : null}
            </article>
          ))}
        </div>
      ) : <div className="empty-state compact-empty-state">В текущем городе боксёрских залов пока нет.</div>}
    </section>
  );
}

function CareerSummary({ state, currentDay }: { state: BoxingPanelState; currentDay: number }) {
  const membershipDays = state.profile.membership ? Math.max(0, state.profile.membership.expiresOnDay - currentDay) : 0;
  return (
    <section className="panel sport-career-summary">
      <div className="sport-career-summary__identity">
        <span><Icon name="boxing" size={24} /></span>
        <div><strong>Бокс</strong><small>{state.gym?.name ?? 'Зал не выбран'} · {state.gymLocation?.address ?? 'Адрес не указан'}</small></div>
      </div>
      <div className="sport-career-summary__metrics">
        <span><small>Уровень</small><strong>{state.levelProgress.level}</strong></span>
        <span><small>Рейтинг</small><strong>{state.profile.rating}</strong></span>
        <span><small>Форма</small><strong>{state.profile.form}%</strong></span>
        <span><small>Абонемент</small><strong>{state.membershipActive ? `${membershipDays} дн.` : 'Истёк'}</strong></span>
      </div>
    </section>
  );
}

export function SportPanel({
  state,
  currentDay,
  onOpenCity,
  onBuyMembership,
  onChooseTrainer,
  onTraining,
  onSparring,
  onTournament
}: SportPanelProps) {
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [careerTab, setCareerTab] = useState<CareerTab>('overview');
  const { profile } = state;

  if (!state.hasStartedBoxing) {
    return selectionOpen
      ? <GymSelection state={state} onBack={() => setSelectionOpen(false)} onOpenCity={onOpenCity} onBuyMembership={onBuyMembership} />
      : <SportCatalog onStart={() => setSelectionOpen(true)} />;
  }

  return (
    <section className="boxing-screen boxing-screen--compact">
      <CareerSummary state={state} currentDay={currentDay} />

      <nav className="sport-career-tabs" aria-label="Разделы бокса">
        <button className={careerTab === 'overview' ? 'is-active' : ''} type="button" onClick={() => setCareerTab('overview')}>Профиль</button>
        <button className={careerTab === 'training' ? 'is-active' : ''} type="button" onClick={() => setCareerTab('training')}>Тренировки</button>
        <button className={careerTab === 'fights' ? 'is-active' : ''} type="button" onClick={() => setCareerTab('fights')}>Бои</button>
      </nav>

      {careerTab === 'overview' ? (
        <div className="sport-section-stack">
          <section className="panel boxing-gym-panel boxing-gym-panel--compact">
            <div className="section-heading section-heading--compact">
              <div><span className="section-kicker">Зал</span><h2>{state.gym?.name ?? 'Зал не найден'}</h2></div>
              <span className={`schedule-badge ${state.gymScheduleStatus.isOpen ? 'schedule-badge--open' : 'schedule-badge--closed'}`}>{state.gymScheduleStatus.shortLabel}</span>
            </div>
            <div className="boxing-membership-status">
              <div><span>Тренер</span><strong>{state.selectedTrainer?.name ?? 'Не выбран'}</strong></div>
              <div><span>Состояние</span><strong>{state.fatigueLabel}</strong></div>
            </div>
            {!state.isAtGym ? <button className="secondary-command-button" type="button" onClick={onOpenCity}><Icon name="pin" size={16} />Перейти к залу</button> : null}
            {!state.membershipActive && state.gym ? (
              <button className="primary-action" disabled={Boolean(state.membershipFailure)} type="button" onClick={() => onBuyMembership(state.gym!.id)}>
                <span>Продлить абонемент</span><strong>{formatRubles(state.gym.monthlyPrice)}</strong>
              </button>
            ) : null}
          </section>

          <section className="panel boxing-stats-panel boxing-stats-panel--compact">
            <div className="section-heading section-heading--compact"><div><span className="section-kicker">Профиль</span><h2>Характеристики</h2></div></div>
            <div className="boxing-stats-grid">
              {(Object.entries(profile.stats) as Array<[keyof BoxingProfile['stats'], number]>).map(([statId, value]) => (
                <div className="boxing-stat" key={statId}><div><span>{STAT_LABELS[statId]}</span><strong>{value}</strong></div><span className="progress-track"><i style={{ width: `${value}%` }} /></span></div>
              ))}
            </div>
          </section>

          <section className="panel boxing-trainers-panel">
            <div className="section-heading section-heading--compact"><div><span className="section-kicker">Команда</span><h2>Тренер</h2></div></div>
            <div className="boxing-card-grid boxing-card-grid--trainers">
              {state.trainers.map(({ trainer, selected, canSelect, failure }) => (
                <article className={`boxing-card boxing-trainer-card ${selected ? 'boxing-card--selected' : ''}`} key={trainer.id}>
                  <div className="boxing-card__top"><Icon name="character" size={18} /><span>{selected ? 'Выбран' : SPECIALTY_LABELS[trainer.specialty]}</span></div>
                  <h3>{trainer.name}</h3>
                  <div className="boxing-card__meta"><span>Занятие</span><strong>{trainer.sessionPrice ? formatRubles(trainer.sessionPrice) : 'Включено'}</strong></div>
                  <button disabled={!canSelect || selected} type="button" onClick={() => onChooseTrainer(trainer.id)}>{selected ? 'Текущий' : 'Выбрать'}</button>
                  {failure && !selected ? <small className="unavailable-reason">{failure}</small> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {careerTab === 'training' ? (
        <section className="panel boxing-training-panel">
          <div className="section-heading section-heading--compact"><div><span className="section-kicker">Подготовка</span><h2>Тренировки</h2></div><span className="section-counter">{state.trainings.length}</span></div>
          <div className="boxing-card-grid">
            {state.trainings.map(({ training, canTrain, failure, sessionPrice, effectiveNeedsDelta }) => (
              <article className="boxing-card boxing-training-card" key={training.id}>
                <div className="boxing-card__top"><Icon name="boxing" size={18} /><span>{training.durationMinutes} мин</span></div>
                <h3>{training.name}</h3>
                <div className="boxing-reward-list">
                  {(Object.entries(training.statRewards) as Array<[keyof BoxingProfile['stats'], number]>).map(([statId, value]) => <span key={statId}>+{value} {STAT_LABELS[statId]}</span>)}
                  <span>+{training.experienceReward} XP</span>
                </div>
                <EffectList items={createNeedsEffectItems(effectiveNeedsDelta)} />
                <button disabled={!canTrain} type="button" onClick={() => onTraining(training.id)}><span>Начать</span><strong>{sessionPrice ? formatRubles(sessionPrice) : 'Включено'}</strong></button>
                {failure ? <small className="unavailable-reason">{failure}</small> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {careerTab === 'fights' ? (
        <div className="sport-section-stack">
          <section className="panel boxing-sparring-panel">
            <div className="section-heading section-heading--compact"><div><span className="section-kicker">Практика</span><h2>Спарринги</h2></div><span className="section-counter">{profile.sparringCount}</span></div>
            <div className="boxing-opponents-list">
              {state.opponents.map(({ opponent, canSpar, failure }) => (
                <article className="boxing-opponent-row" key={opponent.id}>
                  <div className="boxing-opponent-row__rank">{opponent.rating}</div>
                  <div className="boxing-opponent-row__identity"><strong>{opponent.name}</strong><span>{opponent.weightKg} кг · {STYLE_LABELS[opponent.style]}</span></div>
                  <button disabled={!canSpar} type="button" onClick={() => onSparring(opponent.id)}>Спарринг</button>
                  {failure ? <small className="unavailable-reason">{failure}</small> : null}
                </article>
              ))}
            </div>
          </section>

          {state.tournaments.map(({ tournament, canEnter, failure }) => (
            <section className="panel boxing-tournament-panel boxing-tournament-panel--compact" key={tournament.id}>
              <div><span className="section-kicker">Турнир</span><h2>{tournament.name}</h2><small>{failure ?? `Взнос ${formatRubles(tournament.entryFee)}`}</small></div>
              <button disabled={!canEnter} type="button" onClick={() => onTournament(tournament.id)}>Участвовать</button>
            </section>
          ))}

          <section className="panel boxing-history-panel">
            <div className="section-heading section-heading--compact"><div><span className="section-kicker">Архив</span><h2>История боёв</h2></div><span className="section-counter">{profile.fightHistory.length}</span></div>
            {profile.fightHistory.length ? (
              <div className="boxing-history-list">
                {profile.fightHistory.map((fight) => (
                  <article className={`boxing-history-row boxing-history-row--${fight.result}`} key={fight.id}>
                    <span>{fight.kind === 'sparring' ? 'Спарринг' : fight.tournamentName ?? 'Турнир'}</span>
                    <div><strong>{fight.opponentName}</strong><small>День {fight.day} · {fight.method}</small></div>
                    <b>{fight.result === 'win' ? 'Победа' : fight.result === 'loss' ? 'Поражение' : 'Ничья'}</b>
                  </article>
                ))}
              </div>
            ) : <div className="empty-state compact-empty-state">Боёв ещё не было</div>}
          </section>
        </div>
      ) : null}
    </section>
  );
}
