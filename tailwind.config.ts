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
                    navy: "#10174A",
                    blue: "#3B52F5",
                    "blue-hover": "#5168FF",
                },
                brand: {
                    50: "#eff1fe",
                    100: "#e0e4fd",
                    200: "#c7ccfb",
                    300: "#a5acf8",
                    400: "#8186f3",
                    500: "#5e6df6",
                    600: "#3b52f5",
                    700: "#3248da",
                    800: "#283ab2",
                    900: "#222f8d",
                    950: "#10174a",
                },
            },
            fontFamily: {
                sans: ['"neulis-sans"', "Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        themes: [
            {
                sprinta: {
                    "primary": "#3B52F5",
                    "primary-focus": "#5168FF",
                    "primary-content": "#FFFFFF",
                    "secondary": "#B2BAFF",
                    "secondary-content": "#10174A",
                    "accent": "#3B52F5",
                    "neutral": "#10174A",
                    "base-100": "#10174A",
                    "base-200": "#141B4D",
                    "base-300": "#1A2360",
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
