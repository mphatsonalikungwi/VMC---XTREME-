# VMC Xtreme Mobile App

This directory is isolated from the production website and contains the Capacitor mobile application foundation.

## Configuration

- App name: VMC Xtreme
- Android application ID: `mw.vmcxtreme.memberportal`
- Web source: `https://vmcxtreme.pages.dev`
- Native platform: Android

## Local build prerequisites

- Node.js 20+
- Java JDK supported by the selected Capacitor version
- Android Studio and Android SDK
- Android SDK platform/build tools

## Build commands

```bash
cd mobile
npm install
npx cap add android
npx cap sync android
npx cap open android
```

For a debug APK after the Android project has been generated:

```bash
cd android
./gradlew assembleDebug
```

The APK is generated under:

```text
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Safety boundary

The production website is not modified by this mobile foundation. The Android project must be generated and built in a CI runner or Android-capable development environment before an APK can be declared release-ready.
