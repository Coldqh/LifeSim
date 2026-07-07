import type { LifeLogEntry } from '../../state';

type LifeLogProps = {
  entries: LifeLogEntry[];
};

export function LifeLog({ entries }: LifeLogProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <p className="panel__eyebrow">Архив</p>
        <h2 className="panel__title">Лог жизни</h2>
      </div>

      <div className="life-log">
        {entries.map((entry) => (
          <article className="life-log__entry" key={entry.id}>
            <span className="life-log__time">
              День {entry.day}, {entry.timeLabel}
            </span>
            <strong>{entry.title}</strong>
            <p>{entry.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
