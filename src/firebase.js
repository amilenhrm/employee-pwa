// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBoAj7QH0KZivabYwNiEBai9DCdtF4NXRE",
  authDomain: "amilen-system-project.firebaseapp.com",
  projectId: "amilen-system-project",
  storageBucket: "amilen-system-project.firebasestorage.app",
  messagingSenderId: "866375463361",
  appId: "1:866375463361:web:35e65f65a0b3889e403f40",
  measurementId: "G-N8N19GBMJD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
