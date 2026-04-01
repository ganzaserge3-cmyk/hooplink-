# HoopLink Mobile App Setup

This project is prepared for a Capacitor wrapper so you can ship it to the App Store and Google Play.

## Recommended Architecture

Use the deployed HoopLink web app inside a Capacitor shell.

Why this is the best fit here:
- HoopLink is already a working Next.js app
- Firebase auth/database and Cloudinary uploads are already web-based
- you can ship mobile apps faster without rewriting everything in React Native

## Before You Start

1. Deploy the web app first
2. Make sure the production URL works well on mobile
3. Replace the placeholder URL in `capacitor.config.json`

Update:
- `server.url`

Example:
- `https://your-hooplink-domain.com`

## Install Capacitor

Run:

```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

Then initialize if needed:

```powershell
npx cap init HoopLink com.hooplink.app
```

If it asks, keep:
- App name: `HoopLink`
- App ID: `com.hooplink.app`

## Add Native Platforms

```powershell
npx cap add android
npx cap add ios
```

## Sync the Project

```powershell
npm run cap:sync
```

## Open Native Projects

Android:

```powershell
npm run cap:open:android
```

iOS:

```powershell
npm run cap:open:ios
```

## App Store Readiness Checklist

Before submitting, make sure you also have:

1. Real app icons and splash screens
2. Privacy policy URL
3. Terms of service URL
4. Production API/env vars
5. Mobile-tested auth flow
6. Deep-link/domain setup
7. Keyboard-safe screens
8. Stable upload and media playback on real devices

## Important Note

This config assumes a hosted app URL, not a fully bundled offline Next.js export.

That is intentional.

For this repo, the cleanest store path is:
- host HoopLink on Vercel
- point Capacitor at that live domain
- submit the iOS and Android wrappers
