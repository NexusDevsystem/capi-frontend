/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            boxShadow: {
                'brutal': '4px 4px 0px 0px #ea580c', // Orange-600 (primary)
                'brutal-sm': '2px 2px 0px 0px #ea580c',
                'brutal-lg': '8px 8px 0px 0px #ea580c',
            },
            colors: {
                "primary": "#ea580c",     /* Orange-600 */
                "primary-dark": "#c2410c", /* Orange-700 */
                "accent-green": "#10b981", /* Emerald-500 */
                "background-light": "#FAFAF9", /* Stone-50 */
                "background-dark": "#0C0A09", /* Stone-950 */
                "card-dark": "#1c1917",       /* Stone-900 */
                "text-main": "#292524",    /* Stone-800 */
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"],
                "body": ["Noto Sans", "sans-serif"]
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                zoomIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-15px)' },
                },
                scroll: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                textShimmer: {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' }
                },
                drift: {
                    '0%': { transform: 'translate(0, 0)' },
                    '100%': { transform: 'translate(-50px, -20px)' },
                },
                pulseSlow: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.7' },
                },
                wave: {
                    '0%, 100%': { height: '20%' },
                    '50%': { height: '100%' },
                },
                beam: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'zoom-in': 'zoomIn 0.3s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'scroll': 'scroll 40s linear infinite',
                'text-shimmer': 'textShimmer 3s ease-in-out infinite',
                'shimmer': 'shimmer 8s linear infinite',
                'drift': 'drift 20s alternate infinite linear',
                'pulse-slow': 'pulseSlow 8s infinite',
                'wave': 'wave 1s ease-in-out infinite',
                'beam': 'beam 3s linear infinite',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
