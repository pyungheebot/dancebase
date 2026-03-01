import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/groups/"],
      disallow: ["/api/", "/dashboard/", "/profile/", "/messages/", "/settings/", "/stats/"],
    },
    sitemap: "https://dancebase.app/sitemap.xml",
  };
}
