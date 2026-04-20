// 🔥 Import Firebase SDKs
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// 🔐 Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCySpfawzB8q2DK1oAIM2LcyYr_DhmXWA",
  authDomain: "shantai-niwas-b.firebaseapp.com",
  projectId: "shantai-niwas-b",
  storageBucket: "shantai-niwas-b.appspot.com",
  messagingSenderId: "546075245993",
  appId: "1:546075245993:web:0425d9dafdb7099d1d58b8"
};


// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);


// 📦 Export Services
export const auth = getAuth(app);
export const db = getFirestore(app);
