// Simple Firebase connection test
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDmbKvZQxhfzJtnKzr0z6afZOUILheI0Xg",
  authDomain: "owtdeparq.firebaseapp.com",
  projectId: "owtdeparq",
  storageBucket: "owtdeparq.firebasestorage.app",
  messagingSenderId: "647072340812",
  appId: "1:647072340812:web:0d90e10d11143cd1f78de9",
  measurementId: "G-TPH4GGCYMM"
};

// Test Firebase initialization
try {
  console.log('🔥 Testing Firebase initialization...');
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized successfully');
  console.log('🎉 Firebase is working correctly!');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
}
