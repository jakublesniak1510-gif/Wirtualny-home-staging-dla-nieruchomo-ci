import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components wyłączone świadomie: większość tras aplikacji (admin,
  // status zamówienia, API) czyta bazę/cookies przy każdym żądaniu, więc
  // klasyczny model renderowania (statyczne strony treściowe + dynamiczne
  // trasy z `export const dynamic = "force-dynamic"`) jest tu prostszy.
  cacheComponents: false,
  // sharp i Prisma działają po stronie serwera – nie pakujemy ich do bundla.
  serverExternalPackages: ["sharp", "@prisma/client", ".prisma/client"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
