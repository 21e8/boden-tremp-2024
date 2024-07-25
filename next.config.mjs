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
  rewrites: () => [
    {
      source: "!.well-known/**",
      destination: "index.html",
    },
    {
      source: ".well-known/apple-app-site-association",
      destination: ".well-known/apple-app-site-association.json",
    },
  ],
  headers: () => [
    {
      source: ".well-known/apple-app-site-association",
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
