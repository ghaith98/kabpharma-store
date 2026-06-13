import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kabpharma.delivery",
  appName: "Kab Delivery",
  webDir: "public",
  server: {
    url: "https://kabpharma-store.vercel.app/driver/login",
    cleartext: false,
  },
};

export default config;