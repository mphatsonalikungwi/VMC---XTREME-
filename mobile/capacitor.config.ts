import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mw.vmcxtreme.memberportal',
  appName: 'VMC Xtreme',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    url: 'https://vmcxtreme.pages.dev',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      launchFadeOutDuration: 250,
      backgroundColor: '#05070a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;
