import { formatRubles } from '../../core/economy';
import type { Housing } from '../../types/housing';
import type { Player } from '../../types/player';
import { Icon } from '../icons';
import { HousingScene } from '../visuals';
import type { HouseholdPanelState } from '../../types/household';

const CONDITION_LABELS: Record<Housing['condition'], string> = {
  poor: 'плохое состояние',
  standard: 'обычное состояние',
  good: 'хорошее состояние',
  excellent: 'отличное состояние'
};

type HousingPanelProps = {
  housing?: Housing;
  player: Player;
  household: HouseholdPanelState;
};

export function HousingPanel({ housing, player, household }: HousingPanelProps) {
  if (!housing) {
    return (
      <section className="panel housing-panel">
        <div className="section-heading section-heading--compact">
          <div><span className="section-kicker">Жильё</span><h2>Нет жилья</h2></div>
        </div>
      </section>
    );
  }

  const rentWarning = player.daysUntilRent <= 2 || player.rentDebt > 0;

  return (
    <section className="panel housing-panel visual-panel">
      <HousingScene imageSrc={housing.imageSrc} />
      <div className="housing-panel__content">
        <div className="housing-hero">
          <div className="housing-hero__icon"><Icon name="home" size={22} /></div>
          <div>
            <span className="section-kicker">Текущее жильё</span>
            <h2>{housing.name}</h2>
            <p className="housing-panel__address">{housing.address}</p>
          </div>
          <span className={rentWarning ? 'status-label status-label--warning' : 'status-label'}>
            {player.rentDebt > 0 ? 'Есть долг' : `${player.daysUntilRent} дн. до оплаты`}
          </span>
        </div>

        <dl className="data-ledger housing-ledger">
          <div><dt>Аренда</dt><dd>{formatRubles(housing.rentPerWeek)}</dd><small>раз в {housing.rentPeriodDays} дней</small></div>
          <div><dt>Счета</dt><dd>{formatRubles(household.outstandingBills)}</dd><small>{household.debt > 0 ? 'есть просрочка' : 'начислено'}</small></div>
          <div><dt>Залог</dt><dd>{formatRubles(player.rentalContract.depositPaid)}</dd><small>возврат при переезде</small></div>
          <div><dt>Долг</dt><dd className={player.rentDebt > 0 ? 'text-negative' : ''}>{formatRubles(player.rentDebt)}</dd><small>по жилью</small></div>
          <div><dt>Чистота</dt><dd>{household.state.cleanliness}</dd><small>из 100</small></div>
          <div><dt>Исправность</dt><dd>{household.state.condition}</dd><small>{household.activeBreakdownLabel ?? 'без поломок'}</small></div>
          <div><dt>Площадь</dt><dd>{housing.areaSqm} м²</dd><small>{CONDITION_LABELS[housing.condition]}</small></div>
        </dl>
      </div>
    </section>
  );
}
