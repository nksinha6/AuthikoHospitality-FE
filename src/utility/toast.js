export const showToast = (type, message, duration = 4000) => {
  console.warn("Toast utility is deprecated. Use react-hot-toast instead.");
};

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