 import { getMealRecords, getUserProfile, getNutritionPlan, getWeightRecords, saveMonthlyReview } from '../data/db.js';
 import { pageWrapper, navigate } from '../router.js';
 import { today, getMonthStart, formatDate, calculateMealTotals } from '../utils/nutrition.js';
 
 export async function render() {
   const profile = await getUserProfile();
   const plan = await getNutritionPlan();
 
   // Get monthly data (last 30 days)
   let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
   let daysWithFood = 0, recordDays = 0;
 
   for (let i = 29; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     const meals = await getMealRecords(dateStr);
     if (meals.length > 0) {
       recordDays++;
       let dayCal = 0;
       for (const meal of meals) {
         if (meal.foods) {
           for (const food of meal.foods) {
             dayCal += food.calories || 0;
             totalProtein += food.protein || 0;
             totalCarbs += food.carbs || 0;
             totalFat += food.fat || 0;
           }
         }
       }
       totalCalories += dayCal;
       if (dayCal > 0) daysWithFood++;
     }
   }
 
   const avgCal = daysWithFood > 0 ? Math.round(totalCalories / daysWithFood) : 0;
   const avgPro = daysWithFood > 0 ? Math.round(totalProtein / daysWithFood) : 0;
 
   // Weight comparison: first week vs last week
   const weightRecords = await getWeightRecords(30);
   let firstWeekWeights = [], lastWeekWeights = [];
   const now = new Date();
   for (const r of weightRecords) {
     const rd = new Date(r.date + 'T00:00:00');
     const daysAgo = Math.floor((now - rd) / (1000 * 60 * 60 * 24));
     if (daysAgo <= 7 && daysAgo >= 0) lastWeekWeights.push(r.weight);
     if (daysAgo <= 30 && daysAgo >= 23) firstWeekWeights.push(r.weight);
   }
   const avgFirst = firstWeekWeights.length > 0 ? firstWeekWeights.reduce((a, b) => a + b, 0) / firstWeekWeights.length : 0;
   const avgLast = lastWeekWeights.length > 0 ? lastWeekWeights.reduce((a, b) => a + b, 0) / lastWeekWeights.length : 0;
   const weightChange = avgLast > 0 ? Math.round((avgLast - avgFirst) * 100) / 100 : 0;
 
   // Assessment
   let assessment = `本月共记录 ${recordDays} 天，有进食记录 ${daysWithFood} 天。`;
   if (avgCal > 0) {
     const calPct = plan ? Math.round((avgCal / plan.calories) * 100) : 0;
     assessment += ` 日均摄入 ${avgCal} kcal (目标 ${plan?.calories || '-'})。`;
     if (calPct < 85) assessment += ' 热量偏低，注意摄入充足。';
     else if (calPct > 115) assessment += ' 热量偏高，建议适当调整。';
     else assessment += ' 热量控制良好。';
   }
   if (weightChange !== 0) {
     assessment += ` 体重变化：${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg。`;
     if (weightChange < -1) assessment += ' 减重进展良好。';
     else if (weightChange > 1) assessment += ' 体重略有上升，请关注。';
     else assessment += ' 体重维持稳定。';
   }
 
   const monthStart = getMonthStart(today());
   await saveMonthlyReview({
     monthStart,
     recordDays,
     daysWithFood,
     avgCal, avgPro,
     avgFirst, avgLast,
     assessment,
     createdAt: new Date().toISOString()
   });
 
   const content = `
     <div class="fade-in">
       <div class="review-header">
         <h2>本月复盘</h2>
         <div class="big-number">${new Date().getMonth() + 1}月</div>
       </div>
       <div class="card">
         <div class="card-header">记录概况</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${recordDays}</div><div class="stat-label">记录天数</div></div>
           <div class="stat-item"><div class="stat-value">${daysWithFood}</div><div class="stat-label">有饮食天数</div></div>
           <div class="stat-item"><div class="stat-value">${Math.round(((recordDays > 0 ? recordDays : 0) / 30) * 100)}%</div><div class="stat-label">记录率</div></div>
         </div>
       </div>
       <div class="card">
         <div class="card-header">饮食对比</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${avgCal}</div><div class="stat-label">日均热量</div></div>
           <div class="stat-item"><div class="stat-value">${avgPro}g</div><div class="stat-label">日均蛋白质</div></div>
           <div class="stat-item"><div class="stat-value">${plan?.calories || '-'}</div><div class="stat-label">目标</div></div>
         </div>
       </div>
       ${avgFirst > 0 ? `
       <div class="card">
         <div class="card-header">体重对比</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${avgFirst.toFixed(1)}</div><div class="stat-label">月初平均</div></div>
           <div class="stat-item"><div class="stat-value">${avgLast.toFixed(1)}</div><div class="stat-label">月末平均</div></div>
           <div class="stat-item"><div class="stat-value ${weightChange > 0 ? 'weight-change positive' : weightChange < 0 ? 'weight-change negative' : ''}">${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}</div><div class="stat-label">变化</div></div>
         </div>
       </div>
       ` : ''}
       <div class="card" style="background:var(--green-bg);">
         <div class="card-header">AI 评估</div>
         <div style="font-size:0.9375rem;line-height:1.6;">${assessment}</div>
       </div>
       <button class="btn btn-secondary btn-block mt-8" onclick="window.navigate('/me')">返回</button>
     </div>
   `;
   const html = pageWrapper(content, { title: '月复盘', showBack: true, backPath: '/me' });
   const app = document.getElementById('app');
   if (app) app.innerHTML = html;
 }
 
 export default { render };
