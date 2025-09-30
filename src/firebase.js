// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";   // ✅ importFirestore
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";   // ✅ import Auth

const firebaseConfig = {
  apiKey: "AIzaSyDLWkm7UgcQNNxfOc38dPvKrSXr4-0u39Q",
  authDomain: "amilensystemproject.firebaseapp.com",
  projectId: "amilensystemproject",
  storageBucket: "amilensystemproject.firebasestorage.app",
  messagingSenderId: "654529566335",
  appId: "1:654529566335:web:9009de7e344270c784114a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// ✅ Initialize Firestore
const db = getFirestore(app);
// ✅ initialize Auth
const auth = getAuth(app);
// (optional) Analytics
const analytics = getAnalytics(app);

export { db, auth };