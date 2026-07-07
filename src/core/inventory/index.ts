import type { InventoryItem } from '../../types/inventory';
import type { ProductId } from '../../types/ids';

export function addInventoryItem(inventory: InventoryItem[], productId: ProductId, quantity = 1): InventoryItem[] {
  const existingItem = inventory.find((item) => item.productId === productId);

  if (!existingItem) {
    return [...inventory, { productId, quantity }];
  }

  return inventory.map((item) =>
    item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
  );
}

export function removeInventoryItem(inventory: InventoryItem[], productId: ProductId, quantity = 1): InventoryItem[] {
  return inventory
    .map((item) =>
      item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item
    )
    .filter((item) => item.quantity > 0);
}

export function hasInventoryItem(inventory: InventoryItem[], productId: ProductId, quantity = 1): boolean {
  const item = inventory.find((candidate) => candidate.productId === productId);

  return Boolean(item && item.quantity >= quantity);
}
