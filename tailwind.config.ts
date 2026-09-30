import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#27251f",
        navy: "#1e293b",
        honey: "#f6ca57",
        amber: "#f6c945",
        sun: "#f6c945",
        butter: "#fff7cf",
        cream: "#fffdf5",
        leaf: "#46784b",
        coral: "#ef745c"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(65, 52, 12, 0.10)"
      },
      borderRadius: {
        blob: "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
