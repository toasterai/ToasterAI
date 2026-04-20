import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let auth;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.error('Firebase initialization failed. Check your VITE_FIREBASE_* environment variables.', err.message);
  // Return a stub so the app doesn't crash — auth operations will fail gracefully
  auth = {
    currentUser: null,
    onAuthStateChanged: (_callback) => {
      _callback(null); // treat as logged out
      return () => {};
    },
  };
}

export { auth };
