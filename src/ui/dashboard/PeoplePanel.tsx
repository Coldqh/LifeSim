import { useMemo, useState } from 'react';
import { getRelationshipStatusLabel } from '../../core/relationships';
import type { NpcId, NpcInteractionId } from '../../types/ids';
import type { RelationshipStatus, SocialNpcView } from '../../types/relationship';
import type { SocialHistoryEntry } from '../../types/socialEvent';
import { Icon } from '../icons';

export type PeoplePanelProps = {
  currentPeople: SocialNpcView[];
  knownPeople: SocialNpcView[];
  scheduledCount: number;
  history: SocialHistoryEntry[];
  onInteract: (npcId: NpcId, interactionId: NpcInteractionId) => void;
};

type PeopleFilter = 'all' | 'work' | 'boxing' | 'friends' | 'conflicts';

const INTEREST_LABELS: Record<string, string> = {
  sport: 'Спорт',
  career: 'Карьера',
  nightlife: 'Ночная жизнь',
  education: 'Учёба',
  money: 'Деньги',
  culture: 'Культура',
  food: 'Еда',
  city: 'Город'
};


function statusTone(status: RelationshipStatus): string {
  if (status === 'friend' || status === 'close_friend') return 'positive';
  if (status === 'tense' || status === 'dislike' || status === 'conflict') return 'negative';
  return 'neutral';
}

function matchesFilter(view: SocialNpcView, filter: PeopleFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'work') return view.isColleague || view.context === 'work';
  if (filter === 'boxing') return view.context === 'boxing' || view.role?.category === 'sport';
  if (filter === 'friends') return view.status === 'friend' || view.status === 'close_friend';
  return view.status === 'tense' || view.status === 'dislike' || view.status === 'conflict';
}

function initials(view: SocialNpcView): string {
  return `${view.npc.firstName.slice(0, 1)}${view.npc.lastName.slice(0, 1)}`;
}

function PeopleList({
  views,
  selectedId,
  onSelect
}: {
  views: SocialNpcView[];
  selectedId?: string;
  onSelect: (view: SocialNpcView) => void;
}) {
  if (views.length === 0) {
    return <div className="people-directory__empty"><Icon name="users" size={24} /><span>Подходящих людей пока нет</span></div>;
  }

  return (
    <div className="people-directory__list">
      {views.map((view) => (
        <button
          className={`people-directory-row ${selectedId === String(view.npc.id) ? 'people-directory-row--active' : ''}`}
          key={view.npc.id}
          type="button"
          onClick={() => onSelect(view)}
        >
          <span className="people-directory-row__avatar">{initials(view)}</span>
          <span className="people-directory-row__body">
            <strong>{view.npc.firstName} {view.npc.lastName}</strong>
            <small>{view.role?.name ?? 'Житель города'} · {view.npc.age} лет</small>
          </span>
          <span className={`people-directory-row__status people-directory-row__status--${statusTone(view.status)}`}>
            {view.isPresent ? 'Рядом' : getRelationshipStatusLabel(view.status)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function PeoplePanel({ currentPeople, knownPeople, scheduledCount, history, onInteract }: PeoplePanelProps) {
  const [mode, setMode] = useState<'current' | 'known'>('current');
  const [filter, setFilter] = useState<PeopleFilter>('all');
  const source = mode === 'current' ? currentPeople : knownPeople;
  const filtered = useMemo(() => source.filter((view) => matchesFilter(view, filter)), [source, filter]);
  const [selectedId, setSelectedId] = useState<string>();
  const selected = filtered.find((view) => String(view.npc.id) === selectedId) ?? filtered[0];

  return (
    <section className="people-screen-grid">
      <section className="panel people-directory visual-panel">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Социальная сеть города</span>
            <h2>Люди</h2>
          </div>
          <div className="people-directory__counts">
            <span>Рядом <strong>{currentPeople.length}</strong></span>
            <span>Знакомые <strong>{knownPeople.length}</strong></span>
            <span>Ожидают <strong>{scheduledCount}</strong></span>
          </div>
        </div>

        <div className="people-directory__mode">
          <button className={mode === 'current' ? 'active' : ''} type="button" onClick={() => { setMode('current'); setSelectedId(undefined); }}>Сейчас рядом</button>
          <button className={mode === 'known' ? 'active' : ''} type="button" onClick={() => { setMode('known'); setSelectedId(undefined); }}>Знакомые</button>
        </div>

        <div className="people-directory__filters">
          {([
            ['all', 'Все'],
            ['work', 'Работа'],
            ['boxing', 'Бокс'],
            ['friends', 'Друзья'],
            ['conflicts', 'Конфликты']
          ] as Array<[PeopleFilter, string]>).map(([id, label]) => (
            <button className={filter === id ? 'active' : ''} key={id} type="button" onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>

        <PeopleList views={filtered} selectedId={selected ? String(selected.npc.id) : undefined} onSelect={(view) => setSelectedId(String(view.npc.id))} />
        {history.length > 0 ? (
          <section className="people-history-strip">
            <header><span>Последние решения</span><small>{history.length}</small></header>
            <ul>{history.slice(0, 5).map((entry) => <li key={entry.id}><span>День {entry.day}</span><strong>{entry.title}</strong><small>{entry.text}</small></li>)}</ul>
          </section>
        ) : null}
      </section>

      <section className="panel npc-profile-panel visual-panel">
        {selected ? (
          <>
            <header className="npc-profile-panel__hero">
              <span className="npc-profile-panel__avatar">{initials(selected)}</span>
              <div>
                <span className="section-kicker">{selected.isPresent ? 'Сейчас рядом' : 'Знакомый'}</span>
                <h2>{selected.npc.firstName} {selected.npc.lastName}</h2>
                <p>{selected.role?.name ?? 'Житель города'} · {selected.npc.age} лет</p>
              </div>
              <span className={`npc-profile-panel__relationship npc-profile-panel__relationship--${statusTone(selected.status)}`}>
                {getRelationshipStatusLabel(selected.status)}
              </span>
            </header>

            <div className="npc-profile-panel__metrics">
              <div><span>Знакомство</span><strong>{selected.relationship.familiarity}</strong><i style={{ width: `${selected.relationship.familiarity}%` }} /></div>
              <div><span>Отношение</span><strong>{selected.relationship.affinity}</strong><i style={{ width: `${Math.max(0, (selected.relationship.affinity + 100) / 2)}%` }} /></div>
              <div><span>Доверие</span><strong>{selected.relationship.trust}</strong><i style={{ width: `${selected.relationship.trust}%` }} /></div>
              <div><span>Напряжение</span><strong>{selected.relationship.tension}</strong><i style={{ width: `${selected.relationship.tension}%` }} /></div>
            </div>

            <section className="npc-profile-panel__personality">
              <header><span>Характер</span><small>Скрытая симуляция личности</small></header>
              <div className="npc-personality-grid">
                <span>Общительность <strong>{selected.npc.personality.sociability}</strong></span>
                <span>Надёжность <strong>{selected.npc.personality.reliability}</strong></span>
                <span>Амбиции <strong>{selected.npc.personality.ambition}</strong></span>
                <span>Щедрость <strong>{selected.npc.personality.generosity}</strong></span>
              </div>
              <div className="npc-interest-list">{selected.npc.personality.interests.map((interest) => <span key={interest}>{INTEREST_LABELS[interest] ?? interest}</span>)}</div>
            </section>

            <section className="npc-profile-panel__actions">
              <header><span>Действия</span><small>{selected.isPresent ? 'Доступны по ситуации' : 'Человека сейчас нет рядом'}</small></header>
              <div>
                {selected.interactions.map(({ interaction, available, failure }) => (
                  <button
                    disabled={!available}
                    key={interaction.id}
                    title={failure}
                    type="button"
                    onClick={() => onInteract(selected.npc.id, interaction.id)}
                  >
                    <span><strong>{interaction.label}</strong><small>{interaction.durationMinutes} мин{interaction.moneyDelta ? ` · ${interaction.moneyDelta} ₽` : ''}</small></span>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
              </div>
            </section>

            <section className="npc-profile-panel__memory">
              <header><span>Память</span><small>{selected.relationship.memories.length}</small></header>
              {selected.relationship.memories.length > 0 ? (
                <ul>{selected.relationship.memories.map((memory) => <li className={`memory-${memory.tone}`} key={`${memory.key}_${memory.day}`}><span>День {memory.day}</span><strong>{memory.text}</strong></li>)}</ul>
              ) : <div className="empty-state compact-empty-state">Значимых событий пока нет</div>}
            </section>
          </>
        ) : (
          <div className="people-directory__empty people-directory__empty--profile"><Icon name="users" size={30} /><span>Выбери человека</span></div>
        )}
      </section>
    </section>
  );
}
