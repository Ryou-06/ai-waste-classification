import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBXmGMVzWmatGLTFOskyngyOi1fRVnyDrg",
  authDomain: "ai-classification-system.firebaseapp.com",
  projectId: "ai-classification-system",
  storageBucket: "ai-classification-system.appspot.com",
  messagingSenderId: "711983308595",
  appId: "1:711983308595:web:f9d834a983121f90a5e846",
  measurementId: "G-F8ETH255B9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);