import { formatRubles } from '../../core/economy';
import type { Job } from '../../types/job';
import type { JobId } from '../../types/ids';
import type { District, Location } from '../../types/location';
import { Icon } from '../icons';
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
    { label: 'Деньги', value: job.effects.moneyDelta, unit: '₽', tone: 'positive' },
    { label: 'Опыт', value: job.experiencePerShift, unit: 'XP', tone: 'positive' },
    { label: 'Время', value: -job.shiftDurationMinutes, unit: 'мин', tone: 'negative' },
    ...createNeedsEffectItems(job.effects.needsDelta)
  ];
}

export function JobPanel({ currentJobView, onWorkShift }: JobPanelProps) {
  if (!currentJobView) {
    return (
      <section className="panel empty-workplace-panel">
        <div className="empty-workplace-panel__icon"><Icon name="briefcase" size={28} /></div>
        <span className="section-kicker">Работа</span>
        <h2>Нет работы</h2>
        <p>Вакансии доступны в городских локациях.</p>
      </section>
    );
  }

  const { job, location, district, completedShifts, jobExperience, experienceRemaining, canWorkShift, shiftFailure } = currentJobView;
  const progressPercent = Math.min(100, Math.round((jobExperience / job.promotionThreshold) * 100));

  return (
    <section className="workplace-screen">
      <section className="workplace-command-panel">
        <div className="workplace-command-panel__identity">
          <div className="workplace-mark"><Icon name="work" size={24} /></div>
          <div>
            <span className="section-kicker">Текущая работа</span>
            <h2>{job.title}</h2>
            <p>{location?.name ?? 'Место не найдено'} · {district?.name ?? 'Район не найден'}</p>
          </div>
        </div>
        <span className={canWorkShift ? 'status-label status-label--success' : 'status-label'}>
          {canWorkShift ? 'На рабочем месте' : 'Вне рабочего места'}
        </span>
      </section>

      <section className="panel workplace-progress-panel">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Профессиональный рост</span>
            <h2>Опыт работы</h2>
          </div>
          <strong className="progress-value">{jobExperience} / {job.promotionThreshold} XP</strong>
        </div>
        <div className="premium-progress" aria-label="Прогресс работы">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="progress-caption">
          <span>Смен отработано: {completedShifts}</span>
          <span>До повышения: {experienceRemaining} XP</span>
        </div>
      </section>

      <section className="panel shift-panel">
        <div className="section-heading section-heading--compact">
          <div>
            <span className="section-kicker">Рабочая смена</span>
            <h2>{formatDuration(job.shiftDurationMinutes)}</h2>
          </div>
          <strong className="shift-pay">{formatRubles(job.wagePerShift)}</strong>
        </div>
        <EffectList items={getJobShiftEffects(job)} />
        <button className="primary-command-button" disabled={!canWorkShift} type="button" onClick={() => onWorkShift(job.id)}>
          <span>Начать смену</span>
          <Icon name="arrow" size={18} />
        </button>
        {!canWorkShift ? <p className="inline-warning">{shiftFailure}</p> : null}
      </section>
    </section>
  );
}
