import { formatRubles } from '../../core/economy';
import type { Job, JobLevel } from '../../types/job';
import type { JobId } from '../../types/ids';
import type { District, Location } from '../../types/location';
import { getSkillById } from '../../data/skills/basicSkills';
import { Icon } from '../icons';
import { WorkplaceScene } from '../visuals';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type JobView = {
  job: Job;
  location?: Location;
  district?: District;
  jobLevel: JobLevel;
  nextJobLevel?: JobLevel;
  currentLevel: number;
  maxLevel: number;
  isCurrentJob: boolean;
  completedShifts: number;
  jobExperience: number;
  levelExperience: number;
  levelExperienceRequired: number;
  promotionThreshold?: number;
  experienceRemaining: number;
  progressPercent: number;
  isMaxLevel: boolean;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
  canPromote: boolean;
  promotionFailure?: string;
  missingSkillRequirements: Array<{ name: string; currentLevel: number; minLevel: number }>;
};

type JobPanelProps = {
  currentJobView?: JobView;
  onPromoteJob: (jobId: JobId) => void;
  onWorkShift: (jobId: JobId) => void;
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours > 0 && restMinutes > 0) return `${hours} ч ${restMinutes} мин`;
  if (hours > 0) return `${hours} ч`;
  return `${restMinutes} мин`;
}

function getJobShiftEffects(job: Job, jobLevel: JobLevel): EffectListItem[] {
  return [
    { label: 'Деньги', value: jobLevel.wagePerShift, unit: '₽', tone: 'positive' },
    { label: 'Опыт работы', value: job.experiencePerShift, unit: 'XP', tone: 'positive' },
    ...(job.skillRewards ?? []).map((reward) => ({
      label: getSkillById(reward.skillId)?.name ?? 'Навык',
      value: reward.experience,
      unit: 'XP',
      tone: 'positive' as const
    })),
    { label: 'Время', value: -job.shiftDurationMinutes, unit: 'мин', tone: 'negative' },
    ...createNeedsEffectItems(job.effects.needsDelta)
  ];
}

function getCareerLevelState(level: JobLevel, currentLevel: number): 'complete' | 'active' | 'locked' {
  if (level.level < currentLevel) return 'complete';
  if (level.level === currentLevel) return 'active';
  return 'locked';
}

export function JobPanel({ currentJobView, onPromoteJob, onWorkShift }: JobPanelProps) {
  if (!currentJobView) {
    return (
      <section className="panel empty-workplace-panel cinematic-empty-state">
        <div className="cinematic-empty-state__visual"><WorkplaceScene /></div>
        <div className="empty-workplace-panel__icon"><Icon name="briefcase" size={28} /></div>
        <span className="section-kicker">Работа</span>
        <h2>Нет работы</h2>
        <p>Вакансии доступны в городских локациях.</p>
      </section>
    );
  }

  const {
    job,
    jobLevel,
    nextJobLevel,
    location,
    district,
    currentLevel,
    maxLevel,
    completedShifts,
    jobExperience,
    levelExperience,
    levelExperienceRequired,
    experienceRemaining,
    progressPercent,
    isMaxLevel,
    canPromote,
    promotionFailure,
    canWorkShift,
    shiftFailure
  } = currentJobView;

  return (
    <section className="workplace-screen">
      <section className="workplace-command-panel visual-panel">
        <WorkplaceScene />
        <div className="workplace-command-panel__overlay">
          <div className="workplace-command-panel__identity">
            <div className="workplace-mark"><Icon name="work" size={24} /></div>
            <div>
              <span className="section-kicker">Текущая работа · уровень {currentLevel}/{maxLevel}</span>
              <h2>{jobLevel.title}</h2>
              <p>{location?.name ?? 'Место не найдено'} · {district?.name ?? 'Район не найден'}</p>
            </div>
          </div>
          <span className={canWorkShift ? 'status-label status-label--success' : 'status-label'}>
            {canWorkShift ? 'На рабочем месте' : 'Вне рабочего места'}
          </span>
        </div>
      </section>

      <section className="panel workplace-progress-panel career-progress-panel visual-panel">
        <div className="progress-orbit" aria-hidden="true"><span>{progressPercent}%</span></div>
        <div className="section-heading">
          <div>
            <span className="section-kicker">Карьерный прогресс</span>
            <h2>{isMaxLevel ? 'Максимальная должность' : `Следующая: ${nextJobLevel?.title ?? '—'}`}</h2>
          </div>
          <strong className="progress-value">
            {isMaxLevel ? `${jobExperience} XP` : `${levelExperience} / ${levelExperienceRequired} XP`}
          </strong>
        </div>
        <div className="premium-progress" aria-label="Прогресс до повышения">
          <span style={{ width: `${progressPercent}%` }}><i /></span>
        </div>
        <div className="progress-caption">
          <span>Смен отработано: {completedShifts}</span>
          <span>{isMaxLevel ? 'Карьерная вершина достигнута' : `До повышения: ${experienceRemaining} XP`}</span>
        </div>

        <button
          className={`promotion-command-button ${canPromote ? 'promotion-command-button--ready' : ''}`}
          disabled={!canPromote}
          type="button"
          onClick={() => onPromoteJob(job.id)}
        >
          <span className="promotion-command-button__icon"><Icon name={isMaxLevel ? 'star' : 'sparkle'} size={19} /></span>
          <span>
            <strong>{isMaxLevel ? 'Максимальный уровень' : canPromote ? 'Получить повышение' : `Нужно ещё ${experienceRemaining} XP`}</strong>
            <small>{isMaxLevel ? jobLevel.title : nextJobLevel ? `${nextJobLevel.title} · ${formatRubles(nextJobLevel.wagePerShift)} за смену` : promotionFailure}</small>
          </span>
          {!isMaxLevel ? <Icon name="arrow" size={18} /> : null}
        </button>
      </section>

      <section className="panel career-ladder-panel visual-panel">
        <div className="section-heading section-heading--compact">
          <div><span className="section-kicker">Структура роста</span><h2>Карьерная лестница</h2></div>
          <span className="section-counter">{currentLevel}/{maxLevel}</span>
        </div>

        <div className="career-ladder" role="list" aria-label="Карьерные уровни">
          {job.levels.map((level, index) => {
            const state = getCareerLevelState(level, currentLevel);
            const experienceToReach = index === 0 ? 0 : job.levels[index - 1]?.promotionExperienceRequired;
            return (
              <div className={`career-level career-level--${state}`} key={level.level} role="listitem">
                <span className="career-level__index">0{level.level}</span>
                <div className="career-level__body">
                  <strong>{level.title}</strong>
                  <span>{formatRubles(level.wagePerShift)} за смену</span>
                </div>
                <div className="career-level__status">
                  {state === 'complete' ? 'Пройдено' : state === 'active' ? 'Текущий' : experienceToReach ? `${experienceToReach} XP` : 'Открыто'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel shift-panel visual-panel">
        <div className="shift-panel__glow" aria-hidden="true" />
        <div className="section-heading section-heading--compact">
          <div><span className="section-kicker">Рабочая смена</span><h2>{formatDuration(job.shiftDurationMinutes)}</h2></div>
          <strong className="shift-pay">{formatRubles(jobLevel.wagePerShift)}</strong>
        </div>
        <EffectList items={getJobShiftEffects(job, jobLevel)} />
        <button className="primary-command-button premium-cta" disabled={!canWorkShift} type="button" onClick={() => onWorkShift(job.id)}>
          <span>Начать смену</span><Icon name="arrow" size={18} />
        </button>
        {!canWorkShift ? <p className="inline-warning">{shiftFailure}</p> : null}
      </section>
    </section>
  );
}
