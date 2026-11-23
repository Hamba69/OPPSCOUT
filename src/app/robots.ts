import type { MetadataRoute } from "next";

import { publicSiteUrl } from "@/config/app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/v1/admin"] },
    sitemap: `${publicSiteUrl()}/sitemap.xml`,
  };
}
