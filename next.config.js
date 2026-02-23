/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    serverExternalPackages: ['apify-client'],
}

module.exports = nextConfig
