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
  },

  {
    id: productId('tea_cup'),
    name: 'Чай',
    category: 'drink',
    price: 150,
    description: 'Горячий чай без сильного эффекта на энергию.',
    effects: { thirst: 18, mood: 3 }
  },
  {
    id: productId('energy_drink'),
    name: 'Энергетик',
    category: 'drink',
    price: 190,
    description: 'Быстрая бодрость ценой жажды.',
    effects: { energy: 18, thirst: -10, mood: 2 }
  },
  {
    id: productId('shawarma'),
    name: 'Шаурма',
    category: 'food',
    price: 280,
    description: 'Плотный быстрый перекус.',
    effects: { hunger: 45, thirst: -8, mood: 4 }
  },
  {
    id: productId('salad_bowl'),
    name: 'Салат',
    category: 'food',
    price: 360,
    description: 'Лёгкая еда без тяжести.',
    effects: { hunger: 30, health: 3, mood: 2 }
  },
  {
    id: productId('business_lunch'),
    name: 'Бизнес-ланч',
    category: 'food',
    price: 520,
    description: 'Полноценный обед для рабочего дня.',
    effects: { hunger: 70, thirst: -6, mood: 5 }
  },
  {
    id: productId('pasta_box'),
    name: 'Паста',
    category: 'food',
    price: 430,
    description: 'Сытная еда из столовой или фудкорта.',
    effects: { hunger: 58, thirst: -6, mood: 4 }
  },
  {
    id: productId('soup_cup'),
    name: 'Суп',
    category: 'food',
    price: 260,
    description: 'Простая горячая еда.',
    effects: { hunger: 38, health: 2, mood: 3 }
  },
  {
    id: productId('protein_bar'),
    name: 'Протеиновый батончик',
    category: 'food',
    price: 210,
    description: 'Спортивный перекус.',
    effects: { hunger: 28, energy: 4, mood: 2 }
  },
  {
    id: productId('isotonic_drink'),
    name: 'Изотоник',
    category: 'drink',
    price: 180,
    description: 'Напиток после дороги или тренировки.',
    effects: { thirst: 42, energy: 5, health: 2 }
  },
  {
    id: productId('electrolyte_pack'),
    name: 'Электролиты',
    category: 'medicine',
    price: 260,
    description: 'Помогают восстановиться после сильной усталости.',
    effects: { thirst: 25, health: 4, energy: 4 }
  },
  {
    id: productId('painkiller'),
    name: 'Обезболивающее',
    category: 'medicine',
    price: 220,
    description: 'Базовая аптечная покупка.',
    effects: { health: 6, mood: 1 }
  },
  {
    id: productId('vitamins_pack'),
    name: 'Витамины',
    category: 'medicine',
    price: 480,
    description: 'Небольшая поддержка здоровья.',
    effects: { health: 8, energy: 3 }
  },
  {
    id: productId('bandage_kit'),
    name: 'Пластыри',
    category: 'medicine',
    price: 160,
    description: 'Мелкая аптечная расходка.',
    effects: { health: 3 }
  },
  {
    id: productId('cold_medicine'),
    name: 'Средство от простуды',
    category: 'medicine',
    price: 420,
    description: 'Базовое средство для восстановления здоровья.',
    effects: { health: 10, energy: -2 }
  },
  {
    id: productId('hygiene_kit'),
    name: 'Гигиенический набор',
    category: 'other',
    price: 350,
    description: 'Бытовая покупка для нормального дня.',
    effects: { mood: 4, health: 2 }
  },
  {
    id: productId('toothpaste'),
    name: 'Зубная паста',
    category: 'other',
    price: 180,
    description: 'Базовая бытовая расходка.',
    effects: { mood: 2 }
  },
  {
    id: productId('laundry_powder'),
    name: 'Стиральный порошок',
    category: 'other',
    price: 420,
    description: 'Бытовой товар для поддержания порядка.',
    effects: { mood: 3 }
  },
  {
    id: productId('fruit_pack'),
    name: 'Фрукты',
    category: 'food',
    price: 240,
    description: 'Лёгкий полезный перекус.',
    effects: { hunger: 24, health: 3, thirst: 5 }
  },
  {
    id: productId('yogurt'),
    name: 'Йогурт',
    category: 'food',
    price: 130,
    description: 'Быстрый молочный перекус.',
    effects: { hunger: 18, health: 1, mood: 2 }
  },
  {
    id: productId('protein_shake'),
    name: 'Протеиновый коктейль',
    category: 'drink',
    price: 290,
    description: 'Спортивный напиток после нагрузки.',
    effects: { hunger: 25, thirst: 25, energy: 6 }
  }
];

export function getProductById(productId: ProductId): Product | undefined {
  return basicProducts.find((product) => product.id === productId);
}
