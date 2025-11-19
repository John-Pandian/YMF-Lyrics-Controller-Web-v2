// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAims_BukhbZUK0Psw_bNukE2VXnWCna8E",
  authDomain: "lyrics-app-d2256.firebaseapp.com",
  databaseURL: "https://lyrics-app-d2256-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lyrics-app-d2256",
  storageBucket: "lyrics-app-d2256.firebasestorage.app",
  messagingSenderId: "806129650187",
  appId: "1:806129650187:web:3b3d7acb386b9d1dd2550e",
  measurementId: "G-CPV07RS19W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Realtime Database
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
