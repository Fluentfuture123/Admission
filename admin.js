/* admin.js - Fluent Future Admin Panel (final) */
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

/* Build centered print content for PDF/Image (A4) */
function buildPrintContent(s) {
  const ts = formatTimestamp(s.timestamp) || "";
  return `
    <div class="print-sheet" style="width:160mm;margin:15mm auto;padding:15mm;background:#ffffff;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;color:#222;">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid #e6f4ea;padding-bottom:10px;margin-bottom:14px;">
        <div style="width:56px;height:56px;border-radius:8px;background:#2f8f3a;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px;">FF</div>
        <div>
          <div style="font-size:20px;color:#2f8f3a;font-weight:800;margin-bottom:2px;">Fluent Future Academy</div>
          <div style="font-size:12px;color:#666;">Admission Form</div>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:11px;color:#666;">
          <div>Admission No: <strong style="color:#111;">${escapeHtml(s.admissionNumber || "")}</strong></div>
          <div style="margin-top:6px;">Date: <strong style="color:#111;">${escapeHtml(ts)}</strong></div>
        </div>
      </div>

      <div style="display:block;gap:12px;">
        <div style="display:flex;gap:18px;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="font-size:11px;color:#777;margin-bottom:6px;">Full Name</div>
            <div style="font-size:14px;color:#111;font-weight:700;">${escapeHtml(s.name || "")}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;color:#777;margin-bottom:6px;">Email</div>
            <div style="font-size:14px;color:#111;">${escapeHtml(s.email || "")}</div>
          </div>
        </div>

        <div style="display:flex;gap:18px;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="font-size:11px;color:#777;margin-bottom:6px;">Phone</div>
            <div style="font-size:14px;color:#111;">${escapeHtml(s.phone || "")}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;color:#777;margin-bottom:6px;">School</div>
            <div style="font-size:14px;color:#111;">${escapeHtml(s.school || "")}</div>
          </div>
        </div>

        <div style="display:flex;gap:18px;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="font-size:11px;color:#777;margin-bottom:6px;">Grade</div>
            <div style="font-size:14px;color:#111;">${escapeHtml(s.grade || "")}</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;color:#777;margin-bottom:6px;">Subjects</div>
            <div style="font-size:14px;color:#111;">${escapeHtml(getSubjectsValue(s) || "")}</div>
          </div>
        </div>

        <div style="margin-top:8px;">
          <div style="font-size:11px;color:#777;margin-bottom:6px;">Comments</div>
          <div style="font-size:13px;color:#111;min-height:48px;border:1px dashed #e6e6e6;padding:10px;border-radius:6px;">${escapeHtml(s.message || "-")}</div>
        </div>
      </div>

      <div style="margin-top:18px;font-size:12px;color:#555;">
        <div><strong>Submitted:</strong> ${escapeHtml(ts)}</div>
      </div>

      <div style="margin-top:18px;font-size:10px;color:#999;">Generated by Fluent Future Admin Panel</div>
    </div>
  `;
}

/* Robust PDF export (fixed blank + fit-to-page) */
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

  // allow fonts/images to load
  await new Promise(resolve => setTimeout(resolve, 300));

  const opt = {
    margin: 5, // smaller margin to ensure fit
    filename: `admission-${(currentSubmission.admissionNumber || "form")}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2.5, useCORS: true, backgroundColor: "#ffffff" },
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

/* Image export */
function downloadImage() {
  if (!currentSubmission) return alert("No submission selected.");
  let printArea = document.getElementById("printArea");
  if (!printArea) {
    printArea = document.createElement("div");
    printArea.id = "printArea";
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";

  html2canvas(printArea, { scale: 2.5, useCORS: true, backgroundColor: "#ffffff" }).then(canvas => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `admission-${(currentSubmission.admissionNumber || "form")}.png`;
    link.click();
    printArea.style.display = "none";
    printArea.innerHTML = "";
  }).catch(err => {
    console.error("Image export error:", err);
    printArea.style.display = "none";
    printArea.innerHTML = "";
    alert("Image export failed.");
  });
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
