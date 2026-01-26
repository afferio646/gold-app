# How to Set Up Firebase for Goldmorr

To complete the app deployment and enable real-time data syncing between the utilities and the dashboard, you need to set up a Firebase project.

## 1. Create a Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Name it `goldmorr-hub` (or similar).
4. Disable Google Analytics (simpler for now) and click **"Create project"**.

## 2. Enable Firestore Database
1. In the left sidebar, click **Build** -> **Firestore Database**.
2. Click **"Create database"**.
3. Choose a location (e.g., `nam5 (us-central)`).
4. **Important**: Start in **Test Mode** (allows read/write for development).
5. Click **Enable**.

## 3. Enable Authentication (Optional but Recommended)
1. Click **Build** -> **Authentication**.
2. Click **"Get started"**.
3. Enable **Email/Password**.

## 4. Get Your API Keys
1. Click the **Project Settings** (gear icon) in the top left.
2. Scroll down to **"Your apps"**.
3. Click the **</> (Web)** icon.
4. Nickname the app `goldmorr-web`.
5. **Copy the `firebaseConfig` object**. It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

## 5. Send the Config to Developer
Send that `firebaseConfig` code block to me. I will then update `assets/api.js` to use these real keys instead of the mock local storage.
