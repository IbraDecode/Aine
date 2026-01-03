/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'aine-bg': '#F7FDFF',
                'aine-bg-dark': '#0F172A',
                'aine-surface': 'rgba(255,255,255,.72)',
                'aine-surface-dark': 'rgba(30,41,59,.85)',
                'aine-stroke': 'rgba(255,255,255,.55)',
                'aine-stroke-dark': 'rgba(71,85,105,.55)',
                'aine-text': '#0F172A',
                'aine-text-dark': '#F1F5F9',
                'aine-muted': '#64748B',
                'aine-primary': '#69AAE6',
                'aine-secondary': '#BEE7E9',
                'aine-highlight': '#94CAE1',
                'aine-deep': '#1664B9',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Fredoka', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            boxShadow: {
                'aine': '0 18px 60px rgba(15,23,42,.08)',
                'aine-sm': '0 12px 28px rgba(15,23,42,.07)',
                'aine-blue': '0 16px 40px rgba(105,170,230,.28)',
            },
            borderRadius: {
                'aine': '24px',
            }
        },
    },
    plugins: [],
}
