/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => {
    return [
      {
        source: "/loop",
        destination: "/",
        permanent: true,
      },
    ];
  },
  headers: () => [
    {
      source: "/.well-known/apple-app-site-association",
      headers: [
        {
          key: "Content-Type",
          value: "application/json",
        },
      ],
    },
  ],
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    return config;
  },
};

export default nextConfig;
