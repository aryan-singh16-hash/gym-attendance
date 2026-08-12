/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#15181C",
        surface: "#1E2227",
        surface2: "#262B31",
        chalk: "#F5F7F5",
        muted: "#8A9099",
        volt: "#C6FF3D",
        coral: "#FF4757",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
