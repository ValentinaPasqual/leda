// src/map_components/core/UIManager.js

export class UIManager {
  constructor() {
    this.fullScreenLoader = null;
  }

  showFullScreenLoader() {
    if (!this.fullScreenLoader) {
      this.fullScreenLoader = document.createElement('div');
      this.fullScreenLoader.className = 'fixed inset-0 z-[9999] bg-white flex items-center justify-center';
      this.fullScreenLoader.innerHTML = `
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Loading LEDA Search</h2>
          <p class="text-gray-500">Initializing map, data, and components...</p>
        </div>
      `;
      document.body.appendChild(this.fullScreenLoader);
    }
    this.fullScreenLoader.style.display = 'flex';
  }

  hideFullScreenLoader() {
    if (this.fullScreenLoader) {
      this.fullScreenLoader.style.opacity = '0';
      this.fullScreenLoader.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (this.fullScreenLoader) {
          this.fullScreenLoader.style.display = 'none';
        }
      }, 300);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg max-w-sm text-white transition-all duration-300 ${
      type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  showFilterNotification(filterKey, filterValue) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.style.transform = 'translateX(100%)';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
        </svg>
        <span>Filtro applicato: <strong>${filterKey}</strong> = "${filterValue}"</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animazione di entrata
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-rimozione dopo 5 secondi
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.parentElement.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}
