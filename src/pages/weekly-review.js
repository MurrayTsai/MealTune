 import { getMealRecords, getUserProfile, getNutritionPlan, saveWeeklyReview, getWeeklyReview } from '../data/db.js';
 import { pageWrapper, navigate } from '../router.js';
 import { today, getWeekStart, formatDate, calculateMealTotals } from '../utils/nutrition.js';
 
 export async function render() {
   const profile = await getUserProfile();
   const plan = await getNutritionPlan();
   const weekStart = getWeekStart(today());
 
   // Get meals for the past 7 days
   let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
   let daysWithFood = 0, daysWithWeight = 0, recordDays = 0;
   let totalDays = 0;
 
   for (let i = 6; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     const meals = await getMealRecords(dateStr);
     if (meals.length > 0) {
       recordDays++;
       let dayCal = 0, dayPro = 0, dayCarbs = 0, dayFat = 0;
       for (const meal of meals) {
         if (meal.foods) {
           for (const food of meal.foods) {
             dayCal += food.calories || 0;
             dayPro += food.protein || 0;
             dayCarbs += food.carbs || 0;
             dayFat += food.fat || 0;
           }
         }
       }
       totalCalories += dayCal;
       totalProtein += dayPro;
       totalCarbs += dayCarbs;
       totalFat += dayFat;
       if (dayCal > 0) daysWithFood++;
     }
     totalDays++;
   }
 
   const avgCal = daysWithFood > 0 ? Math.round(totalCalories / daysWithFood) : 0;
   const avgPro = daysWithFood > 0 ? Math.round(totalProtein / daysWithFood) : 0;
   const avgCarbs = daysWithFood > 0 ? Math.round(totalCarbs / daysWithFood) : 0;
   const avgFat = daysWithFood > 0 ? Math.round(totalFat / daysWithFood) : 0;
 
   // Generate review text
   let assessment = '';
   if (recordDays <= 2) {
     assessment = '本周记录数据较少，建议增加记录天数以获得更有意义的分析。';
   } else {
     const calPct = plan ? Math.round((avgCal / plan.calories) * 100) : 0;
     if (calPct > 110) assessment = '本周平均热量摄入略高于目标，建议适当控制。';
     else if (calPct < 80) assessment = '本周热量摄入偏低，注意确保基本能量需求。';
     else assessment = '本周热量控制良好，继续保持！';
 
     const proPct = plan ? Math.round((avgPro / plan.protein) * 100) : 0;
     if (proPct < 70) assessment += ' 蛋白质摄入偏低，建议增加优质蛋白。';
     else if (proPct > 100) assessment += ' 蛋白质摄入充足。';
   }
 
   // Save review
   const review = {
     weekStart,
     recordDays,
     daysWithFood,
     avgCal, avgPro, avgCarbs, avgFat,
     assessment,
     createdAt: new Date().toISOString()
   };
   await saveWeeklyReview(review);
 
   const content = `
     <div class="fade-in">
       <div class="review-header">
         <h2>本周复盘</h2>
         <div class="big-number">${formatDate(weekStart)}</div>
       </div>
       <div class="card">
         <div class="card-header">记录概况</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${recordDays}</div><div class="stat-label">记录天数</div></div>
           <div class="stat-item"><div class="stat-value">${daysWithFood}</div><div class="stat-label">有饮食天数</div></div>
           <div class="stat-item"><div class="stat-value">${Math.round((totalDays > 0 ? recordDays / totalDays : 0) * 100)}%</div><div class="stat-label">记录率</div></div>
         </div>
       </div>
       <div class="card">
         <div class="card-header">平均每日摄入</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${avgCal}</div><div class="stat-label">热量 (kcal)</div></div>
           <div class="stat-item"><div class="stat-value">${avgPro}g</div><div class="stat-label">蛋白质</div></div>
           <div class="stat-item"><div class="stat-value">${avgCarbs}g</div><div class="stat-label">碳水</div></div>
         </div>
         <div class="stat-row" style="margin-top:6px;">
           <div class="stat-item"><div class="stat-value">${avgFat}g</div><div class="stat-label">脂肪</div></div>
           <div class="stat-item"><div class="stat-value">${plan ? Math.round((avgCal / plan.calories) * 100) : 0}%</div><div class="stat-label">达成率</div></div>
           <div class="stat-item"><div class="stat-value">${plan ? plan.calories : '-'}</div><div class="stat-label">目标</div></div>
         </div>
       </div>
       <div class="card" style="background:var(--green-bg);">
         <div class="card-header">AI 评估</div>
         <div style="font-size:0.9375rem;line-height:1.6;">${assessment}</div>
       </div>
       ${recordDays < 3 ? `
         <div class="card insight-warning" style="font-size:0.875rem;">
           数据不足时评估仅供参考。建议持续记录以获得完整分析。
         </div>
       ` : ''}
       <button class="btn btn-secondary btn-block mt-8" onclick="window.navigate('/me')">返回</button>
     </div>
   `;
   const html = pageWrapper(content, { title: '周复盘', showBack: true, backPath: '/me' });
   const app = document.getElementById('app');
   if (app) app.innerHTML = html;
 }
 
 export default { render };
