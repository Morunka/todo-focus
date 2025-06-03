// Import the Firebase Admin SDK
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK (important!)
// Ensure this is done only once. If you have other functions, it might be at the top level.
admin.initializeApp();

// Callable Cloud Function to delete a user account
// Make sure this name exactly matches what you call from the frontend: 'deleteCorporateAccount'
exports.deleteCorporateAccount = functions.https.onCall(async (data, context) => {
    // 1. Check if the user is authenticated (security!)
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Authentication required to delete an account.'
        );
    }

    const uidToDelete = context.auth.uid; // Get the UID of the user making the request

    if (!uidToDelete) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'No user ID provided for deletion.'
        );
    }

    try {
        // Optional: Check if the user trying to delete is also the corporate owner
        // This is where your logic for the "corporate deletion key" would come into play.
        // For now, let's assume the calling user is the one to be deleted.
        // If you store the corporate key in Firestore with the user, you'd fetch it here and verify.

        // Example: Verify corporate key if stored in Firestore for the current user
        // const userDocRef = admin.firestore().collection('users').doc(uidToDelete);
        // const userDoc = await userDocRef.get();
        // if (!userDoc.exists || userDoc.data().corporateDeletionKey !== data.corporateKey) {
        //     throw new functions.https.HttpsError(
        //         'permission-denied',
        //         'Invalid corporate deletion key.'
        //     );
        // }

        // Proceed with deleting the Firebase Authentication user
        await admin.auth().deleteUser(uidToDelete);
        console.log(`Successfully deleted user: ${uidToDelete}`);

        // Optional: Delete user's data from Firestore or Realtime Database
        // await admin.firestore().collection('users').doc(uidToDelete).delete();
        // console.log(`Successfully deleted user document for: ${uidToDelete}`);

        return { success: true, message: 'Account deleted successfully.' };

    } catch (error) {
        console.error('Error deleting user:', error);

        // Re-throw Firebase specific errors or general error as HttpsError
        if (error.code && error.message) {
            throw new functions.https.HttpsError(
                'internal', // Or a more specific code if Firebase provides one, like 'auth/user-not-found'
                `Failed to delete account: ${error.message}`
            );
        } else {
            throw new functions.https.HttpsError(
                'internal',
                'An unknown error occurred during account deletion.'
            );
        }
    }
});