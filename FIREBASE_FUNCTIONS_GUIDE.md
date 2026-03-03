# Deploying the Firebase Cloud Function for Push Notifications

Firebase actively blocks standard websites (like your Dashboard) from sending push notifications directly to users. This is a security measure to prevent hackers from stealing your website code and spamming your users.

To actually hit "Send" on the Dashboard and have the notifications arrive on phones, you need a **Secure Backend Server**. Since you are already using Firebase, the easiest way to do this is with a **Firebase Cloud Function**.

Follow these exact steps on your computer to deploy the server function.

---

### Step 1: Install Node.js
If you don't already have Node.js installed on your computer, you need it to run the Firebase deployment tools.
1. Go to [nodejs.org](https://nodejs.org/).
2. Download and install the **"LTS" (Long Term Support)** version for your operating system.

### Step 2: Install Firebase CLI
Open your computer's terminal (Command Prompt or PowerShell on Windows, Terminal on Mac) and run this command:

```bash
npm install -g firebase-tools
```

### Step 3: Login to Firebase
In the same terminal, run:
```bash
firebase login
```
This will open a browser window asking you to log into your Google/Firebase account. Allow access.

### Step 4: Initialize the Functions Folder
Create a new folder on your computer (e.g., `goldmorr-backend`) and open your terminal inside that folder. Then run:

```bash
firebase init functions
```

It will ask you a series of questions. Answer them exactly like this:
1. **Are you ready to proceed?** Yes (`y`)
2. **Please select an option:** Select `Use an existing project`, then select your project (`goldmorr-hub`).
3. **What language would you like to use?** Select `JavaScript`.
4. **Do you want to use ESLint to catch probable bugs?** No (`N`)
5. **Do you want to install dependencies with npm now?** Yes (`Y`)

### Step 5: Replace the Code
A new folder called `functions` was just created. Inside it, there is a file named `index.js`.
Open `functions/index.js` in a text editor (like Notepad or VS Code) and completely replace all the code in it with the code below:

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Ensure CORS allows the dashboard to call this function
const cors = require('cors')({ origin: true });

exports.sendPushNotification = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        // 1. Only allow POST requests
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        try {
            const { message, targetFilter } = req.body;

            if (!message || !message.title || !message.body) {
                return res.status(400).send('Missing message title or body');
            }

            // 2. Query Firestore for users who have a pushToken
            // Note: In a production app with thousands of users, you would use
            // messaging().sendMulticast() and chunk the tokens into arrays of 500.
            const db = admin.firestore();
            let usersQuery = db.collection('activations').where('pushToken', '!=', null);

            // Apply simplistic filtering based on the dashboard dropdown
            if (targetFilter === 'HighActivity') {
                 // Example: If you had a 'scanCount' field, you'd add `.where('scanCount', '>=', 5)`
                 // For now, we will just send to all, or you can implement logic here.
            }

            const snapshot = await usersQuery.get();
            const tokens = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.pushToken) {
                    tokens.push(data.pushToken);
                }
            });

            if (tokens.length === 0) {
                return res.status(200).send({ success: true, message: 'No valid push tokens found to send to.' });
            }

            // 3. Construct the FCM Payload
            const payload = {
                notification: {
                    title: message.title,
                    body: message.body,
                },
                data: {
                    url: message.link || '/'
                }
            };

            // 4. Send the notification via Firebase Admin SDK
            const response = await admin.messaging().sendToDevice(tokens, payload);

            console.log('Successfully sent message:', response);
            return res.status(200).send({
                success: true,
                sentCount: response.successCount,
                failureCount: response.failureCount
            });

        } catch (error) {
            console.error('Error sending push notification:', error);
            return res.status(500).send({ success: false, error: error.message });
        }
    });
});
```

*(Note: If you get a "cors" error, run `npm install cors` inside the `functions` folder).*

### Step 6: Deploy the Function
Go back to your terminal (make sure you are inside the `functions` folder or the parent folder) and run:

```bash
firebase deploy --only functions
```

Firebase will upload the code to Google's servers. When it finishes, it will print a **Function URL** in the terminal that looks something like this:
`https://us-central1-goldmorr-hub.cloudfunctions.net/sendPushNotification`

### Step 7: Update Your Dashboard
Take that URL and paste it into your `dashboard.html` file on line 408 where it says:
`const BACKEND_URL = 'https://us-central1-goldmorr-hub.cloudfunctions.net/sendPushNotification';`

Your Dashboard will now have full power to send Push Notifications securely!