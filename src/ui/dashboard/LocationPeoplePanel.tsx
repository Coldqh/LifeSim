import type { Npc } from '../../types/npc';
import type { LocationPopulationPresence, PopulationSummary } from '../../types/population';
import { getNpcRoleById } from '../../data/population/npcRoles';
import { Icon } from '../icons';

export type LocationPeoplePanelProps = {
  presence?: LocationPopulationPresence;
  summary: PopulationSummary;
};

const ACTIVITY_LABELS: Record<Npc['activityProfile'], string> = {
  worker: 'Посетитель',
  student: 'Студент',
  unemployed: 'Посетитель',
  remote_worker: 'Удалённый работник',
  retired: 'Пенсионер'
};

function getNpcSubtitle(npc: Npc, isStaff: boolean): string {
  if (isStaff) return getNpcRoleById(npc.employment?.roleId)?.name ?? 'Сотрудник';
  return ACTIVITY_LABELS[npc.activityProfile];
}

function NpcRow({ npc, isStaff }: { npc: Npc; isStaff: boolean }) {
  return (
    <li className="people-row">
      <span className="people-row__avatar" aria-hidden="true">{npc.firstName.slice(0, 1)}{npc.lastName.slice(0, 1)}</span>
      <span className="people-row__identity">
        <strong>{npc.firstName} {npc.lastName}</strong>
        <small>{getNpcSubtitle(npc, isStaff)} · {npc.age} лет</small>
      </span>
      <span className={isStaff ? 'people-row__status people-row__status--staff' : 'people-row__status'}>
        {isStaff ? 'Персонал' : 'Посетитель'}
      </span>
    </li>
  );
}

export function LocationPeoplePanel({ presence, summary }: LocationPeoplePanelProps) {
  const staff = presence?.staff ?? [];
  const visitors = presence?.visitors ?? [];
  const total = presence?.total ?? 0;

  return (
    <section className="panel people-panel visual-panel">
      <div className="people-panel__glow" aria-hidden="true" />
      <div className="section-heading section-heading--compact">
        <div>
          <span className="section-kicker">Живая локация</span>
          <h2>Люди сейчас</h2>
        </div>
        <span className="section-counter">{total}</span>
      </div>

      <div className="people-panel__metrics">
        <div><span>Персонал</span><strong>{staff.length}</strong></div>
        <div><span>Посетители</span><strong>{visitors.length}</strong></div>
        <div><span>В пути по городу</span><strong>{summary.travelling}</strong></div>
      </div>

      {total > 0 ? (
        <div className="people-panel__groups">
          {staff.length > 0 ? (
            <section>
              <header><Icon name="briefcase" size={15} /><span>Персонал</span><small>{staff.length}</small></header>
              <ul>{staff.map((npc) => <NpcRow isStaff key={npc.id} npc={npc} />)}</ul>
            </section>
          ) : null}
          {visitors.length > 0 ? (
            <section>
              <header><Icon name="character" size={15} /><span>Посетители</span><small>{visitors.length}</small></header>
              <ul>{visitors.map((npc) => <NpcRow isStaff={false} key={npc.id} npc={npc} />)}</ul>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="people-panel__empty">
          <Icon name="character" size={22} />
          <span>Сейчас здесь никого нет</span>
        </div>
      )}

      <footer className="people-panel__footer">
        <span>Население симуляции</span>
        <strong>{summary.total}</strong>
        <small>{summary.activeResidents} активны · {summary.inactiveResidents} пока дома</small>
      </footer>
    </section>
  );
}
