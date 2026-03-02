const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

/**
 * Triggered when a new document is added to the "notifications" collection.
 * Reads the push notification payload and sends it to all registered device tokens.
 */
exports.sendPushNotification = functions.firestore
    .document('notifications/{docId}')
    .onCreate(async (snap, context) => {
        const payload = snap.data();

        // Safety check: Only process pending notifications
        if (payload.status !== 'pending') return null;

        console.log("Preparing to send push notification:", payload.title);

        try {
            // 1. Fetch all FCM tokens from the 'fcm_tokens' collection
            const tokensSnapshot = await admin.firestore().collection('fcm_tokens').get();

            if (tokensSnapshot.empty) {
                console.log("No registered devices found. Aborting push.");
                await snap.ref.update({ status: 'failed', error: 'No subscribers' });
                return null;
            }

            // Extract just the token strings
            const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
            console.log(`Found ${tokens.length} device tokens.`);

            // 2. Construct the FCM Message
            const message = {
                notification: {
                    title: payload.title,
                    body: payload.body,
                    // Note: FCM 'image' works on some platforms, 'icon' works on others
                    // image: payload.attachmentUrl // If you upload images to storage
                },
                webpush: {
                    fcmOptions: {
                        link: payload.link || "https://gold-app-two.vercel.app/"
                    }
                },
                tokens: tokens // Send to all tokens at once (Multicast)
            };

            // 3. Send the Multicast Message
            const response = await admin.messaging().sendMulticast(message);
            console.log(response.successCount + ' messages were sent successfully');

            // Optional: Log failures to clean up dead tokens
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                console.log('List of tokens that caused failures: ' + failedTokens);
                // Advanced: You could delete these failedTokens from your database here.
            }

            // 4. Update the document status to 'sent'
            return snap.ref.update({
                status: 'sent',
                successCount: response.successCount,
                failureCount: response.failureCount,
                sentAt: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error("Error sending push notification:", error);
            // Mark document as failed
            return snap.ref.update({
                status: 'failed',
                error: error.message
            });
        }
    });
