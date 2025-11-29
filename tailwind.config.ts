import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                sportlink: {
                    "primary": "#16a34a",
                    "primary-focus": "#15803d",
                    "primary-content": "#ffffff",
                    "secondary": "#10b981",
                    "accent": "#34d399",
                    "neutral": "#1f2937",
                    "base-100": "#ffffff",
                    "base-200": "#f0fdf4",
                    "base-300": "#dcfce7",
                    "info": "#3b82f6",
                    "success": "#16a34a",
                    "warning": "#f59e0b",
                    "error": "#dc2626",
                },
            },
        ],
    },
};

export default config;
