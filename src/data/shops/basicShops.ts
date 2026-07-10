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
    productIds: products(['water_05l', 'water_15l', 'snack_bar', 'ready_meal', 'fruit_pack', 'yogurt', 'tea_cup'])
  },
  {
    id: shopId('shop_coffee_spot'),
    name: 'Кофейня',
    description: 'Кофе и быстрый перекус.',
    productIds: products(['coffee_cup', 'cafe_sandwich', 'water_05l', 'tea_cup', 'protein_bar'])
  },

  {
    id: shopId('shop_pharmacy'),
    name: 'Аптека',
    description: 'Лекарства и средства восстановления.',
    productIds: products(['painkiller', 'vitamins_pack', 'bandage_kit', 'electrolyte_pack', 'cold_medicine'])
  },
  {
    id: shopId('shop_canteen'),
    name: 'Столовая',
    description: 'Плотная еда дешевле ресторанов.',
    productIds: products(['soup_cup', 'business_lunch', 'pasta_box', 'salad_bowl', 'tea_cup', 'water_05l'])
  },
  {
    id: shopId('shop_food_court'),
    name: 'Фудкорт',
    description: 'Быстрая еда для рабочего дня и дороги.',
    productIds: products(['shawarma', 'energy_drink', 'ready_meal', 'cafe_sandwich', 'salad_bowl', 'water_05l'])
  },
  {
    id: shopId('shop_sport_goods'),
    name: 'Магазин спорттоваров',
    description: 'Спортивное питание и восстановление.',
    productIds: products(['protein_bar', 'isotonic_drink', 'protein_shake', 'electrolyte_pack', 'water_15l'])
  },
  {
    id: shopId('shop_premium_coffee'),
    name: 'Премиальная кофейня',
    description: 'Дороже обычной кофейни, но удобнее в центре.',
    productIds: products(['coffee_cup', 'cafe_sandwich', 'tea_cup', 'salad_bowl', 'protein_bar', 'water_05l'])
  }
];

export function getShopById(shopId: ShopId): Shop | undefined {
  return basicShops.find((shop) => shop.id === shopId);
}
