// utils/toast.js
import { createRoot } from 'react-dom/client';

let toastRoot = null;
let toastContainer = null;

export const showToast = (type, message, duration = 4000) => {
    // Create or get toast container
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
        document.body.appendChild(toastContainer);
        toastRoot = createRoot(toastContainer);
    }

    // Create toast element
    const toastId = Date.now();
    const toastElement = document.createElement('div');
    toastElement.id = `toast-${toastId}`;

    const bgColor = type === 'error' ? '#ef4444' :
        type === 'success' ? '#10b981' :
            type === 'info' ? '#3b82f6' : '#6b7280';

    toastElement.style.cssText = `
    background: ${bgColor};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
    word-break: break-word;
  `;

    toastElement.textContent = message;
    toastContainer.appendChild(toastElement);

    // Auto remove
    setTimeout(() => {
        if (toastContainer.contains(toastElement)) {
            toastElement.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toastContainer.contains(toastElement)) {
                    toastContainer.removeChild(toastElement);
                }
            }, 300);
        }
    }, duration);

    // Add CSS animation
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
        document.head.appendChild(style);
    }
};