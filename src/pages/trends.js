 import { getWeightRecords, getNutritionPlan, getMealRecords } from '../data/db.js';
 import { pageWrapper, getCurrentPath } from '../router.js';
 import Chart from 'chart.js/auto';
 
 let chartInstance = null;
 let chartView = 'weight'; // 'weight' or 'nutrition'
 let chartRange = 7; // 7 or 30 days
 
 export async function render() {
   const content = `
     <div class="fade-in">
       <div style="display:flex;gap:8px;margin-bottom:12px;">
         <button class="btn btn-sm ${chartView === 'weight' ? 'btn-primary' : 'btn-secondary'}" onclick="switchView('weight')">体重</button>
         <button class="btn btn-sm ${chartView === 'nutrition' ? 'btn-primary' : 'btn-secondary'}" onclick="switchView('nutrition')">营养</button>
       </div>
       <div style="display:flex;gap:8px;margin-bottom:12px;">
         <button class="btn btn-sm ${chartRange === 7 ? 'btn-primary' : 'btn-secondary'}" onclick="switchRange(7)">7天</button>
         <button class="btn btn-sm ${chartRange === 30 ? 'btn-primary' : 'btn-secondary'}" onclick="switchRange(30)">30天</button>
       </div>
       <div class="card">
         <div class="card-header">${chartView === 'weight' ? '体重趋势' : '热量与蛋白质趋势'}</div>
         <div class="chart-container">
           <canvas id="trend-chart"></canvas>
         </div>
       </div>
       <div id="trend-summary" class="card"></div>
     </div>
   `;
   const html = pageWrapper(content, { title: '趋势', showNav: true });
   const app = document.getElementById('app');
   if (app) app.innerHTML = html;
 
   await buildChart();
 
   window.switchView = async (view) => {
     chartView = view;
     await render();
   };
 
   window.switchRange = async (range) => {
     chartRange = range;
     await render();
   };
 }
 
 async function buildChart() {
   const canvas = document.getElementById('trend-chart');
   if (!canvas) return;
 
   // Destroy previous chart
   if (chartInstance) {
     chartInstance.destroy();
     chartInstance = null;
   }
 
   if (chartView === 'weight') {
     await buildWeightChart(canvas);
   } else {
     await buildNutritionChart(canvas);
   }
 }
 
 async function buildWeightChart(canvas) {
   const records = await getWeightRecords(chartRange);
   const summary = document.getElementById('trend-summary');
 
   if (records.length < 2) {
     if (summary) {
       summary.innerHTML = '<div class="empty-state"><h3>数据不足</h3><p>请先记录至少2天的体重数据</p></div>';
     }
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     return;
   }
 
   const labels = records.map(r => {
     const d = new Date(r.date + 'T00:00:00');
     return `${d.getMonth() + 1}/${d.getDate()}`;
   });
   const data = records.map(r => r.weight);
 
   const first = records[0].weight;
   const last = records[records.length - 1].weight;
   const change = last - first;
   const changeStr = change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);

   // Calculate 7-day moving average
   const movingAvgData = data.map((_, i) => {
     const windowSize = Math.min(7, i + 1);
     let sum = 0;
     for (let j = i - windowSize + 1; j <= i; j++) {
       sum += data[j];
     }
     return Math.round((sum / windowSize) * 10) / 10;
   });

   if (summary) {
     summary.innerHTML = `
       <div class="stat-row">
         <div class="stat-item">
           <div class="stat-value">${first.toFixed(1)}</div>
           <div class="stat-label">起始</div>
         </div>
         <div class="stat-item">
           <div class="stat-value">${last.toFixed(1)}</div>
           <div class="stat-label">最近</div>
         </div>
         <div class="stat-item">
           <div class="stat-value ${change >= 0 ? 'weight-change positive' : 'weight-change negative'}">${changeStr}</div>
           <div class="stat-label">变化</div>
         </div>
       </div>
     `;
   }
 
   chartInstance = new Chart(canvas, {
     type: 'line',
     data: {
       labels,
       datasets: [
         {
           label: '体重 (kg)',
           data,
           borderColor: '#4F7C3F',
           backgroundColor: 'rgba(79,124,63,0.1)',
           fill: true,
           tension: 0.3,
           pointRadius: 4,
           pointBackgroundColor: '#4F7C3F',
         },
         {
           label: '7日均线 (kg)',
           data: movingAvgData,
           borderColor: '#F59E0B',
           backgroundColor: 'transparent',
           fill: false,
           tension: 0.4,
           pointRadius: 0,
           borderWidth: 2,
           borderDash: [6, 3],
         }
       ]
     },
     options: {
       responsive: true,
       maintainAspectRatio: false,
       plugins: { legend: { display: true, position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } },
       scales: {
         y: {
           ticks: { callback: v => v + 'kg', font: { size: 11 } },
           grid: { color: 'rgba(0,0,0,0.05)' }
         },
         x: {
           ticks: { font: { size: 10 } },
           grid: { display: false }
         }
       }
     }
   });
 }
 
 async function buildNutritionChart(canvas) {
   const plan = await getNutritionPlan();
   const summary = document.getElementById('trend-summary');
 
   // Get daily summaries for the range
   const dates = [];
   const calData = [];
   const proteinData = [];
   for (let i = chartRange - 1; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
     dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
     const meals = await getMealRecords(dateStr);
     let cal = 0, pro = 0;
     for (const meal of meals) {
       if (meal.foods) {
         for (const food of meal.foods) {
           cal += food.calories || 0;
           pro += food.protein || 0;
         }
       }
     }
     calData.push(Math.round(cal));
     proteinData.push(Math.round(pro * 10) / 10);
   }
 
   if (summary) {
     const avgCal = Math.round(calData.filter(c => c > 0).reduce((a, b) => a + b, 0) / Math.max(1, calData.filter(c => c > 0).length));
     const avgPro = calData.filter(c => c > 0).length > 0
       ? Math.round(proteinData.filter(p => p > 0).reduce((a, b) => a + b, 0) / Math.max(1, proteinData.filter(p => p > 0).length) * 10) / 10
       : 0;
     summary.innerHTML = `
       <div class="stat-row">
         <div class="stat-item">
           <div class="stat-value">${avgCal}</div>
           <div class="stat-label">日均热量 (kcal)</div>
         </div>
         <div class="stat-item">
           <div class="stat-value">${avgPro}g</div>
           <div class="stat-label">日均蛋白质</div>
         </div>
         <div class="stat-item">
           <div class="stat-value">${plan?.calories || '-'}</div>
           <div class="stat-label">目标 (kcal)</div>
         </div>
       </div>
     `;
   }
 
   chartInstance = new Chart(canvas, {
     type: 'bar',
     data: {
       labels: dates,
       datasets: [
         {
           label: '热量 (kcal)',
           data: calData,
           backgroundColor: 'rgba(79,124,63,0.6)',
           borderColor: '#4F7C3F',
           borderWidth: 1,
           order: 1
         },
         {
           label: '蛋白质 (g)',
           data: proteinData,
           type: 'line',
           borderColor: '#3B82F6',
           backgroundColor: 'rgba(59,130,246,0.1)',
           fill: true,
           tension: 0.3,
           pointRadius: 3,
           pointBackgroundColor: '#3B82F6',
           order: 0,
           yAxisID: 'y1'
         }
       ]
     },
     options: {
       responsive: true,
       maintainAspectRatio: false,
       plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } },
       scales: {
         y: {
           beginAtZero: true,
           grid: { color: 'rgba(0,0,0,0.05)' },
           ticks: { font: { size: 10 } }
         },
         y1: {
           position: 'right',
           beginAtZero: true,
           grid: { display: false },
           ticks: { font: { size: 10 } }
         },
         x: {
           grid: { display: false },
           ticks: { font: { size: 10 } }
         }
       }
     }
   });
 }
 
 export default { render };
