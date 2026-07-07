import { formatRubles } from '../../core/economy';
import type { Product, Shop } from '../../types/product';
import type { ProductId } from '../../types/ids';

type ShopPanelProps = {
  shop?: Shop;
  products: Product[];
  onBuyProduct: (productId: ProductId) => void;
};

function formatEffects(product: Product): string {
  const effects = Object.entries(product.effects)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => `${key} ${value && value > 0 ? '+' : ''}${value}`);

  return effects.length > 0 ? effects.join(' · ') : 'без эффекта';
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
            <div>
              <strong>{product.name}</strong>
              <p>{product.description}</p>
              <small>{formatEffects(product)}</small>
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
