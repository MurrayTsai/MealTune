 import { getUserProfile, getNutritionPlan } from '../data/db.js';
 import { navigate, pageWrapper } from '../router.js';
 import { PLAN_TYPES, ACTIVITY_LABELS, calculateStageTarget, getExerciseRecommendation } from '../utils/nutrition.js';
 import { showToast, showModal } from '../components/shared.js';
 import { clearAIConfig, getAIConfig } from '../utils/aiService.js';
 
 export async function render() {
   const profile = await getUserProfile();
   const plan = await getNutritionPlan();
   if (!profile) { navigate('/onboarding'); return; }
 
   const stage = calculateStageTarget(profile.currentWeight, profile.targetWeight);
   const planLabel = PLAN_TYPES[profile.planType]?.label || '';
   const activityLabel = ACTIVITY_LABELS[profile.activityLevel] || '';
   const exercise = getExerciseRecommendation(profile.planType);
   const aiConfig = getAIConfig();
 
   const content = `
     <div class="fade-in">
       <!-- Profile Summary -->
       <div class="card" style="text-align:center;background:var(--green-bg);border:1px solid var(--green-light);">
         <h2 style="margin-bottom:4px;">${planLabel}</h2>
         <div style="display:flex;justify-content:center;gap:24px;margin-top:12px;">
           <div>
             <div style="font-size:1.5rem;font-weight:700;">${profile.currentWeight}</div>
             <div class="text-xs text-secondary">当前 kg</div>
           </div>
           <div>
             <div style="font-size:1.5rem;font-weight:700;color:var(--green);">${stage.stageTarget}</div>
             <div class="text-xs text-secondary">阶段目标 kg</div>
           </div>
           <div>
             <div style="font-size:1.5rem;font-weight:700;">${profile.targetWeight}</div>
             <div class="text-xs text-secondary">最终目标 kg</div>
           </div>
         </div>
       </div>
 
       <!-- Current Plan -->
       <div class="card">
         <div class="card-header">当前营养方案</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${plan?.calories || '-'}</div><div class="stat-label">千卡/日</div></div>
           <div class="stat-item"><div class="stat-value">${plan?.protein || '-'}g</div><div class="stat-label">蛋白质</div></div>
           <div class="stat-item"><div class="stat-value">${plan?.carbs || '-'}g</div><div class="stat-label">碳水</div></div>
         </div>
         <div class="stat-row" style="margin-top:6px;">
           <div class="stat-item"><div class="stat-value">${plan?.fat || '-'}g</div><div class="stat-label">脂肪</div></div>
           <div class="stat-item"><div class="stat-value">${plan?.fiber || '-'}g</div><div class="stat-label">纤维</div></div>
           <div class="stat-item"><div class="stat-value">${activityLabel}</div><div class="stat-label">活动水平</div></div>
         </div>
         <div style="margin-top:12px;">
           <button class="btn btn-outline btn-sm btn-block" onclick="window.navigate('/me/plan')">查看完整方案</button>
         </div>
       </div>
 
       <!-- Exercise -->
       <div class="card">
         <div class="card-header">运动建议</div>
         <div style="font-size:0.9375rem;">${exercise.description}</div>
       </div>
 
       <!-- Menu -->
       <div class="card" style="padding:8px 0;">
         <div class="menu-item" onclick="window.navigate('/me/review/weekly')">
           <span>📊 周复盘</span>
           <span class="text-muted">›</span>
         </div>
         <div class="menu-item" onclick="window.navigate('/me/review/monthly')">
           <span>📈 月复盘</span>
           <span class="text-muted">›</span>
         </div>
         <div class="menu-item" onclick="window.navigate('/me/profile')">
           <span>⚙️ 个人资料</span>
           <span class="text-muted">›</span>
         </div>
         <div class="menu-item" onclick="window.navigate('/me/restrictions')">
           <span>🥜 饮食忌口与过敏</span>
           <span class="text-muted">›</span>
         </div>
         <div class="menu-item" onclick="showAIConfig()">
           <span>🤖 AI 配置</span>
           <span class="text-muted">${aiConfig ? '已配置' : '未配置'}</span>
         </div>
         <div class="menu-item" onclick="window.navigate('/me/data-info')">
           <span>ℹ️ 数据说明</span>
           <span class="text-muted">›</span>
         </div>
       </div>
 
       <!-- Danger Zone -->
       <div style="margin-top:16px;text-align:center;">
         <button class="btn btn-sm btn-danger" onclick="resetAllData()">重置所有数据</button>
       </div>
     </div>
   `;
 
   const html = pageWrapper(content, { title: '我的', showNav: true });
   const app = document.getElementById('app');
   if (app) app.innerHTML = html;
 
   // Add menu item styles
   const style = document.createElement('style');
   style.textContent = `
     .menu-item { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;cursor:pointer;font-size:0.9375rem; }
     .menu-item:hover { background:var(--bg); }
   `;
   app?.appendChild(style);
 
  window.showAIConfig = () => {
    const config = getAIConfig();
     const apiKey = config?.apiKey || '';
     const endpoint = config?.endpoint || 'https://api.openai.com/v1/chat/completions';
     const model = config?.model || 'gpt-4o-mini';
 
     const modal = document.createElement('div');
     modal.className = 'modal-overlay';
     modal.innerHTML = `
       <div class="modal-content">
         <div class="modal-title">AI 配置</div>
         <div class="modal-body">
           <div class="form-group">
             <label class="form-label">API Key</label>
             <input class="form-input" id="ai-api-key" type="password" value="${apiKey}" placeholder="sk-..." />
           </div>
           <div class="form-group">
             <label class="form-label">API 地址 <span class="hint">(可选)</span></label>
             <input class="form-input" id="ai-endpoint" value="${endpoint}" placeholder="https://api.openai.com/v1/chat/completions" />
           </div>
           <div class="form-group">
             <label class="form-label">模型 <span class="hint">(可选)</span></label>
             <input class="form-input" id="ai-model" value="${model}" placeholder="gpt-4o-mini" />
           </div>
         </div>
         <div class="modal-actions">
           <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">取消</button>
           <button class="btn btn-primary" onclick="saveAIConfigFromModal()">保存</button>
         </div>
       </div>
     `;
     document.body.appendChild(modal);
   };

  window.saveAIConfigFromModal = () => {
     import("../utils/aiService.js").then(m => {
       m.saveAIConfig({
         apiKey: document.getElementById("ai-api-key").value,
         endpoint: document.getElementById("ai-endpoint").value,
         model: document.getElementById("ai-model").value
       });
       showToast("AI配置已保存", "success");
       document.querySelectorAll(".modal-overlay").forEach(e => e.remove());
     });
  };
 
   window.resetAllData = async () => {
     const confirm = await showModal('⚠️ 危险操作', '这将清除所有数据（个人资料、饮食记录、体重数据），且无法恢复。确定要继续吗？', '我已确认，重置', '取消');
     if (confirm) {
       await import('../data/db.js').then(m => {
         m.default.delete().then(() => {
           localStorage.clear();
           showToast('数据已重置', 'success');
           setTimeout(() => { window.location.hash = ''; window.location.reload(); }, 1000);
         });
       });
     }
   };
 }
 
 export async function renderPlan() {
   const profile = await getUserProfile();
   const plan = await getNutritionPlan();
   const planLabel = PLAN_TYPES[profile?.planType]?.label || '';
   const stage = calculateStageTarget(profile?.currentWeight || 70, profile?.targetWeight || 65);
 
   const content = `
     <div class="fade-in">
       <div class="card" style="background:var(--green-bg);">
         <div style="text-align:center;">
           <div class="text-sm text-secondary">方案类型</div>
           <h2 style="color:var(--green);margin-top:4px;">${planLabel}</h2>
         </div>
       </div>
       <div class="card">
         <div class="card-header">体重目标</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${profile?.currentWeight || '-'}</div><div class="stat-label">当前</div></div>
           <div class="stat-item"><div class="stat-value" style="color:var(--green);">${stage.stageTarget}</div><div class="stat-label">阶段目标</div></div>
           <div class="stat-item"><div class="stat-value">${profile?.targetWeight || '-'}</div><div class="stat-label">最终目标</div></div>
         </div>
       </div>
       <div class="card">
         <div class="card-header">每日营养目标</div>
         <div class="stat-row">
           <div class="stat-item"><div class="stat-value">${plan?.calories || '-'}</div><div class="stat-label">热量 (kcal)</div></div>
           <div class="stat-item"><div class="stat-value">${plan?.calorieMin || '-'}~${plan?.calorieMax || '-'}</div><div class="stat-label">范围</div></div>
           <div class="stat-item"><div class="stat-value">${plan?.maintenanceCalories || '-'}</div><div class="stat-label">维持 (kcal)</div></div>
         </div>
         <div class="review-item"><span class="review-item-label">蛋白质</span><span class="review-item-value">${plan?.proteinMin || 0}~${plan?.proteinMax || 0}g (目标 ${plan?.protein || 0}g)</span></div>
         <div class="review-item"><span class="review-item-label">碳水化合物</span><span class="review-item-value">${plan?.carbMin || 0}~${plan?.carbMax || 0}g (目标 ${plan?.carbs || 0}g)</span></div>
         <div class="review-item"><span class="review-item-label">脂肪</span><span class="review-item-value">${plan?.fatMin || 0}~${plan?.fatMax || 0}g (目标 ${plan?.fat || 0}g)</span></div>
         <div class="review-item"><span class="review-item-label">膳食纤维</span><span class="review-item-value">${plan?.fiber || 0}g</span></div>
         <div class="review-item"><span class="review-item-label">蔬菜</span><span class="review-item-value">${plan?.vegetableMin || 0}~${plan?.vegetableMax || 0}g</span></div>
         <div class="review-item"><span class="review-item-label">饮水</span><span class="review-item-value">${plan?.waterTarget || 0}ml</span></div>
       </div>
       <button class="btn btn-secondary btn-block" onclick="window.navigate('/me')">返回</button>
     </div>
   `;
   const html = pageWrapper(content, { title: '我的方案', showBack: true, backPath: '/me' });
   const app = document.getElementById('app');
   if (app) app.innerHTML = html;
 }
 
 export async function renderProfile() {
   const profile = await getUserProfile();
   if (!profile) { navigate('/onboarding'); return; }
 
   const content = `
     <div class="fade-in">
       <div class="card">
         <div class="form-group">
           <label class="form-label">年龄</label>
           <input class="form-input" id="edit-age" type="number" value="${profile.age}" />
         </div>
         <div class="form-group">
           <label class="form-label">性别</label>
           <select class="form-select" id="edit-sex">
             <option value="male" ${profile.sex === 'male' ? 'selected' : ''}>男</option>
             <option value="female" ${profile.sex === 'female' ? 'selected' : ''}>女</option>
           </select>
         </div>
         <div class="form-group">
           <label class="form-label">身高 (cm)</label>
           <input class="form-input" id="edit-height" type="number" value="${profile.height}" />
         </div>
         <div class="form-row">
           <div class="form-group">
             <label class="form-label">当前体重 (kg)</label>
             <input class="form-input" id="edit-weight" type="number" step="0.1" value="${profile.currentWeight}" />
           </div>
           <div class="form-group">
             <label class="form-label">目标体重 (kg)</label>
             <input class="form-input" id="edit-target" type="number" step="0.1" value="${profile.targetWeight}" />
           </div>
         </div>
         <div class="form-group">
           <label class="form-label">活动水平</label>
           <select class="form-select" id="edit-activity">
             <option value="sedentary" ${profile.activityLevel === 'sedentary' ? 'selected' : ''}>久坐不动</option>
             <option value="light" ${profile.activityLevel === 'light' ? 'selected' : ''}>轻度活动</option>
             <option value="moderate" ${profile.activityLevel === 'moderate' ? 'selected' : ''}>中等活动</option>
             <option value="high" ${profile.activityLevel === 'high' ? 'selected' : ''}>较高活动</option>
           </select>
         </div>
         <div class="form-group">
           <label class="form-label">计划类型</label>
           <select class="form-select" id="edit-plan">
             <option value="exercise_assisted" ${profile.planType === 'exercise_assisted' ? 'selected' : ''}>运动结合减脂</option>
             <option value="diet_first" ${profile.planType === 'diet_first' ? 'selected' : ''}>饮食优先减脂</option>
             <option value="healthy_diet" ${profile.planType === 'healthy_diet' ? 'selected' : ''}>健康饮食维持</option>
           </select>
         </div>
         <button class="btn btn-primary btn-block mt-16" onclick="saveProfile()">保存修改</button>
         <div class="text-xs text-secondary mt-8" style="text-align:center;">保存后将重新生成营养方案</div>
       </div>
       <button class="btn btn-secondary btn-block" onclick="window.navigate('/me')">返回</button>
     </div>
   `;
   const html = pageWrapper(content, { title: '个人资料', showBack: true, backPath: '/me' });
   const app = document.getElementById('app');
   if (app) {
     app.innerHTML = html;
     window.saveProfile = async () => {
       const age = parseInt(document.getElementById('edit-age').value);
       const sex = document.getElementById('edit-sex').value;
       const height = parseFloat(document.getElementById('edit-height').value);
       const weight = parseFloat(document.getElementById('edit-weight').value);
       const target = parseFloat(document.getElementById('edit-target').value);
       const activity = document.getElementById('edit-activity').value;
       const planType = document.getElementById('edit-plan').value;
 
       const updated = { ...profile, age, sex, height, currentWeight: weight, targetWeight: target, activityLevel: activity, planType, onboardingCompleted: true };
       const { saveUserProfile, saveNutritionPlan } = await import('../data/db.js');
       const { generateNutritionPlan } = await import('../utils/nutrition.js');
       await saveUserProfile(updated);
       const newPlan = generateNutritionPlan(updated);
       await saveNutritionPlan(newPlan);
       showToast('已保存并重新生成方案', 'success');
       navigate('/me');
     };
   }
 }
 
 export async function renderRestrictions() {
   const profile = await getUserProfile();
   const restrictions = profile?.restrictions || [];
   const allergies = profile?.allergies || [];
 
   const commonRestrictions = ['无特殊忌口', '不吃猪肉', '不吃牛肉', '不吃海鲜', '素食', '蛋奶素', '不吃辣', '少油少盐', '无乳糖'];
   const commonAllergies = ['无过敏', '花生过敏', '海鲜过敏', '牛奶过敏', '鸡蛋过敏', '大豆过敏', '坚果过敏'];
 
   const content = `
     <div class="fade-in">
       <div class="card">
         <div class="card-header">饮食忌口</div>
         <div style="display:flex;flex-wrap:wrap;gap:8px;">
           ${commonRestrictions.map(r => `
             <div class="tag" style="cursor:pointer;padding:6px 12px;font-size:0.8125rem;
               ${restrictions.includes(r) ? 'background:var(--green);color:white;' : 'background:var(--border);color:var(--text);'}"
               onclick="toggleRestrictionEdit('${r}', this)">${r}</div>
           `).join('')}
         </div>
       </div>
       <div class="card">
         <div class="card-header">过敏原</div>
         <div style="display:flex;flex-wrap:wrap;gap:8px;">
           ${commonAllergies.map(a => `
             <div class="tag" style="cursor:pointer;padding:6px 12px;font-size:0.8125rem;
               ${allergies.includes(a) ? 'background:var(--blue);color:white;' : 'background:var(--border);color:var(--text);'}"
               onclick="toggleAllergyEdit('${a}', this)">${a}</div>
           `).join('')}
         </div>
       </div>
       <button class="btn btn-primary btn-block" onclick="saveRestrictions()">保存</button>
       <button class="btn btn-secondary btn-block mt-8" onclick="window.navigate('/me')">返回</button>
     </div>
   `;
   const html = pageWrapper(content, { title: '饮食忌口', showBack: true, backPath: '/me' });
   const app = document.getElementById('app');
   if (app) {
     app.innerHTML = html;
     let editRestrictions = [...restrictions];
     let editAllergies = [...allergies];
 
     window.toggleRestrictionEdit = (val, el) => {
       if (val === '无特殊忌口') { editRestrictions = ['无特殊忌口']; document.querySelectorAll('[onclick*="toggleRestrictionEdit"]').forEach(e => { if (e.textContent !== '无特殊忌口') { e.style.background = 'var(--border)'; e.style.color = 'var(--text)'; } }); el.style.background = 'var(--green)'; el.style.color = 'white'; return; }
       const idx = editRestrictions.indexOf(val);
       if (idx > -1) { editRestrictions.splice(idx, 1); el.style.background = 'var(--border)'; el.style.color = 'var(--text)'; }
       else { const noIdx = editRestrictions.indexOf('无特殊忌口'); if (noIdx > -1) { editRestrictions.splice(noIdx, 1); document.querySelectorAll('[onclick*="toggleRestrictionEdit"]').forEach(e => { if (e.textContent === '无特殊忌口') { e.style.background = 'var(--border)'; e.style.color = 'var(--text)'; } }); } editRestrictions.push(val); el.style.background = 'var(--green)'; el.style.color = 'white'; }
     };
     window.toggleAllergyEdit = (val, el) => {
       if (val === '无过敏') { editAllergies = ['无过敏']; document.querySelectorAll('[onclick*="toggleAllergyEdit"]').forEach(e => { if (e.textContent !== '无过敏') { e.style.background = 'var(--border)'; e.style.color = 'var(--text)'; } }); el.style.background = 'var(--blue)'; el.style.color = 'white'; return; }
       const idx = editAllergies.indexOf(val);
       if (idx > -1) { editAllergies.splice(idx, 1); el.style.background = 'var(--border)'; el.style.color = 'var(--text)'; }
       else { const noIdx = editAllergies.indexOf('无过敏'); if (noIdx > -1) { editAllergies.splice(noIdx, 1); document.querySelectorAll('[onclick*="toggleAllergyEdit"]').forEach(e => { if (e.textContent === '无过敏') { e.style.background = 'var(--border)'; e.style.color = 'var(--text)'; } }); } editAllergies.push(val); el.style.background = 'var(--blue)'; el.style.color = 'white'; }
     };
     window.saveRestrictions = async () => {
       const { saveUserProfile, getUserProfile } = await import('../data/db.js');
       const p = await getUserProfile();
       await saveUserProfile({ ...p, restrictions: editRestrictions, allergies: editAllergies });
       showToast('已保存', 'success');
       navigate('/me');
     };
   }
 }
 
 export async function renderDataInfo() {
   const content = `
     <div class="fade-in">
       <div class="card">
         <div class="card-header">数据存储说明</div>
         <div style="font-size:0.875rem;line-height:1.6;color:var(--text-secondary);">
           <p>• 所有数据仅保存在你当前设备上 (IndexedDB)</p>
           <p>• 清除浏览器数据将导致信息丢失</p>
           <p>• AI 功能使用你的 API Key 直接调用模型接口</p>
           <p>• 发送的数据仅包含当前餐食文本和营养状态</p>
           <p>• 不收集任何个人身份信息</p>
         </div>
       </div>
       <div class="card">
         <div class="card-header">免责声明</div>
         <div style="font-size:0.875rem;line-height:1.6;color:var(--text-secondary);">
           MealTune 提供的营养建议和饮食方案仅供参考，不能替代专业医疗建议。在使用前如有健康问题请咨询医生。
           营养计算基于 Mifflin-St Jeor 公式和标准食物成分表，实际需求可能因个体差异而不同。
         </div>
       </div>
       <button class="btn btn-secondary btn-block" onclick="window.navigate('/me')">返回</button>
     </div>
   `;
   const html = pageWrapper(content, { title: '数据说明', showBack: true, backPath: '/me' });
   const app = document.getElementById('app');
   if (app) app.innerHTML = html;
 }
 
 export default { render, renderPlan, renderProfile, renderRestrictions, renderDataInfo };
