import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBywlIVXu5oGOAd-H8_dRYa5aP7_CxC_GI",
  authDomain: "ddos-sim-49936.firebaseapp.com",
  projectId: "ddos-sim-49936",
  storageBucket: "ddos-sim-49936.firebasestorage.app",
  messagingSenderId: "667606516848",
  appId: "1:667606516848:web:b585bb171cccb9f2e9e0b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };