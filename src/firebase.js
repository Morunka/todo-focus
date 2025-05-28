// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVcs56OYlFDq0jb13MgJr7gcM1TR9lJiE",
  authDomain: "todo-focus-d59b1.firebaseapp.com",
  projectId: "todo-focus-d59b1",
  storageBucket: "todo-focus-d59b1.firebasestorage.app",
  messagingSenderId: "520960174304",
  appId: "1:520960174304:web:047d83bbc1ba1d917f8885",
  measurementId: "G-9T29LYWMG5"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { 
  db, 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  analytics 
};