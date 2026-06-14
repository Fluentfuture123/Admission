/* Admin script: fetch sheet, merge to localStorage, render, export PDF/Image/CSV, demo fallback */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

/* Helpers */
function getLastAdmissionNumber() {
  const raw = localStorage.getItem("lastAdmissionNumber");
  return raw ? parseInt(raw, 10) : 1000;
}
function saveAdmissionNumber(num) {
  localStorage.setItem("lastAdmissionNumber", String(num));
}
function loadLocal() {
  return JSON.parse(localStorage.getItem("submissions") || "[]");
}
function saveLocal(arr) {
  localStorage.setItem("submissions", JSON.stringify(arr));
}
function normalize(item) {
  return {
    admissionNumber: item.admissionNumber || item.AdmissionNumber || item.Admission || item.Admission_No || item.AdmissionNo || "",
    name: item.name || item.Name || item.FullName || "",
    email: item.email || item.Email || "",
    phone: item.phone || item.Phone || item.PhoneNumber || "",
    age: item.age || item.Age || "",
    gender: item.gender || item.Gender || "",
    school: item.school || item.School || "",
    grade: item.grade || item.Grade || "",
    subjects: item.subjects || item.Subjects || item.Subject || "",
    message: item.message || item.Message || item.Comments || "",
    timestamp: item.timestamp || item.Timestamp || item.Time || new Date().toLocaleString()
  };
}
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

/* Render */
let currentSubmission = null;
function renderSubmissions() {
  const submissionsList = document.getElementById("submissionsList");
  const totalCount = document.getElementById("totalCount");
  const lastId = document.getElementById("lastId");
  const submissions = loadLocal();

  totalCount.textContent = submissions.length;
  lastId.textContent = submissions.length ? (submissions[submissions.length-1].admissionNumber || "-") : "-";

  if (!submissions.length) {
    submissionsList.innerHTML = '<div class="no-submissions">No submissions yet</div>';
    return;
  }

  const reversed = submissions.slice().reverse();
  submissionsList.innerHTML = reversed.map((s, idx) => {
    const displayIndex = submissions.length - 1 - idx;
    const name = s.name || "N/A";
    const admission = s.admissionNumber || "N/A";
    const timestamp = s.timestamp || "Unknown";
    return `
      <div class="submission-item" data-index="${displayIndex}">
        <div class="submission-header">
          <div class="submission-id">${escapeHtml(admission)}</div>
          <div class="submission-meta">
            <span><strong>Student:</strong> ${escapeHtml(name)}</span>
            <span><strong>Date:</strong> ${escapeHtml(timestamp)}</span>
          </div>
        </div>
        <div class="submission-actions">
          <button class="btn-view" data-index="${displayIndex}">👁️ View Details</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".submission-item").forEach(item => {
    item.addEventListener("click", function () {
      const idx = parseInt(this.getAttribute("data-index"),10);
      viewDetailsByIndex(idx);
    });
  });
  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const idx = parseInt(this.getAttribute("data-index"),10);
      viewDetailsByIndex(idx);
    });
  });
}

/* Modal */
function viewDetailsByIndex(index) {
  const subs = loadLocal();
  const item = subs[index];
  if (!item) return;
  currentSubmission = normalize(item);
  openModalWithSubmission(currentSubmission);
}
function openModalWithSubmission(s) {
  const modal = document.getElementById("detailModal");
  const detailsContent = document.getElementById("detailsContent");
  detailsContent.innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><div class="detail-label">Name</div><div class="detail-value">${escapeHtml(s.name)}</div></div>
      <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(s.email)}</div></div>
      <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value">${escapeHtml(s.phone)}</div></div>
      <div class="detail-field"><div class="detail-label">School</div><div class="detail-value">${escapeHtml(s.school)}</div></div>
      <div class="detail-field"><div class="detail-label">Subjects</div><div class="detail-value">${escapeHtml(s.subjects)}</div></div>
      <div class="detail-field"><div class="detail-label">Grade</div><div class="detail-value">${escapeHtml(s.grade)}</div></div>
      <div class="detail-field"><div class="detail-label">Admission Number</div><div class="detail-value">${escapeHtml(s.admissionNumber)}</div></div>
      <div class="detail-field"><div class="detail-label">Timestamp</div><div class="detail-value">${escapeHtml(s.timestamp)}</div></div>
      <div class="detail-field" style="grid-column:1 / -1;">
        <div class="detail-label">Comments</div>
        <div class="detail-value">${escapeHtml(s.message)}</div>
      </div>
    </div>
  `;
  modal.style.display = "block";
  modal.setAttribute("aria-hidden","false");
}
function closeModal() {
  const modal = document.getElementById("detailModal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden","true");
}

/* Print / Export */
function buildPrintContent(s) {
  const st = s || currentSubmission || {};
  return `
    <div class="print-header"><h1>Admission Form</h1><p>Fluent Future Academy</p></div>
    <div class="print-body">
      <div class="print-section"><div class="print-section-title">Personal Information</div>
        <div class="print-row"><div class="print-label">Admission Number:</div><div class="print-value">${escapeHtml(st.admissionNumber)}</div></div>
        <div class="print-row"><div class="print-label">Full Name:</div><div class="print-value">${escapeHtml(st.name)}</div></div>
        <div class="print-row"><div class="print-label">Age:</div><div class="print-value">${escapeHtml(st.age)}</div></div>
        <div class="print-row"><div class="print-label">Gender:</div><div class="print-value">${escapeHtml(st.gender)}</div></div>
      </div>
      <div class="print-section"><div class="print-section-title">Contact Information</div>
        <div class="print-row"><div class="print-label">Email:</div><div class="print-value">${escapeHtml(st.email)}</div></div>
        <div class="print-row"><div class="print-label">Phone:</div><div class="print-value">${escapeHtml(st.phone)}</div></div>
      </div>
      <div class="print-section"><div class="print-section-title">Academic Information</div>
        <div class="print-row"><div class="print-label">School:</div><div class="print-value">${escapeHtml(st.school)}</div></div>
        <div class="print-row"><div class="print-label">Grade:</div><div class="print-value">${escapeHtml(st.grade)}</div></div>
        <div class="print-row"><div class="print-label">Subjects:</div><div class="print-value">${escapeHtml(st.subjects)}</div></div>
      </div>
      <div class="print-section"><div class="print-section-title">Additional Information</div>
        <div class="print-row"><div class="print-label">Comments:</div><div class="print-value">${escapeHtml(st.message)}</div></div>
        <div class="print-row"><div class="print-label">Submission Date:</div><div class="print-value">${escapeHtml(st.timestamp)}</div></div>
      </div>
    </div>
  `;
}
function downloadPDF() {
  if (!currentSubmission) return;
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";
  const opt = { margin:10, filename:`admission-${(currentSubmission.admissionNumber||'form')}.pdf`, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} };
  html2pdf().set(opt).from(printArea).save().then(()=>{ printArea.style.display='none'; }).catch(()=>{ printArea.style.display='none'; });
}
function downloadImage() {
  if (!currentSubmission) return;
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";
  setTimeout(()=> {
    html2canvas(printArea, { scale:2, useCORS:true }).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `admission-${(currentSubmission.admissionNumber||'form')}.png`;
      link.click();
      printArea.style.display = "none";
    }).catch(()=>{ printArea.style.display='none'; });
  }, 300);
}

/* CSV / Clear / Refresh */
function exportToCSV() {
  const subs = loadLocal();
  if (!subs.length) { alert("No submissions to export!"); return; }
  const headers = ["Admission Number","Name","Email","Phone","Age","Gender","School","Grade","Subjects","Comments","Timestamp"];
  const rows = subs.map(s => [s.admissionNumber||"", s.name||"", s.email||"", s.phone||"", s.age||"", s.gender||"", s.school||"", s.grade||"", s.subjects||"", s.message||"", s.timestamp||""]);
  const csv = [headers].concat(rows).map(r => r.map(c => `"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fluent-future-submissions-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
function clearAllData() {
  if (!confirm("⚠️ Are you sure? This will delete ALL submission data permanently.")) return;
  localStorage.removeItem("submissions");
  localStorage.removeItem("lastAdmissionNumber");
  renderSubmissions();
  alert("✓ All data has been cleared.");
}
function refreshPage() {
  fetchAndMerge();
  alert("✓ Data refreshed!");
}

/* Fetch sheet and merge */
function fetchAndMerge() {
  fetch(WEB_APP_URL)
    .then(r => r.json())
    .then(data => {
      if (!Array.isArray(data)) {
        console.warn("Sheet returned non-array:", data);
        renderSubmissions();
        return;
      }
      const local = loadLocal();
      const existing = new Set(local.map(i => (i.admissionNumber||i.AdmissionNumber||"").toString()));
      let added = 0;
      data.forEach(raw => {
        const n = normalize(raw);
        const id = (n.admissionNumber||"").toString();
        if (!id) return;
        if (!existing.has(id)) {
          local.push(n);
          existing.add(id);
          added++;
        }
      });
      if (added) {
        saveLocal(local);
        console.log(`Merged ${added} new submissions from Google Sheets into localStorage.`);
      } else {
        console.log("No new submissions to merge.");
      }
      // update lastAdmissionNumber
      const lastFromSheet = data.length ? normalize(data[data.length-1]).admissionNumber : null;
      if (lastFromSheet) {
        const numeric = parseInt(String(lastFromSheet).replace(/\D/g,""),10);
        if (!isNaN(numeric)) {
          const cur = getLastAdmissionNumber();
          if (numeric > cur) saveAdmissionNumber(numeric);
        }
      }
      renderSubmissions();
    })
    .catch(err => {
      console.error("Error fetching sheet data:", err);
      // fallback: if no local data, create demo entries
      const local = loadLocal();
      if (!local.length) {
        createDemoData();
      }
      renderSubmissions();
    });
}

/* Demo fallback */
function createDemoData() {
  const demo = [
    { admissionNumber: "FF-1001", name: "Demo Student One", email: "demo1@example.com", phone: "0123456789", age: "12", gender: "Male", school: "Demo School", grade: "6", subjects: "History, Geography", message: "-", timestamp: new Date().toLocaleString() },
    { admissionNumber: "FF-1002", name: "Demo Student Two", email: "demo2@example.com", phone: "0987654321", age: "11", gender: "Female", school: "Demo School", grade: "5", subjects: "Math, English", message: "-", timestamp: new Date().toLocaleString() }
  ];
  saveLocal(demo);
  saveAdmissionNumber(1002);
  console.log("Demo data created for admin preview.");
}

/* Init */
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btnExportCSV").addEventListener("click", exportToCSV);
  document.getElementById("btnClearAll").addEventListener("click", clearAllData);
  document.getElementById("btnRefresh").addEventListener("click", fetchAndMerge);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("btnClose").addEventListener("click", closeModal);
  document.getElementById("btnDownloadPDF").addEventListener("click", downloadPDF);
  document.getElementById("btnDownloadImage").addEventListener("click", downloadImage);

  window.addEventListener("click", function (event) {
    const modal = document.getElementById("detailModal");
    if (event.target === modal) closeModal();
  });

  // First attempt to fetch and merge; if fails, demo data will be created
  fetchAndMerge();
});
