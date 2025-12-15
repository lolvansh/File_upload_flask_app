import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCjHebIpK3vjoTgrrphSrnWVqdSMedXsw0",
  authDomain: "image-keep.firebaseapp.com",
  projectId: "image-keep",
  storageBucket: "image-keep.firebasestorage.app",
  messagingSenderId: "948298184512",
  appId: "1:948298184512:web:598a59973fae74ddcb2ca5",
  measurementId: "G-5JB4142ZX0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Auth instance so we can use it in Login.jsx
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();