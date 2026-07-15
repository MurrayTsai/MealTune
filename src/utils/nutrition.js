 // Mifflin-St Jeor Equation for BMR
 export function calculateBMR(weightKg, heightCm, age, sex) {
   // sex: 'male' or 'female'
   const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
   return sex === 'male' ? base + 5 : base - 161;
 }
 
 // Activity level multipliers
 export const ACTIVITY_MULTIPLIERS = {
   sedentary: 1.35,  // Mostly sitting, little exercise
   light: 1.45,      // Light activity 1-2x/week
   moderate: 1.60,   // Moderate exercise 3-4x/week
   high: 1.75        // Exercise 5+ times/week
 };
 
 export const ACTIVITY_LABELS = {
   sedentary: '久坐不动',
   light: '轻度活动',
   moderate: '中等活动',
   high: '较高活动'
 };
 
 // User types
 export const PLAN_TYPES = {
   exercise_assisted: { label: '运动结合减脂', desc: '饮食与运动同步减脂' },
   diet_first: { label: '饮食优先减脂', desc: '主要通过饮食控制减脂' },
   healthy_diet: { label: '健康饮食维持', desc: '改善饮食结构，维持体重' }
 };
 
 function getPlanConfig(planType) {
   switch (planType) {
     case 'exercise_assisted':
       return { deficit: { min: 0.10, max: 0.15 }, proteinRatio: { min: 1.6, max: 1.8 }, fatRatio: { min: 0.25, max: 0.30 } };
     case 'diet_first':
       return { deficit: { min: 0.15, max: 0.20 }, proteinRatio: { min: 1.4, max: 1.6 }, fatRatio: { min: 0.25, max: 0.30 } };
     case 'healthy_diet':
       return { deficit: { min: -0.05, max: 0.05 }, proteinRatio: { min: 1.0, max: 1.2 }, fatRatio: { min: 0.25, max: 0.30 } };
     default:
       return { deficit: { min: 0.10, max: 0.15 }, proteinRatio: { min: 1.4, max: 1.6 }, fatRatio: { min: 0.25, max: 0.30 } };
   }
 }
 
 export function generateNutritionPlan(profile) {
   const { age, sex, height, currentWeight, targetWeight, activityLevel, planType } = profile;
   const config = getPlanConfig(planType);
 
   const bmr = calculateBMR(currentWeight, height, age, sex);
   const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.45;
   const maintenanceCalories = Math.round(bmr * multiplier);
 
   // Calculate target maintenance weight (between current and target)
   const midWeight = (currentWeight + targetWeight) / 2;
 
   // Calorie target based on deficit
   let calorieTarget;
   if (planType === 'healthy_diet') {
     calorieTarget = maintenanceCalories;
   } else {
     const deficitRate = (config.deficit.min + config.deficit.max) / 2;
     calorieTarget = Math.round(maintenanceCalories * (1 - deficitRate));
   }
 
   const calorieMin = Math.round(maintenanceCalories * (1 - config.deficit.max));
   const calorieMax = Math.round(maintenanceCalories * (1 - config.deficit.min));
 
   // Protein target
   const proteinLow = Math.round(config.proteinRatio.min * currentWeight);
   const proteinHigh = Math.round(config.proteinRatio.max * currentWeight);
   const proteinTarget = Math.round(((config.proteinRatio.min + config.proteinRatio.max) / 2) * currentWeight);
 
   // Fat target (25-30% of calories)
   const fatCalMin = Math.round(calorieTarget * config.fatRatio.min);
   const fatCalMax = Math.round(calorieTarget * config.fatRatio.max);
   const fatTarget = Math.round(fatCalMax / 9);
   const fatMin = Math.round(fatCalMin / 9);
   const fatMax = Math.round(fatCalMax / 9);
 
   // Carbs (remaining calories)
   const proteinCalories = proteinTarget * 4;
   const fatCaloriesAverage = Math.round(((config.fatRatio.min + config.fatRatio.max) / 2) * calorieTarget);
   const carbCalories = calorieTarget - proteinCalories - fatCaloriesAverage;
   const carbTarget = Math.round(carbCalories / 4);
   const carbMin = Math.round(carbTarget * 0.8);
   const carbMax = Math.round(carbTarget * 1.2);
 
   // Fiber: ~14g per 1000 kcal
   const fiberTarget = Math.round((14 * calorieTarget) / 1000);
 
   // Vegetables: 400-500g
   const vegetableMin = 400;
   const vegetableMax = 500;
 
   // Fruit: 200-350g
   const fruitMin = 200;
   const fruitMax = 350;
 
   // Water: ~2L
   const waterTarget = 2000;
 
   return {
     calories: calorieTarget,
     calorieMin,
     calorieMax,
     maintenanceCalories,
     protein: proteinTarget,
     proteinMin: proteinLow,
     proteinMax: proteinHigh,
     carbs: carbTarget,
     carbMin,
     carbMax,
     fat: fatTarget,
     fatMin,
     fatMax,
     fiber: fiberTarget,
     vegetableMin,
     vegetableMax,
     fruitMin,
     fruitMax,
     waterTarget,
     bmr,
     activityLevel,
     planType,
     createdAt: new Date().toISOString(),
     status: 'active'
   };
 }
 
 // Calculate nutrition from a list of food items
 export function calculateMealTotals(foods) {
   const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
   for (const food of foods) {
     totals.calories += food.calories || 0;
     totals.protein += food.protein || 0;
     totals.carbs += food.carbs || 0;
     totals.fat += food.fat || 0;
     totals.fiber += food.fiber || 0;
   }
   totals.calories = Math.round(totals.calories);
   totals.protein = Math.round(totals.protein * 10) / 10;
   totals.carbs = Math.round(totals.carbs * 10) / 10;
   totals.fat = Math.round(totals.fat * 10) / 10;
   totals.fiber = Math.round(totals.fiber * 10) / 10;
   return totals;
 }
 
 // Calculate remaining nutrition for the day
 export function calculateRemaining(plan, consumed) {
   return {
     calories: plan.calories - consumed.calories,
     protein: plan.protein - consumed.protein,
     carbs: plan.carbs - consumed.carbs,
     fat: plan.fat - consumed.fat,
     fiber: plan.fiber - consumed.fiber
   };
 }
 
 // Check if a value is within target range
 export function isInRange(value, min, max) {
   return value >= min && value <= max;
 }
 
 export function getStatus(value, min, max) {
   if (value < min) return 'low';
   if (value > max) return 'high';
   return 'good';
 }
 
 // Get exercise recommendations based on plan type
 export function getExerciseRecommendation(planType) {
   switch (planType) {
     case 'exercise_assisted':
       return { description: '每周2次力量训练 + 2次有氧训练，每次20-40分钟', strength: 2, cardio: 2, duration: '20-40分钟' };
     case 'diet_first':
       return { description: '每周2-3次快走，每次20-30分钟', strength: 0, cardio: 2, duration: '20-30分钟' };
     case 'healthy_diet':
       return { description: '保持日常活动，每周1-2次轻度运动', strength: 0, cardio: 1, duration: '按个人习惯' };
     default:
       return { description: '每周3-4次中等强度运动', strength: 1, cardio: 2, duration: '30分钟' };
   }
 }
 
 // Calculate stage target (3-5% of current weight as first stage)
 export function calculateStageTarget(currentWeight, targetWeight) {
   const firstDrop = currentWeight * 0.03; // 3% first stage
   const stageTarget = Math.round((currentWeight - firstDrop) * 10) / 10;
   const minimumTarget = currentWeight * 0.95; // At most 5%
   return {
     stageTarget: Math.max(stageTarget, Math.round(minimumTarget * 10) / 10),
     finalTarget: targetWeight
   };
 }
 
 // Format macronutrient percentage
 export function macroPercent(grams, calories) {
   if (!calories || !grams) return 0;
   const cal = grams * (grams === 'fat' ? 9 : 4);
   return Math.round((cal / calories) * 100);
 }
 
 // Today's date as string
 export function today() {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
 }
 
 // Format date for display
 export function formatDate(dateStr) {
   const d = new Date(dateStr + 'T00:00:00');
   const month = d.getMonth() + 1;
   const day = d.getDate();
   const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
   const weekday = weekdays[d.getDay()];
   return `${month}月${day}日 周${weekday}`;
 }
 
 // Get week start (Monday) from a date
 export function getWeekStart(dateStr) {
   const d = new Date(dateStr + 'T00:00:00');
   const day = d.getDay();
   const diff = d.getDate() - day + (day === 0 ? -6 : 1);
   d.setDate(diff);
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
 }
 
 // Get month start from a date
 export function getMonthStart(dateStr) {
   const d = new Date(dateStr + 'T00:00:00');
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
 }
 
 // Generate a short insight from nutrition comparison
 export function generateInsight(remaining, plan) {
   const insights = [];
   if (remaining.calories > 0) {
     insights.push({ type: 'info', text: `今日还有 ${remaining.calories} 千卡剩余` });
   } else if (remaining.calories < -200) {
     insights.push({ type: 'warning', text: `今日热量已超出 ${Math.abs(remaining.calories)} 千卡` });
   }
   if (remaining.protein < -10) {
     insights.push({ type: 'warning', text: '蛋白质摄入不足，建议补充优质蛋白' });
   }
   if (remaining.fiber > 5) {
     insights.push({ type: 'info', text: '膳食纤维还有余量，可以来点蔬菜' });
   }
   return insights;
 }
