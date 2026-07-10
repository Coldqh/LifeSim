import { Icon, type IconName } from '../icons';

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  progress?: number;
  tone?: 'default' | 'good' | 'warning';
  icon?: IconName;
};

export function StatCard({ label, value, helper, progress, tone = 'default', icon = 'pulse' }: StatCardProps) {
  const normalizedProgress = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : undefined;

  return (
    <article className={`vital-card vital-card--${tone}`}>
      <div className="vital-card__flare" aria-hidden="true" />
      <div className="vital-card__header">
        <span className="vital-card__label"><Icon name={icon} size={17} />{label}</span>
        <strong>{value}</strong>
      </div>
      {normalizedProgress !== undefined ? (
        <div className="vital-card__track" aria-label={`${label}: ${normalizedProgress} из 100`}>
          <span style={{ width: `${normalizedProgress}%` }}><i /></span>
        </div>
      ) : null}
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}
