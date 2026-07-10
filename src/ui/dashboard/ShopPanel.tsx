import { formatRubles } from '../../core/economy';
import type { Product, Shop } from '../../types/product';
import type { ProductId } from '../../types/ids';
import type { ScheduleStatus } from '../../types/schedule';
import { Icon } from '../icons';
import { CommerceScene, ProductGlyph } from '../visuals';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type ShopPanelProps = {
  shop?: Shop;
  locationName?: string;
  locationAddress?: string;
  products: Product[];
  scheduleStatus: ScheduleStatus;
  scheduleFailure?: string;
  onBuyProduct: (productId: ProductId) => void;
};

function getProductPurchaseEffects(product: Product): EffectListItem[] {
  return [
    { label: 'Деньги', value: -product.price, unit: '₽', tone: 'negative' },
    { label: 'Использование', value: -product.useDurationMinutes, unit: 'мин', tone: 'negative' },
    ...createNeedsEffectItems(product.effects)
  ];
}

export function ShopPanel({ shop, locationName, locationAddress, products, scheduleStatus, scheduleFailure, onBuyProduct }: ShopPanelProps) {
  if (!shop) return null;

  return (
    <section className="panel commerce-panel visual-panel">
      <CommerceScene title={locationName ?? shop.name} />
      <div className="commerce-panel__content">
        <div className="section-heading section-heading--compact">
          <div>
            <span className="section-kicker">Торговая точка</span>
            <h2>{locationName ?? shop.name}</h2>
            {locationAddress ? <p className="commerce-panel__address">{locationAddress}</p> : null}
            <small className={scheduleStatus.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>{scheduleStatus.label}</small>
          </div>
          <span className="section-counter">{products.length}</span>
        </div>

        {!scheduleStatus.isOpen && scheduleFailure ? <p className="inline-warning commerce-schedule-warning">{scheduleFailure}</p> : null}
        <div className="commerce-list">
          {products.map((product) => (
            <article className="commerce-row" key={product.id}>
              <ProductGlyph alt={product.name} category={product.category} imageSrc={product.imageSrc} />
              <div className="commerce-row__content">
                <strong>{product.name}</strong>
                <EffectList items={getProductPurchaseEffects(product)} />
              </div>
              <div className="commerce-row__action">
                <span>{formatRubles(product.price)}</span>
                <button disabled={!scheduleStatus.isOpen} type="button" onClick={() => onBuyProduct(product.id)}><span>{scheduleStatus.isOpen ? 'Купить' : 'Закрыто'}</span><Icon name="arrow" size={14}/></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
