const base = import.meta.env.BASE_URL;

async function loadConfiguration() {
  try {
    // Usa l'APP_ID per creare una chiave unica
    const storageKey = `mapConfig_${__APP_ID__}`;
    const savedConfig = localStorage.getItem(storageKey);
    
    if (savedConfig) {
      console.log(`Loading configuration from localStorage (${storageKey})`);
      return JSON.parse(savedConfig);
    }
    
    // If no saved config, load from server
    const response = await fetch(`${base}config/map-config.json`);
    const config = await response.json();
    console.log('Loaded configuration from server:', config);
    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw error;
  }
}

async function saveConfiguration(config) {
  try {
    // Usa la stessa chiave per salvare
    const storageKey = `mapConfig_${__APP_ID__}`;
    localStorage.setItem(storageKey, JSON.stringify(config, null, 2));
    console.log(`✅ Configuration saved to ${storageKey}`);
         
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error);
    return false;
  }
}

// // Helper function to download config as a file (optional backup)
// function downloadConfigAsFile(config) {
//   try {
//     const configJson = JSON.stringify(config, null, 2);
//     const blob = new Blob([configJson], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
    
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'map-config-updated.json';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
    
//     console.log('Configuration backup downloaded as file');
//   } catch (error) {
//     console.warn('Could not download config file:', error);
//   }
// }

// // Function to reset to original server config
// async function resetConfiguration() {
//   try {
//     // Remove from localStorage
//     localStorage.removeItem('mapConfig');
    
//     // Load fresh from server
//     const response = await fetch(`${base}/config/map-config.json`);
//     const config = await response.json();
//     console.log('Configuration reset to server version');
//     return config;
//   } catch (error) {
//     console.error('Error resetting configuration:', error);
//     throw error;
//   }
// }

export { loadConfiguration, saveConfiguration };