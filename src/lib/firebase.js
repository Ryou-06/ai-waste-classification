import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { browser } from '$app/environment';

// Validate and log environment variables (only in development)
const validateConfig = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing Firebase environment variables:', missing);
    throw new Error(`Missing required Firebase config: ${missing.join(', ')}`);
  }

  // Log first few characters of API key for debugging (only in dev)
  if (import.meta.env.DEV) {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    console.log('Firebase API Key (first 10 chars):', apiKey?.substring(0, 10));
    console.log('All env vars loaded:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
  }
};

const getFirebaseConfig = () => {
  // Validate before creating config
  if (browser) {
    validateConfig();
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim()
  };
};

// Initialize Firebase only in the browser
/** @type {import('firebase/app').FirebaseApp | undefined} */
let app;

/** @type {import('firebase/firestore').Firestore | undefined} */
let db;

/** @type {import('firebase/auth').Auth | undefined} */
let auth;

/** @type {import('firebase/auth').GoogleAuthProvider | undefined} */
let googleProvider;

if (browser) {
  try {
    const firebaseConfig = getFirebaseConfig();
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export { db, auth, googleProvider };