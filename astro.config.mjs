import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: 'server', // Enable SSR for API routes
    adapter: node({
        mode: 'standalone'
    }),
    integrations: [db()],

    // Optional: Configure dev server
    server: {
        port: 4321,
        host: true
    },
});
