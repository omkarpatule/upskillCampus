import { auth, db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


/* ===============================
   🔹 MONTH DOCUMENT REFERENCE
================================ */

const monthRef = doc(db, "accounts", "jan-2026");

let currentUserRole = null;


/* ===============================
   🔐 AUTH CHECK + ROLE CHECK
================================ */

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

  const data = userSnap.data();
  currentUserRole = data.role?.trim();

  // ❌ Tenants / invalid role blocked
  if (
    currentUserRole !== "admin" &&
    currentUserRole !== "treasurer" &&
    currentUserRole !== "owner"
  ) {
    alert("Access denied.");
    window.location.href = "dashboard.html";
    return;
  }

  loadAccounts();
});


/* ===============================
   🔄 LOAD ACCOUNT DATA
================================ */

async function loadAccounts() {

  const monthSnap = await getDoc(monthRef);

  // If month does not exist → create it
  if (!monthSnap.exists()) {
    await setDoc(monthRef, {
      totalIncome: 0,
      totalExpense: 0
    });
  }

  const updatedSnap = await getDoc(monthRef);
  const data = updatedSnap.data();

  const totalIncome = data.totalIncome || 0;
  const totalExpense = data.totalExpense || 0;
  const balance = totalIncome - totalExpense;

  document.getElementById("totalIncome").innerText = totalIncome;
  document.getElementById("totalExpense").innerText = totalExpense;
  document.getElementById("balance").innerText = balance;

  loadTransactions();

  // 🔥 Hide Add Form for Owner
  if (currentUserRole === "owner") {
    const form = document.getElementById("transactionForm");
    if (form) form.style.display = "none";
  }
}


/* ===============================
   📋 LOAD TRANSACTIONS
================================ */

async function loadTransactions() {

  const snapshot =
    await getDocs(collection(monthRef, "transactions"));

  const tableBody =
    document.querySelector("#transactionsTable tbody");

  tableBody.innerHTML = "";

  snapshot.forEach(docSnap => {

    const t = docSnap.data();

    const row = `
      <tr>
        <td>₹ ${t.amount}</td>
        <td>${t.description}</td>
        <td>${t.type}</td>
        <td>${t.createdAt?.toDate().toLocaleDateString() || ""}</td>
      </tr>
    `;

    tableBody.innerHTML += row;
  });
}


/* ===============================
   ➕ ADD TRANSACTION
================================ */

window.addTransaction = async function () {

  if (
    currentUserRole !== "admin" &&
    currentUserRole !== "treasurer"
  ) {
    alert("Only Admin or Treasurer can add transactions.");
    return;
  }

  const amount =
    parseInt(document.getElementById("amount").value);

  const description =
    document.getElementById("description").value.trim();

  const type =
    document.getElementById("type").value;

  if (!amount || !description) {
    alert("Please fill all fields.");
    return;
  }

  // Add transaction
  await addDoc(collection(monthRef, "transactions"), {
    amount,
    description,
    type,
    createdAt: serverTimestamp()
  });

  // Update totals
  const monthSnap = await getDoc(monthRef);
  const data = monthSnap.data();

  if (type === "income") {
    await updateDoc(monthRef, {
      totalIncome: (data.totalIncome || 0) + amount
    });
  } else {
    await updateDoc(monthRef, {
      totalExpense: (data.totalExpense || 0) + amount
    });
  }

  // Clear form
  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  loadAccounts();
};
