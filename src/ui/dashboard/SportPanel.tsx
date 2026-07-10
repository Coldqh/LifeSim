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
import type { Location } from '../../types/location';
import type { NeedsState } from '../../types/needs';
import type { ScheduleStatus } from '../../types/schedule';
import { Icon } from '../icons';
import { createNeedsEffectItems, EffectList } from './EffectList';

const STAT_LABELS: Record<keyof BoxingProfile['stats'], string> = {
  technique: 'Техника',
  speed: 'Скорость',
  power: 'Сила удара',
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
  onBuyMembership: (gymId: BoxingGymId) => void;
  onChooseTrainer: (trainerId: BoxingTrainerId) => void;
  onTraining: (trainingId: BoxingTrainingId) => void;
  onSparring: (opponentId: BoxingOpponentId) => void;
  onTournament: (tournamentId: BoxingTournamentId) => void;
};

function RecordLine({ label, record }: { label: string; record: BoxingProfile['officialRecord'] }) {
  return (
    <div className="boxing-record-line">
      <span>{label}</span>
      <strong>{record.wins}-{record.losses}-{record.draws}</strong>
    </div>
  );
}

export function SportPanel({
  state,
  currentDay,
  onBuyMembership,
  onChooseTrainer,
  onTraining,
  onSparring,
  onTournament
}: SportPanelProps) {
  const { profile, gym, gymLocation, levelProgress } = state;
  const membershipDays = profile.membership ? Math.max(0, profile.membership.expiresOnDay - currentDay) : 0;

  return (
    <section className="boxing-screen">
      <section className="boxing-hero panel visual-panel">
        <div className="boxing-hero__grid" aria-hidden="true" />
        <div className="boxing-hero__glove" aria-hidden="true"><Icon name="boxing" size={64} /></div>
        <div className="boxing-hero__content">
          <span className="section-kicker">Спортивная карьера</span>
          <h2>Любительский бокс</h2>
          <p>{gym?.name ?? 'Боксёрский зал'} · {gymLocation?.address ?? 'Москва'}</p>
          <div className="boxing-hero__metrics">
            <div><span>Уровень</span><strong>{levelProgress.level}</strong></div>
            <div><span>Рейтинг</span><strong>{profile.rating}</strong></div>
            <div><span>Форма</span><strong>{profile.form}%</strong></div>
            <div><span>Усталость</span><strong>{profile.fatigue}%</strong></div>
          </div>
        </div>
        <div className="boxing-hero__records">
          <RecordLine label="Официальный рекорд" record={profile.officialRecord} />
          <RecordLine label="Спарринги" record={profile.sparringRecord} />
          <div className="boxing-level-progress">
            <div><span>Опыт бокса</span><strong>{levelProgress.isMaxLevel ? 'MAX' : `${levelProgress.currentLevelExperience}/${levelProgress.nextLevelExperience} XP`}</strong></div>
            <span className="progress-track"><i style={{ width: `${levelProgress.progressPercent}%` }} /></span>
          </div>
        </div>
      </section>

      <div className="boxing-overview-grid">
        <section className="panel boxing-gym-panel">
          <div className="section-heading section-heading--compact">
            <div><span className="section-kicker">Клуб</span><h2>{gym?.name ?? 'Зал не найден'}</h2></div>
            <span className={`schedule-badge ${state.gymScheduleStatus.isOpen ? 'schedule-badge--open' : 'schedule-badge--closed'}`}>{state.gymScheduleStatus.shortLabel}</span>
          </div>
          <div className="boxing-location-row">
            <Icon name="pin" size={17} />
            <div><strong>{gymLocation?.name ?? 'Нет локации'}</strong><span>{gymLocation?.address ?? 'Адрес неизвестен'}</span></div>
          </div>
          <div className="boxing-membership-status">
            <div>
              <span>Абонемент</span>
              <strong>{state.membershipActive ? `Активен · ${membershipDays} дн.` : 'Не оформлен'}</strong>
            </div>
            <div>
              <span>Тренер</span>
              <strong>{state.selectedTrainer?.name ?? 'Не выбран'}</strong>
            </div>
          </div>
          {!state.isAtGym ? <p className="boxing-warning">Для действий нужно приехать в зал через вкладку «Город».</p> : null}
          <button
            className="primary-action boxing-primary-action"
            disabled={!gym || Boolean(state.membershipFailure)}
            type="button"
            onClick={() => gym && onBuyMembership(gym.id)}
          >
            <span>{state.membershipActive ? 'Продлить на 30 дней' : 'Купить на 30 дней'}</span>
            <strong>{gym ? formatRubles(gym.monthlyPrice) : '—'}</strong>
          </button>
          {state.membershipFailure ? <small className="unavailable-reason">{state.membershipFailure}</small> : null}
        </section>

        <section className="panel boxing-readiness-panel">
          <div className="section-heading section-heading--compact">
            <div><span className="section-kicker">Готовность</span><h2>{state.fatigueLabel}</h2></div>
            <Icon name="pulse" size={22} />
          </div>
          <div className="boxing-readiness-row"><span>Форма</span><strong>{profile.form}/100</strong><i><b style={{ width: `${profile.form}%` }} /></i></div>
          <div className="boxing-readiness-row boxing-readiness-row--fatigue"><span>Усталость</span><strong>{profile.fatigue}/100</strong><i><b style={{ width: `${profile.fatigue}%` }} /></i></div>
          <p>Сон и отдых снижают спортивную усталость. Высокая нагрузка режет эффективность тренировок.</p>
        </section>
      </div>

      <section className="panel boxing-stats-panel">
        <div className="section-heading"><div><span className="section-kicker">Профиль бойца</span><h2>Характеристики</h2></div></div>
        <div className="boxing-stats-grid">
          {(Object.entries(profile.stats) as Array<[keyof BoxingProfile['stats'], number]>).map(([statId, value]) => (
            <div className="boxing-stat" key={statId}>
              <div><span>{STAT_LABELS[statId]}</span><strong>{value}</strong></div>
              <span className="progress-track"><i style={{ width: `${value}%` }} /></span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel boxing-trainers-panel">
        <div className="section-heading"><div><span className="section-kicker">Команда</span><h2>Тренеры</h2></div><span className="section-counter">{state.trainers.length}</span></div>
        <div className="boxing-card-grid boxing-card-grid--trainers">
          {state.trainers.map(({ trainer, selected, canSelect, failure }) => (
            <article className={`boxing-card boxing-trainer-card ${selected ? 'boxing-card--selected' : ''}`} key={trainer.id}>
              <div className="boxing-card__top"><Icon name="character" size={22} /><span>{selected ? 'Выбран' : SPECIALTY_LABELS[trainer.specialty]}</span></div>
              <h3>{trainer.name}</h3>
              <div className="boxing-card__meta"><span>Занятие</span><strong>{trainer.sessionPrice ? formatRubles(trainer.sessionPrice) : 'Включено'}</strong></div>
              <div className="boxing-card__meta"><span>XP</span><strong>×{trainer.experienceMultiplier.toFixed(2)}</strong></div>
              <button disabled={!canSelect || selected} type="button" onClick={() => onChooseTrainer(trainer.id)}>{selected ? 'Текущий тренер' : 'Выбрать'}</button>
              {failure && !selected ? <small className="unavailable-reason">{failure}</small> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel boxing-training-panel">
        <div className="section-heading"><div><span className="section-kicker">Подготовка</span><h2>Тренировки</h2></div><span className="section-counter">{state.trainings.length}</span></div>
        <div className="boxing-card-grid">
          {state.trainings.map(({ training, canTrain, failure, sessionPrice, effectiveNeedsDelta }) => (
            <article className="boxing-card boxing-training-card" key={training.id}>
              <div className="boxing-card__top"><Icon name="boxing" size={22} /><span>{training.durationMinutes} мин</span></div>
              <h3>{training.name}</h3>
              <div className="boxing-reward-list">
                {(Object.entries(training.statRewards) as Array<[keyof BoxingProfile['stats'], number]>).map(([statId, value]) => <span key={statId}>+{value} {STAT_LABELS[statId]}</span>)}
                <span>+{training.experienceReward} XP</span>
                <span>+{training.fatigueDelta} усталость</span>
              </div>
              <EffectList items={createNeedsEffectItems(effectiveNeedsDelta)} />
              <button disabled={!canTrain} type="button" onClick={() => onTraining(training.id)}><span>Начать</span><strong>{sessionPrice ? formatRubles(sessionPrice) : 'Включено'}</strong></button>
              {failure ? <small className="unavailable-reason">{failure}</small> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel boxing-sparring-panel">
        <div className="section-heading"><div><span className="section-kicker">Практика</span><h2>Спарринг-партнёры</h2></div><span className="section-counter">{profile.sparringCount}</span></div>
        <div className="boxing-opponents-list">
          {state.opponents.map(({ opponent, canSpar, failure }) => (
            <article className="boxing-opponent-row" key={opponent.id}>
              <div className="boxing-opponent-row__rank">{opponent.rating}</div>
              <div className="boxing-opponent-row__identity"><strong>{opponent.name}</strong><span>{opponent.age} лет · {opponent.weightKg} кг · {opponent.club}</span></div>
              <div className="boxing-opponent-row__style">{STYLE_LABELS[opponent.style]}</div>
              <button disabled={!canSpar} type="button" onClick={() => onSparring(opponent.id)}>Спарринг</button>
              {failure ? <small className="unavailable-reason">{failure}</small> : null}
            </article>
          ))}
        </div>
      </section>

      {state.tournaments.map(({ tournament, canEnter, failure }) => (
        <section className="panel boxing-tournament-panel visual-panel" key={tournament.id}>
          <div className="boxing-tournament-panel__mark"><Icon name="star" size={34} /></div>
          <div className="boxing-tournament-panel__content">
            <span className="section-kicker">Ближайший старт</span>
            <h2>{tournament.name}</h2>
            <div className="boxing-tournament-requirements">
              <span>Спарринги {profile.sparringCount}/{tournament.minSparrings}</span>
              <span>Техника {profile.stats.technique}/{tournament.minTechnique}</span>
              <span>Выносливость {profile.stats.stamina}/{tournament.minStamina}</span>
              <span>Форма {profile.form}/{tournament.minForm}</span>
              <span>Усталость ≤ {tournament.maxFatigue}</span>
            </div>
            {failure ? <small className="unavailable-reason">{failure}</small> : null}
          </div>
          <button className="primary-action" disabled={!canEnter} type="button" onClick={() => onTournament(tournament.id)}><span>Войти в сетку</span><strong>{formatRubles(tournament.entryFee)}</strong></button>
        </section>
      ))}

      <section className="panel boxing-history-panel">
        <div className="section-heading"><div><span className="section-kicker">Архив</span><h2>История боёв</h2></div><span className="section-counter">{profile.fightHistory.length}</span></div>
        {profile.fightHistory.length ? (
          <div className="boxing-history-list">
            {profile.fightHistory.map((fight) => (
              <article className={`boxing-history-row boxing-history-row--${fight.result}`} key={fight.id}>
                <span>{fight.kind === 'sparring' ? 'Спарринг' : fight.tournamentName ?? 'Турнир'}</span>
                <div><strong>{fight.opponentName}</strong><small>День {fight.day} · {fight.method}</small></div>
                <b>{fight.result === 'win' ? 'Победа' : fight.result === 'loss' ? 'Поражение' : 'Ничья'}</b>
                <em>{fight.ratingDelta >= 0 ? '+' : ''}{fight.ratingDelta}</em>
              </article>
            ))}
          </div>
        ) : <div className="empty-state">Боёв ещё не было</div>}
      </section>
    </section>
  );
}
