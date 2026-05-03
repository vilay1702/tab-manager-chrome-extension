import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'Tab Manager',
  description: 'Organize tabs into folders, with favorites at the top.',
  version: pkg.version,
  action: { default_title: 'Open Tab Manager' },
  side_panel: { default_path: 'src/sidepanel/index.html' },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['sidePanel', 'tabs', 'storage', 'favicon'],
});
