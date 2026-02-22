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
                primary: "#FF5F1F",
                "background-light": "#FFFFFF",
                "ios-bg": "#FBFBFB",
                "ios-gray": "#F5F5F7",
                "ios-gray-2": "#F2F2F7",
                "ios-black": "#1D1D1F",
                "soft-gray": "#86868B",
            },
            fontFamily: {
                display: ["Manrope", "sans-serif"],
                sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
            },
            fontWeight: {
                500: "500",
                600: "600",
                700: "700",
                800: "800",
            },
            borderRadius: {
                DEFAULT: "1rem",
                lg: "1.5rem",
                xl: "24px",
                "2xl": "32px",
            },
            boxShadow: {
                premium: "0 20px 60px -15px rgba(0, 0, 0, 0.05)",
                card: "0 2px 10px rgba(0, 0, 0, 0.04)",
                "card-hover": "0 8px 24px rgba(0, 0, 0, 0.06)",
                "glow-orange": "0 0 15px rgba(255, 95, 31, 0.4)",
            },
        },
    },
    plugins: [],
};

export default config;
