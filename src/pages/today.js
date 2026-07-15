 import { getUserProfile, getNutritionPlan, getMealRecords, saveWeightRecord, getWeightRecords } from '../data/db.js';
 import { today, formatDate, calculateMealTotals, generateInsight } from '../utils/nutrition.js';
 import { generateRecommendation, parseMealText } from '../utils/aiService.js';
 import { pageWrapper, navigate } from '../router.js';
 import { showToast } from '../components/shared.js';

 export async function render() {
   const profile = await getUserProfile();
   if (!profile || !profile.onboardingCompleted) {
     navigate('/onboarding');
     return;
   }

   const plan = await getNutritionPlan();
   const date = today();
   const meals = await getMealRecords(date);
   const yesterdayMeals = await getMealRecords(getYesterday());
   const weightRecords = await getWeightRecords(7);

   // Calculate consumed totals
   let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, vegetables: 0 };
   let mealCount = 0;
   for (const meal of meals) {
     if (meal.foods) {
       for (const food of meal.foods) {
         consumed.calories += food.calories || 0;
         consumed.protein += food.protein || 0;
         consumed.carbs += food.carbs || 0;
         consumed.fat += food.fat || 0;
         consumed.fiber += food.fiber || 0;
       }
     }
     mealCount++;
   }

   // Get AI recommendations
   let recommendations = [];
   try {
     recommendations = await generateRecommendation(plan, consumed, profile.planType, date);
   } catch {}

   // Get latest weight
   const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1] : null;
   const firstWeight = weightRecords.length > 0 ? weightRecords[0] : null;

   // Calc percentages
   const calPercent = plan ? Math.min(100, Math.round((consumed.calories / plan.calories) * 100)) : 0;
   const proteinPercent = plan ? Math.min(100, Math.round((consumed.protein / plan.protein) * 100)) : 0;
   const carbsPercent = plan ? Math.min(100, Math.round((consumed.carbs / plan.carbs) * 100)) : 0;
   const fatPercent = plan ? Math.min(100, Math.round((consumed.fat / plan.fat) * 100)) : 0;

   const content = `
     <div class="fade-in">
       <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
         <div>
           <div style="font-size:0.875rem;color:var(--text-secondary);">${formatDate(date)}</div>
           <h2 style="margin-top:2px;">今天</h2>
         </div>
         <div style="text-align:right;">
           <div class="weight-display" style="padding:0;gap:2px;">
             <span class="weight-number">${latestWeight ? latestWeight.weight : profile.currentWeight}</span>
             <span class="weight-unit">kg</span>
           </div>
           <div style="font-size:0.75rem;color:var(--text-muted);">点击记录体重</div>
         </div>
       </div>

       <!-- Calorie Ring -->
       <div class="card" style="text-align:center;">
         <div style="position:relative;width:120px;height:120px;margin:0 auto 8px;">
           <svg width="120" height="120" viewBox="0 0 120 120">
             <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" stroke-width="10"/>
             <circle cx="60" cy="60" r="54" fill="none" stroke="var(--green)" stroke-width="10"
               stroke-dasharray="${2 * Math.PI * 54}" stroke-dashoffset="${2 * Math.PI * 54 * (1 - calPercent / 100)}"
               stroke-linecap="round" transform="rotate(-90 60 60)"/>
           </svg>
           <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
             <div style="font-size:1.5rem;font-weight:700;">${consumed.calories}</div>
             <div style="font-size:0.75rem;color:var(--text-secondary);">/ ${plan?.calories || 0} kcal</div>
           </div>
         </div>
         <div style="font-size:0.8125rem;color:var(--text-secondary);">
           ${consumed.calories > (plan?.calories || 0) ? '今日热量已达标' : `剩余 ${(plan?.calories || 0) - consumed.calories} 千卡`}
         </div>
       </div>

       <!-- Macro Progress -->
       <div class="card">
         <div class="card-header">三大营养素</div>
         <div class="macro-grid">
           <div class="macro-item">
             <div class="macro-value" style="color:var(--blue);">${Math.round(consumed.protein)}g</div>
             <div class="progress-bar" style="height:4px;">
               <div class="progress-fill blue" style="width:${proteinPercent}%;"></div>
             </div>
             <div class="macro-label">蛋白质 / ${plan?.protein || 0}g</div>
           </div>
           <div class="macro-item">
             <div class="macro-value" style="color:var(--orange);">${Math.round(consumed.carbs)}g</div>
             <div class="progress-bar" style="height:4px;">
               <div class="progress-fill orange" style="width:${carbsPercent}%;"></div>
             </div>
             <div class="macro-label">碳水 / ${plan?.carbs || 0}g</div>
           </div>
           <div class="macro-item">
             <div class="macro-value" style="color:var(--warning);">${Math.round(consumed.fat)}g</div>
             <div class="progress-bar" style="height:4px;">
               <div class="progress-fill yellow" style="width:${fatPercent}%;"></div>
             </div>
             <div class="macro-label">脂肪 / ${plan?.fat || 0}g</div>
           </div>
         </div>
       </div>

       <!-- AI Recommendations -->
       ${recommendations.length > 0 ? `
       <div class="card" style="background:var(--green-bg);">
         <div class="card-header" style="color:var(--green);">AI 饮食建议</div>
         ${recommendations.map(r => `
           <div class="insight-banner ${r.type === 'warning' ? 'insight-warning' : r.type === 'tip' ? 'insight-tip' : r.type === 'recommendation' ? 'insight-success' : 'insight-tip'}">
             ${r.text}
           </div>
         `).join('')}
       </div>` : ''}

       <!-- Today's Meals -->
       <div class="card" style="padding:12px 0;">
         <div class="card-header" style="padding:0 16px 8px;">今日餐食</div>
         ${mealCount === 0 ? `
           <div class="empty-state" style="padding:20px;">
             <h3>今天还没有记录</h3>
             <p>点击下方按钮记录第一餐</p>
           </div>
         ` : `
           ${['早餐', '午餐', '晚餐', '加餐'].map(mealType => {
             const meal = meals.find(m => m.mealType === mealType);
             if (!meal) return '';
             const mealTotal = calculateMealTotals(meal.foods || []);
             return `
               <div class="meal-card" style="margin:0 16px 8px;">
                 <div class="meal-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                   <div class="meal-header-left">
                     ${mealType === '早餐' ? '🌅' : mealType === '午餐' ? '☀️' : mealType === '晚餐' ? '🌙' : '🍪'}
                     <span>${mealType}</span>
                   </div>
                   <div class="meal-header-right">
                     <span>${mealTotal.calories} kcal</span>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                   </div>
                 </div>
                 <div class="meal-body hidden">
                   ${(meal.foods || []).map(f => `
                     <div class="food-item">
                       <span class="food-name">${f.foodName}</span>
                       <span class="food-amount">${f.weight}g</span>
                       <span class="food-cal">${f.calories} kcal</span>
                     </div>
                   `).join('')}
                 </div>
               </div>
             `;
           }).join('')}
         `}
         <div style="padding:8px 16px 0;">
           <button class="btn btn-outline btn-block btn-sm" onclick="window.navigate('/records')">
             + 记录餐食
           </button>
         </div>
       </div>

       <!-- Water Tracker -->
       <div class="card">
         <div class="card-header">饮水</div>
         <div class="water-tracker">
           <button class="water-btn" id="water-sub" onclick="adjustWater(-250)">-</button>
           <div class="water-progress">
             <div style="display:flex;justify-content:space-between;font-size:0.8125rem;margin-bottom:4px;">
               <span id="water-amount">0 ml</span>
               <span class="text-secondary">目标 ${plan?.waterTarget || 2000} ml</span>
             </div>
             <div class="progress-bar">
               <div class="progress-fill blue" id="water-bar" style="width:0%;"></div>
             </div>
           </div>
           <button class="water-btn" onclick="adjustWater(250)">+</button>
         </div>
         <div style="margin-top:8px;">
           <button class="btn btn-sm btn-secondary" onclick="adjustWater(500)">+500ml</button>
         </div>
       </div>

       <!-- Exercise -->
       <div class="card">
         <div class="card-header">今日运动</div>
         <div style="font-size:0.875rem;color:var(--text-secondary);">
           ${profile.planType === 'exercise_assisted' ? '今日建议：力量训练 30-40分钟' :
             profile.planType === 'diet_first' ? '今日建议：快走 20-30分钟' :
             '今日建议：保持日常活动量'}
         </div>
       </div>
     </div>
   `;

   const html = pageWrapper(content, { title: 'MealTune' });
   const app = document.getElementById('app');
   if (app) app.innerHTML = html;

   // Setup water tracking
   setupWaterTracker(plan?.waterTarget || 2000);

   // Setup weight click
   const weightDisplay = app?.querySelector('.weight-display');
   if (weightDisplay) {
     weightDisplay.style.cursor = 'pointer';
     weightDisplay.onclick = async () => {
       const { showModal } = await import('../components/shared.js');
       const { default: modal } = await import('../components/shared.js');
       const weight = prompt('记录今日体重 (kg):', latestWeight?.weight || profile.currentWeight);
       if (weight && parseFloat(weight) > 0) {
         await saveWeightRecord({ date, weight: parseFloat(weight) });
         showToast('体重已记录', 'success');
         render();
       }
     };
   }
 }

 let waterIntake = 0;
 function setupWaterTracker(target) {
   const stored = localStorage.getItem(`water_${today()}`);
   waterIntake = stored ? parseInt(stored) : 0;
   updateWaterDisplay(target);
 }

 window.adjustWater = (amount) => {
   const date = today();
   const key = `water_${date}`;
   waterIntake = Math.max(0, waterIntake + amount);
   localStorage.setItem(key, waterIntake.toString());
   const plan = localStorage.getItem('mealtune_current_plan');
   const target = plan ? JSON.parse(plan).waterTarget : 2000;
   updateWaterDisplay(target);
 };

 function updateWaterDisplay(target) {
   const amountEl = document.getElementById('water-amount');
   const barEl = document.getElementById('water-bar');
   if (amountEl) amountEl.textContent = `${waterIntake} ml`;
   if (barEl) barEl.style.width = `${Math.min(100, (waterIntake / target) * 100)}%`;
 }

 function getYesterday() {
   const d = new Date();
   d.setDate(d.getDate() - 1);
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
 }

 export default { render };
