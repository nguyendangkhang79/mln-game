import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDOVa3aGhrwAFh1Jr_jx8ZFpqO5jOG8oE8",
  authDomain: "mln122-704c5.firebaseapp.com",
  databaseURL: "https://mln122-704c5-default-rtdb.firebaseio.com",
  projectId: "mln122-704c5",
  storageBucket: "mln122-704c5.firebasestorage.app",
  messagingSenderId: "56472092412",
  appId: "1:56472092412:web:d953b5a771713e9242e179"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);