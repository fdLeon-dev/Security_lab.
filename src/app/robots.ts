import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/portfolio"],
        disallow: [
          "/dashboard",
          "/knowledge",
          "/learning",
          "/labs",
          "/writeups",
          "/certifications",
          "/projects",
          "/toolkit",
          "/siem",
          "/inventory",
          "/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
