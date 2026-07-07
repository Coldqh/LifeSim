type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'default' | 'good' | 'warning';
};

export function StatCard({ label, value, helper, tone = 'default' }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{label}</p>
      <strong className="stat-card__value">{value}</strong>
      {helper ? <span className="stat-card__helper">{helper}</span> : null}
    </article>
  );
}
