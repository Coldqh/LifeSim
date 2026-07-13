import type { NeedsState } from './needs';
import type { MedicalProductUse } from './healthcare';
import type { ProductId, ShopId } from './ids';

export type ProductCategory = 'food' | 'drink' | 'coffee' | 'medicine' | 'other';

export type Product = {
  id: ProductId;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  useDurationMinutes: number;
  imageSrc?: string;
  effects: Partial<NeedsState>;
  medicalUse?: MedicalProductUse;
};

export type ShopProduct = {
  productId: ProductId;
  priceOverride?: number;
};

export type Shop = {
  id: ShopId;
  name: string;
  description: string;
  productIds: ProductId[];
};
