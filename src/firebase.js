// firebase.js
// Place this as early as possible, even before firebase imports
// This must execute BEFORE Firebase SDKs attempt to initialize,
// so it needs to be near the top of the file, outside of any functions.
if (process.env.NODE_ENV === 'development') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  console.log("App Check Debug Token enabled for development. Expecting token in console.");
}

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore, // Import getFirestore to get the Firestore instance
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser // Import deleteUser for account deletion
} from "firebase/auth";

// Import App Check modules
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Your web app's Firebase configuration - NOW USING ENVIRONMENT VARIABLES
const firebaseConfig = {
  // Use 'process.env.VUE_APP_' for Vue CLI projects.
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID,
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Ensure analytics is properly initialized
const db = getFirestore(app); // Initialize Firestore instance
const auth = getAuth(app);

// Initialize App Check (it will pick up self.FIREBASE_APPCHECK_DEBUG_TOKEN if set)
// This should be initialized regardless of NODE_ENV if you intend to use it in both dev/prod
// but the reCAPTCHA provider itself is production-only.
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(process.env.VUE_APP_RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true
});


// Set Firebase Authentication state persistence to local storage
// This will keep the user logged in even after closing and reopening the browser
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set to 'local'.");
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Error setting Firebase Auth persistence:", errorCode, errorMessage);
  });

export {
  db, // Export db
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  analytics,
  sendEmailVerification,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  deleteUser // Export deleteUser
};