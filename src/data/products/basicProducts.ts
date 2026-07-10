import water_05lImage from '../../assets/products/water_05l.png';
import water_15lImage from '../../assets/products/water_15l.png';
import snack_barImage from '../../assets/products/snack_bar.png';
import ready_mealImage from '../../assets/products/ready_meal.png';
import coffee_cupImage from '../../assets/products/coffee_cup.png';
import cafe_sandwichImage from '../../assets/products/cafe_sandwich.png';
import tea_cupImage from '../../assets/products/tea_cup.png';
import energy_drinkImage from '../../assets/products/energy_drink.png';
import shawarmaImage from '../../assets/products/shawarma.png';
import salad_bowlImage from '../../assets/products/salad_bowl.png';
import business_lunchImage from '../../assets/products/business_lunch.png';
import pasta_boxImage from '../../assets/products/pasta_box.png';
import soup_cupImage from '../../assets/products/soup_cup.png';
import protein_barImage from '../../assets/products/protein_bar.png';
import isotonic_drinkImage from '../../assets/products/isotonic_drink.png';
import electrolyte_packImage from '../../assets/products/electrolyte_pack.png';
import painkillerImage from '../../assets/products/painkiller.png';
import vitamins_packImage from '../../assets/products/vitamins_pack.png';
import bandage_kitImage from '../../assets/products/bandage_kit.png';
import cold_medicineImage from '../../assets/products/cold_medicine.png';
import hygiene_kitImage from '../../assets/products/hygiene_kit.png';
import toothpasteImage from '../../assets/products/toothpaste.png';
import laundry_powderImage from '../../assets/products/laundry_powder.png';
import fruit_packImage from '../../assets/products/fruit_pack.png';
import yogurtImage from '../../assets/products/yogurt.png';
import protein_shakeImage from '../../assets/products/protein_shake.png';
import type { Product } from '../../types/product';
import type { ProductId } from '../../types/ids';

export function productId(value: string): ProductId {
  return value as ProductId;
}

export const basicProducts: Product[] = [
  {
    id: productId('water_05l'),
    name: 'Святой Источник негазированная 0.5 л',
    category: 'drink',
    price: 80,
    description: 'Обычная бутылка воды. Быстро закрывает жажду.',
    imageSrc: water_05lImage,
    effects: {
      thirst: 35
    }
  },
  {
    id: productId('water_15l'),
    name: 'Святой Источник негазированная 1.5 л',
    category: 'drink',
    price: 140,
    description: 'Большая бутылка воды. Выгоднее маленькой.',
    imageSrc: water_15lImage,
    effects: {
      thirst: 70
    }
  },
  {
    id: productId('snack_bar'),
    name: 'Snickers 50 г',
    category: 'food',
    price: 120,
    description: 'Дешёвый перекус. Не еда на день, но выручает.',
    imageSrc: snack_barImage,
    effects: {
      hunger: 20,
      mood: 2
    }
  },
  {
    id: productId('ready_meal'),
    name: 'Доширак с курицей 90 г',
    category: 'food',
    price: 350,
    description: 'Нормальный готовый обед из магазина.',
    imageSrc: ready_mealImage,
    effects: {
      hunger: 55,
      thirst: -5,
      mood: 4
    }
  },
  {
    id: productId('coffee_cup'),
    name: 'Cofix Американо 0.3 л',
    category: 'coffee',
    price: 250,
    description: 'Кофе из кофейни. Немного бодрит, но сушит.',
    imageSrc: coffee_cupImage,
    effects: {
      energy: 12,
      thirst: -5,
      mood: 5
    }
  },
  {
    id: productId('cafe_sandwich'),
    name: 'ВкусВилл Сэндвич с курицей',
    category: 'food',
    price: 320,
    description: 'Быстрый сэндвич из кофейни.',
    imageSrc: cafe_sandwichImage,
    effects: {
      hunger: 35,
      mood: 3
    }
  },

  {
    id: productId('tea_cup'),
    name: 'Greenfield Golden Ceylon',
    category: 'drink',
    price: 150,
    description: 'Горячий чай без сильного эффекта на энергию.',
    imageSrc: tea_cupImage,
    effects: { thirst: 18, mood: 3 }
  },
  {
    id: productId('energy_drink'),
    name: 'Burn Original 0.449 л',
    category: 'drink',
    price: 190,
    description: 'Быстрая бодрость ценой жажды.',
    imageSrc: energy_drinkImage,
    effects: { energy: 18, thirst: -10, mood: 2 }
  },
  {
    id: productId('shawarma'),
    name: 'Мираторг Шаурма с курицей',
    category: 'food',
    price: 280,
    description: 'Плотный быстрый перекус.',
    imageSrc: shawarmaImage,
    effects: { hunger: 45, thirst: -8, mood: 4 }
  },
  {
    id: productId('salad_bowl'),
    name: 'ВкусВилл Салат «Цезарь»',
    category: 'food',
    price: 360,
    description: 'Лёгкая еда без тяжести.',
    imageSrc: salad_bowlImage,
    effects: { hunger: 30, health: 3, mood: 2 }
  },
  {
    id: productId('business_lunch'),
    name: 'Му-Му Бизнес-ланч',
    category: 'food',
    price: 520,
    description: 'Полноценный обед для рабочего дня.',
    imageSrc: business_lunchImage,
    effects: { hunger: 70, thirst: -6, mood: 5 }
  },
  {
    id: productId('pasta_box'),
    name: 'ВкусВилл Паста «Карбонара»',
    category: 'food',
    price: 430,
    description: 'Сытная еда из столовой или фудкорта.',
    imageSrc: pasta_boxImage,
    effects: { hunger: 58, thirst: -6, mood: 4 }
  },
  {
    id: productId('soup_cup'),
    name: 'ВкусВилл Суп куриный',
    category: 'food',
    price: 260,
    description: 'Простая горячая еда.',
    imageSrc: soup_cupImage,
    effects: { hunger: 38, health: 2, mood: 3 }
  },
  {
    id: productId('protein_bar'),
    name: 'Bombbar Protein Bar',
    category: 'food',
    price: 210,
    description: 'Спортивный перекус.',
    imageSrc: protein_barImage,
    effects: { hunger: 28, energy: 4, mood: 2 }
  },
  {
    id: productId('isotonic_drink'),
    name: 'Powerade Mountain Blast 0.5 л',
    category: 'drink',
    price: 180,
    description: 'Напиток после дороги или тренировки.',
    imageSrc: isotonic_drinkImage,
    effects: { thirst: 42, energy: 5, health: 2 }
  },
  {
    id: productId('electrolyte_pack'),
    name: 'Регидрон Био',
    category: 'medicine',
    price: 260,
    description: 'Помогают восстановиться после сильной усталости.',
    imageSrc: electrolyte_packImage,
    effects: { thirst: 25, health: 4, energy: 4 }
  },
  {
    id: productId('painkiller'),
    name: 'Нурофен Экспресс',
    category: 'medicine',
    price: 220,
    description: 'Базовая аптечная покупка.',
    imageSrc: painkillerImage,
    effects: { health: 6, mood: 1 }
  },
  {
    id: productId('vitamins_pack'),
    name: 'Компливит',
    category: 'medicine',
    price: 480,
    description: 'Небольшая поддержка здоровья.',
    imageSrc: vitamins_packImage,
    effects: { health: 8, energy: 3 }
  },
  {
    id: productId('bandage_kit'),
    name: 'Hartmann Cosmos',
    category: 'medicine',
    price: 160,
    description: 'Мелкая аптечная расходка.',
    imageSrc: bandage_kitImage,
    effects: { health: 3 }
  },
  {
    id: productId('cold_medicine'),
    name: 'ТераФлю',
    category: 'medicine',
    price: 420,
    description: 'Базовое средство для восстановления здоровья.',
    imageSrc: cold_medicineImage,
    effects: { health: 10, energy: -2 }
  },
  {
    id: productId('hygiene_kit'),
    name: 'Nivea Men Travel Set',
    category: 'other',
    price: 350,
    description: 'Бытовая покупка для нормального дня.',
    imageSrc: hygiene_kitImage,
    effects: { mood: 4, health: 2 }
  },
  {
    id: productId('toothpaste'),
    name: 'Colgate Total',
    category: 'other',
    price: 180,
    description: 'Базовая бытовая расходка.',
    imageSrc: toothpasteImage,
    effects: { mood: 2 }
  },
  {
    id: productId('laundry_powder'),
    name: 'Persil Color',
    category: 'other',
    price: 420,
    description: 'Бытовой товар для поддержания порядка.',
    imageSrc: laundry_powderImage,
    effects: { mood: 3 }
  },
  {
    id: productId('fruit_pack'),
    name: 'ВкусВилл Фруктовый микс',
    category: 'food',
    price: 240,
    description: 'Лёгкий полезный перекус.',
    imageSrc: fruit_packImage,
    effects: { hunger: 24, health: 3, thirst: 5 }
  },
  {
    id: productId('yogurt'),
    name: 'Чудо Йогурт',
    category: 'food',
    price: 130,
    description: 'Быстрый молочный перекус.',
    imageSrc: yogurtImage,
    effects: { hunger: 18, health: 1, mood: 2 }
  },
  {
    id: productId('protein_shake'),
    name: 'Bombbar Protein Shake',
    category: 'drink',
    price: 290,
    description: 'Спортивный напиток после нагрузки.',
    imageSrc: protein_shakeImage,
    effects: { hunger: 25, thirst: 25, energy: 6 }
  }
];

export function getProductById(productId: ProductId): Product | undefined {
  return basicProducts.find((product) => product.id === productId);
}
