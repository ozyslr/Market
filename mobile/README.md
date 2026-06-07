# Benim Olan Mobile

React Native iOS/Android app for the Benim Olan marketplace.

## Setup

```bash
npm install
cd ios && pod install && cd ..
npx react-native run-ios    # iOS
npx react-native run-android # Android
```

## Architecture

- React Native 0.78 + TypeScript
- React Navigation (native stack + bottom tabs)
- Firebase Auth (email/password + Google) with encrypted token storage
- Zustand for client state (cart)
- Stripe React Native for payments
- Firebase Cloud Messaging for push notifications
- Shares API layer with web app (Express server)
