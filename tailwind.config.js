/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0D17",
          900: "#10131F",
          800: "#171B2B",
          700: "#1C2236",
          600: "#262D45",
        },
        brass: {
          400: "#E0C15C",
          500: "#C9A227",
          600: "#A9841D",
        },
        parchment: "#EDE6D8",
        umbral: {
          green: "#4F9D69",
          rose: "#B4453A",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        eclipse:
          "radial-gradient(circle at 50% 35%, rgba(201,162,39,0.16), rgba(11,13,23,0) 60%)",
      },
    },
  },
  plugins: [],
};
