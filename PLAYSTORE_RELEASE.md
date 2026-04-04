# Google Play Upload Guide (Capacitor + Next.js)

This project is configured as a hosted web app inside a Capacitor Android shell.

## 1. Prerequisites (Windows)

Install:

1. Node.js `>= 22` (Capacitor 8 requirement)
2. Java JDK `21` (or compatible JDK on your system)
3. Android Studio (SDK + build tools)

Quick checks:

```powershell
node -v
java -version
```

## 2. Set your production app URL

Edit `capacitor.config.json`:

```json
"server": {
  "url": "https://YOUR-LIVE-DOMAIN",
  "cleartext": false
}
```

Use your real HTTPS domain (not localhost).

## 3. Create the Android upload keystore

Run:

```powershell
cd android
keytool -genkeypair -v -storetype JKS -keystore app/release-key.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Then create your signing config file:

```powershell
Copy-Item keystore.properties.example keystore.properties
```

Edit `android/keystore.properties` and set real values:

```properties
storeFile=app/release-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=upload
keyPassword=YOUR_KEY_PASSWORD
```

## 4. Build release AAB for Play Store

From project root:

```powershell
npm run android:bundle:release
```

Output file:

`android/app/build/outputs/bundle/release/app-release.aab`

## 5. Upload to Google Play Console

1. Go to Play Console and create/select your app.
2. Open `Production` track.
3. Create a new release.
4. Upload `app-release.aab`.
5. Complete store listing + privacy policy + app content forms.
6. Submit for review.

## 6. Next release version bump

Before each new upload, update `android/app/build.gradle`:

1. Increase `versionCode` (must always go up)
2. Update `versionName` (for users, e.g. `1.0.1`)

