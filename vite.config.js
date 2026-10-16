import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site from /<repo-name>/. The deploy workflow sets GITHUB_PAGES=true.
// If you rename the repository, change the name below.
const REPO = 'komo-portfolio'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? `/${REPO}/` : '/',
  plugins: [react()],
})
