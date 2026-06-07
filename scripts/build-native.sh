#!/bin/bash
# MTA Underground — Native Build Script
# Prerequisites:
#   - npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
#   - For iOS: Xcode + CocoaPods
#   - For Android: Android Studio + SDK
#
# Usage:
#   ./scripts/build-native.sh android   # Build for Android
#   ./scripts/build-native.sh ios       # Build for iOS
#   ./scripts/build-native.sh both      # Build for both

set -e

PLATFORM=${1:-both}

echo "=== MTA Underground Native Build ==="
echo "Platform: $PLATFORM"
echo ""

# Step 1: Production web build
echo "Step 1: Building web assets..."
npm run build
echo "Web build complete."
echo ""

# Step 2: Sync web assets to native projects
echo "Step 2: Syncing to native projects..."
npx cap sync
echo "Sync complete."
echo ""

# Step 3: Build native
if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
  echo "Step 3a: Opening Android project..."
  echo "Run 'npx cap open android' to open in Android Studio"
  echo "Then Build > Generate Signed Bundle/APK"
  echo ""
fi

if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
  echo "Step 3b: Opening iOS project..."
  echo "Run 'npx cap open ios' to open in Xcode"
  echo "Then Product > Archive for App Store submission"
  echo ""
fi

echo "=== Build steps complete ==="
echo ""
echo "To test locally:"
echo "  Android: npx cap run android"
echo "  iOS:     npx cap run ios"
echo ""
echo "To submit to stores:"
echo "  1. Get Apple Developer account ($99/yr)"
echo "  2. Get Google Play Developer account ($25 one-time)"
echo "  3. Follow platform-specific submission guides"
