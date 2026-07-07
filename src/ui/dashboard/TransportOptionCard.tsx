import type { TransportOption } from '../../types/travel';
import type { TravelModeId } from '../../types/transport';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type TransportOptionCardProps = {
  option: TransportOption;
  onSelect: (modeId: TravelModeId) => void;
};

function getTransportEffects(option: TransportOption): EffectListItem[] {
  return [
    {
      label: 'Время',
      value: -option.durationMinutes,
      unit: 'мин',
      tone: 'negative'
    },
    {
      label: 'Деньги',
      value: -option.moneyCost,
      unit: '₽',
      tone: option.moneyCost > 0 ? 'negative' : 'neutral'
    },
    ...createNeedsEffectItems(option.needsDelta)
  ];
}

export function TransportOptionCard({ option, onSelect }: TransportOptionCardProps) {
  return (
    <button
      className={`transport-card ${!option.available ? 'transport-card--disabled' : ''}`}
      disabled={!option.available}
      type="button"
      onClick={() => onSelect(option.modeId)}
    >
      <span className="transport-card__name">{option.name}</span>
      <EffectList items={getTransportEffects(option)} />
      {option.available ? <strong>Выбрать</strong> : <strong>{option.unavailableReason ?? 'Недоступно'}</strong>}
    </button>
  );
}
