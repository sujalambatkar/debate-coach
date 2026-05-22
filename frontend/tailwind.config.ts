import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        card: "#111111",
        border: "#222222",
        accent: {
          DEFAULT: "#7c3aed",
          hover: "#6d28d9",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        float1: "float1 14s ease-in-out infinite",
        float2: "float2 18s ease-in-out infinite",
        float3: "float3 22s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float1: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-40px) rotate(180deg)" },
        },
        float2: {
          "0%, 100%": { transform: "translateX(0px) rotate(0deg)" },
          "50%": { transform: "translateX(30px) rotate(-120deg)" },
        },
        float3: {
          "0%, 100%": { transform: "translate(0px, 0px) rotate(0deg)" },
          "33%": { transform: "translate(20px, -30px) rotate(120deg)" },
          "66%": { transform: "translate(-10px, -15px) rotate(240deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
