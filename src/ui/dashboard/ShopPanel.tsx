import { formatRubles } from '../../core/economy';
import type { Product, Shop } from '../../types/product';
import type { ProductId } from '../../types/ids';
import { Icon } from '../icons';
import { CommerceScene, ProductGlyph } from '../visuals';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type ShopPanelProps = {
  shop?: Shop;
  products: Product[];
  onBuyProduct: (productId: ProductId) => void;
};

function getProductPurchaseEffects(product: Product): EffectListItem[] {
  return [
    { label: 'Деньги', value: -product.price, unit: '₽', tone: 'negative' },
    ...createNeedsEffectItems(product.effects)
  ];
}

export function ShopPanel({ shop, products, onBuyProduct }: ShopPanelProps) {
  if (!shop) return null;

  return (
    <section className="panel commerce-panel visual-panel">
      <CommerceScene title={shop.name} />
      <div className="commerce-panel__content">
        <div className="section-heading section-heading--compact">
          <div><span className="section-kicker">Торговая точка</span><h2>{shop.name}</h2></div>
          <span className="section-counter">{products.length}</span>
        </div>

        <div className="commerce-list">
          {products.map((product) => (
            <article className="commerce-row" key={product.id}>
              <ProductGlyph category={product.category} />
              <div className="commerce-row__content">
                <strong>{product.name}</strong>
                <EffectList items={getProductPurchaseEffects(product)} />
              </div>
              <div className="commerce-row__action">
                <span>{formatRubles(product.price)}</span>
                <button type="button" onClick={() => onBuyProduct(product.id)}><span>Купить</span><Icon name="arrow" size={14}/></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
