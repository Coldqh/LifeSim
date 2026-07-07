import type { ProductId, ShopId } from './ids';

export type ProductCategory = 'food' | 'drink' | 'medicine' | 'clothing' | 'electronics' | 'service' | 'other';

export type Product = {
  id: ProductId;
  shopId?: ShopId;
  name: string;
  category: ProductCategory;
  price: number;
};

export type InventoryItem = {
  productId: ProductId;
  quantity: number;
};
