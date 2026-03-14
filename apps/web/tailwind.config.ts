import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    blue: '#00f5ff',
                    purple: '#bf00ff',
                    pink: '#ff00aa',
                    green: '#00ff88',
                    orange: '#ff6b00',
                },
                dark: {
                    bg: '#0a0a0f',
                    card: 'rgba(15, 15, 25, 0.9)',
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px theme(colors.neon.blue), 0 0 10px theme(colors.neon.blue)' },
                    '100%': { boxShadow: '0 0 10px theme(colors.neon.purple), 0 0 20px theme(colors.neon.purple)' },
                }
            },
            dropShadow: {
                'neon': '0 0 10px rgba(191, 0, 255, 0.5)',
                'neon-blue': '0 0 10px rgba(0, 245, 255, 0.5)',
            }
        },
    },
    plugins: [],
};
export default config;
