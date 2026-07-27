import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyB3wjavGlZlgwt9Z91tqu-s8tI7AAezsbI",
  authDomain: "ordini-coco-cera-e-calus-stop.firebaseapp.com",
  projectId: "ordini-coco-cera-e-calus-stop",
  storageBucket: "ordini-coco-cera-e-calus-stop.firebasestorage.app",
  messagingSenderId: "417597402005",
  appId: "1:417597402005:web:cb6b6451351dab8ab9a49c"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)