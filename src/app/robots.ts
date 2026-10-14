import type { MetadataRoute } from "next";
import { ROUTES, absoluteUrl, getSiteUrl } from "@/lib/site";

/** Prefiks stron statusu zamówień (/zamowienie/[token]) – prywatne linki klientów. */
const ORDER_STATUS_PREFIX = ROUTES.orderStatus("").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [ROUTES.admin, "/api/", `${ORDER_STATUS_PREFIX}/`],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
