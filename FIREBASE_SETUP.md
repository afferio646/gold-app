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
3. **Choose Location:** `nam5 (us-central)`.
   - **Why?** This is a multi-region location that covers the entire US with excellent reliability. Even if you have reps across the country (NY to CA), the speed difference is negligible for this type of app. It is the standard, safe choice.
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

---

## Database Strategy & Cost Management (FAQ)

**Q: Do I need a separate database for each new client?**
**A: NO.**
We will use a **Single Database / Multi-Tenant Architecture**.
- **How it works:** All data lives in one central database. Every report and user record will have a `clientId` tag (e.g., "Hospital-A", "School-District-B").
- **Why?** This is industry standard. It keeps your administration simple (one place to manage) and maximizes the value of the Free Tier.
- **Security:** The app code filters data so Client A only sees their own data.

**Q: Will this cost money?**
**A: Likely $0 for a long time.**
Firebase has a very generous "Spark Plan" (Free Tier):
- **Database Reads:** 50,000 per day (free). That's enough for hundreds of daily inspections.
- **Database Writes:** 20,000 per day (free).
- **Storage (Photos):** 5GB total (free).
  - *Strategy:* We will implement automatic image resizing in the app before upload. A 5MB photo becomes 100KB. This allows you to store ~50,000 photos for free.

**Recommendation:** Stick with the default Free Plan (Spark). You only need to upgrade (Blaze Plan) if you exceed these limits, which would mean your business is scaling significantly!
