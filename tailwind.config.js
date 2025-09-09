/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
    './*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
  // PRIMARY COLOR - Verde scuro (#1C6F3A)
  primary: {
    50: '#f0f8f3',
    100: '#dcefe1',
    200: '#bce0c7',
    300: '#8cc9a1',
    400: '#5aad74',
    500: '#389454',
    600: '#2a7841',
    700: '#1c6f3a', // Main primary (#1C6F3A)
    800: '#17582f',
    900: '#134725',
  },
  
  // SECONDARY COLOR - Arancione/Rosso (#C24C1C)
  secondary: {
    50: '#fef6f2',
    100: '#feeae0',
    200: '#fdd4c1',
    300: '#fbb896',
    400: '#f8956a',
    500: '#f47447',
    600: '#e25a2b',
    700: '#c24c1c', // Main secondary (#C24C1C)
    800: '#9c3f17',
    900: '#7d3317',
  },
  
  // ACCENT COLOR - Verde chiaro (#91C682)
  accent: {
    50: '#f5fbf3',
    100: '#e8f5e3',
    200: '#d3ebc9',
    300: '#b5daa1',
    400: '#91c682', // Main accent (#91C682)
    500: '#73b05e',
    600: '#5a9147',
    700: '#48743a',
    800: '#3c5d32',
    900: '#334d2b',
  }
},
      // CUSTOM FONTS
      fontFamily: {   
        // FONT ATTIVI (modificabili dall'utente)
        'headings': ['Playfair Display', 'ui-serif', 'Georgia'],       // Font per titoli principali
        'body': ['Inter', 'ui-sans-serif', 'system-ui'],              // Font per testo corpo
        
        // FONT DISPONIBILI (commentati - decommenta per usarli)
        // 'inter': ['Inter', 'ui-sans-serif', 'system-ui'],              // Moderno e leggibile
        // 'poppins': ['Poppins', 'ui-sans-serif', 'system-ui'],          // Geometrico e trendy
        // 'playfair': ['Playfair Display', 'ui-serif', 'Georgia'],       // Elegante per titoli
        // 'merriweather': ['Merriweather', 'ui-serif', 'Georgia'],       // Perfetto per testo lungo
        // 'jetbrains': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'], // Miglior monospace
        // 'montserrat': ['Montserrat', 'ui-sans-serif', 'system-ui'],    // Bold per headlines
      },
    },
  },
  safelist: [
    // Pattern per tutte le classi background primary e secondary [safer import in js files for dynamic application]
    {
      pattern: /bg-(primary|secondary)-(50|100|200|300|400|500|600|700|800|900)/
    }
  ],
  plugins: [],
};

/* 
EXAMPLES: Change primary color to match your brand

// 🟢 GREEN THEME
primary: {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e', // Main green
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
},

// 🟣 PURPLE THEME  
primary: {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7', // Main purple
  600: '#9333ea',
  700: '#7c3aed',
  800: '#6b21a8',
  900: '#581c87',
},

// 🔴 RED THEME
primary: {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444', // Main red
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
},
primary: {
  50: '#eff6ff',
  100: '#dbeafe', 
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // 👈 MAIN BRAND COLOR - Change this!
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
}
*/