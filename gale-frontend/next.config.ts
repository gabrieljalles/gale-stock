import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["utfs.io"],
    remotePatterns: [
      // site de imagem uploadthing
      {
        protocol: "https",
        hostname: "bfu8xmr6kg.ufs.sh",
        port: "",
        pathname: "/f/**",
      },
    ],
  },
};

export default nextConfig;
