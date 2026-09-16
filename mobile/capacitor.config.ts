import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mw.vmcxtreme.memberportal',
  appName: 'VMC Xtreme',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    url: 'https://vmcxtreme.pages.dev',
    cleartext: false
  }
};

export default config;
