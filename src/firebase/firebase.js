// src/firebase/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAiNdrPrc4wy4wWt5riHga7eBDwaUxdTrw",
  authDomain: "note-agent-fb.firebaseapp.com",
  projectId: "note-agent-fb",
  storageBucket: "note-agent-fb.firebasestorage.app",
  messagingSenderId: "255992953410",
  appId: "1:255992953410:web:b13481c03cce4b67134bdb",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// login function
export const signInWithGoogle = () => signInWithPopup(auth, provider);
