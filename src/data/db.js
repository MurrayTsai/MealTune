 import Dexie from 'dexie';
 
 const db = new Dexie('MealTuneDB');
 
 db.version(1).stores({
   userProfile: '++id, onboardingCompleted',
   nutritionPlan: '++id, createdAt, planType, status',
   mealRecords: '++id, date, mealType, [date+mealType]',
   weightRecords: '++id, date',
   exerciseRecords: '++id, date',
   dailySummaries: '++id, date',
   weeklyReviews: '++id, weekStart',
   monthlyReviews: '++id, monthStart',
   aiMealLogs: '++id, createdAt'
 });

 db.version(2).stores({
   userProfile: '++id, onboardingCompleted',
   nutritionPlan: '++id, createdAt, planType, status',
   mealRecords: '++id, date, mealType, [date+mealType]',
   weightRecords: '++id, date',
   exerciseRecords: '++id, date',
   dailySummaries: '++id, date',
   weeklyReviews: '++id, weekStart',
   monthlyReviews: '++id, monthStart',
   aiMealLogs: '++id, createdAt',
   waterRecords: '++id, date'
 });
 
 export async function getUserProfile() {
   const profiles = await db.userProfile.toArray();
   return profiles[0] || null;
 }
 
 export async function saveUserProfile(profile) {
   const existing = await getUserProfile();
   if (existing) {
     await db.userProfile.update(existing.id, { ...profile, id: existing.id });
     return { ...existing, ...profile };
   } else {
     return await db.userProfile.add({ ...profile, onboardingCompleted: true });
   }
 }
 
 export async function getNutritionPlan() {
   const plans = await db.nutritionPlan.where('status').equals('active').reverse().sortBy('createdAt');
   return plans[0] || null;
 }
 
 export async function saveNutritionPlan(plan) {
   const active = await db.nutritionPlan.where('status').equals('active').toArray();
   for (const p of active) {
     await db.nutritionPlan.update(p.id, { status: 'archived' });
   }
   return await db.nutritionPlan.add({ ...plan, status: 'active', createdAt: new Date().toISOString() });
 }
 
 export async function getMealRecords(date) {
   if (!date) {
     return await db.mealRecords.toArray();
   }
   return await db.mealRecords.where('date').equals(date).toArray();
 }
 
 export async function saveMealRecord(record) {
   if (record.id) {
     await db.mealRecords.update(record.id, record);
     return record;
   }
   return await db.mealRecords.add({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
 }
 
 export async function deleteMealRecord(id) {
   return await db.mealRecords.delete(id);
 }
 
 export async function getWeightRecords(days = 30) {
   const cutoff = new Date();
   cutoff.setDate(cutoff.getDate() - days);
   const cutoffStr = cutoff.toISOString().split('T')[0];
   return await db.weightRecords.where('date').aboveOrEqual(cutoffStr).reverse().sortBy('date');
 }
 
 export async function saveWeightRecord(record) {
   const existing = await db.weightRecords.where('date').equals(record.date).first();
   if (existing) {
     await db.weightRecords.update(existing.id, { weight: record.weight, updatedAt: new Date().toISOString() });
     return existing;
   }
   return await db.weightRecords.add({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
 }
 
 export async function getDailySummary(date) {
   return await db.dailySummaries.where('date').equals(date).first();
 }
 
 export async function saveDailySummary(summary) {
   const existing = await db.dailySummaries.where('date').equals(summary.date).first();
   if (existing) {
     await db.dailySummaries.update(existing.id, summary);
     return existing;
   }
   return await db.dailySummaries.add(summary);
 }
 
 export async function getWeeklyReview(weekStart) {
   return await db.weeklyReviews.where('weekStart').equals(weekStart).first();
 }
 
 export async function saveWeeklyReview(review) {
   const existing = await db.weeklyReviews.where('weekStart').equals(review.weekStart).first();
   if (existing) {
     await db.weeklyReviews.update(existing.id, review);
     return existing;
   }
   return await db.weeklyReviews.add(review);
 }
 
 export async function getMonthlyReview(monthStart) {
   return await db.monthlyReviews.where('monthStart').equals(monthStart).first();
 }
 
 export async function saveMonthlyReview(review) {
   const existing = await db.monthlyReviews.where('monthStart').equals(review.monthStart).first();
   if (existing) {
     await db.monthlyReviews.update(existing.id, review);
     return existing;
   }
   return await db.monthlyReviews.add(review);
 }

 export async function getWaterRecord(date) {
   return await db.waterRecords.where('date').equals(date).first();
 }

 export async function saveWaterRecord(date, amount) {
   const existing = await getWaterRecord(date);
   if (existing) {
     await db.waterRecords.update(existing.id, { amount, updatedAt: new Date().toISOString() });
     return existing;
   }
   return await db.waterRecords.add({ date, amount, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
 }
 
 export default db;
