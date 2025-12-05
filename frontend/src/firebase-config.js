import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// PASTE YOUR CONFIG FROM STEP 1 HERE
const firebaseConfig = {
  apiKey: "AIzaSyDToJmCbSg7eKGYRAXfW7nvIV66VOlrthA",
  authDomain: "image-keep-storage.firebaseapp.com",
  projectId: "image-keep-storage",
  storageBucket: "image-keep-storage.firebasestorage.app",
  messagingSenderId: "274777899696",
  appId: "1:274777899696:web:239358bd502adc53b27175",
  measurementId: "G-9ZVHWMB2TG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Auth instance so we can use it in Login.jsx
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();