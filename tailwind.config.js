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
        // PRIMARY COLOR - Users customize this to match their brand (mandatory)
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
        // SECONDARY COLOR (mandatory, can be the same as primary if no shades are needed)
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: 'rgba(127, 29, 29, 1)',
        }
      },
      // CUSTOM FONTS
      fontFamily: {   
        // MODERN SANS-SERIF - Clean, readable, professional
        // ['Inter', 'ui-sans-serif', 'system-ui'],              // Very popular, excellent readability
        // ['Roboto', 'ui-sans-serif', 'system-ui'],             // Google's Material Design font
        // ['Open Sans', 'ui-sans-serif', 'system-ui'],          // Friendly and legible
        // ['Lato', 'ui-sans-serif', 'system-ui'],               // Humanist sans-serif
        // ['Source Sans Pro', 'ui-sans-serif', 'system-ui'],    // Adobe's open-source font
        // ['Nunito', 'ui-sans-serif', 'system-ui'],             // Rounded, friendly appearance
        // ['Work Sans', 'ui-sans-serif', 'system-ui'],          // Clean and modern
        // ['Poppins', 'ui-sans-serif', 'system-ui'],            // Geometric, trendy
        // ['Manrope', 'ui-sans-serif', 'system-ui'],            // Modern variable font
        // ['DM Sans', 'ui-sans-serif', 'system-ui'],            // Clean and versatile

        // // GEOMETRIC & STYLISH - Bold, distinctive, attention-grabbing
        // ['Montserrat', 'ui-sans-serif', 'system-ui'],         // Inspired by urban typography
        // ['Raleway', 'ui-sans-serif', 'system-ui'],            // Elegant and sophisticated
        // ['Oswald', 'ui-sans-serif', 'system-ui'],             // Condensed and bold
        // ['Quicksand', 'ui-sans-serif', 'system-ui'],          // Friendly and rounded
        // ['Rubik', 'ui-sans-serif', 'system-ui'],              // Slightly rounded corners
        // ['Barlow', 'ui-sans-serif', 'system-ui'],             // Low-contrast, utilitarian
        // ['Outfit', 'ui-sans-serif', 'system-ui'],             // Modern and minimal
        // ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui'],  // Contemporary Indonesian-inspired

        // // SERIF FONTS - Traditional, elegant, readable for long text
        // ['Playfair Display', 'ui-serif', 'Georgia'],          // High-contrast, elegant
        // ['Merriweather', 'ui-serif', 'Georgia'],              // Designed for screens
        // ['Lora', 'ui-serif', 'Georgia'],                      // Well-balanced contemporary serif
        // ['Crimson Text', 'ui-serif', 'Georgia'],              // Book-style serif
        // ['Libre Baskerville', 'ui-serif', 'Georgia'],         // Based on 1941 Baskerville
        // ['IBM Plex Serif', 'ui-serif', 'Georgia'],            // Corporate but friendly
        // ['Source Serif Pro', 'ui-serif', 'Georgia'],          // Adobe's serif companion
        // ['Cormorant Garamond', 'ui-serif', 'Georgia'],        // Display serif
        // ['Spectral', 'ui-serif', 'Georgia'],                  // Designed for digital reading

        // // MONOSPACE FONTS - Code, technical content, fixed-width
        // ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'], // Designed for developers
        // ['Fira Code', 'ui-monospace', 'SFMono-Regular'],      // Programming font with ligatures
        // ['Source Code Pro', 'ui-monospace', 'SFMono-Regular'], // Adobe's monospace font
        // ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular'],  // Part of IBM's font family
        // ['Roboto Mono', 'ui-monospace', 'SFMono-Regular'],    // Google's monospace
        // ['Space Mono', 'ui-monospace', 'SFMono-Regular'],     // Quirky monospace
        // ['Inconsolata', 'ui-monospace', 'SFMono-Regular'],    // Humanist monospace

        // // DISPLAY & HEADING FONTS - Bold, impactful, for headlines only
        // ['Bebas Neue', 'cursive'],                            // Condensed sans-serif
        // ['Anton', 'sans-serif'],                              // Bold and condensed
        // ['Righteous', 'cursive'],                             // Retro-futuristic
        // ['Fredoka One', 'cursive'],                           // Playful and rounded
        // ['Bangers', 'cursive'],                               // Comic book style
        // ['Creepster', 'cursive'],                             // Horror/Halloween theme

        // // VARIABLE FONTS - Modern approach with flexible weights
        // ['Inter Variable', 'ui-sans-serif', 'system-ui'],     // Variable weight Inter
        // ['Roboto Flex', 'ui-sans-serif', 'system-ui'],        // Variable Roboto
        // ['Work Sans Variable', 'ui-sans-serif', 'system-ui'], // Variable Work Sans
        // ['Manrope Variable', 'ui-sans-serif', 'system-ui'],   // Variable Manrope 
        'headings':  ['Libre Baskerville', 'ui-serif', 'Georgia'],
        'body': ['Rubik', 'ui-sans-serif', 'system-ui'],
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