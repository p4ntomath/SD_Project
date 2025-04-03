// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjdEQGCfDpUA5iu3SAvqMwoEInW6uij6s",
  authDomain: "login-52b8e.firebaseapp.com",
  projectId: "login-52b8e",
  storageBucket: "login-52b8e.firebasestorage.app",
  messagingSenderId: "1075511247756",
  appId: "1:1075511247756:web:e8e375411866031897cca9",
  measurementId: "G-X6KGQECM7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
export const db = getFirestore(app);
export const getDoc = getFirestore(app);