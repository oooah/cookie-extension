import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  imports: false,
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'cookie-extension',
    description:
      'Fixes Chrome 140+ cookie forwarding issues by syncing cookies into declarative request rules for development environments.',
    icons: {
      16: 'icons/icon64.png',
      32: 'icons/icon64.png',
      48: 'icons/icon64.png',
      128: 'icons/icon64.png',
    },
    action: {
      default_title: 'cookie-extension',
    },
    permissions: [
      'storage',
      'cookies',
      'tabs',
      'declarativeNetRequestWithHostAccess',
    ],
    host_permissions: ['*://*/'],
  },
});
