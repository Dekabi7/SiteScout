/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional Theme Colors
        primary: {
          DEFAULT: '#3B82F6', // Primary Blue (Calls to Action)
          hover: '#2563EB', // Hover Blue (Button Hover State)
        },
        background: {
          DEFAULT: '#F8FAFC', // Main Page Background
          card: '#FFFFFF', // Card/Panel Background
          panel: '#F1F5F9', // Alternative Card Background
        },
        text: {
          primary: '#1E293B', // Primary Text (Headlines and Labels)
          secondary: '#64748B', // Secondary Text (Hints, Descriptions)
        },
        accent: {
          hint: '#0EA5E9', // Hint/Info Text (Optional Instructional Highlight)
          warning: {
            bg: '#FBBF24', // Warning Highlight Background
            text: '#92400E', // Warning Highlight Text
          },
          error: '#EF4444', // Error/Validation Text
          success: '#22C55E', // Success/Toast/Export Confirmation
        },
      },
    },
  },
  plugins: [],
} 