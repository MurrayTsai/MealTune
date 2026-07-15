 // Simple hash-based SPA router
 
 const routes = {};
 let currentCleanup = null;
 let currentPath = '';
 
 export function registerRoute(pattern, handler) {
   routes[pattern] = handler;
 }
 
 function matchRoute(hash) {
   const path = hash.replace('#', '') || '/today';
   for (const [pattern, handler] of Object.entries(routes)) {
     const patternParts = pattern.split('/');
     const pathParts = path.split('/');
     if (patternParts.length !== pathParts.length) continue;
     const params = {};
     let match = true;
     for (let i = 0; i < patternParts.length; i++) {
       if (patternParts[i].startsWith(':')) {
         params[patternParts[i].slice(1)] = pathParts[i];
       } else if (patternParts[i] !== pathParts[i]) {
         match = false;
         break;
       }
     }
     if (match) return { handler, params, path };
   }
   return { handler: null, params: {}, path };
 }
 
 export function navigate(path) {
   window.location.hash = path;
 }
 
 export function getCurrentPath() {
   return window.location.hash.replace('#', '') || '/today';
 }
 
 export function startRouter() {
   function handleHashChange() {
     const hash = window.location.hash || '#/today';
     const path = hash.replace('#', '') || '/today';
     const { handler, params } = matchRoute(hash);
 
     if (currentCleanup && typeof currentCleanup === 'function') {
       currentCleanup();
       currentCleanup = null;
     }
 
     const app = document.getElementById('app');
     if (app) {
       app.innerHTML = '';
     }
 
     if (handler) {
       const result = handler(params, path);
       if (result && typeof result.then === 'function') {
         result.then(cleanup => {
           if (typeof cleanup === 'function') currentCleanup = cleanup;
         });
       } else if (typeof result === 'function') {
         currentCleanup = result;
       }
     } else {
       navigate('/today');
     }
   }
 
   window.addEventListener('hashchange', handleHashChange);
   // Initial route
   if (!window.location.hash) {
     navigate('/today');
   }
   handleHashChange();
 
   return () => {
     window.removeEventListener('hashchange', handleHashChange);
   };
 }
 
 // Generate page HTML wrapper
 export function pageWrapper(content, options = {}) {
   const { title, showBack, backPath, showNav = true } = options;
   let header = '';
   if (title) {
     const backBtn = showBack
       ? `<div class="page-header-back" onclick="navigate('${backPath || '/today'}')">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
         </div>`
       : '';
     header = `<div class="page-header">${backBtn}<h1>${title}</h1><div></div></div>`;
   }
   const nav = showNav ? getBottomNav() : '';
   return `<div class="page">${header}<div class="page-content">${content}</div>${nav}</div>`;
 }
 
 export function getBottomNav() {
   const currentPath = getCurrentPath();
   const items = [
     { path: '/today', label: '今天', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' },
     { path: '/records', label: '记录', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>' },
     { path: '/trends', label: '趋势', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' },
     { path: '/me', label: '我的', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
   ];
 
   return `<nav class="bottom-nav">${items.map(item => {
     const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
     return `<div class="nav-item ${isActive ? 'active' : ''}" onclick="navigate('${item.path}')">
       ${item.icon}<span>${item.label}</span>
     </div>`;
   }).join('')}</nav>`;
 }
 
 // Make navigate globally accessible for onclick handlers
 window.navigate = navigate;
