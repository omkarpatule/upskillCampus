import { auth, db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


/* ===========================
   🔐 ADMIN ACCESS PROTECTION
=========================== */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));

  if (!userSnap.exists()) {
    window.location.href = "login.html";
    return;
  }

  const role = userSnap.data().role?.trim();

  if (role !== "admin") {
    alert("Access denied. Admin only.");
    window.location.href = "dashboard.html";
    return;
  }

  loadUsers();
});


/* ===========================
   🔄 LOAD USERS
=========================== */

async function loadUsers() {

  const snapshot = await getDocs(collection(db, "users"));

  const pendingDiv = document.getElementById("pendingUsers");
  const approvedDiv = document.getElementById("approvedUsers");

  pendingDiv.innerHTML = "";
  approvedDiv.innerHTML = "";

  let pendingCount = 0;
  let approvedCount = 0;

  snapshot.forEach(docSnap => {

    const data = docSnap.data();
    const userId = docSnap.id;

    /* ---------- PENDING USERS ---------- */

    if (data.status === "pending") {

      pendingCount++;

      pendingDiv.innerHTML += `
        <div class="user-card">
          <p><b>Name:</b> ${data.name}</p>
          <p><b>Email:</b> ${data.email}</p>
          <p><b>Flat:</b> ${data.flatNo}</p>

          <button class="btn approve"
            onclick="approveUser('${userId}')">
            Approve
          </button>

          <button class="btn reject"
            onclick="rejectUser('${userId}')">
            Reject
          </button>
        </div>
      `;
    }

    /* ---------- APPROVED USERS ---------- */

    if (data.status === "approved") {

      approvedCount++;

      approvedDiv.innerHTML += `
        <div class="user-card">
          <p><b>Name:</b> ${data.name}</p>
          <p><b>Email:</b> ${data.email}</p>
          <p><b>Flat:</b> ${data.flatNo}</p>
          <p><b>Role:</b> ${data.role}</p>

          <button class="btn treasurer"
            onclick="makeTreasurer('${userId}')">
            Make Treasurer
          </button>
        </div>
      `;
    }

  });

  if (pendingCount === 0) {
    pendingDiv.innerHTML = "<p>No pending users.</p>";
  }

  if (approvedCount === 0) {
    approvedDiv.innerHTML = "<p>No approved users found.</p>";
  }
}


/* ===========================
   ✅ APPROVE USER
=========================== */

window.approveUser = async function(userId) {

  await updateDoc(doc(db, "users", userId), {
    status: "approved",
    role: "owner"
  });

  alert("User Approved");
  loadUsers();
};


/* ===========================
   ❌ REJECT USER
=========================== */

window.rejectUser = async function(userId) {

  await updateDoc(doc(db, "users", userId), {
    status: "rejected"
  });

  alert("User Rejected");
  loadUsers();
};


/* ===========================
   💰 MAKE TREASURER
=========================== */

window.makeTreasurer = async function(userId) {

  await updateDoc(doc(db, "users", userId), {
    role: "treasurer"
  });

  alert("User promoted to Treasurer.");
  loadUsers();
};


/* ===========================
   🚪 LOGOUT
=========================== */

window.logout = async function() {

  await signOut(auth);
  window.location.href = "login.html";
};
