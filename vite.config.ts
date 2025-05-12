// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/wire_wiz/',  // <-- THIS MUST MATCH YOUR REPO NAME
  plugins: [react()]
})
