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
                // Apple-style dark mode palette
                background: {
                    DEFAULT: '#000000',
                    secondary: '#0a0a0a',
                    card: '#1c1c1e',
                },
                text: {
                    primary: '#ffffff',
                    secondary: '#a8a8a8',
                    tertiary: '#6e6e73',
                },
                accent: {
                    cyan: '#00d4ff',
                    blue: '#0071e3',
                },
                border: {
                    DEFAULT: '#2c2c2e',
                    light: '#3a3a3c',
                },
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
            },
            boxShadow: {
                'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
            },
        },
    },
    plugins: [],
};

export default config;
