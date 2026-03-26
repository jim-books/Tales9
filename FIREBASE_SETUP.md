# Firebase setup (one-time)

To use config and orders sync between the Table (web app) and the iOS app:

## 1. Web app (barcode.html)

- In [Firebase Console](https://console.firebase.google.com): Project settings → Your apps → Web app → copy the `firebaseConfig` object.
- Open `BARCODE Kiosk (Customer)/barcode.html` and replace the placeholder `firebaseConfig` (near the top of the body, after the Firebase script tags) with your config. It looks like:

  ```js
  const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  };
  ```

## 2. iOS app

- In Firebase Console: Add app → iOS. Use your app’s **Bundle ID** (from Xcode).
- Download **GoogleService-Info.plist** and add it to the SmartTableAI target in Xcode (drag into the SmartTableAI group and ensure “Copy items if needed” and the SmartTableAI target are checked).

## 3. Firestore

- In the Firebase project, enable **Firestore Database** (test mode is fine for demo).
- No code changes needed; the app uses `venues/demo/config/current` for config and `venues/demo/orders` for orders.

After that, run the web app and the iOS app; “Send to table” and “Orders from kiosk” will sync via Firebase.
