import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E293B",
        navy: "#3F4D62",
        muted: "#3F4D62",
        amber: "#FFD700",
        sun: "#FFD15B",
        honey: "#F6CA57",
        butter: "#FFF9C4",
        cream: "#F9F9F6",
        leaf: "#1F7E6E",
        coral: "#F28C7A"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(30, 41, 59, 0.08)"
      },
      borderRadius: {
        blob: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
