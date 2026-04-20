import { auth, db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


/* ===========================
   AUTH CHECK
=========================== */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadStats();
});


/* ===========================
   LOAD DASHBOARD STATS
=========================== */

async function loadStats() {

  // Users
  const userSnap =
    await getDocs(collection(db, "users"));

  let totalUsers = 0;
  let pendingUsers = 0;

  userSnap.forEach(doc => {
    const data = doc.data();

    if (data.status === "approved")
      totalUsers++;

    if (data.status === "pending")
      pendingUsers++;
  });

  document.getElementById("totalUsers").innerText =
    totalUsers;

  document.getElementById("pendingUsers").innerText =
    pendingUsers;


  // Complaints
  const complaintSnap =
    await getDocs(collection(db, "complaints"));

  document.getElementById("totalComplaints").innerText =
    complaintSnap.size;


  // Tankers Today
  const tankerSnap =
    await getDocs(collection(db, "tankers"));

  let todayCount = 0;
  const today = new Date().toDateString();

  tankerSnap.forEach(doc => {
    const data = doc.data();
    const uploadDate =
      data.uploadedAt?.toDate();

    if (uploadDate &&
        uploadDate.toDateString() === today) {
      todayCount++;
    }
  });

  document.getElementById("todayTankers").innerText =
    todayCount;
}


/* ===========================
   LOGOUT
=========================== */

window.logout = async function() {
  await signOut(auth);
  window.location.href = "login.html";
};


/* ===========================
   NAVIGATION
=========================== */

window.goTo = function(page) {
  window.location.href = page;
};
