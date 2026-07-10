import type { TransportOption } from '../../types/travel';
import type { TravelModeId } from '../../types/transport';
import { Icon, type IconName } from '../icons';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type TransportOptionCardProps = {
  option: TransportOption;
  onSelect: (modeId: TravelModeId) => void;
};

const MODE_ICONS: Record<TravelModeId, IconName> = { walk: 'walk', bus: 'bus', metro: 'metro', taxi: 'taxi' };

function getTransportEffects(option: TransportOption): EffectListItem[] {
  return [
    { label: 'Время', value: -option.durationMinutes, unit: 'мин', tone: 'negative' },
    { label: 'Деньги', value: -option.moneyCost, unit: '₽', tone: option.moneyCost > 0 ? 'negative' : 'neutral' },
    ...createNeedsEffectItems(option.needsDelta)
  ];
}

export function TransportOptionCard({ option, onSelect }: TransportOptionCardProps) {
  return (
    <button
      className={`transport-option transport-option--${option.modeId} ${!option.available ? 'transport-option--disabled' : ''}`}
      disabled={!option.available}
      type="button"
      onClick={() => onSelect(option.modeId)}
    >
      <span className="transport-option__route-line" aria-hidden="true" />
      <div className="transport-option__icon"><Icon name={MODE_ICONS[option.modeId]} size={21} /></div>
      <div className="transport-option__content">
        <strong>{option.name}</strong>
        <EffectList items={getTransportEffects(option)} />
        {!option.available ? <small>{option.unavailableReason ?? 'Недоступно'}</small> : null}
      </div>
      <Icon className="transport-option__arrow" name="chevron" size={18} />
    </button>
  );
}
