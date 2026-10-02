import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E293B",
        navy: "#3F4D62",
        muted: "#3F4D62",
        amber: "#C9A227",
        sun: "#E8B84A",
        honey: "#D4A83A",
        butter: "#FBF6E6",
        cream: "#F7F5F0",
        leaf: "#1F7E6E",
        coral: "#E89B8C",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(30, 41, 59, 0.08)",
      },
      borderRadius: {
        blob: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
