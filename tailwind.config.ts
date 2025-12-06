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
                sprinta: {
                    white: "#FFFFFF",
                    navy: "#0A0F32",
                    blue: "#2341F0",
                    "blue-hover": "#3B52F5",
                },
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                sprinta: {
                    "primary": "#2341F0",
                    "primary-focus": "#3B52F5",
                    "primary-content": "#FFFFFF",
                    "secondary": "#A7B0FF",
                    "accent": "#2341F0",
                    "neutral": "#0A0F32",
                    "base-100": "#0A0F32",
                    "base-200": "#11152F",
                    "base-300": "#141A3A",
                    "info": "#3b82f6",
                    "success": "#10b981",
                    "warning": "#f59e0b",
                    "error": "#dc2626",
                },
            },
        ],
    },
};

export default config;
