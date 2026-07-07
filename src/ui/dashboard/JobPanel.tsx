import { formatRubles } from '../../core/economy';
import type { Job } from '../../types/job';
import type { JobId } from '../../types/ids';
import type { District, Location } from '../../types/location';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type JobView = {
  job: Job;
  location?: Location;
  district?: District;
  isCurrentJob: boolean;
  completedShifts: number;
  jobExperience: number;
  experienceRemaining: number;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
};

type JobPanelProps = {
  currentJobView?: JobView;
  onWorkShift: (jobId: JobId) => void;
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours > 0 && restMinutes > 0) return `${hours} ч ${restMinutes} мин`;
  if (hours > 0) return `${hours} ч`;

  return `${restMinutes} мин`;
}

function getJobShiftEffects(job: Job): EffectListItem[] {
  return [
    {
      label: 'Деньги',
      value: job.effects.moneyDelta,
      unit: '₽',
      tone: 'positive'
    },
    {
      label: 'Опыт',
      value: job.experiencePerShift,
      unit: 'XP',
      tone: 'positive'
    },
    {
      label: 'Время',
      value: -job.shiftDurationMinutes,
      unit: 'мин',
      tone: 'negative'
    },
    ...createNeedsEffectItems(job.effects.needsDelta)
  ];
}

export function JobPanel({ currentJobView, onWorkShift }: JobPanelProps) {
  if (!currentJobView) {
    return (
      <section className="panel job-panel">
        <div className="panel__header">
          <p className="panel__eyebrow">Работа</p>
          <h2 className="panel__title">Нет работы</h2>
        </div>
        <p className="empty-state">Ищи вакансии в городских местах: кофейни, магазины, салоны, склады, бизнес-центры.</p>
      </section>
    );
  }

  const { job, location, district, completedShifts, jobExperience, experienceRemaining, canWorkShift, shiftFailure } = currentJobView;
  const progressPercent = Math.min(100, Math.round((jobExperience / job.promotionThreshold) * 100));

  return (
    <section className="panel job-panel">
      <div className="panel__header">
        <p className="panel__eyebrow">Работа</p>
        <h2 className="panel__title">{job.title}</h2>
      </div>

      <div className="current-job-card current-job-card--workplace">
        <span>Рабочее место</span>
        <strong>{location?.name ?? 'Место не найдено'}</strong>
        <small>{district?.name ?? 'Район не найден'}</small>
      </div>

      <dl className="job-card__meta workplace-meta">
        <div>
          <dt>Смена</dt>
          <dd>{formatDuration(job.shiftDurationMinutes)}</dd>
        </div>
        <div>
          <dt>Оплата</dt>
          <dd>{formatRubles(job.wagePerShift)}</dd>
        </div>
        <div>
          <dt>Смены</dt>
          <dd>{completedShifts}</dd>
        </div>
        <div>
          <dt>Опыт</dt>
          <dd>{jobExperience} / {job.promotionThreshold}</dd>
        </div>
        <div>
          <dt>До повышения</dt>
          <dd>{experienceRemaining} XP</dd>
        </div>
        <div>
          <dt>Статус</dt>
          <dd>{canWorkShift ? 'На месте' : 'Недоступно'}</dd>
        </div>
      </dl>

      <div className="work-progress" aria-label="Прогресс работы">
        <div className="work-progress__bar" style={{ width: `${progressPercent}%` }} />
      </div>

      <EffectList items={getJobShiftEffects(job)} />

      <div className="job-card__actions">
        <button className="action-card__button" disabled={!canWorkShift} type="button" onClick={() => onWorkShift(job.id)}>
          Работать смену
        </button>
      </div>

      {!canWorkShift ? <p className="job-card__warning">{shiftFailure}</p> : null}
    </section>
  );
}
