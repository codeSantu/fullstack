if (!process.env.DOPPLER_CRASH_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('DOPPLER_CRASH_SECRET is missing! Frontend build crash test triggered.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@ddd/shared"],
};
export default nextConfig;
