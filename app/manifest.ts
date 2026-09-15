import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gym Log",
    short_name: "Gym Log",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0F0F",
    theme_color: "#FF6A00",
    icons: [
      {
        src: "/gym-log-splash.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/gym-log-splash.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
