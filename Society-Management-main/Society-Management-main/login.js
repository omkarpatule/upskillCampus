import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


/* ===========================
   🔐 LOGIN FUNCTION
=========================== */

document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  errorEl.innerText = "";

  if (!email || !password) {
    errorEl.innerText = "Please enter email and password.";
    return;
  }

  try {

    // 🔥 Firebase Login
    const userCredential =
      await signInWithEmailAndPassword(auth, email, password);

    const user = userCredential.user;

    // 🔥 Get user document from Firestore
    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
      errorEl.innerText = "User record not found.";
      return;
    }

    const data = userSnap.data();
    const role = data.role?.trim();
    const status = data.status?.trim();

    // ❌ Block if not approved
    if (status !== "approved") {
      errorEl.innerText = "Waiting for admin approval.";
      return;
    }

    // 🔁 Role Based Redirect
    if (role === "admin") {
      window.location.href = "admin-dashboard.html";
    }
    else if (role === "treasurer") {
      window.location.href = "dashboard.html";
    }
    else if (role === "owner") {
      window.location.href = "dashboard.html";
    }
    else {
      errorEl.innerText = "Invalid role assigned.";
    }

  } catch (error) {
    errorEl.innerText = error.message;
  }

});
