import type { NextConfig } from "next";

let withPWA = (config: NextConfig) => config;

try {
  const mod = require("next-pwa");
  const factory = mod?.default ?? mod;

  if (typeof factory === "function") {
    withPWA = factory({
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === "development",
    });
  } else {
    console.warn("next-pwa is not a function — PWA disabled.");
  }
} catch (err) {
  console.warn("next-pwa failed to load — PWA disabled.");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_APP_VERSION: "2.2" + (process.env.VERCEL_GIT_COMMIT_SHA ? " (" + process.env.VERCEL_GIT_COMMIT_SHA.slice(0,7) + ")" : " (local)") },
};

export default withPWA(nextConfig);