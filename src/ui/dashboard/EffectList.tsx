export type EffectTone = 'positive' | 'negative' | 'neutral';

export type EffectListItem = {
  label: string;
  value: number;
  unit?: string;
  tone?: EffectTone;
};

type EffectListProps = {
  items: EffectListItem[];
  emptyText?: string;
};

const NEED_LABELS: Record<string, string> = {
  energy: 'Энергия',
  hunger: 'Еда',
  thirst: 'Вода',
  health: 'Здоровье',
  mood: 'Настроение'
};

function getTone(item: EffectListItem): EffectTone {
  if (item.tone) return item.tone;
  if (item.value > 0) return 'positive';
  if (item.value < 0) return 'negative';

  return 'neutral';
}

function formatValue(item: EffectListItem): string {
  const sign = item.value > 0 ? '+' : '';
  return `${sign}${item.value}${item.unit ? ` ${item.unit}` : ''}`;
}

export function needLabel(key: string): string {
  return NEED_LABELS[key] ?? key;
}

export function createNeedsEffectItems(needsDelta: Record<string, number | undefined> | undefined): EffectListItem[] {
  if (!needsDelta) return [];

  return Object.entries(needsDelta)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => ({
      label: needLabel(key),
      value: value ?? 0
    }));
}

export function EffectList({ items, emptyText = 'Без эффекта' }: EffectListProps) {
  const visibleItems = items.filter((item) => item.value !== 0);

  if (visibleItems.length === 0) {
    return <p className="effect-list effect-list--empty">{emptyText}</p>;
  }

  return (
    <div className="effect-list" aria-label="Эффекты">
      {visibleItems.map((item) => {
        const tone = getTone(item);

        return (
          <span className={`effect-line effect-line--${tone}`} key={`${item.label}-${item.value}-${item.unit ?? ''}`}>
            <strong>{formatValue(item)}</strong>
            <span>{item.label}</span>
          </span>
        );
      })}
    </div>
  );
}
