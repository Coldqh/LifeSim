import { formatRubles } from '../../core/economy';
import type { Housing } from '../../types/housing';
import type { Player } from '../../types/player';
import { Icon } from '../icons';

type HousingPanelProps = {
  housing?: Housing;
  player: Player;
};

export function HousingPanel({ housing, player }: HousingPanelProps) {
  if (!housing) {
    return (
      <section className="panel housing-panel">
        <div className="section-heading section-heading--compact">
          <div>
            <span className="section-kicker">Жильё</span>
            <h2>Нет жилья</h2>
          </div>
        </div>
      </section>
    );
  }

  const rentWarning = player.daysUntilRent <= 2 || player.rentDebt > 0;

  return (
    <section className="panel housing-panel">
      <div className="housing-hero">
        <div className="housing-hero__icon"><Icon name="home" size={22} /></div>
        <div>
          <span className="section-kicker">Текущее жильё</span>
          <h2>{housing.name}</h2>
        </div>
        <span className={rentWarning ? 'status-label status-label--warning' : 'status-label'}>
          {player.rentDebt > 0 ? 'Есть долг' : `${player.daysUntilRent} дн. до оплаты`}
        </span>
      </div>

      <dl className="data-ledger housing-ledger">
        <div><dt>Аренда</dt><dd>{formatRubles(housing.rentPerWeek)}</dd><small>раз в {housing.rentPeriodDays} дней</small></div>
        <div><dt>Бытовые расходы</dt><dd>{formatRubles(housing.dailyUtilities)}</dd><small>в сутки</small></div>
        <div><dt>Долг</dt><dd className={player.rentDebt > 0 ? 'text-negative' : ''}>{formatRubles(player.rentDebt)}</dd><small>по жилью</small></div>
        <div><dt>Комфорт</dt><dd>{housing.comfort}</dd><small>из 100</small></div>
      </dl>
    </section>
  );
}
