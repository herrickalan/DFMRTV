# DFM RTV International mobile app

A production-shaped iPhone and Android app for DFM RTV International, built with Expo and React Native. One TypeScript codebase ships native iOS and Android binaries while preserving platform audio behavior.

## Included

- Live radio player with iOS/Android background-audio configuration
- Persistent mini-player available across the app
- Weekly schedule and current/next program views
- Mobile story feed and article view
- Website, Facebook, Discord, and Second Life destinations
- Native accessibility labels, safe areas, dark-mode visual system, splash, and adaptive icon
- EAS profiles for development, internal previews, and store builds

The first-run program and story content is deliberately marked as seed content. All station-owned endpoints live in one configuration layer and can be changed without modifying screen code.

## Run it

Requires Node 20+ and the Expo Go app, an Android emulator, or Xcode on macOS.

```bash
npm install
cp .env.example .env
npm start
```

Scan the QR code with Expo Go, press `a` for Android, or press `i` for iOS on macOS.

## Connect DFM's live services

Edit `.env`:

```dotenv
EXPO_PUBLIC_DFM_STREAM_URL=http://dfm.nu/DFM_RTV_INT_1.m3u
EXPO_PUBLIC_DFM_WEBSITE_URL=https://dfm.nu
EXPO_PUBLIC_DFM_FACEBOOK_URL=https://www.facebook.com/dfm.rtv/
EXPO_PUBLIC_DFM_DISCORD_URL=https://discord.com/invite/FRsN2pH
EXPO_PUBLIC_DFM_SECONDLIFE_URL=https://dfm.nu/secondlife/
```

The app downloads DFM's `.m3u` playlist and resolves the first playable stream entry automatically. Native transport exceptions are limited to media and the `dfm.nu` domain because the supplied playlist uses HTTP. Restart Expo after editing `.env`.

For live news and schedules, implement a CMS/RSS adapter behind `src/services/content.ts`; UI components are intentionally independent of the backend source.

## Verify and build

```bash
npm run typecheck
npm test
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

Store submission requires DFM's final bundle ownership, signing accounts, privacy-policy URL, approved app name/icon, and production content endpoints.
