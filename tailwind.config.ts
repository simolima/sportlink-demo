import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        primary: {
          50: "#fff5f5",
          100: "#ffecec",
          500: "#ff6b6b",
        },
        accent: {
          500: "#ff9f43",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  // daisyUI theme configuration
  // note: TypeScript may not include daisyui typings; this is a plain JS config key.
  // DaisyUI will read this at runtime.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  daisyui: {
    themes: [
      {
        sportlink: {
          primary: "#FF6B6B",
          "primary-focus": "#e05555",
          secondary: "#6B7280",
          accent: "#FF9F43",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          info: "#60a5fa",
          success: "#10B981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
  },
};
export default config;
