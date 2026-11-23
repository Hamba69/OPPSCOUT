import type { MetadataRoute } from "next";

import { publicSiteUrl } from "@/config/app";

/** Public, indexable pages only. Signed-in areas (feed, saved, profile, listings) sit behind login. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicSiteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
