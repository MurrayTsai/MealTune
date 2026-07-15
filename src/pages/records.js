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
 let isAIMode = true;
 
 export async function render(params, path) {
   const app = document.getElementById('app');
   if (!app) return;
 
   // Extract date from params if present
   if (params.date) {
     currentDate = params.date;
   }
 
   const meals = await getMealRecords(currentDate);
 
   const content = `
     <div class="fade-in">
       <!-- Date Selector -->
       <div class="day-selector">
         <button onclick="changeRecordDate(-1)">&lt;</button>
         <div class="date-label">${formatDate(currentDate)}</div>
         <button onclick="changeRecordDate(1)">&gt;</button>
       </div>
 
       <!-- Meal Type Tabs -->
       <div class="tabs" id="meal-type-tabs">
         ${['早餐', '午餐', '晚餐', '加餐'].map(t =>
           `<div class="tab ${currentMealType === t ? 'active' : ''}" onclick="setMealType('${t}')">${t}</div>`
         ).join('')}
       </div>
 
       <!-- Existing meals today -->
       ${meals.length > 0 ? `
         <div style="margin-bottom:12px;">
           <div style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">今日餐食记录</div>
           ${meals.map(meal => {
             const total = calculateMealTotals(meal.foods || []);
             const icons = { '早餐': '🌅', '午餐': '☀️', '晚餐': '🌙', '加餐': '🍪' };
             return `
               <div class="meal-card">
                 <div class="meal-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                   <div class="meal-header-left">
                     <span>${icons[meal.mealType] || '🍽️'}</span>
                     <span>${meal.mealType}</span>
                   </div>
                   <div class="meal-header-right">
                     <span>${total.calories} kcal</span>
                     <span class="text-xs" style="cursor:pointer;color:var(--danger);" onclick="event.stopPropagation();deleteMealConfirm(${meal.id})">删除</span>
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
         </div>
       ` : ''}
 
       <!-- Input Mode -->
       <div style="display:flex;gap:8px;margin-bottom:12px;">
         <button class="btn btn-sm ${isAIMode ? 'btn-primary' : 'btn-secondary'}" onclick="toggleInputMode(true)">AI 输入</button>
         <button class="btn btn-sm ${!isAIMode ? 'btn-primary' : 'btn-secondary'}" onclick="toggleInputMode(false)">手动选择</button>
       </div>
 
       <!-- AI Input Area -->
       <div id="ai-input-section" class="${isAIMode ? '' : 'hidden'}">
         <div class="ai-input-area">
           <div class="ai-input-label">📝 用自然语言描述你的餐食</div>
           <div class="ai-input">
             <textarea id="ai-text-input" rows="3" placeholder="例如：吃了一碗米饭，一份鸡胸肉，一份西兰花&#10;或者：中午吃了一碗面条和一个鸡蛋">${aiInputText}</textarea>
           </div>
           <div class="ai-hint">支持中英文输入，AI会自动识别食物并估算营养</div>
           <button class="btn btn-primary btn-block btn-sm" style="margin-top:8px;" onclick="parseAIText()">
             <span id="ai-parse-btn-text">🤖 AI 识别</span>
             <span id="ai-spinner" class="hidden spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span>
           </button>
         </div>
       </div>
 
       <!-- Manual Input Area -->
       <div id="manual-input-section" class="${isAIMode ? 'hidden' : ''}">
         <div class="card">
           <div class="card-header">选择食物</div>
           <div class="form-group">
             <input class="form-input" id="food-search" type="text" placeholder="搜索食物名称..." oninput="searchFood()" />
           </div>
           <div id="search-results" style="max-height:200px;overflow-y:auto;"></div>
         </div>
         <div id="manual-foods" class="card">
           <div class="card-header">已添加食物</div>
           <div id="selected-foods-list">
             ${currentFoods.length === 0 ? '<div class="text-sm text-secondary">还没有选择食物</div>' : ''}
           </div>
         </div>
       </div>
 
       <!-- Current AI parsed foods -->
       <div id="parsed-foods-section" class="${isAIMode && currentFoods.length > 0 ? '' : 'hidden'}">
         <div class="card">
           <div class="card-header">已识别食物</div>
           <div id="parsed-foods-list">
             ${currentFoods.map((f, i) => `
               <div class="food-item">
                 <span class="food-name">${f.foodName}</span>
                 <span class="food-amount">
                   <input type="number" value="${f.weight}" min="1" style="width:60px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;font-size:0.8125rem;text-align:center;"
                     onchange="updateFoodWeight(${i}, this.value)" /> g
                 </span>
                 <span class="food-cal">${f.calories} kcal</span>
                 <span class="text-xs" style="cursor:pointer;color:var(--danger);margin-left:4px;" onclick="removeParsedFood(${i})">✕</span>
               </div>
             `).join('')}
           </div>
         </div>
       </div>
 
       <!-- Save Button -->
       <button class="btn btn-primary btn-block btn-lg" id="save-meal-btn" onclick="saveMeal()">
         <span id="save-meal-text">保存餐食</span>
       </button>
     </div>
   `;
 
   const html = pageWrapper(content, { title: '记录餐食', showBack: true, backPath: '/today' });
   app.innerHTML = html;
 
   // Re-bind window functions within context
   window.changeRecordDate = async (delta) => {
     const d = new Date(currentDate + 'T00:00:00');
     d.setDate(d.getDate() + delta);
     currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     currentFoods = [];
     aiInputText = '';
     isAIMode = true;
     await render({ date: currentDate });
   };
 
   window.setMealType = async (type) => {
     currentMealType = type;
     currentFoods = [];
     aiInputText = '';
     await render({ date: currentDate });
   };
 
   window.toggleInputMode = async (ai) => {
     isAIMode = ai;
     currentFoods = [];
     await render({ date: currentDate });
   };
 
   window.parseAIText = async () => {
     const textarea = document.getElementById('ai-text-input');
     if (!textarea || !textarea.value.trim()) {
       showToast('请输入食物描述', 'warning');
       return;
     }
     const text = textarea.value.trim();
     const btnEl = document.getElementById('ai-parse-btn-text');
     const spinnerEl = document.getElementById('ai-spinner');
     if (btnEl) btnEl.textContent = '识别中...';
     if (spinnerEl) spinnerEl.classList.remove('hidden');
 
     const foods = await parseMealText(text);
 
     if (btnEl) btnEl.textContent = '🤖 AI 识别';
     if (spinnerEl) spinnerEl.classList.add('hidden');
 
     if (foods.length > 0) {
       currentFoods = foods;
       aiInputText = text;
       await render({ date: currentDate });
       showToast(`已识别 ${foods.length} 种食物`, 'success');
     } else {
       showToast('未能识别食物，请尝试手动选择或更详细描述', 'warning');
     }
   };
 
   window.saveMeal = async () => {
     if (currentFoods.length === 0) {
       showToast('请先添加食物', 'warning');
       return;
     }
 
     const total = calculateMealTotals(currentFoods);
     const existing = await getMealRecords(currentDate);
     const existingMeal = existing.find(m => m.mealType === currentMealType);
 
     const record = {
       date: currentDate,
       mealType: currentMealType,
       foods: currentFoods,
       calories: total.calories,
       protein: total.protein,
       carbs: total.carbs,
       fat: total.fat,
       fiber: total.fiber,
       updatedAt: new Date().toISOString()
     };
 
     if (existingMeal) {
       record.id = existingMeal.id;
       const confirm = await showModal('确认修改', '该餐次已有记录，是否覆盖？', '覆盖', '取消');
       if (!confirm) return;
     }
 
     await saveMealRecord(record);
     showToast('餐食已保存', 'success');
     currentFoods = [];
     aiInputText = '';
     const latestMeals = await getMealRecords(currentDate);
     if (latestMeals.length > 0) {
       navigate('/today');
     }
     currentFoods = [];
     await render({ date: currentDate });
   };
 
   window.deleteMealConfirm = async (id) => {
     const confirm = await showModal('确认删除', '确定删除这条餐食记录？', '删除', '取消');
     if (confirm) {
       await deleteMealRecord(id);
       showToast('已删除', 'success');
       await render({ date: currentDate });
     }
   };
 
    window.updateFoodWeight = (index, value) => {
      const weight = parseFloat(value);
      if (!weight || weight <= 0) return;
      currentFoods[index].weight = weight;
      const nutrition = calculateFoodNutrition(currentFoods[index].foodId, weight);
      if (nutrition) {
        currentFoods[index].calories = nutrition.calories;
        currentFoods[index].protein = nutrition.protein;
        currentFoods[index].carbs = nutrition.carbs;
        currentFoods[index].fat = nutrition.fat;
      }
      // Re-render to update the displayed calorie values
      render({ date: currentDate });
    };
 
   window.removeParsedFood = (index) => {
     currentFoods.splice(index, 1);
     render({ date: currentDate });
   };
 
   window.searchFood = () => {
     const query = document.getElementById('food-search')?.value || '';
     const results = searchFoods(query);
     const container = document.getElementById('search-results');
     if (!container) return;
     container.innerHTML = results.slice(0, 20).map(f => `
       <div class="food-item" style="cursor:pointer;" onclick="addCustomFood('${f.id}', '${f.name}')">
         <span class="food-name">${f.name}</span>
         <span class="food-cal">${f.per100g.cal} kcal/100g</span>
       </div>
     `).join('');
   };
 
   window.addCustomFood = (id, name) => {
     const weight = 100;
     const nutrition = calculateFoodNutrition(id, weight);
     if (nutrition) {
       currentFoods.push(nutrition);
       document.getElementById('food-search').value = '';
       showToast(`已添加 ${name}`, 'success');
       render({ date: currentDate });
     }
   };
 
   // Init manual search
   if (!isAIMode) {
     window.searchFood();
   }
 }
 
 export default { render };
