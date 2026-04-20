import { auth, db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  orderBy
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

  const data = userSnap.data();
  currentUserRole = data.role?.trim();

  // Only authorized roles can upload
  if (
    currentUserRole !== "admin" &&
    currentUserRole !== "watchman" &&
    currentUserRole !== "tanker_driver" &&
    currentUserRole !== "tanker_owner"
  ) {
    document.getElementById("uploadSection").style.display = "none";
  }

  loadTankers();
});


/* ===========================
   UPLOAD TANKER
=========================== */

window.uploadTanker = async function() {

  if (
    currentUserRole !== "admin" &&
    currentUserRole !== "watchman" &&
    currentUserRole !== "tanker_driver" &&
    currentUserRole !== "tanker_owner"
  ) {
    alert("Only authorized tanker staff can upload.");
    return;
  }

  const tankerNumber =
    document.getElementById("tankerNumber").value.trim();

  const waterQuantity =
    document.getElementById("waterQuantity").value.trim();

  const file =
    document.getElementById("tankerImage").files[0];

  if (!tankerNumber || !waterQuantity || !file) {
    alert("Fill all fields.");
    return;
  }

  const userSnap =
    await getDoc(doc(db, "users", currentUserId));

  const userData = userSnap.data();

  const reader = new FileReader();

  reader.onloadend = async function() {

    const base64Image = reader.result;

    await addDoc(collection(db, "tankers"), {
      image: base64Image,
      tankerNumber: tankerNumber,
      waterQuantity: waterQuantity,
      uploadedByName: userData.name,
      uploadedByRole: currentUserRole,
      uploadedAt: serverTimestamp()
    });

    await autoDeleteOldImages();

    document.getElementById("tankerNumber").value = "";
    document.getElementById("waterQuantity").value = "";
    document.getElementById("tankerImage").value = "";

    loadTankers();
  };

  reader.readAsDataURL(file);
};


/* ===========================
   LOAD TANKERS
=========================== */

async function loadTankers() {

  const q = query(
    collection(db, "tankers"),
    orderBy("uploadedAt", "desc")
  );

  const snapshot = await getDocs(q);

  const tankerList =
    document.getElementById("tankerList");

  tankerList.innerHTML = "";

  let todayCount = 0;
  const today = new Date().toDateString();

  snapshot.forEach(docSnap => {

    const data = docSnap.data();
    const uploadDate =
      data.uploadedAt?.toDate();

    if (uploadDate &&
        uploadDate.toDateString() === today) {
      todayCount++;
    }

    tankerList.innerHTML += `
      <div class="user-card">
        <img src="${data.image}"
             style="width:100%; max-width:300px; border-radius:8px;">

        <p><b>Tanker No:</b> ${data.tankerNumber}</p>
        <p><b>Water:</b> ${data.waterQuantity} Liters</p>
        <p><b>Uploaded By:</b> ${data.uploadedByName} (${data.uploadedByRole})</p>
        <p><b>Date:</b>
          ${uploadDate ? uploadDate.toLocaleString() : ""}
        </p>
      </div>
    `;
  });

  const todayElement =
    document.getElementById("todayCount");

  if (todayElement) {
    todayElement.innerText =
      "Today's Tankers: " + todayCount;
  }

  if (!tankerList.innerHTML) {
    tankerList.innerHTML =
      "<p>No tanker history.</p>";
  }
}


/* ===========================
   AUTO DELETE (MAX 100)
=========================== */

async function autoDeleteOldImages() {

  const q = query(
    collection(db, "tankers"),
    orderBy("uploadedAt", "asc")
  );

  const snapshot = await getDocs(q);

  if (snapshot.size > 100) {

    const deleteCount = snapshot.size - 100;
    const docs = snapshot.docs;

    for (let i = 0; i < deleteCount; i++) {
      await deleteDoc(doc(db, "tankers", docs[i].id));
    }
  }
}
