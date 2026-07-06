// Admin Panel Script
var WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

// Firebase Config - REPLACE WITH YOUR ACTUAL CONFIG
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase safely
if (typeof firebase !== "undefined") {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}

var allSubmissions = [];
var showDeleted = false;

function initAuthGuard() {
  var authOverlay = document.getElementById("authOverlay");
  var mainContent = document.getElementById("mainContent");

  if (typeof firebase === "undefined") {
    console.error("Firebase not loaded");
    if (authOverlay) authOverlay.style.display = "none";
    if (mainContent) mainContent.style.display = "block";
    fetchAndMerge();
    return;
  }

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      if (authOverlay) authOverlay.style.display = "none";
      if (mainContent) mainContent.style.display = "block";
      fetchAndMerge();
    } else {
      window.location.href = "login.html";
    }
  });

  // Fallback: hide spinner after 3 seconds
  setTimeout(function() {
    if (authOverlay && authOverlay.style.display !== "none") {
      authOverlay.style.display = "none";
      if (mainContent) mainContent.style.display = "block";
      fetchAndMerge();
    }
  }, 3000);
}

function fetchAndMerge() {
  var container = document.getElementById("submissionsTable");
  if (!container) return;

  container.innerHTML = "<p>Loading data...</p>";

  fetch(WEB_APP_URL + "?action=getAll")
    .then(function(response) { return response.json(); })
    .then(function(result) {
      if (result.result === "success" && result.data) {
        allSubmissions = result.data;
        renderTable();
      } else {
        container.innerHTML = "<p>No data found.</p>";
      }
    })
    .catch(function(err) {
      console.error("Fetch error:", err);
      container.innerHTML = "<p style='color:red'>Error loading data. Check console.</p>";
    });
}

function renderTable() {
  var container = document.getElementById("submissionsTable");
  if (!container) return;

  var filtered = allSubmissions.filter(function(s) {
    var status = String(s.Status || s.status || "").trim();
    if (showDeleted) return true;
    return status !== "Deleted";
  });

  if (filtered.length === 0) {
    container.innerHTML = "<p>No submissions found.</p>";
    return;
  }

  var html = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">';
  html += "<tr style='background:#f0f0f0;font-weight:bold;'>";
  html += "<th>Name</th>";
  html += "<th>Age</th>";
  html += "<th>Gender</th>";
  html += "<th>Email</th>";
  html += "<th>Phone</th>";
  html += "<th>School</th>";
  html += "<th>Address</th>";
  html += "<th>DOB</th>";
  html += "<th>Subjects</th>";
  html += "<th>Grade</th>";
  html += "<th>Message</th>";
  html += "<th>Admission No</th>";
  html += "<th>Status</th>";
  html += "<th>Actions</th>";
  html += "</tr>";

  for (var i = 0; i < filtered.length; i++) {
    var s = filtered[i];
    var status = String(s.Status || s.status || "Active").trim();
    var statusColor = status === "Deleted" ? "#dc3545" : "#28a745";
    var statusBg = status === "Deleted" ? "#ffebee" : "#e8f5e9";

    html += "<tr>";
    html += "<td>" + escapeHtml(String(s.Name || s.name || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Age || s.age || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Gender || s.gender || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Email || s.email || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Phone || s.phone || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.School || s.school || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Address || s.address || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.DOB || s.dob || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Subjects || s.subjects || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Grade || s.grade || "")) + "</td>";
    html += "<td>" + escapeHtml(String(s.Message || s.message || "")) + "</td>";
    html += "<td><b>" + escapeHtml(String(s.AdmissionNumber || s.admissionNumber || "")) + "</b></td>";
    html += '<td style="color:' + statusColor + ';background:' + statusBg + ';font-weight:bold;text-align:center;">' + status + "</td>";
    html += '<td><button onclick="deleteStudent(\'' + escapeHtml(String(s.AdmissionNumber || s.admissionNumber || "")) + '\')" style="background:#dc3545;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Delete</button></td>';
    html += "</tr>";
  }

  html += "</table>";
  container.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function deleteStudent(admissionNumber) {
  if (!admissionNumber || admissionNumber === "undefined") {
    alert("Invalid admission number");
    return;
  }
  if (!confirm("Are you sure you want to delete this record?\n\nAdmission No: " + admissionNumber)) return;

  showToast("Updating status to 'Deleted'...", "info");

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "action=delete&admissionNumber=" + encodeURIComponent(admissionNumber)
  })
  .then(function() {
    showToast("Success! Status updated to 'Deleted'", "success");
    setTimeout(fetchAndMerge, 1000);
  })
  .catch(function(err) {
    console.error("Delete error:", err);
    showToast("Delete failed. Check console.", "error");
  });
}

function showToast(message, type) {
  var toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "14px 24px";
    toast.style.borderRadius = "6px";
    toast.style.color = "#fff";
    toast.style.zIndex = "9999";
    toast.style.fontFamily = "sans-serif";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    document.body.appendChild(toast);
  }

  if (type === "success") toast.style.background = "#28a745";
  else if (type === "error") toast.style.background = "#dc3545";
  else toast.style.background = "#007bff";

  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(function() {
    toast.style.display = "none";
  }, 4000);
}

function toggleDeleted() {
  showDeleted = !showDeleted;
  var btn = document.getElementById("toggleDeletedBtn");
  if (btn) {
    btn.textContent = showDeleted ? "Hide Deleted Records" : "Show Deleted Records";
    btn.style.background = showDeleted ? "#dc3545" : "#6c757d";
  }
  renderTable();
}

function exportCSV() {
  var active = allSubmissions.filter(function(s) {
    var status = String(s.Status || s.status || "").trim();
    return status !== "Deleted";
  });

  if (active.length === 0) {
    alert("No active records to export");
    return;
  }

  var headers = ["Name", "Age", "Gender", "Email", "Phone", "School", "Address", "DOB", "Subjects", "Grade", "Message", "AdmissionNumber", "Timestamp", "Status"];
  var csv = [headers.join(",")];

  for (var i = 0; i < active.length; i++) {
    var s = active[i];
    var row = [
      '"' + String(s.Name || s.name || "").replace(/"/g, '""') + '"',
      '"' + String(s.Age || s.age || "").replace(/"/g, '""') + '"',
      '"' + String(s.Gender || s.gender || "").replace(/"/g, '""') + '"',
      '"' + String(s.Email || s.email || "").replace(/"/g, '""') + '"',
      '"' + String(s.Phone || s.phone || "").replace(/"/g, '""') + '"',
      '"' + String(s.School || s.school || "").replace(/"/g, '""') + '"',
      '"' + String(s.Address || s.address || "").replace(/"/g, '""') + '"',
      '"' + String(s.DOB || s.dob || "").replace(/"/g, '""') + '"',
      '"' + String(s.Subjects || s.subjects || "").replace(/"/g, '""') + '"',
      '"' + String(s.Grade || s.grade || "").replace(/"/g, '""') + '"',
      '"' + String(s.Message || s.message || "").replace(/"/g, '""') + '"',
      '"' + String(s.AdmissionNumber || s.admissionNumber || "").replace(/"/g, '""') + '"',
      '"' + String(s.Timestamp || s.timestamp || "").replace(/"/g, '""') + '"',
      '"' + String(s.Status || s.status || "Active").replace(/"/g, '""') + '"'
    ];
    csv.push(row.join(","));
  }

  var blob = new Blob([csv.join("\n")], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "active_submissions.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function clearAll() {
  if (!confirm("WARNING: This will mark ALL records as 'Deleted'.\n\nAre you sure?")) return;

  showToast("Marking all as 'Deleted'...", "info");

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "action=clearAll"
  })
  .then(function() {
    showToast("All records marked as 'Deleted'", "success");
    setTimeout(fetchAndMerge, 1000);
  })
  .catch(function(err) {
    console.error("ClearAll error:", err);
    showToast("Clear all failed", "error");
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", initAuthGuard);
