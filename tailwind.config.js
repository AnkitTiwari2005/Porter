/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        porter: {
          blue: '#4338ca',        // Deep Electric Indigo
          hover: '#3730a3',       // Darker Indigo hover
          light: '#eef2ff',       // Light Indigo accent
          accent: '#6366f1',      // Vibrant Indigo
          dark: '#0f172a',        // Obsidian Slate
          navy: '#1e1b4b',        // Midnight Indigo
          green: '#059669',       // Clean Emerald status
          lightgreen: '#d1fae5',  // Soft status green pill
          card: '#ffffff',
          subtext: '#64748b',     // Modern cool slate subtext
          border: '#e2e8f0',
          drop: '#f43f5e'         // Drop indicator rose red
        },
        // Brand palette alias
        loadpulse: {
          orange: '#4338ca',
          hover: '#3730a3',
          light: '#eef2ff',
          accent: '#6366f1',
          dark: '#0f172a',
          slate: '#1e293b',
          card: '#ffffff',
          subtext: '#64748b',
          border: '#e2e8f0',
          emerald: '#059669',
          blue: '#4338ca'
        }
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        scaleUp: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleUp: 'scaleUp 0.2s ease-out'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        heading: ['"Outfit"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
