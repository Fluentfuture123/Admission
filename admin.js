/* ============================
   Admin Panel JavaScript
   - Loads data from Google Sheets (WEB_APP_URL)
   - Merges new sheet entries into localStorage
   - Renders localStorage submissions
   - PDF / Image export for each submission
   - CSV export, refresh, clear all
   ============================ */

/* ---------- Configuration ---------- */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

/* ---------- Utilities ---------- */
function getLastAdmissionNumber() {
  const raw = localStorage.getItem("lastAdmissionNumber");
  return raw ? parseInt(raw, 10) : 1000;
}
function saveAdmissionNumber(num) {
  localStorage.setItem("lastAdmissionNumber", num);
}
function storeSubmissionData(formDataObj) {
  const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
  submissions.push(formDataObj);
  localStorage.setItem("submissions", JSON.stringify(submissions));
  console.log("Data stored locally. Total submissions:", submissions.length);
}
function normalizeFetchedItem(item) {
  // Accept both capitalized keys from Google Sheets and lowercase keys from localStorage
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

/* ---------- Rendering ---------- */
let currentSubmission = null;

function loadSubmissionsFromLocal() {
  const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
  return submissions;
}

function renderSubmissions() {
  const submissionsList = document.getElementById("submissionsList");
  const totalCount = document.getElementById("totalCount");
  const lastId = document.getElementById("lastId");

  const submissions = loadSubmissionsFromLocal();

  totalCount.textContent = submissions.length;
  lastId.textContent = submissions.length ? (submissions[submissions.length - 1].admissionNumber || "-") : "-";

  if (submissions.length === 0) {
    submissionsList.innerHTML = '<div class="no-submissions">No submissions yet</div>';
    return;
  }

  // Render newest first
  const reversed = submissions.slice().reverse();

  submissionsList.innerHTML = reversed.map((submission, idx) => {
    const displayIndex = submissions.length - 1 - idx;
    const name = submission.name || submission.Name || "N/A";
    const admission = submission.admissionNumber || submission.AdmissionNumber || "N/A";
    const timestamp = submission.timestamp || submission.Timestamp || "Unknown";
    return `
      <div class="submission-item" data-index="${displayIndex}">
        <div class="submission-header">
          <div class="submission-id">${admission}</div>
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

  // Attach click handlers for view buttons and items
  document.querySelectorAll(".submission-item").forEach(item => {
    item.addEventListener("click", function (e) {
      const idx = parseInt(this.getAttribute("data-index"), 10);
      viewDetailsByIndex(idx);
    });
  });
  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const idx = parseInt(this.getAttribute("data-index"), 10);
      viewDetailsByIndex(idx);
    });
  });
}

/* ---------- Modal / Details ---------- */
function viewDetailsByIndex(index) {
  const submissions = loadSubmissionsFromLocal();
  const item = submissions[index];
  if (!item) return;
  currentSubmission = normalizeFetchedItem(item);
  openModalWithSubmission(currentSubmission);
}

function openModalWithSubmission(student) {
  const modal = document.getElementById("detailModal");
  const detailsContent = document.getElementById("detailsContent");

  detailsContent.innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><div class="detail-label">Name</div><div class="detail-value">${escapeHtml(student.name)}</div></div>
      <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(student.email)}</div></div>
      <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value">${escapeHtml(student.phone)}</div></div>
      <div class="detail-field"><div class="detail-label">School</div><div class="detail-value">${escapeHtml(student.school)}</div></div>
      <div class="detail-field"><div class="detail-label">Subjects</div><div class="detail-value">${escapeHtml(student.subjects)}</div></div>
      <div class="detail-field"><div class="detail-label">Grade</div><div class="detail-value">${escapeHtml(student.grade)}</div></div>
      <div class="detail-field"><div class="detail-label">Admission Number</div><div class="detail-value">${escapeHtml(student.admissionNumber)}</div></div>
      <div class="detail-field"><div class="detail-label">Timestamp</div><div class="detail-value">${escapeHtml(student.timestamp)}</div></div>
      <div class="detail-field" style="grid-column: 1 / -1;">
        <div class="detail-label">Comments</div>
        <div class="detail-value">${escapeHtml(student.message)}</div>
      </div>
    </div>
  `;

  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
}

/* ---------- Export: PDF / Image ---------- */
function buildPrintContent(sub) {
  const s = sub || currentSubmission || {};
  return `
    <div class="print-header">
      <h1>Admission Form</h1>
      <p>Fluent Future Academy</p>
    </div>
    <div class="print-body">
      <div class="print-section"><div class="print-section-title">Personal Information</div>
        <div class="print-row"><div class="print-label">Admission Number:</div><div class="print-value">${escapeHtml(s.admissionNumber)}</div></div>
        <div class="print-row"><div class="print-label">Full Name:</div><div class="print-value">${escapeHtml(s.name)}</div></div>
        <div class="print-row"><div class="print-label">Age:</div><div class="print-value">${escapeHtml(s.age)}</div></div>
        <div class="print-row"><div class="print-label">Gender:</div><div class="print-value">${escapeHtml(s.gender)}</div></div>
      </div>
      <div class="print-section"><div class="print-section-title">Contact Information</div>
        <div class="print-row"><div class="print-label">Email:</div><div class="print-value">${escapeHtml(s.email)}</div></div>
        <div class="print-row"><div class="print-label">Phone:</div><div class="print-value">${escapeHtml(s.phone)}</div></div>
      </div>
      <div class="print-section"><div class="print-section-title">Academic Information</div>
        <div class="print-row"><div class="print-label">School:</div><div class="print-value">${escapeHtml(s.school)}</div></div>
        <div class="print-row"><div class="print-label">Grade:</div><div class="print-value">${escapeHtml(s.grade)}</div></div>
        <div class="print-row"><div class="print-label">Subjects:</div><div class="print-value">${escapeHtml(s.subjects)}</div></div>
      </div>
      <div class="print-section"><div class="print-section-title">Additional Information</div>
        <div class="print-row"><div class="print-label">Comments:</div><div class="print-value">${escapeHtml(s.message)}</div></div>
        <div class="print-row"><div class="print-label">Submission Date:</div><div class="print-value">${escapeHtml(s.timestamp)}</div></div>
      </div>
    </div>
  `;
}

function downloadPDF() {
  if (!currentSubmission) return;
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";

  const opt = {
    margin: 10,
    filename: `admission-${(currentSubmission.admissionNumber || 'form')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(printArea).save().then(() => {
    printArea.style.display = "none";
  }).catch(() => {
    printArea.style.display = "none";
  });
}

function downloadImage() {
  if (!currentSubmission) return;
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";

  setTimeout(() => {
    html2canvas(printArea, { scale: 2, useCORS: true }).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `admission-${(currentSubmission.admissionNumber || 'form')}.png`;
      link.click();
      printArea.style.display = "none";
    }).catch(() => {
      printArea.style.display = "none";
    });
  }, 400);
}

/* ---------- CSV Export / Clear / Refresh ---------- */
function exportToCSV() {
  const submissions = loadSubmissionsFromLocal();
  if (!submissions.length) {
    alert("No submissions to export!");
    return;
  }

  const headers = [
    "Admission Number",
    "Name",
    "Email",
    "Phone",
    "Age",
    "Gender",
    "School",
    "Grade",
    "Subjects",
    "Comments",
    "Timestamp"
  ];

  const rows = submissions.map(s => [
    s.admissionNumber || "",
    s.name || "",
    s.email || "",
    s.phone || "",
    s.age || "",
    s.gender || "",
    s.school || "",
    s.grade || "",
    s.subjects || "",
    s.message || "",
    s.timestamp || ""
  ]);

  const csv = [headers].concat(rows)
    .map(r => r.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

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
  fetchData();
  alert("✓ Data refreshed!");
}

/* ---------- Fetch from Google Sheets and merge ---------- */
function fetchData() {
  // Fetch sheet data (assumes the web app returns JSON array)
  fetch(WEB_APP_URL)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        console.warn("Unexpected data from sheet:", data);
        return;
      }

      // Normalize and merge into localStorage
      const local = JSON.parse(localStorage.getItem("submissions") || "[]");
      const existingIds = new Set(local.map(i => (i.admissionNumber || i.AdmissionNumber || "").toString()));

      let added = 0;
      data.forEach(rawItem => {
        const item = normalizeFetchedItem(rawItem);
        const id = (item.admissionNumber || "").toString();
        if (!id) return;
        if (!existingIds.has(id)) {
          // push normalized object with lowercase keys
          local.push({
            admissionNumber: item.admissionNumber,
            name: item.name,
            email: item.email,
            phone: item.phone,
            age: item.age,
            gender: item.gender,
            school: item.school,
            grade: item.grade,
            subjects: item.subjects,
            message: item.message,
            timestamp: item.timestamp
          });
          existingIds.add(id);
          added++;
        }
      });

      if (added > 0) {
        localStorage.setItem("submissions", JSON.stringify(local));
        console.log(`Merged ${added} new submissions from Google Sheets into localStorage.`);
      } else {
        console.log("No new submissions to merge.");
      }

      // Update lastAdmissionNumber if sheet has higher
      const lastFromSheet = data.length ? normalizeFetchedItem(data[data.length - 1]).admissionNumber : null;
      if (lastFromSheet) {
        const numeric = parseInt(String(lastFromSheet).replace(/\D/g, ""), 10);
        if (!isNaN(numeric)) {
          const currentLast = getLastAdmissionNumber();
          if (numeric > currentLast) saveAdmissionNumber(numeric);
        }
      }

      renderSubmissions();
    })
    .catch(err => {
      console.error("Error fetching sheet data:", err);
      // still render local data
      renderSubmissions();
    });
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- Modal close handlers ---------- */
function closeModal() {
  const modal = document.getElementById("detailModal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", function () {
  // Buttons
  document.getElementById("btnExportCSV").addEventListener("click", exportToCSV);
  document.getElementById("btnClearAll").addEventListener("click", clearAllData);
  document.getElementById("btnRefresh").addEventListener("click", fetchData);

  // Modal buttons
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("btnClose").addEventListener("click", closeModal);
  document.getElementById("btnDownloadPDF").addEventListener("click", downloadPDF);
  document.getElementById("btnDownloadImage").addEventListener("click", downloadImage);

  // Click outside modal to close
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("detailModal");
    if (event.target === modal) {
      closeModal();
    }
  });

  // Initial load: merge sheet -> local -> render
  fetchData();
});
