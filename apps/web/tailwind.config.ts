import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        graphite: "#1f2933",
        signal: "#007C89",
        copper: "#B45309",
        field: "#64748B"
      }
    }
  },
  plugins: []
};

export default config;
