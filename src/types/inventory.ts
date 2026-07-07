import type { ProductId } from './ids';

export type InventoryItem = {
  productId: ProductId;
  quantity: number;
};
