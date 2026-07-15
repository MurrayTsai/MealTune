 // Built-in food database with per-100g nutrition values
 // Based on Chinese standard food composition data
 export const FOOD_DATABASE = [
   // === Grains & Rice ===
   { id: 'rice_cooked', name: '米饭', nameEn: 'Cooked Rice', category: 'grain', per100g: { cal: 116, protein: 2.6, carbs: 25.9, fat: 0.3, fiber: 0.3 } },
   { id: 'porridge', name: '粥', nameEn: 'Porridge', category: 'grain', per100g: { cal: 46, protein: 1.1, carbs: 9.7, fat: 0.2, fiber: 0.1 } },
   { id: 'noodle_cooked', name: '面条(熟)', nameEn: 'Cooked Noodles', category: 'grain', per100g: { cal: 110, protein: 3.4, carbs: 22.8, fat: 0.5, fiber: 0.4 } },
   { id: 'bread_white', name: '白面包', nameEn: 'White Bread', category: 'grain', per100g: { cal: 265, protein: 8.0, carbs: 49.0, fat: 3.2, fiber: 2.7 } },
   { id: 'bread_wheat', name: '全麦面包', nameEn: 'Whole Wheat Bread', category: 'grain', per100g: { cal: 247, protein: 9.0, carbs: 41.0, fat: 3.4, fiber: 7.0 } },
   { id: 'steamed_bun', name: '馒头', nameEn: 'Steamed Bun', category: 'grain', per100g: { cal: 221, protein: 7.0, carbs: 44.2, fat: 1.1, fiber: 1.5 } },
   { id: 'corn', name: '玉米', nameEn: 'Corn', category: 'grain', per100g: { cal: 112, protein: 4.0, carbs: 22.8, fat: 1.2, fiber: 2.9 } },
   { id: 'oatmeal', name: '燕麦片', nameEn: 'Oatmeal', category: 'grain', per100g: { cal: 367, protein: 13.5, carbs: 66.3, fat: 6.7, fiber: 10.6 } },
   { id: 'sweet_potato', name: '红薯', nameEn: 'Sweet Potato', category: 'grain', per100g: { cal: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3.0 } },
   { id: 'potato', name: '土豆', nameEn: 'Potato', category: 'grain', per100g: { cal: 81, protein: 2.0, carbs: 17.5, fat: 0.2, fiber: 1.4 } },
 
   // === Proteins ===
   { id: 'chicken_breast', name: '鸡胸肉', nameEn: 'Chicken Breast', category: 'protein', per100g: { cal: 133, protein: 31.0, carbs: 0, fat: 1.2, fiber: 0 } },
   { id: 'chicken_leg', name: '鸡腿肉', nameEn: 'Chicken Leg', category: 'protein', per100g: { cal: 181, protein: 20.0, carbs: 0, fat: 11.0, fiber: 0 } },
   { id: 'egg_whole', name: '鸡蛋', nameEn: 'Whole Egg', category: 'protein', per100g: { cal: 144, protein: 13.3, carbs: 1.5, fat: 8.8, fiber: 0 } },
   { id: 'egg_white', name: '蛋白', nameEn: 'Egg White', category: 'protein', per100g: { cal: 48, protein: 11.0, carbs: 0.7, fat: 0, fiber: 0 } },
   { id: 'beef_lean', name: '瘦牛肉', nameEn: 'Lean Beef', category: 'protein', per100g: { cal: 125, protein: 22.3, carbs: 0, fat: 4.2, fiber: 0 } },
   { id: 'pork_lean', name: '瘦猪肉', nameEn: 'Lean Pork', category: 'protein', per100g: { cal: 143, protein: 20.3, carbs: 0, fat: 6.2, fiber: 0 } },
   { id: 'fish_white', name: '白肉鱼', nameEn: 'White Fish', category: 'protein', per100g: { cal: 100, protein: 22.0, carbs: 0, fat: 1.0, fiber: 0 } },
   { id: 'salmon', name: '三文鱼', nameEn: 'Salmon', category: 'protein', per100g: { cal: 208, protein: 20.0, carbs: 0, fat: 13.0, fiber: 0 } },
   { id: 'shrimp', name: '虾仁', nameEn: 'Shrimp', category: 'protein', per100g: { cal: 99, protein: 20.3, carbs: 0.2, fat: 1.7, fiber: 0 } },
   { id: 'tofu_firm', name: '老豆腐', nameEn: 'Firm Tofu', category: 'protein', per100g: { cal: 81, protein: 8.1, carbs: 4.2, fat: 3.7, fiber: 0.4 } },
   { id: 'tofu_soft', name: '嫩豆腐', nameEn: 'Soft Tofu', category: 'protein', per100g: { cal: 62, protein: 6.2, carbs: 2.0, fat: 2.5, fiber: 0.2 } },
   { id: 'milk_whole', name: '全脂牛奶', nameEn: 'Whole Milk', category: 'protein', per100g: { cal: 65, protein: 3.2, carbs: 5.0, fat: 3.5, fiber: 0 } },
   { id: 'yogurt_plain', name: '原味酸奶', nameEn: 'Plain Yogurt', category: 'protein', per100g: { cal: 72, protein: 3.5, carbs: 8.0, fat: 2.5, fiber: 0 } },
   { id: 'soy_milk', name: '豆浆', nameEn: 'Soy Milk', category: 'protein', per100g: { cal: 33, protein: 2.9, carbs: 1.8, fat: 1.5, fiber: 0.4 } },
 
   // === Vegetables ===
   { id: 'broccoli', name: '西兰花', nameEn: 'Broccoli', category: 'vegetable', per100g: { cal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6 } },
   { id: 'spinach', name: '菠菜', nameEn: 'Spinach', category: 'vegetable', per100g: { cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 } },
   { id: 'cabbage', name: '大白菜', nameEn: 'Chinese Cabbage', category: 'vegetable', per100g: { cal: 13, protein: 1.5, carbs: 2.2, fat: 0.2, fiber: 1.0 } },
   { id: 'lettuce', name: '生菜', nameEn: 'Lettuce', category: 'vegetable', per100g: { cal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.2 } },
   { id: 'cucumber', name: '黄瓜', nameEn: 'Cucumber', category: 'vegetable', per100g: { cal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 } },
   { id: 'tomato', name: '番茄', nameEn: 'Tomato', category: 'vegetable', per100g: { cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 } },
   { id: 'carrot', name: '胡萝卜', nameEn: 'Carrot', category: 'vegetable', per100g: { cal: 37, protein: 1.0, carbs: 8.8, fat: 0.2, fiber: 2.8 } },
   { id: 'celery', name: '芹菜', nameEn: 'Celery', category: 'vegetable', per100g: { cal: 16, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.6 } },
   { id: 'mushroom', name: '蘑菇', nameEn: 'Mushroom', category: 'vegetable', per100g: { cal: 20, protein: 2.7, carbs: 3.3, fat: 0.3, fiber: 1.0 } },
   { id: 'green_pepper', name: '青椒', nameEn: 'Green Pepper', category: 'vegetable', per100g: { cal: 22, protein: 1.0, carbs: 4.6, fat: 0.2, fiber: 1.4 } },
   { id: 'eggplant', name: '茄子', nameEn: 'Eggplant', category: 'vegetable', per100g: { cal: 25, protein: 1.0, carbs: 5.9, fat: 0.2, fiber: 3.0 } },
   { id: 'green_beans', name: '四季豆', nameEn: 'Green Beans', category: 'vegetable', per100g: { cal: 34, protein: 2.0, carbs: 7.1, fat: 0.2, fiber: 2.4 } },
   { id: 'cauliflower', name: '菜花', nameEn: 'Cauliflower', category: 'vegetable', per100g: { cal: 24, protein: 1.8, carbs: 4.5, fat: 0.3, fiber: 2.4 } },
   { id: 'onion', name: '洋葱', nameEn: 'Onion', category: 'vegetable', per100g: { cal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 } },
   { id: 'bell_pepper', name: '彩椒', nameEn: 'Bell Pepper', category: 'vegetable', per100g: { cal: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.0 } },
 
   // === Fruits ===
   { id: 'apple', name: '苹果', nameEn: 'Apple', category: 'fruit', per100g: { cal: 52, protein: 0.3, carbs: 14.0, fat: 0.2, fiber: 2.4 } },
   { id: 'banana', name: '香蕉', nameEn: 'Banana', category: 'fruit', per100g: { cal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6 } },
   { id: 'orange', name: '橙子', nameEn: 'Orange', category: 'fruit', per100g: { cal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4 } },
   { id: 'grape', name: '葡萄', nameEn: 'Grape', category: 'fruit', per100g: { cal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9 } },
   { id: 'watermelon', name: '西瓜', nameEn: 'Watermelon', category: 'fruit', per100g: { cal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4 } },
   { id: 'blueberry', name: '蓝莓', nameEn: 'Blueberry', category: 'fruit', per100g: { cal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4 } },
   { id: 'strawberry', name: '草莓', nameEn: 'Strawberry', category: 'fruit', per100g: { cal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0 } },
   { id: 'kiwi', name: '猕猴桃', nameEn: 'Kiwi', category: 'fruit', per100g: { cal: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3.0 } },
 
   // === Oils & Fats ===
   { id: 'olive_oil', name: '橄榄油', nameEn: 'Olive Oil', category: 'fat', per100g: { cal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
   { id: 'peanut_oil', name: '花生油', nameEn: 'Peanut Oil', category: 'fat', per100g: { cal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
   { id: 'butter', name: '黄油', nameEn: 'Butter', category: 'fat', per100g: { cal: 717, protein: 0.9, carbs: 0.1, fat: 81.1, fiber: 0 } },
   { id: 'peanut_butter', name: '花生酱', nameEn: 'Peanut Butter', category: 'fat', per100g: { cal: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 } },
   { id: 'almond', name: '杏仁', nameEn: 'Almond', category: 'fat', per100g: { cal: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5 } },
   { id: 'walnut', name: '核桃', nameEn: 'Walnut', category: 'fat', per100g: { cal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7 } },
 
   // === Legumes ===
   { id: 'red_beans_cooked', name: '红豆(熟)', nameEn: 'Cooked Red Beans', category: 'legume', per100g: { cal: 128, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 7.4 } },
   { id: 'soybean', name: '大豆', nameEn: 'Soybean', category: 'legume', per100g: { cal: 446, protein: 36.5, carbs: 30.2, fat: 19.9, fiber: 9.3 } },
   { id: 'edamame', name: '毛豆', nameEn: 'Edamame', category: 'legume', per100g: { cal: 122, protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2 } },
 
   // === Condiments & Others ===
   { id: 'honey', name: '蜂蜜', nameEn: 'Honey', category: 'condiment', per100g: { cal: 304, protein: 0.3, carbs: 82.4, fat: 0, fiber: 0.2 } },
   { id: 'sugar', name: '白砂糖', nameEn: 'White Sugar', category: 'condiment', per100g: { cal: 387, protein: 0, carbs: 100, fat: 0, fiber: 0 } },
   { id: 'soy_sauce', name: '酱油', nameEn: 'Soy Sauce', category: 'condiment', per100g: { cal: 53, protein: 8.0, carbs: 4.7, fat: 0, fiber: 0 } },
   { id: 'vinegar', name: '醋', nameEn: 'Vinegar', category: 'condiment', per100g: { cal: 18, protein: 0.4, carbs: 3.5, fat: 0, fiber: 0 } },
   { id: 'sesame_oil', name: '香油', nameEn: 'Sesame Oil', category: 'condiment', per100g: { cal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 } },
 
   // === Snacks ===
   { id: 'cookies', name: '饼干', nameEn: 'Cookies', category: 'snack', per100g: { cal: 433, protein: 8.1, carbs: 66.0, fat: 16.4, fiber: 1.5 } },
   { id: 'potato_chips', name: '薯片', nameEn: 'Potato Chips', category: 'snack', per100g: { cal: 536, protein: 7.0, carbs: 49.7, fat: 35.0, fiber: 4.4 } },
   { id: 'chocolate', name: '巧克力', nameEn: 'Chocolate', category: 'snack', per100g: { cal: 546, protein: 4.9, carbs: 59.4, fat: 31.3, fiber: 3.4 } },
   { id: 'ice_cream', name: '冰淇淋', nameEn: 'Ice Cream', category: 'snack', per100g: { cal: 207, protein: 3.5, carbs: 23.6, fat: 11.0, fiber: 0.7 } },
 ];
 
 export function getFoodById(id) {
   return FOOD_DATABASE.find(f => f.id === id);
 }
 
 export function searchFoods(query, category) {
   let results = FOOD_DATABASE;
   if (query) {
     const q = query.toLowerCase();
     results = results.filter(f =>
       f.name.toLowerCase().includes(q) ||
       f.nameEn.toLowerCase().includes(q)
     );
   }
   if (category && category !== 'all') {
     results = results.filter(f => f.category === category);
   }
   return results;
 }
 
 export function getFoodsByCategory(category) {
   return FOOD_DATABASE.filter(f => f.category === category);
 }
 
 export function calculateFoodNutrition(foodId, weightGrams) {
   const food = getFoodById(foodId);
   if (!food) return null;
   const ratio = weightGrams / 100;
   return {
     foodId: food.id,
     foodName: food.name,
     weight: weightGrams,
     calories: Math.round(food.per100g.cal * ratio),
     protein: Math.round(food.per100g.protein * ratio * 10) / 10,
     carbs: Math.round(food.per100g.carbs * ratio * 10) / 10,
     fat: Math.round(food.per100g.fat * ratio * 10) / 10,
     fiber: Math.round(food.per100g.fiber * ratio * 10) / 10,
   };
 }
