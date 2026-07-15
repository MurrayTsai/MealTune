 import './styles/main.css';
 import { registerRoute, startRouter } from './router.js';
 import { getUserProfile } from './data/db.js';
 import { navigate } from './router.js';
 import { showToast } from './components/shared.js';
 
 // Page imports
 import onboarding from './pages/onboarding.js';
 import today from './pages/today.js';
 import records from './pages/records.js';
 import trends from './pages/trends.js';
 import me from './pages/me.js';
 import weeklyReview from './pages/weekly-review.js';
 import monthlyReview from './pages/monthly-review.js';
 
 // Register routes
 registerRoute('/onboarding', (params, path) => {
   onboarding.render();
 });
 
 registerRoute('/today', async (params, path) => {
   const profile = await getUserProfile();
   if (!profile || !profile.onboardingCompleted) {
     navigate('/onboarding');
     return;
   }
   today.render();
 });
 
 registerRoute('/records', async (params, path) => {
   const profile = await getUserProfile();
   if (!profile || !profile.onboardingCompleted) {
     navigate('/onboarding');
     return;
   }
   records.render({}, path);
 });
 
 registerRoute('/records/:date', async (params, path) => {
   const profile = await getUserProfile();
   if (!profile || !profile.onboardingCompleted) {
     navigate('/onboarding');
     return;
   }
   records.render(params, path);
 });
 
 registerRoute('/trends', async (params, path) => {
   const profile = await getUserProfile();
   if (!profile || !profile.onboardingCompleted) {
     navigate('/onboarding');
     return;
   }
   trends.render();
 });
 
 registerRoute('/me', async (params, path) => {
   const profile = await getUserProfile();
   if (!profile || !profile.onboardingCompleted) {
     navigate('/onboarding');
     return;
   }
   me.render();
 });
 
 registerRoute('/me/plan', async (params, path) => {
   me.renderPlan();
 });
 
 registerRoute('/me/plan/example', async (params, path) => {
   // Example meal plan - could add later
   me.renderPlan();
 });
 
 registerRoute('/me/review/weekly', async (params, path) => {
   weeklyReview.render();
 });
 
 registerRoute('/me/review/monthly', async (params, path) => {
   monthlyReview.render();
 });
 
 registerRoute('/me/profile', async (params, path) => {
   me.renderProfile();
 });
 
 registerRoute('/me/restrictions', async (params, path) => {
   me.renderRestrictions();
 });
 
 registerRoute('/me/data-info', async (params, path) => {
   me.renderDataInfo();
 });
 
 // Fallback - redirect to today
 registerRoute('*', () => {
   navigate('/today');
 });
 
 // Initialize app
 async function init() {
   // Check if onboarding is needed
   const profile = await getUserProfile();
 
   // Start the router
   startRouter();
 
   // Register service worker
   if ('serviceWorker' in navigator) {
     try {
       const registration = await navigator.serviceWorker.register('/sw.js');
       console.log('SW registered:', registration.scope);
     } catch (e) {
       console.log('SW registration failed:', e);
     }
   }
 
   // If no profile, redirect to onboarding after router initializes
   if (!profile || !profile.onboardingCompleted) {
     setTimeout(() => navigate('/onboarding'), 100);
   }
 }
 
 init();
 
 console.log('MealTune PWA initialized');
 
 // Global error handler for smooth UX
 window.addEventListener('unhandledrejection', (event) => {
   console.warn('Unhandled error:', event.reason);
 });
