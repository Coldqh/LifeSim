import { formatRubles } from '../../core/economy';
import type { Product, Shop } from '../../types/product';
import type { ProductId } from '../../types/ids';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type ShopPanelProps = {
  shop?: Shop;
  products: Product[];
  onBuyProduct: (productId: ProductId) => void;
};

function getProductPurchaseEffects(product: Product): EffectListItem[] {
  return [
    {
      label: 'Деньги',
      value: -product.price,
      unit: '₽',
      tone: 'negative'
    },
    ...createNeedsEffectItems(product.effects)
  ];
}

export function ShopPanel({ shop, products, onBuyProduct }: ShopPanelProps) {
  if (!shop) return null;

  return (
    <section className="panel shop-panel">
      <div className="panel__header">
        <p className="panel__eyebrow">Магазин</p>
        <h2 className="panel__title">{shop.name}</h2>
        <p className="panel__text">{shop.description}</p>
      </div>

      <div className="shop-list">
        {products.map((product) => (
          <article className="shop-item" key={product.id}>
            <div className="shop-item__main">
              <strong>{product.name}</strong>
              <p>{product.description}</p>
              <EffectList items={getProductPurchaseEffects(product)} />
            </div>
            <div className="shop-item__side">
              <span>{formatRubles(product.price)}</span>
              <button type="button" onClick={() => onBuyProduct(product.id)}>
                Купить
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
