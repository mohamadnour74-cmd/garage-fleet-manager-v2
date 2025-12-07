// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0iU44wDkwfFQC4_j2eYq1HNX5gPz-WVg",
  authDomain: "garage-fleet-manager.firebaseapp.com",
  projectId: "garage-fleet-manager",
  storageBucket: "garage-fleet-manager.firebasestorage.app",
  messagingSenderId: "622242559504",
  appId: "1:622242559504:web:2379aee03dd9e5152abc95",
  measurementId: "G-QGR6V33WMM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
