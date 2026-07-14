import { useMemo, useState } from 'react';
import { formatRubles } from '../../core/economy';
import { formatMinuteOfDay } from '../../core/schedule';
import type {
  BusinessEmployee,
  BusinessEmployeeRole,
  BusinessEquipmentDefinition,
  BusinessMenuItemDefinition,
  BusinessPremises,
  BusinessSupplyDefinition,
  BusinessTypeDefinition,
  BusinessUpgradeDefinition,
  BusinessWorldState,
  OwnedBusiness
} from '../../types/business';
import type {
  BusinessEquipmentId,
  BusinessMenuItemId,
  BusinessPremisesId,
  BusinessSupplyId,
  BusinessUpgradeId,
  NpcId
} from '../../types/ids';
import type { District, Location } from '../../types/location';
import type { Npc } from '../../types/npc';
import type { ScheduleStatus } from '../../types/schedule';
import { Icon } from '../icons';

export type BusinessPremisesView = {
  premises: BusinessPremises;
  location?: Location;
  district?: District;
  startup: { equipmentCost: number; starterInventoryCost: number; total: number };
  canLaunch: boolean;
  failure?: string;
  isAtLocation: boolean;
};

export type BusinessPanelState = {
  world: BusinessWorldState;
  business?: OwnedBusiness;
  businessType?: BusinessTypeDefinition;
  premises?: BusinessPremises;
  premisesListings: BusinessPremisesView[];
  scheduleStatus: ScheduleStatus;
  menu: Array<{ item: BusinessMenuItemDefinition; price: number; canProduce: boolean }>;
  supplies: Array<{ supply: BusinessSupplyDefinition; quantity: number; batchCost: number; canBuy: boolean }>;
  equipment: Array<{ equipment: BusinessEquipmentDefinition; owned: boolean; canBuy: boolean }>;
  upgrades: Array<{ upgrade: BusinessUpgradeDefinition; owned: boolean; canBuy: boolean }>;
  employees: Array<{ employee: BusinessEmployee; npc?: Npc; onShift: boolean }>;
  candidates: Npc[];
  recentCustomers: Npc[];
  ownerShiftFailure?: string;
  canWorkOwnerShift: boolean;
};

type BusinessPanelProps = {
  state: BusinessPanelState;
  playerMoney: number;
  onOpenBusiness: (premisesId: BusinessPremisesId, name: string) => void;
  onBuySupply: (supplyId: BusinessSupplyId, batches?: number) => void;
  onSetPrice: (itemId: BusinessMenuItemId, price: number) => void;
  onHireNpc: (npcId: NpcId, role: BusinessEmployeeRole) => void;
  onFireNpc: (npcId: NpcId) => void;
  onInvest: (amount: number) => void;
  onBuyEquipment: (equipmentId: BusinessEquipmentId) => void;
  onBuyUpgrade: (upgradeId: BusinessUpgradeId) => void;
  onOwnerShift: () => void;
};

const ROLE_LABELS: Record<BusinessEmployeeRole, string> = {
  barista: 'Бариста',
  administrator: 'Администратор',
  cleaner: 'Уборщик'
};

function reportNet(report: OwnedBusiness['currentReport']): number {
  return report.revenue - report.costOfGoods - report.wages - report.utilities - report.rent;
}

function formatSchedule(employee: BusinessEmployee): string {
  return `${formatMinuteOfDay(employee.shiftStartMinute)}–${formatMinuteOfDay(employee.shiftEndMinute)}`;
}

function LaunchView({ state, playerMoney, onOpenBusiness }: Pick<BusinessPanelProps, 'state' | 'playerMoney' | 'onOpenBusiness'>) {
  const [name, setName] = useState('Городской кофе');

  return (
    <div className="business-launch">
      <section className="panel business-hero visual-panel">
        <div className="business-hero__glow" aria-hidden="true" />
        <div>
          <span className="section-kicker">Первое предприятие</span>
          <h2>Кофейня навынос</h2>
          <p>Выбери помещение, запусти точку и управляй продажами, запасами и сотрудниками.</p>
        </div>
        <div className="business-hero__funds">
          <span>Личные деньги</span>
          <strong>{formatRubles(playerMoney)}</strong>
        </div>
      </section>

      <section className="panel business-name-panel">
        <label className="business-name-field">
          <span>Название кофейни</span>
          <input maxLength={40} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
      </section>

      <div className="business-premises-grid">
        {state.premisesListings.map((view) => (
          <article className="panel business-premises-card" key={view.premises.id}>
            <div className="business-premises-card__head">
              <div className="business-premises-card__icon"><Icon name="building" size={22} /></div>
              <div>
                <span>{view.district?.name ?? 'Москва'}</span>
                <h3>{view.premises.name}</h3>
                <p>{view.premises.address}</p>
              </div>
            </div>
            <div className="business-premises-card__summary">
              <div><span>Аренда</span><strong>{formatRubles(view.premises.rentPerWeek)}<small>/нед.</small></strong></div>
              <div><span>Старт</span><strong>{formatRubles(view.startup.total)}</strong></div>
            </div>
            <details className="business-premises-card__details">
              <summary>Характеристики и расходы <Icon name="chevron" size={15} /></summary>
              <div className="business-premises-card__metrics">
                <div><span>Площадь</span><strong>{view.premises.areaSqm} м²</strong></div>
                <div><span>Поток</span><strong>{view.premises.footTraffic}/5</strong></div>
                <div><span>Аренда</span><strong>{formatRubles(view.premises.rentPerWeek)}/нед.</strong></div>
                <div><span>Старт</span><strong>{formatRubles(view.startup.total)}</strong></div>
              </div>
              <div className="business-premises-card__breakdown">
                <span>Залог {formatRubles(view.premises.deposit)}</span>
                <span>Оборудование {formatRubles(view.startup.equipmentCost)}</span>
                <span>Запас {formatRubles(view.startup.starterInventoryCost)}</span>
              </div>
            </details>
            <button
              className="primary-action-button"
              disabled={!view.canLaunch}
              title={view.failure}
              type="button"
              onClick={() => onOpenBusiness(view.premises.id, name)}
            >
              <span>{view.isAtLocation ? 'Открыть кофейню' : 'Сначала приехать сюда'}</span>
              <Icon name="arrow" size={16} />
            </button>
            {view.failure ? <p className="business-failure">{view.failure}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export function BusinessPanel(props: BusinessPanelProps) {
  const { state } = props;
  const business = state.business;
  const [section, setSection] = useState<'overview' | 'stock' | 'team' | 'growth' | 'reports'>('overview');
  const candidates = useMemo(() => state.candidates.slice(0, 8), [state.candidates]);

  if (!business) return <LaunchView state={state} playerMoney={props.playerMoney} onOpenBusiness={props.onOpenBusiness} />;

  const currentNet = reportNet(business.currentReport);
  const totalStock = Object.values(business.inventory).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const onShiftCount = state.employees.filter((entry) => entry.onShift).length;

  return (
    <div className="business-console">
      <section className="panel business-command visual-panel">
        <div className="business-command__visual" aria-hidden="true"><Icon name="coffee" size={70} /></div>
        <div className="business-command__identity">
          <span className="section-kicker">Собственное предприятие</span>
          <h2>{business.name}</h2>
          <p>{state.premises?.name} · {state.premises?.address}</p>
          <div className={`schedule-pill ${state.scheduleStatus.isOpen ? 'schedule-pill--open' : 'schedule-pill--closed'}`}>{state.scheduleStatus.label}</div>
        </div>
        <div className="business-command__metrics">
          <div><span>Счёт бизнеса</span><strong>{formatRubles(business.balance)}</strong></div>
          <div><span>Репутация</span><strong>{Math.round(business.reputation)}/100</strong></div>
          <div><span>Выручка сегодня</span><strong>{formatRubles(business.currentReport.revenue)}</strong></div>
          <div><span>Прибыль сегодня</span><strong className={currentNet >= 0 ? 'positive-text' : 'negative-text'}>{currentNet >= 0 ? '+' : ''}{formatRubles(currentNet)}</strong></div>
        </div>
      </section>

      <nav className="business-tabs" aria-label="Управление бизнесом">
        {[
          ['overview', 'Обзор'],
          ['stock', 'Товары'],
          ['team', 'Сотрудники'],
          ['growth', 'Развитие'],
          ['reports', 'Отчёты']
        ].map(([id, label]) => (
          <button className={section === id ? 'business-tab business-tab--active' : 'business-tab'} key={id} type="button" onClick={() => setSection(id as typeof section)}>{label}</button>
        ))}
      </nav>

      {section === 'overview' ? (
        <div className="business-dashboard-grid">
          <section className="panel business-owner-panel">
            <div className="section-heading section-heading--compact"><div><span className="section-kicker">Операционная работа</span><h2>Смена владельца</h2></div><Icon name="briefcase" size={22} /></div>
            <div className="business-owner-stats">
              <div><span>Длительность</span><strong>4 часа</strong></div>
              <div><span>Сотрудников на смене</span><strong>{onShiftCount}</strong></div>
              <div><span>Запасов</span><strong>{totalStock}</strong></div>
            </div>
            <button className="primary-action-button" disabled={!state.canWorkOwnerShift} title={state.ownerShiftFailure} type="button" onClick={props.onOwnerShift}><span>Выйти на смену</span><Icon name="arrow" size={16} /></button>
            {state.ownerShiftFailure ? <p className="business-failure">{state.ownerShiftFailure}</p> : null}
          </section>

          <section className="panel business-funds-panel">
            <div className="section-heading section-heading--compact"><div><span className="section-kicker">Касса</span><h2>Финансирование</h2></div><Icon name="wallet" size={22} /></div>
            <p>Пополнение идёт из личных денег игрока на отдельный счёт предприятия.</p>
            <div className="business-fund-buttons">
              <button disabled={props.playerMoney < 5000} type="button" onClick={() => props.onInvest(5000)}>Внести 5 000 ₽</button>
              <button disabled={props.playerMoney < 10000} type="button" onClick={() => props.onInvest(10000)}>Внести 10 000 ₽</button>
            </div>
            {business.debt > 0 ? <div className="business-debt">Долг бизнеса: {formatRubles(business.debt)}</div> : null}
          </section>

          <section className="panel business-menu-panel business-span-two">
            <div className="section-heading"><div><span className="section-kicker">Продажи</span><h2>Меню и цены</h2></div><span className="section-counter">{state.menu.length}</span></div>
            <div className="business-menu-table">
              {state.menu.map(({ item, price, canProduce }) => (
                <div className="business-menu-row" key={item.id}>
                  <div><strong>{item.name}</strong><span>{canProduce ? 'В продаже' : 'Нет ингредиентов'}</span></div>
                  <div className="business-price-control">
                    <button type="button" onClick={() => props.onSetPrice(item.id, price - 20)}>−</button>
                    <strong>{formatRubles(price)}</strong>
                    <button type="button" onClick={() => props.onSetPrice(item.id, price + 20)}>+</button>
                  </div>
                  <small>Ориентир: {formatRubles(item.recommendedPrice)}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel business-customers-panel business-span-two">
            <div className="section-heading"><div><span className="section-kicker">Живая популяция</span><h2>Последние посетители</h2></div><span className="section-counter">{state.recentCustomers.length}</span></div>
            {state.recentCustomers.length > 0 ? <div className="business-customer-list">{state.recentCustomers.map((npc) => <div key={npc.id}><span>{npc.firstName[0]}{npc.lastName[0]}</span><strong>{npc.firstName} {npc.lastName}</strong><small>{npc.age} лет</small></div>)}</div> : <div className="empty-state compact-empty-state">Продаж ещё не было</div>}
          </section>
        </div>
      ) : null}

      {section === 'stock' ? (
        <section className="panel business-stock-panel">
          <div className="section-heading"><div><span className="section-kicker">Склад</span><h2>Закупки и остатки</h2></div><span className="section-counter">{totalStock}</span></div>
          <div className="business-stock-list">
            {state.supplies.map(({ supply, quantity, batchCost, canBuy }) => (
              <article key={supply.id}>
                <div><strong>{supply.name}</strong><span>Остаток: {quantity}</span></div>
                <div><span>Партия ×{supply.purchaseBatch}</span><strong>{formatRubles(batchCost)}</strong></div>
                <button disabled={!canBuy} type="button" onClick={() => props.onBuySupply(supply.id, 1)}>Закупить</button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {section === 'team' ? (
        <div className="business-team-grid">
          <section className="panel">
            <div className="section-heading"><div><span className="section-kicker">Штат</span><h2>Сотрудники</h2></div><span className="section-counter">{state.employees.length}</span></div>
            {state.employees.length > 0 ? <div className="business-employee-list">{state.employees.map(({ employee, npc, onShift }) => (
              <article key={employee.npcId}>
                <div><strong>{npc ? `${npc.firstName} ${npc.lastName}` : 'Сотрудник'}</strong><span>{ROLE_LABELS[employee.role]}</span></div>
                <div><span>{formatSchedule(employee)}</span><strong className={onShift ? 'positive-text' : ''}>{onShift ? 'На смене' : 'Не на смене'}</strong></div>
                <div><span>{formatRubles(employee.wagePerShift)}/смена</span><button type="button" onClick={() => props.onFireNpc(employee.npcId)}>Уволить</button></div>
              </article>
            ))}</div> : <div className="empty-state compact-empty-state">Штат пока пуст</div>}
          </section>

          <section className="panel">
            <div className="section-heading"><div><span className="section-kicker">Городская популяция</span><h2>Кандидаты</h2></div><span className="section-counter">{candidates.length}</span></div>
            <div className="business-candidate-list">{candidates.map((npc) => (
              <article key={npc.id}>
                <div><strong>{npc.firstName} {npc.lastName}</strong><span>{npc.age} лет · {npc.activityProfile === 'unemployed' ? 'без работы' : 'свободен'}</span></div>
                <div className="business-candidate-actions">
                  <button type="button" onClick={() => props.onHireNpc(npc.id, 'barista')}>Бариста</button>
                  <button type="button" onClick={() => props.onHireNpc(npc.id, 'administrator')}>Админ</button>
                  <button type="button" onClick={() => props.onHireNpc(npc.id, 'cleaner')}>Уборка</button>
                </div>
              </article>
            ))}</div>
          </section>
        </div>
      ) : null}

      {section === 'growth' ? (
        <div className="business-growth-grid">
          <section className="panel">
            <div className="section-heading"><div><span className="section-kicker">Производительность</span><h2>Оборудование</h2></div></div>
            <div className="business-growth-list">{state.equipment.map(({ equipment, owned, canBuy }) => (
              <article key={equipment.id}><div><strong>{equipment.name}</strong><span>{equipment.description}</span></div><div><strong>{owned ? 'Установлено' : formatRubles(equipment.price)}</strong><button disabled={owned || !canBuy} type="button" onClick={() => props.onBuyEquipment(equipment.id)}>{owned ? 'Есть' : 'Купить'}</button></div></article>
            ))}</div>
          </section>
          <section className="panel">
            <div className="section-heading"><div><span className="section-kicker">Рост</span><h2>Улучшения точки</h2></div></div>
            <div className="business-growth-list">{state.upgrades.map(({ upgrade, owned, canBuy }) => (
              <article key={upgrade.id}><div><strong>{upgrade.name}</strong><span>{upgrade.description}</span></div><div><strong>{owned ? 'Куплено' : formatRubles(upgrade.price)}</strong><button disabled={owned || !canBuy} type="button" onClick={() => props.onBuyUpgrade(upgrade.id)}>{owned ? 'Есть' : 'Купить'}</button></div></article>
            ))}</div>
          </section>
        </div>
      ) : null}

      {section === 'reports' ? (
        <section className="panel business-reports-panel">
          <div className="section-heading"><div><span className="section-kicker">Финансы</span><h2>Ежедневные отчёты</h2></div><span className="section-counter">{business.reports.length}</span></div>
          <div className="business-report-table business-report-table--head"><span>День</span><span>Посетители</span><span>Обслужено</span><span>Выручка</span><span>Расходы</span><span>Прибыль</span></div>
          <div className="business-report-table"><span>Сегодня · {business.currentReport.day}</span><span>{business.currentReport.visitors}</span><span>{business.currentReport.served}</span><span>{formatRubles(business.currentReport.revenue)}</span><span>{formatRubles(business.currentReport.costOfGoods + business.currentReport.wages + business.currentReport.utilities + business.currentReport.rent)}</span><strong className={currentNet >= 0 ? 'positive-text' : 'negative-text'}>{formatRubles(currentNet)}</strong></div>
          {business.reports.map((report) => {
            const net = reportNet(report);
            return <div className="business-report-table" key={report.day}><span>День {report.day}</span><span>{report.visitors}</span><span>{report.served}</span><span>{formatRubles(report.revenue)}</span><span>{formatRubles(report.costOfGoods + report.wages + report.utilities + report.rent)}</span><strong className={net >= 0 ? 'positive-text' : 'negative-text'}>{formatRubles(net)}</strong></div>;
          })}
          {business.reports.length === 0 ? <div className="empty-state compact-empty-state">Первый отчёт появится после завершения дня</div> : null}
        </section>
      ) : null}
    </div>
  );
}
