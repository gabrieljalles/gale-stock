import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["utfs.io"],
    remotePatterns: [
      // Uploadthing serve cada app num subdomínio próprio de ufs.sh, e o
      // curinga evita que uma troca de app/chave quebre todas as imagens
      // (o next/image recusa host não listado e a foto simplesmente some).
      {
        protocol: "https",
        hostname: "**.ufs.sh",
        port: "",
        pathname: "/f/**",
      },
    ],
  },
};

export default nextConfig;
