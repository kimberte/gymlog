// @ts-check
const nextPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep whatever you previously had in next.config.ts
  reactStrictMode: true,
};

module.exports = nextPWA(nextConfig);