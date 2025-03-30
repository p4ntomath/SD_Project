// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlpFD060eqiJ7l4kRClLj9KpIE6x8QNwk",
  authDomain: "practice-69d08.firebaseapp.com",
  projectId: "practice-69d08",
  storageBucket: "practice-69d08.firebasestorage.app",
  messagingSenderId: "366036036030",
  appId: "1:366036036030:web:04c536867a1f1935be31ef",
  measurementId: "G-GSL2KWM3YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export {app, auth};