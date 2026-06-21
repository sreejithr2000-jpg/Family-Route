import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev server for Family Routes.
export default defineConfig({
  // Relative base so the build works under a GitHub Pages sub-path
  // (e.g. https://<user>.github.io/<repo>/), or any host.
  base: "./",
  plugins: [react()],
  server: {
    // Deliberately uncommon port to avoid stale service workers / other apps
    // that may have claimed the default Vite port (5173) on this machine.
    port: 5280,
    strictPort: true,
    open: true,
    // Expose on the local network so phones on the same Wi-Fi can open it.
    host: true,
  },
});
