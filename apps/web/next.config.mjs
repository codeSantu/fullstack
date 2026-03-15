import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@ddd/shared"],
    allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],

    // Fixes the relative path math for root-level builds
    outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;