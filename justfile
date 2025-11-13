# Start Expo development server
dev:
    npm start

# Run on Android (debug)
android:
    npx expo run:android

# Run on Android (release/production build)
android-release:
    npx expo run:android --variant release

# Run on iOS (debug)
ios:
    npx expo run:ios

# Build Android APK (release)
build-apk:
    npx expo build:android -t apk --release-channel production

# Build Android App Bundle (for Play Store)
build-aab:
    npx expo build:android -t app-bundle --release-channel production

# Install dependencies
install:
    npm install
