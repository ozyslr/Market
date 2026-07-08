import os
m = r"O:\AI\E-tic 2026\mobile"

files = {
    "App.tsx": """import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { requestPermission } from './src/services/notifications';

export default function App() {
  React.useEffect(() => { requestPermission(); }, []);
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#18181b" />
      <AppNavigator />
    </>
  );
}
""",

    ".gitignore": """node_modules/
.expo/
dist/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
.env
ios/Pods/
android/.gradle/
android/app/build/
android/build/
""",

    "README.md": """# Benim Olan Mobile

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
"""
}

for filename, content in files.items():
    filepath = os.path.join(m, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Written: {filename}")
