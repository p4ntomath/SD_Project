//import {initializeApp} from 'firebase/app';
//import {createUserWithEmailAndPassword, getAuth,onAuthStateChanged, useDeviceLanguage} from 'firebase/auth';

import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import {createUserWithEmailAndPassword, getAuth,onAuthStateChanged, useDeviceLanguage} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';


// You are changing the code, we need to import/export the code as modules from mpm pads to browser module pads
//Gonna need to include some html file
//Essentially you are just changing the npm pads to browser module pads
const firebaseConfig = {
    apiKey: "AIzaSyAlpFD060eqiJ7l4kRClLj9KpIE6x8QNwk",
    authDomain: "practice-69d08.firebaseapp.com",
    projectId: "practice-69d08",
    storageBucket: "practice-69d08.firebasestorage.app",
    messagingSenderId: "366036036030",
    appId: "1:366036036030:web:04c536867a1f1935be31ef",
    measurementId: "G-GSL2KWM3YL"
  };
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);


//detect auth state
onAuthStateChanged(auth, user => {
if (user != null){
  console.log('logged in!');
}else {
  console.log('No user');
}
});

