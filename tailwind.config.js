// tailwind.config.js
// Tells Tailwind which files to scan for class names.
// Any class you use in these files gets included in the final CSS.
// Any class you don't use is stripped out — keeping the bundle tiny.

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mirror the mobile app's primary blue so the brand feels consistent
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
    },
  },
  plugins: [],
}