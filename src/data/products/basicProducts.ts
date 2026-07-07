import type { Product } from '../../types/product';
import type { ProductId } from '../../types/ids';

export function productId(value: string): ProductId {
  return value as ProductId;
}

export const basicProducts: Product[] = [
  {
    id: productId('water_05l'),
    name: 'Вода 0.5 л',
    category: 'drink',
    price: 80,
    description: 'Обычная бутылка воды. Быстро закрывает жажду.',
    effects: {
      thirst: 35
    }
  },
  {
    id: productId('water_15l'),
    name: 'Вода 1.5 л',
    category: 'drink',
    price: 140,
    description: 'Большая бутылка воды. Выгоднее маленькой.',
    effects: {
      thirst: 70
    }
  },
  {
    id: productId('snack_bar'),
    name: 'Батончик',
    category: 'food',
    price: 120,
    description: 'Дешёвый перекус. Не еда на день, но выручает.',
    effects: {
      hunger: 20,
      mood: 2
    }
  },
  {
    id: productId('ready_meal'),
    name: 'Готовый обед',
    category: 'food',
    price: 350,
    description: 'Нормальный готовый обед из магазина.',
    effects: {
      hunger: 55,
      thirst: -5,
      mood: 4
    }
  },
  {
    id: productId('coffee_cup'),
    name: 'Кофе',
    category: 'coffee',
    price: 250,
    description: 'Кофе из кофейни. Немного бодрит, но сушит.',
    effects: {
      energy: 12,
      thirst: -5,
      mood: 5
    }
  },
  {
    id: productId('cafe_sandwich'),
    name: 'Сэндвич',
    category: 'food',
    price: 320,
    description: 'Быстрый сэндвич из кофейни.',
    effects: {
      hunger: 35,
      mood: 3
    }
  }
];

export function getProductById(productId: ProductId): Product | undefined {
  return basicProducts.find((product) => product.id === productId);
}
