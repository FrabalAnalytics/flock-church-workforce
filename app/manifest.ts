import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flock Church Workforce",
    short_name: "Flock",
    description: "Secure church workforce attendance, ministry reporting and pastoral-care coordination.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fc",
    theme_color: "#101c3d",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
