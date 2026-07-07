import { getProductById } from '../../data/products/basicProducts';
import type { InventoryItem } from '../../types/inventory';
import type { ProductId } from '../../types/ids';

type InventoryPanelProps = {
  inventory: InventoryItem[];
  onUseInventoryItem: (productId: ProductId) => void;
};

function formatEffects(productId: ProductId): string {
  const product = getProductById(productId);
  if (!product) return 'товар не найден';

  const effects = Object.entries(product.effects)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => `${key} ${value && value > 0 ? '+' : ''}${value}`);

  return effects.length > 0 ? effects.join(' · ') : 'без эффекта';
}

export function InventoryPanel({ inventory, onUseInventoryItem }: InventoryPanelProps) {
  return (
    <section className="panel inventory-panel">
      <div className="panel__header">
        <p className="panel__eyebrow">Персонаж</p>
        <h2 className="panel__title">Инвентарь</h2>
      </div>

      {inventory.length > 0 ? (
        <div className="inventory-list">
          {inventory.map((item) => {
            const product = getProductById(item.productId);

            return (
              <article className="inventory-item" key={item.productId}>
                <div>
                  <strong>{product?.name ?? 'Неизвестный предмет'}</strong>
                  <p>Количество: {item.quantity}</p>
                  <small>{formatEffects(item.productId)}</small>
                </div>
                <button type="button" onClick={() => onUseInventoryItem(item.productId)}>
                  Использовать
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">Инвентарь пуст. Зайди в магазин или кофейню.</p>
      )}
    </section>
  );
}
