/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/about-legacy',
        destination: '/feed',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
