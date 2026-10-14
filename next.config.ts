import type { NextConfig } from "next";

/**
 * Nagłówki bezpieczeństwa dla wszystkich odpowiedzi. HSTS tylko, gdy serwis działa
 * pod https (NEXT_PUBLIC_SITE_URL) – lokalnie po http nie blokujemy przeglądarki.
 * Uwaga: next.config czytany jest przy buildzie – zmiana adresu wymaga ponownego builda.
 */
function securityHeaders(): Array<{ key: string; value: string }> {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim().startsWith("https://")) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  }
  return headers;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
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
