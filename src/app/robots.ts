import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/groups/", "/profile/", "/messages/", "/settings/"],
    },
    sitemap: "https://dancebase.app/sitemap.xml",
  };
}
