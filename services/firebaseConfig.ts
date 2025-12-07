import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// NOTE: This configuration uses a placeholder or invalid API Key.
// To make the app work with a real cloud database:
// 1. Go to console.firebase.google.com
// 2. Create a project
// 3. Enable Firestore and Authentication (Anonymous)
// 4. Paste your real keys below.
export const firebaseConfigRaw = {
  apiKey: "AIzaSyA8IU4dWkvfFPCAJ2eY41hDK9Pz-vWg",
  authDomain: "garage-fleet-manager.firebaseapp.com",
  projectId: "garage-fleet-manager",
  storageBucket: "garage-fleet-manager.appspot.com",
  messagingSenderId: "622242556594",
  appId: "1:622242556594:web:2379faae03de96512abc95",
  measurementId: "G-9RQv63W0W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfigRaw);
export const db = getFirestore(app);
export const auth = getAuth(app);