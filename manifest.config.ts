import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "Stash - Tab & Bookmark Manager",
  description:
    "Drowning in tabs? Find any saved tab in seconds and create folders in one click. A Chrome side panel tab and bookmark manager.",
  version: pkg.version,
  action: {
    default_title: "Open Tab Manager",
    default_icon: {
      "16": "src/assets/tab-manager-icon.png",
      "48": "src/assets/tab-manager-icon.png",
      "128": "src/assets/tab-manager-icon.png",
    },
  },
  icons: {
    "16": "src/assets/tab-manager-icon.png",
    "48": "src/assets/tab-manager-icon.png",
    "128": "src/assets/tab-manager-icon.png",
  },
  side_panel: { default_path: "src/sidepanel/index.html" },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  permissions: ["sidePanel", "tabs", "storage", "favicon", "alarms"],
});
