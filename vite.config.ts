import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          '@babel/plugin-syntax-import-attributes',
        ],
      },
    }),
    {
      name: 'generate-sitemap',
      buildStart() {
        console.log('Generating sitemap...');
        try {
          execSync('npm run generate-sitemap');
          console.log('Sitemap generated successfully.');
        } catch (error) {
          console.error('Failed to generate sitemap:', error);
        }
      },
    },
  ],
  base: "/",
  build: {
    sourcemap: false,
  },
});
