/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/pinata/:path*',
                destination: 'https://turquoise-voluntary-cricket-828.mypinata.cloud/ipfs/:path*',
            },
            {
                source: '/api/ai-image/:path*',
                destination: 'https://storage.googleapis.com/galadriel-assets/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
