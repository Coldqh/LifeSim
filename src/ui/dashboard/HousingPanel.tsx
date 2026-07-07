import { formatRubles } from '../../core/economy';
import type { Housing } from '../../types/housing';
import type { Player } from '../../types/player';
import { EffectList } from './EffectList';

type HousingPanelProps = {
  housing?: Housing;
  player: Player;
};

export function HousingPanel({ housing, player }: HousingPanelProps) {
  if (!housing) {
    return (
      <section className="panel housing-panel">
        <div className="panel__header">
          <p className="panel__eyebrow">Жильё</p>
          <h2 className="panel__title">Жильё не найдено</h2>
        </div>
        <p className="empty-state">У игрока пока нет активного жилья.</p>
      </section>
    );
  }

  return (
    <section className="panel housing-panel">
      <div className="panel__header">
        <p className="panel__eyebrow">Жильё</p>
        <h2 className="panel__title">{housing.name}</h2>
      </div>

      <div className="housing-grid">
        <div>
          <span>Аренда</span>
          <strong>{formatRubles(housing.rentPerWeek)}</strong>
          <small>каждые {housing.rentPeriodDays} дней</small>
        </div>
        <div>
          <span>До оплаты</span>
          <strong>{player.daysUntilRent}</strong>
          <small>дн.</small>
        </div>
        <div>
          <span>Бытовые расходы</span>
          <strong>{formatRubles(housing.dailyUtilities)}</strong>
          <small>каждый новый день</small>
        </div>
        <div>
          <span>Долг</span>
          <strong>{formatRubles(player.rentDebt)}</strong>
          <small>по жилью</small>
        </div>
        <div>
          <span>Комфорт</span>
          <strong>{housing.comfort}</strong>
          <small>0–100</small>
        </div>
        <div>
          <span>Бонус сна</span>
          <strong>+{housing.sleepRecoveryBonus}</strong>
          <small>энергия, будущий слой</small>
        </div>
      </div>

      <EffectList
        items={[
          { label: 'Аренда', value: -housing.rentPerWeek, unit: '₽' },
          { label: 'Быт', value: -housing.dailyUtilities, unit: '₽' },
          { label: 'Комфорт', value: housing.comfort, tone: 'neutral' }
        ]}
      />
    </section>
  );
}
