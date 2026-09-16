import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/products/**",
          },
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/categories/**",
          },
        ]
      : [],
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "dzien", value: "(?<d>.*)" }],
        destination: "/sklep?dzien=:d",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
