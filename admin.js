/* admin.js - Fluent Future Admin Panel (Enhanced PDF/Image with Logo) */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

function loadLocal() {
  try { return JSON.parse(localStorage.getItem("submissions") || "[]"); }
  catch (e) { return []; }
}
function saveLocal(arr) { localStorage.setItem("submissions", JSON.stringify(arr)); }

let currentSubmission = null;

/* Helpers */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* Format timestamp robustly */
function formatTimestamp(ts) {
  if (!ts && ts !== 0) return "";
  if (ts instanceof Date && !isNaN(ts)) return ts.toLocaleString("en-US", { hour12: true });
  const parsed = Date.parse(ts);
  if (!isNaN(parsed)) return new Date(parsed).toLocaleString("en-US", { hour12: true });
  return String(ts);
}

/* Normalize subjects for display/export */
function getSubjectsValue(s) {
  if (!s) return "";
  const raw = s.subjects ?? s.subject ?? "";
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.join(", ");
  if (typeof raw === "string") return raw;
  try { return String(raw); } catch (e) { return ""; }
}

/* Render submissions list */
function renderSubmissions() {
  const subs = loadLocal();
  const list = document.getElementById("submissionsList");
  const totalCountEl = document.getElementById("totalCount");
  const lastIdEl = document.getElementById("lastId");

  if (totalCountEl) totalCountEl.textContent = subs.length;
  if (lastIdEl) lastIdEl.textContent = subs.length ? subs[subs.length - 1].admissionNumber : "-";
  if (!list) return;

  if (!subs.length) {
    list.innerHTML = '<div class="no-submissions">No submissions yet</div>';
    return;
  }

  list.innerHTML = subs.map((s, i) => {
    const ts = formatTimestamp(s.timestamp) || "Unknown";
    return `
      <div class="submission-item" data-index="${i}">
        <div>
          <div class="submission-id">${escapeHtml(s.admissionNumber || "N/A")}</div>
          <div class="submission-meta">
            <span><strong>Student:</strong> ${escapeHtml(s.name || "N/A")}</span>
            <span><strong>Date:</strong> ${escapeHtml(ts)}</span>
            <span><strong>Subjects:</strong> ${escapeHtml(getSubjectsValue(s) || "—")}</span>
          </div>
        </div>
        <div class="submission-actions">
          <button class="btn-view" data-index="${i}">👁️ View</button>
          <button class="btn-delete-single" data-index="${i}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.removeEventListener("click", onViewClick);
    btn.addEventListener("click", onViewClick);
  });
  document.querySelectorAll(".btn-delete-single").forEach(btn => {
    btn.removeEventListener("click", onDeleteClick);
    btn.addEventListener("click", onDeleteClick);
  });
}
function onViewClick(e) { const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10); viewDetails(idx); }
function onDeleteClick(e) { const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10); deleteSubmission(idx); }

/* View details in modal */
function viewDetails(index) {
  const subs = loadLocal();
  const s = subs[index];
  if (!s) return;
  currentSubmission = s;
  const ts = formatTimestamp(s.timestamp) || "Unknown";
  const detailsContent = document.getElementById("detailsContent");
  if (!detailsContent) return;

  detailsContent.innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><div class="detail-label">Name</div><div class="detail-value">${escapeHtml(s.name)}</div></div>
      <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(s.email)}</div></div>
      <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value">${escapeHtml(s.phone)}</div></div>
      <div class="detail-field"><div class="detail-label">School</div><div class="detail-value">${escapeHtml(s.school)}</div></div>
      <div class="detail-field"><div class="detail-label">Grade</div><div class="detail-value">${escapeHtml(s.grade)}</div></div>
      <div class="detail-field"><div class="detail-label">Subjects</div><div class="detail-value">${escapeHtml(getSubjectsValue(s) || "-")}</div></div>
      <div class="detail-field"><div class="detail-label">Admission No</div><div class="detail-value">${escapeHtml(s.admissionNumber)}</div></div>
      <div class="detail-field"><div class="detail-label">Timestamp</div><div class="detail-value">${escapeHtml(ts)}</div></div>
      <div class="detail-field full"><div class="detail-label">Comments</div><div class="detail-value">${escapeHtml(s.message || "-")}</div></div>
    </div>
  `;

  const modal = document.getElementById("detailModal");
  if (modal) modal.style.display = "block";
}

/* Close modal */
function closeModal() {
  const modal = document.getElementById("detailModal");
  if (modal) modal.style.display = "none";
  currentSubmission = null;
  const pa = document.getElementById("printArea");
  if (pa) { pa.innerHTML = ""; pa.style.display = "none"; }
}

/* Delete single submission */
function deleteSubmission(index) {
  if (!confirm("Delete this submission?")) return;
  const subs = loadLocal();
  if (index < 0 || index >= subs.length) return;
  subs.splice(index, 1);
  saveLocal(subs);
  renderSubmissions();
  closeModal();
}

/* Clear all submissions */
function clearAll() {
  if (!confirm("Delete all submissions?")) return;
  localStorage.removeItem("submissions");
  renderSubmissions();
  closeModal();
}

/* Export CSV */
function exportCSV() {
  const subs = loadLocal();
  if (!subs.length) return alert("No submissions!");
  const headers = ["Admission No", "Name", "Email", "Phone", "School", "Grade", "Subjects", "Comments", "Timestamp"];
  const rows = subs.map(s => [
    s.admissionNumber || "",
    s.name || "",
    s.email || "",
    s.phone || "",
    s.school || "",
    s.grade || "",
    getSubjectsValue(s) || "",
    (s.message || "").replace(/\n/g, " "),
    formatTimestamp(s.timestamp) || ""
  ]);
  const csv = [headers].concat(rows).map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "submissions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================ */
/*  AMAZING A4 PRINT CONTENT BUILDER (with Logo)                */
/* ============================================================ */
function buildPrintContent(s) {
  const ts = formatTimestamp(s.timestamp) || "";
  const subjects = getSubjectsValue(s) || "—";

  return `
    <div class="print-sheet">
      <!-- Top Green Bar -->
      <div class="print-top-bar"></div>

      <!-- Header with Logo -->
      <div class="print-header">
        <div class="print-logo-wrap">
          <img src="IMG/logo.jpeg" class="print-logo-img"
            onerror="this.style.display='none'; this.parentNode.querySelector('.print-logo-fallback').style.display='flex';">
          <div class="print-logo-fallback">FF</div>
        </div>
        <div class="print-header-center">
          <div class="print-academy-name">FLUENT FUTURE ACADEMY</div>
          <div class="print-tagline">Shaping Minds, Building Futures</div>
          <div class="print-contact-small">📞 +94 768 980 815 &nbsp;|&nbsp; ✉️ fluentfutureacademylk@gmail.com</div>
        </div>
        <div class="print-admission-badge">
          <div class="print-badge-label">ADMISSION NO</div>
          <div class="print-badge-value">${escapeHtml(s.admissionNumber || "")}</div>
          <div class="print-badge-date">${escapeHtml(ts)}</div>
        </div>
      </div>

      <!-- Decorative watermark -->
      <div class="print-watermark">FLUENT FUTURE</div>

      <!-- Main Body -->
      <div class="print-body">

        <!-- Personal Info -->
        <div class="print-section">
          <div class="print-section-header">
            <div class="print-section-icon">👤</div>
            <div class="print-section-title">Personal Information</div>
          </div>
          <div class="print-grid-3">
            <div class="print-field-box">
              <div class="print-field-label">Full Name</div>
              <div class="print-field-value">${escapeHtml(s.name || "—")}</div>
            </div>
            <div class="print-field-box">
              <div class="print-field-label">Age</div>
              <div class="print-field-value">${escapeHtml(s.age || "—")}</div>
            </div>
            <div class="print-field-box">
              <div class="print-field-label">Gender</div>
              <div class="print-field-value">${escapeHtml(s.gender || "—")}</div>
            </div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="print-section">
          <div class="print-section-header">
            <div class="print-section-icon">📞</div>
            <div class="print-section-title">Contact Information</div>
          </div>
          <div class="print-grid-2">
            <div class="print-field-box">
              <div class="print-field-label">Email Address</div>
              <div class="print-field-value">${escapeHtml(s.email || "—")}</div>
            </div>
            <div class="print-field-box">
              <div class="print-field-label">Phone Number</div>
              <div class="print-field-value">${escapeHtml(s.phone || "—")}</div>
            </div>
          </div>
          <div class="print-field-box full">
            <div class="print-field-label">School Name</div>
            <div class="print-field-value">${escapeHtml(s.school || "—")}</div>
          </div>
        </div>

        <!-- Academic Info -->
        <div class="print-section">
          <div class="print-section-header">
            <div class="print-section-icon">📚</div>
            <div class="print-section-title">Academic Information</div>
          </div>
          <div class="print-grid-2">
            <div class="print-field-box">
              <div class="print-field-label">Grade</div>
              <div class="print-field-value">${escapeHtml(s.grade || "—")}</div>
            </div>
            <div class="print-field-box">
              <div class="print-field-label">Selected Subjects</div>
              <div class="print-field-value">${escapeHtml(subjects)}</div>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="print-section">
          <div class="print-section-header">
            <div class="print-section-icon">📝</div>
            <div class="print-section-title">Additional Comments</div>
          </div>
          <div class="print-comments-box">
            ${escapeHtml(s.message || "No additional comments provided.")}
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="print-footer">
        <div class="print-signature-area">
          <div class="print-signature-box">
            <div class="print-signature-line"></div>
            <div class="print-signature-label">Student / Parent Signature</div>
          </div>
          <div class="print-signature-box">
            <div class="print-signature-line"></div>
            <div class="print-signature-label">Authorized By</div>
          </div>
        </div>
        <div class="print-footer-text">
          <div>📅 Generated on: ${escapeHtml(ts)}</div>
          <div>Fluent Future Academy | www.fluentfuture.com | This is a computer generated document.</div>
        </div>
      </div>

      <!-- Bottom Green Bar -->
      <div class="print-bottom-bar"></div>
    </div>
  `;
}

/* ============================================================ */
/*  PDF EXPORT (waits for logo image to load)                   */
/* ============================================================ */
async function downloadPDF() {
  if (!currentSubmission) return alert("No submission selected.");

  let printArea = document.getElementById("printArea");
  if (!printArea) {
    printArea = document.createElement("div");
    printArea.id = "printArea";
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";
  printArea.style.visibility = "visible";
  printArea.style.position = "relative";
  printArea.style.background = "#ffffff";
  printArea.style.width = "210mm";
  printArea.style.minHeight = "297mm";
  printArea.style.padding = "0";
  printArea.style.margin = "0 auto";

  // Wait for all images to load (especially the logo)
  const images = printArea.querySelectorAll("img");
  await Promise.all(Array.from(images).map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 1200); // safety timeout
    });
  }));

  // Extra wait for fonts & layout stabilization
  await new Promise(resolve => setTimeout(resolve, 600));

  const opt = {
    margin: [4, 4, 4, 4],
    filename: `admission-${(currentSubmission.admissionNumber || "form")}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2.5, useCORS: true, backgroundColor: "#ffffff", logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(printArea).save();
  } catch (err) {
    console.error("PDF export error:", err);
    alert("PDF export failed. See console for details.");
  } finally {
    printArea.style.display = "none";
    printArea.innerHTML = "";
  }
}

/* ============================================================ */
/*  IMAGE EXPORT (waits for logo image to load)                 */
/* ============================================================ */
async function downloadImage() {
  if (!currentSubmission) return alert("No submission selected.");

  let printArea = document.getElementById("printArea");
  if (!printArea) {
    printArea = document.createElement("div");
    printArea.id = "printArea";
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";
  printArea.style.visibility = "visible";
  printArea.style.position = "relative";
  printArea.style.background = "#ffffff";
  printArea.style.width = "210mm";
  printArea.style.minHeight = "297mm";

  // Wait for images
  const images = printArea.querySelectorAll("img");
  await Promise.all(Array.from(images).map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      setTimeout(resolve, 1200);
    });
  }));

  await new Promise(resolve => setTimeout(resolve, 600));

  try {
    const canvas = await html2canvas(printArea, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,  // 210mm in pixels at 96dpi
      height: 1123 // 297mm in pixels at 96dpi
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `admission-${(currentSubmission.admissionNumber || "form")}.png`;
    link.click();
  } catch (err) {
    console.error("Image export error:", err);
    alert("Image export failed.");
  } finally {
    printArea.style.display = "none";
    printArea.innerHTML = "";
  }
}

/* Fetch from Google Apps Script and merge into localStorage */
function fetchAndMerge() {
  fetch(WEB_APP_URL)
    .then(r => r.json())
    .then(data => {
      if (!Array.isArray(data)) throw new Error("Invalid data");
      const local = loadLocal();
      const existing = new Set(local.map(x => x.admissionNumber));
      data.forEach(raw => {
        const admissionNumber = raw.AdmissionNumber || raw.admissionNumber || raw["Admission No"] || "";
        if (!admissionNumber) return;
        if (!existing.has(admissionNumber)) {
          local.push({
            admissionNumber: admissionNumber,
            name: raw.Name || raw.name || "",
            email: raw.Email || raw.email || "",
            phone: raw.Phone || raw.phone || "",
            school: raw.School || raw.school || "",
            grade: raw.Grade || raw.grade || "",
            subjects: raw.Subjects || raw.subjects || raw.Subject || raw.subject || "",
            message: raw.Message || raw.message || "",
            timestamp: raw.Timestamp || raw.timestamp || new Date().toISOString()
          });
        }
      });
      saveLocal(local);
      renderSubmissions();
    })
    .catch(err => {
      console.warn("Fetch failed:", err);
      renderSubmissions();
    });
}

/* Init */
document.addEventListener("DOMContentLoaded", () => {
  const btnExport = document.getElementById("btnExportCSV");
  if (btnExport) btnExport.addEventListener("click", exportCSV);
  const btnClear = document.getElementById("btnClearAll");
  if (btnClear) btnClear.addEventListener("click", clearAll);
  const btnRefresh = document.getElementById("btnRefresh");
  if (btnRefresh) btnRefresh.addEventListener("click", fetchAndMerge);
  const closeModalBtn = document.getElementById("closeModalBtn");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  const btnClose = document.getElementById("btnClose");
  if (btnClose) btnClose.addEventListener("click", closeModal);
  const btnPDF = document.getElementById("btnDownloadPDF");
  if (btnPDF) btnPDF.addEventListener("click", downloadPDF);
  const btnImage = document.getElementById("btnDownloadImage");
  if (btnImage) btnImage.addEventListener("click", downloadImage);

  renderSubmissions();
  fetchAndMerge();
});