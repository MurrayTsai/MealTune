import foodData from "./foodData.json"
export const FOOD_DATABASE = foodData
export function getFoodById(id){return FOOD_DATABASE.find(function(f){return f.id===id})}
export function searchFoods(q,cat){if(q){var l=q.toLowerCase();return FOOD_DATABASE.filter(function(f){return f.name.toLowerCase().includes(l)||f.id.toLowerCase().includes(l)})}if(cat&&cat!=="all")return FOOD_DATABASE.filter(function(f){return f.category===cat});return FOOD_DATABASE}
export function getFoodsByCategory(cat){return FOOD_DATABASE.filter(function(f){return f.category===cat})}
export function calculateFoodNutrition(id,w){var f=getFoodById(id);if(!f)return null;var r=w/100;return{foodId:f.id,foodName:f.name,weight:w,calories:Math.round(f.per100g.cal*r),protein:Math.round(f.per100g.protein*r*10)/10,carbs:Math.round(f.per100g.carbs*r*10)/10,fat:Math.round(f.per100g.fat*r*10)/10,fiber:Math.round(f.per100g.fiber*r*10)/10}}