import type { ProductId, ShopId } from '../../types/ids';
import type { Shop } from '../../types/product';
import { productId } from '../products/basicProducts';

function shopId(value: string): ShopId {
  return value as ShopId;
}

function products(values: string[]): ProductId[] {
  return values.map(productId);
}

export const basicShops: Shop[] = [
  {
    id: shopId('shop_local_grocery'),
    name: 'Магазин у дома',
    description: 'Базовая еда и вода для обычного дня.',
    productIds: products(['water_05l', 'water_15l', 'snack_bar', 'ready_meal'])
  },
  {
    id: shopId('shop_coffee_spot'),
    name: 'Кофейня',
    description: 'Кофе и быстрый перекус.',
    productIds: products(['coffee_cup', 'cafe_sandwich', 'water_05l'])
  }
];

export function getShopById(shopId: ShopId): Shop | undefined {
  return basicShops.find((shop) => shop.id === shopId);
}
