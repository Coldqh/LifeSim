import { formatRubles } from '../../core/economy';
import type { Npc } from '../../types/npc';
import type { ActiveSocialEvent } from '../../types/socialEvent';
import type { SocialEventChoiceId } from '../../types/ids';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';
import { Icon } from '../icons';

export type SocialEventModalProps = {
  event?: ActiveSocialEvent;
  npc?: Npc;
  onChoose: (choiceId: SocialEventChoiceId) => void;
};

function choiceEffects(choice: ActiveSocialEvent['choices'][number]): EffectListItem[] {
  const items: EffectListItem[] = [];
  if (choice.durationMinutes) items.push({ label: 'Время', value: -choice.durationMinutes, unit: ' мин', tone: 'negative' });
  if (choice.moneyDelta) items.push({ label: 'Деньги', value: choice.moneyDelta, unit: ' ₽', tone: choice.moneyDelta > 0 ? 'positive' : 'negative' });
  items.push(...createNeedsEffectItems(choice.needsDelta));
  return items;
}

export function SocialEventModal({ event, npc, onChoose }: SocialEventModalProps) {
  if (!event || !npc || event.source === 'story') return null;

  return (
    <div className="social-event-backdrop" role="presentation">
      <section aria-labelledby="social-event-title" aria-modal="true" className="social-event-modal" role="dialog">
        <header className="social-event-modal__header">
          <span className="social-event-modal__avatar">{npc.firstName.slice(0, 1)}{npc.lastName.slice(0, 1)}</span>
          <div>
            <span className="section-kicker">{event.source === 'scheduled' ? 'Последствие' : 'Событие'}</span>
            <h2 id="social-event-title">{event.title}</h2>
            <p>{npc.firstName} {npc.lastName}</p>
          </div>
          <Icon name="users" size={22} />
        </header>
        <div className="social-event-modal__body">
          <p>{event.text}</p>
          <div className="social-event-modal__choices">
            {event.choices.filter((choice) => !choice.expiryOnly).map((choice) => (
              <button key={choice.id} type="button" onClick={() => onChoose(choice.id)}>
                <span className="social-event-modal__choice-title"><strong>{choice.label}</strong><Icon name="arrow" size={16} /></span>
                <small>{choice.resultText}</small>
                {choice.moneyDelta ? <span className="social-event-modal__money">{choice.moneyDelta > 0 ? '+' : '-'}{formatRubles(Math.abs(choice.moneyDelta))}</span> : null}
                <EffectList items={choiceEffects(choice)} />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
