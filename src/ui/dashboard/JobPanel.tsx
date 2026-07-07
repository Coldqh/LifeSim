import { formatRubles } from '../../core/economy';
import type { Job } from '../../types/job';
import type { JobId } from '../../types/ids';
import type { Location } from '../../types/location';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type JobView = {
  job: Job;
  location?: Location;
  isCurrentJob: boolean;
  completedShifts: number;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
};

type JobPanelProps = {
  currentJob?: Job;
  jobs: JobView[];
  onApplyForJob: (jobId: JobId) => void;
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
      label: 'Время',
      value: -job.shiftDurationMinutes,
      unit: 'мин',
      tone: 'negative'
    },
    ...createNeedsEffectItems(job.effects.needsDelta)
  ];
}

export function JobPanel({ currentJob, jobs, onApplyForJob, onWorkShift }: JobPanelProps) {
  return (
    <section className="panel job-panel">
      <div className="panel__header">
        <p className="panel__eyebrow">Работа</p>
        <h2 className="panel__title">Вакансии и смены</h2>
      </div>

      <div className="current-job-card">
        <span>Текущая работа</span>
        <strong>{currentJob?.title ?? 'Нет работы'}</strong>
        <small>{currentJob ? 'Чтобы работать смену, надо быть на месте работы.' : 'Устройся на одну из доступных вакансий.'}</small>
      </div>

      <div className="job-list">
        {jobs.map((view) => (
          <article className={`job-card ${view.isCurrentJob ? 'job-card--active' : ''}`} key={view.job.id}>
            <div>
              <p className="panel__eyebrow">{view.location?.name ?? 'Место не найдено'}</p>
              <h3>{view.job.title}</h3>
              <p>{view.job.description}</p>
            </div>

            <dl className="job-card__meta">
              <div>
                <dt>Смена</dt>
                <dd>{formatDuration(view.job.shiftDurationMinutes)}</dd>
              </div>
              <div>
                <dt>Оплата</dt>
                <dd>{formatRubles(view.job.wagePerShift)}</dd>
              </div>
              <div>
                <dt>Смены</dt>
                <dd>{view.completedShifts}</dd>
              </div>
            </dl>

            <EffectList items={getJobShiftEffects(view.job)} />

            <div className="job-card__actions">
              <button
                className="secondary-button"
                disabled={view.isCurrentJob || !view.canApply}
                type="button"
                onClick={() => onApplyForJob(view.job.id)}
              >
                {view.isCurrentJob ? 'Устроен' : 'Устроиться'}
              </button>

              <button
                className="action-card__button"
                disabled={!view.canWorkShift}
                type="button"
                onClick={() => onWorkShift(view.job.id)}
              >
                Работать смену
              </button>
            </div>

            {!view.canApply && !view.isCurrentJob ? <p className="job-card__warning">{view.applicationFailure}</p> : null}
            {!view.canWorkShift ? <p className="job-card__warning">{view.shiftFailure}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
