import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCaLElBr5FHIfYnvTMbIceeGYCCIcxXgxA",
  authDomain: "untuk-esok.firebaseapp.com",
  projectId: "untuk-esok",
  storageBucket: "untuk-esok.firebasestorage.app",
  messagingSenderId: "277216741378",
  appId: "1:277216741378:web:e4368249e698c632c6bf1b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

export { auth, provider, db, storage };