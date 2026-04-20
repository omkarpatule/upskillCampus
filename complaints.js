import { auth, db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let currentUserRole = null;
let currentUserId = null;

/* ===========================
   AUTH CHECK
=========================== */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUserId = user.uid;

  const userSnap = await getDoc(doc(db, "users", user.uid));

  if (!userSnap.exists()) {
    window.location.href = "login.html";
    return;
  }

  currentUserRole = userSnap.data().role;

  loadComplaints();
});


/* ===========================
   SUBMIT COMPLAINT
=========================== */

window.submitComplaint = async function() {

  const text = document.getElementById("complaintText").value.trim();

  if (!text) {
    alert("Write complaint first.");
    return;
  }

  const userSnap = await getDoc(doc(db, "users", currentUserId));
  const userData = userSnap.data();

  await addDoc(collection(db, "complaints"), {
    userId: currentUserId,
    name: userData.name,
    flatNo: userData.flatNo,
    message: text,
    status: "Pending",
    createdAt: serverTimestamp()
  });

  document.getElementById("complaintText").value = "";

  loadComplaints();
};


/* ===========================
   LOAD COMPLAINTS
=========================== */

async function loadComplaints() {

  const snapshot = await getDocs(collection(db, "complaints"));

  const listDiv = document.getElementById("complaintList");

  listDiv.innerHTML = "";

  snapshot.forEach(docSnap => {

    const data = docSnap.data();
    const id = docSnap.id;

    // Owners only see their complaints
    if (currentUserRole !== "admin" &&
        data.userId !== currentUserId) {
      return;
    }

    let buttons = "";

    // Admin can update status
    if (currentUserRole === "admin") {
      buttons = `
        <button class="btn approve"
          onclick="updateStatus('${id}','Resolved')">
          Resolve
        </button>
      `;
    }

    listDiv.innerHTML += `
      <div class="user-card">
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Flat:</b> ${data.flatNo}</p>
        <p><b>Message:</b> ${data.message}</p>
        <p><b>Status:</b> ${data.status}</p>
        ${buttons}
      </div>
    `;
  });

  if (!listDiv.innerHTML) {
    listDiv.innerHTML = "<p>No complaints found.</p>";
  }
}


/* ===========================
   UPDATE STATUS (ADMIN)
=========================== */

window.updateStatus = async function(id, newStatus) {

  await updateDoc(doc(db, "complaints", id), {
    status: newStatus
  });

  loadComplaints();
};
