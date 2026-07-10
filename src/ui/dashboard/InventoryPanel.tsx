import { getProductById } from '../../data/products/basicProducts';
import type { InventoryItem } from '../../types/inventory';
import type { ProductId } from '../../types/ids';
import { Icon } from '../icons';
import { ProductGlyph } from '../visuals';
import { createNeedsEffectItems, EffectList } from './EffectList';

type InventoryPanelProps = {
  inventory: InventoryItem[];
  onUseInventoryItem: (productId: ProductId) => void;
};

export function InventoryPanel({ inventory, onUseInventoryItem }: InventoryPanelProps) {
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="panel inventory-panel">
      <div className="section-heading section-heading--compact">
        <div><span className="section-kicker">Личные вещи</span><h2>Инвентарь</h2></div>
        <span className="section-counter">{totalItems}</span>
      </div>

      {inventory.length > 0 ? (
        <div className="inventory-list">
          {inventory.map((item) => {
            const product = getProductById(item.productId);
            return (
              <article className="inventory-row" key={item.productId}>
                <ProductGlyph alt={product?.name ?? ''} category={product?.category} imageSrc={product?.imageSrc} />
                <div className="inventory-row__content">
                  <strong>{product?.name ?? 'Неизвестный предмет'}</strong>
                  <span>Количество: {item.quantity}</span>
                  <EffectList items={createNeedsEffectItems(product?.effects)} />
                </div>
                <button className="row-action-button row-action-button--compact" type="button" onClick={() => onUseInventoryItem(item.productId)}>
                  <span>Использовать</span><Icon name="arrow" size={15} />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state visual-empty-state">
          <div className="empty-state__halo"><Icon name="bag" size={24} /></div>
          <span>Инвентарь пуст</span>
        </div>
      )}
    </section>
  );
}
