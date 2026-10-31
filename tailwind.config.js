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
          blue: '#0a57ff',        // Iconic Porter Blue
          hover: '#0047e0',       // Darker blue hover
          light: '#f0f4ff',       // Light blue accent
          accent: '#2962ff',      // Bright blue
          dark: '#1e2432',        // Top bar slate
          navy: '#001366',        // Deep corporate navy
          green: '#0d8154',       // Emerald status green
          lightgreen: '#d4f7e2',  // Soft status green pill
          card: '#ffffff',
          subtext: '#707582',     // Porter grey subtext
          border: '#e5e7eb',
          drop: '#e03748'         // Drop indicator red
        },
        // Alias for components using loadpulse classes
        loadpulse: {
          orange: '#0a57ff',
          hover: '#0047e0',
          light: '#f0f4ff',
          accent: '#2962ff',
          dark: '#1e2432',
          slate: '#2d2f34',
          card: '#ffffff',
          subtext: '#707582',
          border: '#e5e7eb',
          emerald: '#0d8154',
          blue: '#0a57ff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
