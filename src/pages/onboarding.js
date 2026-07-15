 import { saveUserProfile, saveNutritionPlan } from '../data/db.js';
 import { generateNutritionPlan, PLAN_TYPES, ACTIVITY_LABELS, ACTIVITY_MULTIPLIERS, calculateStageTarget } from '../utils/nutrition.js';
 import { navigate } from '../router.js';
 import { showToast } from '../components/shared.js';
 
 const STEPS = ['欢迎', '目标', '信息', '活动', '忌口', '健康确认', '方案'];
 const TOTAL_STEPS = STEPS.length;
 
 let state = {
   planType: '',
   age: 28,
   sex: 'male',
   height: 170,
   currentWeight: 70,
   targetWeight: 65,
   activityLevel: 'light',
   restrictions: [],
   allergies: [],
   hasHealthLimitation: false,
   healthDescription: ''
 };
 
 export function render() {
   renderStep(0);
 }
 
 function renderStep(step) {
   const app = document.getElementById('app');
   if (!app) return;
   const progress = STEPS.map((_, i) =>
     `<div class="onboarding-step ${i < step ? 'done' : i === step ? 'active' : ''}"></div>`
   ).join('');
 
   let body = '';
   switch (step) {
     case 0: body = welcomeStep(); break;
     case 1: body = goalStep(); break;
     case 2: body = profileStep(); break;
     case 3: body = activityStep(); break;
     case 4: body = restrictionsStep(); break;
     case 5: body = healthCheckStep(); break;
     case 6: body = resultStep(); break;
   }
 
   app.innerHTML = `
     <div class="onboarding-page fade-in">
       <div class="onboarding-progress">${progress}</div>
       ${body}
     </div>
   `;
 
   // Attach event listeners
   const radioButtons = app.querySelectorAll('.option-card');
   radioButtons.forEach(btn => {
     btn.addEventListener('click', () => {
       const name = btn.dataset.name;
       const value = btn.dataset.value;
       if (btn.dataset.multiple !== 'true') {
         radioButtons.forEach(b => {
           if (b.dataset.name === name) b.classList.remove('selected');
         });
       } else {
         btn.classList.toggle('selected');
       }
      btn.classList.add('selected');
      if (name && value && name in state) {
        state[name] = value;
      }
    });
   });
 
   const nextBtn = app.querySelector('.btn-next');
   if (nextBtn) {
     nextBtn.addEventListener('click', () => {
       const currentStep = step;
       if (validateStep(currentStep)) {
         renderStep(currentStep + 1);
       }
     });
   }
 
   const backBtn = app.querySelector('.btn-back');
   if (backBtn) {
     backBtn.addEventListener('click', () => {
       renderStep(step - 1);
     });
   }
 
   // Bind health limitation buttons (step 5)
   const hlYes = app.querySelector('#hl-yes');
   const hlNo = app.querySelector('#hl-no');
   const hlOther = app.querySelector('#hl-other');
   if (hlYes) {
     hlYes.addEventListener('click', () => {
       state.hasHealthLimitation = true;
       hlYes.className = 'btn btn-sm btn-primary';
       hlNo.className = 'btn btn-sm btn-secondary';
       if (hlOther) hlOther.classList.remove('hidden');
     });
   }
   if (hlNo) {
     hlNo.addEventListener('click', () => {
       state.hasHealthLimitation = false;
       hlNo.className = 'btn btn-sm btn-primary';
       hlYes.className = 'btn btn-sm btn-secondary';
       if (hlOther) hlOther.classList.add('hidden');
     });
   }

   // Bind form inputs
   const inputs = app.querySelectorAll('input, select, textarea');
   inputs.forEach(input => {
     input.addEventListener('change', () => {
       const key = input.dataset.bind;
       if (key && key in state) {
         if (input.type === 'number') {
           state[key] = parseFloat(input.value) || 0;
         } else if (input.type === 'checkbox') {
           state[key] = input.checked;
         } else {
           state[key] = input.value;
         }
       }
     });
     input.addEventListener('input', () => {
       const key = input.dataset.bind;
       if (key && key in state && input.type === 'number') {
         state[key] = parseFloat(input.value) || 0;
       }
     });
   });
 }
 
 function validateStep(step) {
   switch (step) {
     case 0: return true;
     case 1:
       if (!state.planType) { showToast('请选择一个目标类型', 'warning'); return false; }
       return true;
     case 2:
       if (!state.age || state.age < 10 || state.age > 100) { showToast('请输入有效年龄（10-100岁）', 'warning'); return false; }
       if (state.height < 100 || state.height > 250) { showToast('请输入有效身高（100-250cm）', 'warning'); return false; }
       if (state.currentWeight < 30 || state.currentWeight > 300) { showToast('请输入有效体重', 'warning'); return false; }
       if (state.targetWeight < 20 || state.targetWeight > 300) { showToast('请输入有效目标体重', 'warning'); return false; }
       return true;
     case 3: return true;
     case 4: return true;
     case 5: return true;
     default: return true;
   }
 }
 
 function welcomeStep() {
   return `
     <div class="onboarding-title">欢迎来到 MealTune</div>
     <div class="onboarding-subtitle">你的智能饮食健康助手</div>
     <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px 0;">
       <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
         <rect width="100" height="100" rx="20" fill="#4F7C3F"/>
         <text x="50" y="65" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">M</text>
       </svg>
       <div style="text-align:center;">
         <div style="font-size: 1rem; color: var(--text-secondary); margin-top: 12px;">
           三分钟设定你的个性化方案<br/>
           开启科学饮食之旅
         </div>
       </div>
     </div>
     <div class="onboarding-actions">
       <button class="btn btn-primary btn-block btn-lg btn-next">开始设置</button>
     </div>
   `;
 }
 
 function goalStep() {
   const types = [
     { key: 'exercise_assisted', title: '运动结合减脂', desc: '你有运动习惯，希望饮食与运动同步配合达到减脂效果', icon: '💪' },
     { key: 'diet_first', title: '饮食优先减脂', desc: '你主要想通过饮食管理来控制体重，配合少量运动', icon: '🥗' },
     { key: 'healthy_diet', title: '健康饮食维持', desc: '你希望改善饮食习惯，维持现有体重', icon: '🌿' }
   ];
 
   return `
     <div class="onboarding-title">你的首要目标是什么？</div>
     <div class="onboarding-subtitle">请选择最符合你需求的方案，后续可以随时调整</div>
     <div class="option-grid" style="flex:1;">
       ${types.map(t => `
         <div class="option-card ${state.planType === t.key ? 'selected' : ''}"
              data-name="planType" data-value="${t.key}">
           <div style="font-size:1.5rem;flex-shrink:0;">${t.icon}</div>
           <div class="option-content">
             <div class="option-title">${t.title}</div>
             <div class="option-desc">${t.desc}</div>
           </div>
           <div class="option-radio"></div>
         </div>
       `).join('')}
     </div>
     <div class="onboarding-actions">
       <div style="display:flex;gap:12px;">
         <button class="btn btn-secondary btn-back" style="flex:0.4;">上一步</button>
         <button class="btn btn-primary btn-next" style="flex:0.6;">下一步</button>
       </div>
     </div>
   `;
 }
 
 function profileStep() {
   return `
     <div class="onboarding-title">填写基本信息</div>
     <div class="onboarding-subtitle">这些信息将帮助我们准确计算你的营养目标</div>
     <div style="flex:1;">
       <div class="form-row">
         <div class="form-group">
           <label class="form-label">年龄</label>
           <input class="form-input" type="number" data-bind="age" value="${state.age}" min="10" max="100" placeholder="岁" />
         </div>
         <div class="form-group">
           <label class="form-label">性别</label>
           <select class="form-select" data-bind="sex">
             <option value="male" ${state.sex === 'male' ? 'selected' : ''}>男</option>
             <option value="female" ${state.sex === 'female' ? 'selected' : ''}>女</option>
           </select>
         </div>
       </div>
       <div class="form-group">
         <label class="form-label">身高</label>
         <input class="form-input" type="number" data-bind="height" value="${state.height}" min="100" max="250" placeholder="厘米" />
       </div>
       <div class="form-row">
         <div class="form-group">
           <label class="form-label">当前体重</label>
           <input class="form-input" type="number" step="0.1" data-bind="currentWeight" value="${state.currentWeight}" min="30" max="300" placeholder="千克" />
         </div>
         <div class="form-group">
           <label class="form-label">目标体重</label>
           <input class="form-input" type="number" step="0.1" data-bind="targetWeight" value="${state.targetWeight}" min="20" max="300" placeholder="千克" />
         </div>
       </div>
     </div>
     <div class="onboarding-actions">
       <div style="display:flex;gap:12px;">
         <button class="btn btn-secondary btn-back" style="flex:0.4;">上一步</button>
         <button class="btn btn-primary btn-next" style="flex:0.6;">下一步</button>
       </div>
     </div>
   `;
 }
 
 function activityStep() {
   const activities = [
     { key: 'sedentary', title: '久坐不动', desc: '大部分时间坐着，很少运动' },
     { key: 'light', title: '轻度活动', desc: '每天步数不多，每周运动1-2次' },
     { key: 'moderate', title: '中等活动', desc: '每周运动3-4次' },
     { key: 'high', title: '较高活动', desc: '每周运动5次以上或体力工作' }
   ];
 
   return `
     <div class="onboarding-title">你的日常活动水平</div>
     <div class="onboarding-subtitle">这将帮助我们计算你的每日能量消耗</div>
     <div class="option-grid" style="flex:1;">
       ${activities.map(a => `
         <div class="option-card ${state.activityLevel === a.key ? 'selected' : ''}"
              data-name="activityLevel" data-value="${a.key}">
           <div class="option-content">
             <div class="option-title">${a.title}</div>
             <div class="option-desc">${a.desc}</div>
           </div>
           <div class="option-radio"></div>
         </div>
       `).join('')}
     </div>
     <div class="onboarding-actions">
       <div style="display:flex;gap:12px;">
         <button class="btn btn-secondary btn-back" style="flex:0.4;">上一步</button>
         <button class="btn btn-primary btn-next" style="flex:0.6;">下一步</button>
       </div>
     </div>
   `;
 }
 
 function restrictionsStep() {
   const commonRestrictions = [
     '无特殊忌口', '不吃猪肉', '不吃牛肉', '不吃海鲜',
     '素食', '蛋奶素', '不吃辣', '少油少盐', '无乳糖'
   ];
   const commonAllergies = [
     '无过敏', '花生过敏', '海鲜过敏', '牛奶过敏',
     '鸡蛋过敏', '大豆过敏', '坚果过敏'
   ];
 
   return `
     <div class="onboarding-title">饮食偏好与过敏</div>
     <div class="onboarding-subtitle">可选择或不选，后续可修改</div>
     <div style="flex:1;">
       <label class="form-label" style="margin-bottom:8px;">饮食忌口</label>
       <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
         ${commonRestrictions.map(r => `
           <div class="tag tag-green" style="cursor:pointer;padding:6px 12px;font-size:0.8125rem;
             ${state.restrictions.includes(r) ? 'background:var(--green);color:white;' : ''}"
             onclick="toggleRestriction(this,'${r}')">${r}</div>
         `).join('')}
       </div>
       <label class="form-label" style="margin-bottom:8px;">过敏原</label>
       <div style="display:flex;flex-wrap:wrap;gap:8px;">
         ${commonAllergies.map(a => `
           <div class="tag tag-blue" style="cursor:pointer;padding:6px 12px;font-size:0.8125rem;
             ${state.allergies.includes(a) ? 'background:var(--blue);color:white;' : ''}"
             onclick="toggleAllergy(this,'${a}')">${a}</div>
         `).join('')}
       </div>
     </div>
     <div class="onboarding-actions">
       <div style="display:flex;gap:12px;">
         <button class="btn btn-secondary btn-back" style="flex:0.4;">上一步</button>
         <button class="btn btn-primary btn-next" style="flex:0.6;">下一步</button>
       </div>
     </div>
   `;
 }
 
 function healthCheckStep() {
   return `
     <div class="onboarding-title">健康确认</div>
     <div class="onboarding-subtitle">为确保安全，请确认以下信息</div>
     <div style="flex:1;">
       <div class="card" style="background:var(--warning-bg);border:1px solid var(--warning);">
         <div style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6;">
           <p style="margin-bottom:8px;"><strong>免责声明：</strong></p>
           <p>MealTune 仅提供一般性营养建议和参考信息，不能替代医生或专业营养师的诊断和治疗建议。</p>
           <p style="margin-top:8px;">如果你有以下情况，请在使用前咨询医生：</p>
           <ul style="margin:8px 0;padding-left:16px;">
             <li>糖尿病、高血压、心脏病等慢性疾病</li>
             <li>进食障碍史</li>
             <li>孕期或哺乳期</li>
             <li>正在服用可能受饮食影响的药物</li>
           </ul>
         </div>
       </div>
      <div class="form-group" style="margin-top:16px;">
        <label class="form-label">是否有需要说明的健康限制？</label>
        <div style="display:flex;gap:12px;margin-bottom:8px;">
          <button class="btn btn-sm ${state.hasHealthLimitation ? 'btn-primary' : 'btn-secondary'}"
            id="hl-yes">有</button>
          <button class="btn btn-sm ${!state.hasHealthLimitation ? 'btn-primary' : 'btn-secondary'}"
            id="hl-no">无</button>
        </div>
        <textarea class="form-input ${state.hasHealthLimitation ? '' : 'hidden'}" id="hl-other"
          placeholder="请简要说明你的健康情况..." data-bind="healthDescription">${state.healthDescription}</textarea>
      </div>
     </div>
     <div class="onboarding-actions">
       <div style="display:flex;gap:12px;">
         <button class="btn btn-secondary btn-back" style="flex:0.4;">上一步</button>
         <button class="btn btn-primary btn-next" style="flex:0.6;">确认并生成方案</button>
       </div>
     </div>
   `;
 }
 
 function resultStep() {
   const plan = generateNutritionPlan(state);
   const stage = calculateStageTarget(state.currentWeight, state.targetWeight);
   const planTypeLabel = PLAN_TYPES[state.planType]?.label || '';

   // Save to database immediately (no setTimeout delay)
   state.onboardingCompleted = true;
   window._onboardingSavePromise = (async () => {
     await saveUserProfile(state);
     await saveNutritionPlan(plan);
   })();
 
   return `
     <div class="onboarding-title">你的方案已生成</div>
     <div class="onboarding-subtitle">以下是为你定制的营养方案</div>
     <div style="flex:1;overflow-y:auto;">
       <div class="card" style="background:var(--green-bg);border:2px solid var(--green);">
         <div style="text-align:center;padding:8px 0;">
           <div style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:4px;">方案类型</div>
           <div style="font-size:1.125rem;font-weight:700;color:var(--green);">${planTypeLabel}</div>
         </div>
       </div>
       <div class="card">
         <div class="card-header">每日营养目标</div>
         <div class="stat-row">
           <div class="stat-item">
             <div class="stat-value">${plan.calories}</div>
             <div class="stat-label">千卡</div>
           </div>
           <div class="stat-item">
             <div class="stat-value">${plan.protein}g</div>
             <div class="stat-label">蛋白质</div>
           </div>
           <div class="stat-item">
             <div class="stat-value">${plan.carbs}g</div>
             <div class="stat-label">碳水</div>
           </div>
         </div>
         <div class="stat-row" style="margin-top:8px;">
           <div class="stat-item">
             <div class="stat-value">${plan.fat}g</div>
             <div class="stat-label">脂肪</div>
           </div>
           <div class="stat-item">
             <div class="stat-value">${plan.fiber}g</div>
             <div class="stat-label">纤维</div>
           </div>
           <div class="stat-item">
             <div class="stat-value">${plan.waterTarget}ml</div>
             <div class="stat-label">饮水</div>
           </div>
         </div>
       </div>
       <div class="card">
         <div class="card-header">体重目标</div>
         <div style="display:flex;justify-content:space-between;align-items:center;">
           <div style="text-align:center;">
             <div class="text-sm text-secondary">当前</div>
             <div style="font-size:1.5rem;font-weight:700;">${state.currentWeight} <span class="text-sm text-secondary">kg</span></div>
           </div>
           <div style="font-size:1.5rem;color:var(--text-muted);">→</div>
           <div style="text-align:center;">
             <div class="text-sm text-secondary">阶段目标</div>
             <div style="font-size:1.5rem;font-weight:700;color:var(--green);">${stage.stageTarget} <span class="text-sm text-secondary">kg</span></div>
           </div>
           <div style="font-size:1.5rem;color:var(--text-muted);">→</div>
           <div style="text-align:center;">
             <div class="text-sm text-secondary">最终</div>
             <div style="font-size:1.5rem;font-weight:700;">${state.targetWeight} <span class="text-sm text-secondary">kg</span></div>
           </div>
         </div>
       </div>
       <div class="card">
         <div class="card-header">运动建议</div>
         <div style="font-size:0.9375rem;">
           ${state.planType === 'exercise_assisted' ? '每周2次力量训练 + 2次有氧训练，每次20-40分钟' :
             state.planType === 'diet_first' ? '每周2-3次快走，每次20-30分钟' : '保持日常活动，每周1-2次轻度运动'}
         </div>
       </div>
     </div>
     <div class="onboarding-actions">
       <button class="btn btn-primary btn-block btn-lg" onclick="window._startUsing()">开始使用</button>
     </div>
   `;
 }
 
 // Global helpers for restriction/allergy toggle
 window.toggleRestriction = (el, value) => {
   if (value === '无特殊忌口') {
     state.restrictions = ['无特殊忌口'];
     document.querySelectorAll('[onclick*="toggleRestriction"]').forEach(e => {
       if (e.textContent !== '无特殊忌口') { e.style.background = ''; e.style.color = ''; }
     });
     el.style.background = 'var(--green)';
     el.style.color = 'white';
     return;
   }
   const idx = state.restrictions.indexOf(value);
   if (idx > -1) {
     state.restrictions.splice(idx, 1);
     el.style.background = '';
     el.style.color = '';
   } else {
     const noRestrictionIdx = state.restrictions.indexOf('无特殊忌口');
     if (noRestrictionIdx > -1) {
       state.restrictions.splice(noRestrictionIdx, 1);
       document.querySelectorAll('[onclick*="toggleRestriction"]').forEach(e => {
         if (e.textContent === '无特殊忌口') { e.style.background = ''; e.style.color = ''; }
       });
     }
     state.restrictions.push(value);
     el.style.background = 'var(--green)';
     el.style.color = 'white';
   }
 };
 
 window.toggleAllergy = (el, value) => {
   if (value === '无过敏') {
     state.allergies = ['无过敏'];
     document.querySelectorAll('[onclick*="toggleAllergy"]').forEach(e => {
       if (e.textContent !== '无过敏') { e.style.background = ''; e.style.color = ''; }
     });
     el.style.background = 'var(--blue)';
     el.style.color = 'white';
     return;
   }
   const idx = state.allergies.indexOf(value);
   if (idx > -1) {
     state.allergies.splice(idx, 1);
     el.style.background = '';
     el.style.color = '';
   } else {
     const noAllergyIdx = state.allergies.indexOf('无过敏');
     if (noAllergyIdx > -1) {
       state.allergies.splice(noAllergyIdx, 1);
       document.querySelectorAll('[onclick*="toggleAllergy"]').forEach(e => {
         if (e.textContent === '无过敏') { e.style.background = ''; e.style.color = ''; }
       });
     }
     state.allergies.push(value);
     el.style.background = 'var(--blue)';
     el.style.color = 'white';
   }
 };
 
 // Ensure onboarding data is saved before navigating to the app
 window._startUsing = async () => {
   try {
     if (window._onboardingSavePromise) {
       await window._onboardingSavePromise;
     }
   } catch (e) {
     showToast('数据保存失败，请重试', 'error');
     return;
   }
   navigate('/today');
 };

 export default { render };
