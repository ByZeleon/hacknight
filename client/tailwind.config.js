/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neonCyan: "#00f3ff",
                neonFuchsia: "#ff00ff",
                neonYellow: "#ffff00",
                darkBg: "#0f172a",
            },
            boxShadow: {
                'neon-cyan': '0 0 10px #00f3ff, 0 0 20px #00f3ff',
                'neon-fuchsia': '0 0 10px #ff00ff, 0 0 20px #ff00ff',
            }
        },
    },
    plugins: [],
}
