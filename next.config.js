/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/pinata/:path*',
                destination: 'https://turquoise-voluntary-cricket-828.mypinata.cloud/ipfs/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
