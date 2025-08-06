import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
    mode: 'dev',
    base: './',
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        }
    },
    server: {
        // https: true,
        host: true,
        port: 8000,
    },
    preview: {
        // https: true,
        host: true,
        port: 8000,
    } ,
})