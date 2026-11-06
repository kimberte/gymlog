import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gym Log",
    short_name: "Gym Log",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FF6A00",
    icons: [
      { src: "/gym-log-icon.svg?v=3", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/gym-log-splash.svg?v=3", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
