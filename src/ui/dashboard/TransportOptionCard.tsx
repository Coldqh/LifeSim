import type { TransportOption } from '../../types/travel';
import type { TravelModeId } from '../../types/transport';

type TransportOptionCardProps = {
  option: TransportOption;
  onSelect: (modeId: TravelModeId) => void;
};

function formatNeedsDelta(option: TransportOption): string | undefined {
  const energy = option.needsDelta?.energy;
  if (!energy) return undefined;

  return `Энергия ${energy}`;
}

export function TransportOptionCard({ option, onSelect }: TransportOptionCardProps) {
  const needsText = formatNeedsDelta(option);

  return (
    <button
      className={`transport-card ${!option.available ? 'transport-card--disabled' : ''}`}
      disabled={!option.available}
      type="button"
      onClick={() => onSelect(option.modeId)}
    >
      <span className="transport-card__name">{option.name}</span>
      <small>{option.description}</small>
      <dl className="transport-card__meta">
        <div>
          <dt>Время</dt>
          <dd>{option.durationMinutes} мин</dd>
        </div>
        <div>
          <dt>Цена</dt>
          <dd>{option.moneyCost > 0 ? `${option.moneyCost} ₽` : '0 ₽'}</dd>
        </div>
        {needsText ? (
          <div>
            <dt>Состояние</dt>
            <dd>{needsText}</dd>
          </div>
        ) : null}
      </dl>
      {option.available ? <strong>Выбрать</strong> : <strong>{option.unavailableReason ?? 'Недоступно'}</strong>}
    </button>
  );
}
