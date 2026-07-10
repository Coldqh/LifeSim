import type { LifeLogEntry } from '../../state';
import { Icon } from '../icons';

type LifeLogProps = { entries: LifeLogEntry[] };

export function LifeLog({ entries }: LifeLogProps) {
  return (
    <section className="panel log-panel visual-panel">
      <div className="log-panel__aurora" aria-hidden="true"><i/><i/></div>
      <div className="section-heading section-heading--compact">
        <div><span className="section-kicker">Хронология</span><h2>Журнал жизни</h2></div>
        <span className="section-counter">{entries.length}</span>
      </div>

      <div className="timeline-list">
        {entries.map((entry, index) => (
          <article className="timeline-entry" key={entry.id}>
            <div className="timeline-entry__rail">
              <span><Icon name={index === 0 ? 'sparkle' : 'pulse'} size={14} /></span>
              {index < entries.length - 1 ? <i /> : null}
            </div>
            <div className="timeline-entry__content">
              <time>День {entry.day} · {entry.timeLabel}</time>
              <strong>{entry.title}</strong>
              <p>{entry.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
