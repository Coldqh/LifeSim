import { getProductById } from '../../data/products/basicProducts';
import { getShopById } from '../../data/shops/basicShops';
import type { Product, Shop } from '../../types/product';
import type { Location } from '../../types/location';
import type { ProductId, ShopId } from '../../types/ids';

export function getShopForLocation(location?: Location): Shop | undefined {
  if (!location?.shopId) return undefined;

  return getShopById(location.shopId);
}

export function getShopProducts(shopId: ShopId | undefined): Product[] {
  if (!shopId) return [];

  const shop = getShopById(shopId);
  if (!shop) return [];

  return shop.productIds
    .map((productId) => getProductById(productId))
    .filter((product): product is Product => Boolean(product));
}

export function isProductSoldByShop(shopId: ShopId | undefined, productId: ProductId): boolean {
  if (!shopId) return false;

  const shop = getShopById(shopId);
  if (!shop) return false;

  return shop.productIds.includes(productId);
}

export { getProductById, getShopById };
