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
 
 export async function render(params, path) {
   const app = document.getElementById('app');
   if (!app) return;
 
   // Extract date from params if present
   if (params.date) {
     currentDate = params.date;
   }
 
   const meals = await getMealRecords(currentDate);
 
   ﻿const content = `
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

      <!-- Step Progress -->
      <div style="display:flex;gap:6px;margin-bottom:12px;padding:0 4px;">
        <div style="flex:1;text-align:center;padding:6px 0;border-radius:6px;font-size:0.75rem;font-weight:600;${!hasRecognized ? 'background:var(--green);color:white;' : 'background:var(--green-bg);color:var(--green);'}">1. 描述食物</div>
        <div style="flex:1;text-align:center;padding:6px 0;border-radius:6px;font-size:0.75rem;font-weight:600;${hasRecognized ? 'background:var(--green);color:white;' : 'background:var(--border);color:var(--text-muted);'}">2. 确认结果</div>
        <div style="flex:1;text-align:center;padding:6px 0;border-radius:6px;font-size:0.75rem;font-weight:600;${hasRecognized && currentFoods.length > 0 ? 'background:var(--green);color:white;' : 'background:var(--border);color:var(--text-muted);'}">3. 保存</div>
      </div>

      <!-- Existing meals today -->
      ${meals.length > 0 ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">已记录的餐食</div>
          ${meals.map(meal => {
            const total = calculateMealTotals(meal.foods || []);
            const icons = { '早餐': '\u{1F305}', '午餐': '\u2600\uFE0F', '晚餐': '\u{1F319}', '加餐': '\u{1F36A}' };
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:var(--bg);border-radius:6px;margin-bottom:4px;font-size:0.8125rem;">
                <span>${icons[meal.mealType] || '\u{1F37D}\uFE0F'} ${meal.mealType} - ${total.calories} kcal</span>
                <span class="text-xs" style="cursor:pointer;color:var(--danger);" onclick="deleteMealConfirm(${meal.id})">删除</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <!-- Step 1: Describe food (always visible) -->
      <div>
        <div style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">用自然语言描述这餐吃了什么</div>
        <div class="ai-input-area" style="margin-bottom:0;">
          <div class="ai-input">
            <textarea id="ai-text-input" rows="2" placeholder="例如：吃了200克米饭、150克鸡胸肉、100克西兰花&#10;或者：一碗面条加一个鸡蛋，一杯牛奶" style="font-size:0.9375rem;">${aiInputText}</textarea>
          </div>
          <div class="ai-hint">推荐包含食物名称和份量，如"200克米饭"、"半斤牛肉"</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-primary btn-block btn-sm" style="margin-top:0;" onclick="parseAIText()">
            <span id="ai-parse-btn-text">识别食物</span>
            <span id="ai-spinner" class="hidden spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span>
          </button>
        </div>
      </div>

      <!-- Step 2 + 3: Results after recognition -->
      ${hasRecognized ? `
        <div style="margin-top:12px;">
          <div style="font-size:0.8125rem;font-weight:600;color:var(--green);margin-bottom:8px;">已识别食物 编辑重量后确认</div>
          <div class="card" style="padding:12px;">
            ${currentFoods.length === 0 ? '<div class="text-sm text-secondary text-center" style="padding:8px 0;">未识别到食物，可修改描述后重试</div>' : ''}
            ${currentFoods.map((f, i) => `
              <div class="food-item">
                <span class="food-name" style="font-weight:500;">${f.foodName}</span>
                <span class="food-amount">
                  <input type="number" value="${f.weight}" min="1" step="10" style="width:55px;padding:3px 4px;border:1px solid var(--border);border-radius:4px;font-size:0.8125rem;text-align:center;" onchange="updateFoodWeight(${i}, this.value)" /> g
                </span>
                <span class="food-cal">${f.calories} <span class="text-xs text-secondary">kcal</span></span>
                <span class="text-xs" style="cursor:pointer;color:var(--danger);margin-left:4px;padding:4px;" onclick="removeParsedFood(${i})">X</span>
              </div>
            `).join('')}
          </div>

          <!-- Nutrition preview -->
          ${currentFoods.length > 0 ? `
          <div class="card" style="margin-top:8px;background:var(--green-bg);padding:12px;">
            <div style="font-size:0.75rem;font-weight:600;color:var(--green);margin-bottom:6px;">本餐营养小计（保存前预览）</div>
            <div class="stat-row" style="gap:4px;">
              <div class="stat-item" style="padding:8px 6px;"><div class="stat-value" style="font-size:1rem;">${Math.round(currentFoods.reduce((s,fi) => s+(fi.calories||0), 0))}</div><div class="stat-label" style="font-size:0.6875rem;">千卡</div></div>
              <div class="stat-item" style="padding:8px 6px;"><div class="stat-value" style="font-size:1rem;color:var(--blue);">${Math.round(currentFoods.reduce((s,fi) => s+(fi.protein||0), 0)*10)/10}g</div><div class="stat-label" style="font-size:0.6875rem;">蛋白质</div></div>
              <div class="stat-item" style="padding:8px 6px;"><div class="stat-value" style="font-size:1rem;color:var(--orange);">${Math.round(currentFoods.reduce((s,fi) => s+(fi.carbs||0), 0)*10)/10}g</div><div class="stat-label" style="font-size:0.6875rem;">碳水</div></div>
              <div class="stat-item" style="padding:8px 6px;"><div class="stat-value" style="font-size:1rem;color:var(--warning);">${Math.round(currentFoods.reduce((s,fi) => s+(fi.fat||0), 0)*10)/10}g</div><div class="stat-label" style="font-size:0.6875rem;">脂肪</div></div>
            </div>
          </div>
          ` : ''}

          <!-- Manual supplement -->
          <div class="card" style="margin-top:8px;">
            <div class="card-header">手动补充</div>
            <div class="form-group" style="margin-bottom:8px;">
              <input class="form-input" id="food-search" type="text" placeholder="搜索食物..." oninput="searchFood()" />
            </div>
            <div id="search-results" style="max-height:150px;overflow-y:auto;"></div>
            <div style="margin-top:8px;">
              <button class="btn btn-sm btn-secondary btn-block" onclick="reRecognize()">返回重新描述</button>
            </div>
          </div>

          <!-- Save button (only when foods exist) -->
          ${currentFoods.length > 0 ? `
          <button class="btn btn-primary btn-block btn-lg" style="margin-top:12px;" onclick="saveMeal()">
            确认并保存餐食
          </button>
          ` : ''}
        </div>
      ` : ''}

    </div>
  `
;
 
   const html = pageWrapper(content, { title: '记录餐食', showBack: true, backPath: '/today' });
   app.innerHTML = html;
 
   // Re-bind window functions within context
   window.changeRecordDate = async (delta) => {
     const d = new Date(currentDate + 'T00:00:00');
     d.setDate(d.getDate() + delta);
     currentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     currentFoods = [];
     aiInputText = '';
     hasRecognized = false;
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
 
   window.reRecognize = () => {
    currentFoods = [];
    hasRecognized = false;
    render({ date: currentDate });
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
