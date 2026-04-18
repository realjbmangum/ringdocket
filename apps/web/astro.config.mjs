import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://ringdocket.com',
  integrations: [
    tailwind({
      applyBaseStyles: false, // we handle base in global.css
    }),
    react(),
  ],
  server: {
    port: 4321,
    host: true,
  },
});
