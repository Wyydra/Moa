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

# Rebuild Android App Bundle from scratch (clean + build)
rebuild-aab:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "🗑️  Cleaning build outputs and caches..."
    cd android
    # Remove output directories first
    rm -rf app/build/outputs/bundle/
    rm -rf app/build/outputs/apk/
    # Remove CMake/native build cache (fixes autolinking errors)
    rm -rf app/.cxx/
    rm -rf app/build/generated/
    # Clean Gradle build (skip native build clean to avoid CMake errors)
    ./gradlew clean -x externalNativeBuildCleanDebug -x externalNativeBuildCleanRelease
    echo "📦 Building release AAB..."
    ./gradlew bundleRelease
    echo "✅ AAB built: android/app/build/outputs/bundle/release/app-release.aab"

# Install dependencies
install:
    npm install
