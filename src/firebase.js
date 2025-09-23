import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "xxxxxx",
  appId: "xxxxxx"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
