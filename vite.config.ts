// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Self-hosting: when NITRO_PRESET is set (e.g. in the Docker build) force-enable
  // the nitro deploy plugin with that preset (we use `node-server` → dist/server/index.mjs).
  // When unset, this stays undefined so Lovable's own cloud build keeps its cloudflare default.
  nitro: process.env.NITRO_PRESET ? { preset: process.env.NITRO_PRESET } : undefined,
});
