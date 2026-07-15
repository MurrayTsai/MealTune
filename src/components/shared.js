 // Shared UI component builders
 
 export function showModal(title, bodyHtml, confirmText = '确定', cancelText = '取消') {
   return new Promise((resolve) => {
     const overlay = document.createElement('div');
     overlay.className = 'modal-overlay';
     overlay.innerHTML = `
       <div class="modal-content">
         <div class="modal-title">${title}</div>
         <div class="modal-body">${bodyHtml}</div>
         <div class="modal-actions">
           <button class="btn btn-secondary" id="modal-cancel">${cancelText}</button>
           <button class="btn btn-primary" id="modal-confirm">${confirmText}</button>
         </div>
       </div>
     `;
     document.body.appendChild(overlay);
 
     overlay.querySelector('#modal-cancel').onclick = () => {
       overlay.remove();
       resolve(false);
     };
     overlay.querySelector('#modal-confirm').onclick = () => {
       overlay.remove();
       resolve(true);
     };
     overlay.onclick = (e) => {
       if (e.target === overlay) {
         overlay.remove();
         resolve(false);
       }
     };
   });
 }
 
 export function showToast(message, type = 'info', duration = 2500) {
   const colors = { info: '#4F7C3F', warning: '#F59E0B', error: '#DC2626', success: '#10B981' };
   const toast = document.createElement('div');
   toast.style.cssText = `
     position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 300;
     background: ${colors[type] || colors.info}; color: white; padding: 12px 24px;
     border-radius: 8px; font-size: 0.875rem; font-weight: 600;
     box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeIn 0.2s ease;
   `;
   toast.textContent = message;
   document.body.appendChild(toast);
   setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, duration);
 }
 
 export function createSpinner() {
   const div = document.createElement('div');
   div.className = 'spinner';
   return div;
 }
 
 export function formatTime(dateStr) {
   const d = new Date(dateStr);
   return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
 }
