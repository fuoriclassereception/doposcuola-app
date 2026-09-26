import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBvdt-SI07jgrKz7ebw8AD0Sqj-stf5cls",
  authDomain: "fuoriclasse-app-4dfb9.firebaseapp.com",
  projectId: "fuoriclasse-app-4dfb9",
  storageBucket: "fuoriclasse-app-4dfb9.firebasestorage.app",
  messagingSenderId: "22858064784",
  appId: "1:22858064784:web:98b33584447c8a0466c915",
  measurementId: "G-EC3NNQ9FG1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
