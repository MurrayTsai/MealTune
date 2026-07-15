 import { getMealRecords, saveMealRecord, deleteMealRecord } from '../data/db.js';
 import { today, formatDate, calculateMealTotals } from '../utils/nutrition.js';
 import { parseMealText } from '../utils/aiService.js';
 import { pageWrapper, navigate } from '../router.js';
 import { showToast, showModal } from '../components/shared.js';
 import { searchFoods, calculateFoodNutrition } from '../data/foodDatabase.js';
 
 let currentDate = today();
 let currentMealType = '早餐';
 let currentFoods = [];
 let aiInputText = '';
 let hasRecognized = false;
 
 export async function render(params) {
   const app = document.getElementById('app');
   if (!app) return;
   if (params && params.date) currentDate = params.date;
 
   const meals = await getMealRecords(currentDate);
   const content = buildPage(meals);
   app.innerHTML = pageWrapper(content, { title: '记录餐食', showBack: true, backPath: '/today' });
   bindHandlers(meals);
 }
 
 function buildPage(meals) {
   let total = null;
   if (currentFoods.length > 0) total = calculateMealTotals(currentFoods);
 
   return `
     <div class="fade-in">
       <!-- Date + Meal Type -->
       <div class="flex items-center justify-between" style="margin-bottom:8px;">
         <button class="btn btn-sm btn-secondary" onclick="changeDate(-1)">&lt;</button>
         <div style="font-weight:600;">${formatDate(currentDate)}</div>
         <button class="btn btn-sm btn-secondary" onclick="changeDate(1)">&gt;</button>
       </div>
       <div class="tabs" style="margin-bottom:12px;">
         ${['早餐','午餐','晚餐','加餐'].map(t =>
           `<div class="tab ${currentMealType===t?'active':''}" onclick="setMealType('${t}')">${t}</div>`
         ).join('')}
       </div>
 
       <!-- Existing meals -->
       ${meals.length ? `
         <div style="margin-bottom:12px;">
           <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">已记录</div>
           ${meals.map(m => {
             const t = calculateMealTotals(m.foods||[]);
             const ic = {早餐:'🌅',午餐:'☀️',晚餐:'🌙',加餐:'🍪'};
             return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:var(--bg);border-radius:6px;margin-bottom:3px;font-size:0.8125rem;">
               <span>${ic[m.mealType]||'🍽️'} ${m.mealType} — ${t.calories} kcal</span>
               <span style="cursor:pointer;color:var(--danger);font-size:0.75rem;" onclick="deleteMeal(${m.id})">删除</span>
             </div>`;
           }).join('')}
         </div>
       ` : ''}
 
       <!-- Text input -->
       <div style="margin-bottom:8px;">
         <textarea id="food-desc" rows="2" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:0.9375rem;resize:none;background:var(--surface);box-sizing:border-box;" placeholder="例如：200克米饭，150克鸡胸肉，100克西兰花（可同时输入多种食物）">${aiInputText}</textarea>
         <button class="btn btn-primary btn-block btn-sm" style="margin-top:6px;" onclick="parseFood()">
           <span id="parse-btn-text">识别食物</span>
           <span id="parse-spinner" class="hidden spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span>
         </button>
       </div>
 
       <!-- Results after recognition -->
       ${hasRecognized ? `
         <!-- Recognized foods -->
         ${currentFoods.length ? `
           <div style="background:var(--surface);border-radius:var(--radius);padding:12px;margin-bottom:8px;box-shadow:var(--shadow);">
             <div style="font-size:0.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">识别的食物</div>
             ${currentFoods.map((f,i) => `
               <div class="food-item">
                 <span class="food-name" style="font-weight:500;">${f.foodName}</span>
                 <span class="food-amount">
                   <input type="number" value="${f.weight}" step="10" style="width:50px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;font-size:0.8125rem;text-align:center;" onchange="updateWeight(${i},this.value)" /> g
                 </span>
                 <span class="food-cal">${f.calories} kcal</span>
                 <span style="cursor:pointer;color:var(--danger);margin-left:4px;padding:2px 4px;font-size:0.8125rem;" onclick="removeFood(${i})">✕</span>
               </div>
             `).join('')}
           </div>
           <!-- Nutrition preview -->
           <div style="background:var(--green-bg);border-radius:var(--radius);padding:10px 12px;margin-bottom:8px;">
             <div style="font-size:0.75rem;font-weight:600;color:var(--green);margin-bottom:4px;">本餐合计</div>
             <div class="stat-row" style="gap:4px;">
               <div class="stat-item" style="padding:6px;"><div class="stat-value" style="font-size:1rem;">${total.calories}</div><div class="stat-label" style="font-size:0.6875rem;">千卡</div></div>
               <div class="stat-item" style="padding:6px;"><div class="stat-value" style="font-size:1rem;color:var(--blue);">${total.protein}g</div><div class="stat-label" style="font-size:0.6875rem;">蛋白质</div></div>
               <div class="stat-item" style="padding:6px;"><div class="stat-value" style="font-size:1rem;color:var(--orange);">${total.carbs}g</div><div class="stat-label" style="font-size:0.6875rem;">碳水</div></div>
               <div class="stat-item" style="padding:6px;"><div class="stat-value" style="font-size:1rem;color:var(--warning);">${total.fat}g</div><div class="stat-label" style="font-size:0.6875rem;">脂肪</div></div>
             </div>
           </div>
         ` : '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.875rem;">未识别到食物，请修改描述或搜索添加</div>'}
 
         <!-- Manual search -->
         <div style="background:var(--surface);border-radius:var(--radius);padding:12px;margin-bottom:8px;box-shadow:var(--shadow);">
           <div style="font-size:0.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">搜索添加食物</div>
           <input id="food-search" class="form-input" type="text" placeholder="输入食物名称..." oninput="search()" />
           <div id="search-rs" style="max-height:150px;overflow-y:auto;margin-top:6px;"></div>
         </div>
 
         <!-- Action buttons -->
         <div class="flex gap-8">
           <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="resetForm()">重新描述</button>
           ${currentFoods.length ? `<button class="btn btn-primary btn-sm" style="flex:2;" onclick="saveMeal()">保存餐食</button>` : ''}
         </div>
       ` : ''}
     </div>
   `;
 }
 
 function bindHandlers(meals) {
   window.changeDate = async (d) => {
     const dt = new Date(currentDate + 'T00:00:00');
     dt.setDate(dt.getDate() + d);
     currentDate = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
     resetForm();
     await render({ date: currentDate });
   };
   window.setMealType = async (t) => { currentMealType = t; resetForm(); await render({ date: currentDate }); };
 
   window.parseFood = async () => {
     const ta = document.getElementById('food-desc');
     if (!ta || !ta.value.trim()) { showToast('请描述你吃了什么', 'warning'); return; }
     const text = ta.value.trim();
     const btn = document.getElementById('parse-btn-text');
     const sp = document.getElementById('parse-spinner');
     if (btn) btn.textContent = '识别中...';
     if (sp) sp.classList.remove('hidden');
     try {
       const foods = await parseMealText(text);
       currentFoods = foods;
       aiInputText = text;
       hasRecognized = true;
       await render({ date: currentDate });
       if (foods.length) showToast(`识别到 ${foods.length} 种食物`, 'success');
       else showToast('未识别到食物，可修改描述或手动搜索添加', 'warning');
     } catch(e) {
       showToast('解析出错: ' + e.message, 'error');
     } finally {
       if (btn) btn.textContent = '识别食物';
       if (sp) sp.classList.add('hidden');
     }
   };
 
   window.updateWeight = (i, v) => {
     const w = parseFloat(v);
     if (!w || w <= 0) return;
     currentFoods[i].weight = w;
     const n = calculateFoodNutrition(currentFoods[i].foodId, w);
     if (n) Object.assign(currentFoods[i], n);
     render({ date: currentDate });
   };
 
   window.removeFood = (i) => { currentFoods.splice(i, 1); render({ date: currentDate }); };
 
   window.resetForm = () => { currentFoods = []; aiInputText = ''; hasRecognized = false; render({ date: currentDate }); };
 
   window.search = () => {
     const q = document.getElementById('food-search')?.value || '';
     const rs = searchFoods(q);
     const c = document.getElementById('search-rs');
     if (!c) return;
     c.innerHTML = rs.slice(0,15).map(f =>
       `<div class="food-item" style="cursor:pointer;" onclick="addFood('${f.id}','${f.name}')">
         <span style="color:var(--green);font-size:0.875rem;">+ ${f.name}</span>
         <span class="text-xs text-muted">${f.per100g.cal} kcal/100g</span>
       </div>`
     ).join('');
   };
 
   window.addFood = (id, name) => {
     const n = calculateFoodNutrition(id, 100);
     if (n) { currentFoods.push(n); document.getElementById('food-search').value = ''; showToast(`已添加 ${name}`,'success'); render({ date: currentDate }); }
   };
 
   window.saveMeal = async () => {
     if (!currentFoods.length) { showToast('请先添加食物','warning'); return; }
     const tot = calculateMealTotals(currentFoods);
     const existing = meals.find(m => m.mealType === currentMealType);
     const record = {
       date: currentDate,
       mealType: currentMealType,
       foods: currentFoods,
       calories: tot.calories, protein: tot.protein, carbs: tot.carbs, fat: tot.fat, fiber: tot.fiber,
       updatedAt: new Date().toISOString()
     };
     if (existing) {
       record.id = existing.id;
       if (!await showModal('确认修改','该餐次已有记录，是否覆盖？','覆盖','取消')) return;
     }
     await saveMealRecord(record);
     showToast('已保存','success');
     resetForm();
     navigate('/today');
   };
 
   window.deleteMeal = async (id) => {
     if (await showModal('确认删除','删除这条餐食记录？','删除','取消')) {
       await deleteMealRecord(id);
       showToast('已删除','success');
       render({ date: currentDate });
     }
   };
 }
 
 export default { render };
