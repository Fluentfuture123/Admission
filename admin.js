/* admin.js - Fluent Future Admin Panel */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem("submissions") || "[]");
  } catch (e) {
    return [];
  }
}
function saveLocal(arr) {
  localStorage.setItem("submissions", JSON.stringify(arr));
}

let currentSubmission = null;

/* Render submissions list */
function renderSubmissions() {
  const subs = loadLocal();
  const list = document.getElementById("submissionsList");
  document.getElementById("totalCount").textContent = subs.length;
  document.getElementById("lastId").textContent = subs.length ? subs[subs.length - 1].admissionNumber : "-";

  if (!subs.length) {
    list.innerHTML = '<div class="no-submissions">No submissions yet</div>';
    return;
  }

  list.innerHTML = subs.map((s, i) => {
    const ts = s.timestamp ? new Date(s.timestamp).toLocaleString("en-US", { hour12: true }) : "Unknown";
    return `
      <div class="submission-item" data-index="${i}">
        <div class="submission-header">
          <div>
            <div class="submission-id">${s.admissionNumber || "N/A"}</div>
            <div class="submission-meta"><span><strong>Student:</strong> ${escapeHtml(s.name || "N/A")}</span> <span><strong>Date:</strong> ${escapeHtml(ts)}</span></div>
          </div>
        </div>
        <div class="submission-actions">
          <button class="btn-view" data-index="${i}">👁️ View</button>
          <button class="btn-delete-single" data-index="${i}">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join("");

  // attach handlers
  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      viewDetails(idx);
    });
  });
  document.querySelectorAll(".btn-delete-single").forEach(btn => {
    btn.addEventListener("click", e => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      deleteSubmission(idx);
    });
  });
}

/* Escape HTML to avoid injection when rendering */
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* View details in modal */
function viewDetails(index) {
  const subs = loadLocal();
  const s = subs[index];
  if (!s) return;
  currentSubmission = s;

  const ts = s.timestamp ? new Date(s.timestamp).toLocaleString("en-US", { hour12: true }) : "Unknown";

  document.getElementById("detailsContent").innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><div class="detail-label">Name</div><div class="detail-value">${escapeHtml(s.name)}</div></div>
      <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(s.email)}</div></div>
      <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value">${escapeHtml(s.phone)}</div></div>
      <div class="detail-field"><div class="detail-label">School</div><div class="detail-value">${escapeHtml(s.school)}</div></div>
      <div class="detail-field"><div class="detail-label">Grade</div><div class="detail-value">${escapeHtml(s.grade)}</div></div>
      <div class="detail-field"><div class="detail-label">Admission No</div><div class="detail-value">${escapeHtml(s.admissionNumber)}</div></div>
      <div class="detail-field"><div class="detail-label">Timestamp</div><div class="detail-value">${escapeHtml(ts)}</div></div>
      <div class="detail-field full"><div class="detail-label">Comments</div><div class="detail-value">${escapeHtml(s.message || "-")}</div></div>
    </div>
  `;

  document.getElementById("detailModal").style.display = "block";
}

/* Close modal */
function closeModal() {
  document.getElementById("detailModal").style.display = "none";
  currentSubmission = null;
  // clear print area to avoid stray content
  const pa = document.getElementById("printArea");
  pa.innerHTML = "";
  pa.style.display = "none";
}

/* Delete single submission */
function deleteSubmission(index) {
  if (!confirm("Delete this submission?")) return;
  const subs = loadLocal();
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
  const headers = ["Admission No", "Name", "Email", "Phone", "School", "Grade", "Comments", "Timestamp"];
  const rows = subs.map(s => [
    s.admissionNumber || "",
    s.name || "",
    s.email || "",
    s.phone || "",
    s.school || "",
    s.grade || "",
    (s.message || "").replace(/\n/g, " "),
    s.timestamp ? new Date(s.timestamp).toLocaleString("en-US", { hour12: true }) : ""
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

/* Build styled print content for PDF/Image (A4) */
function buildPrintContent(s) {
  const ts = s.timestamp ? new Date(s.timestamp).toLocaleString("en-US", { hour12: true }) : "";
  return `
    <div style="width:210mm;min-height:297mm;padding:20mm;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#222;">
      <div style="text-align:center;border-bottom:4px solid #4CAF50;padding-bottom:10px;margin-bottom:12px;">
        <h1 style="margin:0;color:#2f8f3a;font-size:22px;">Fluent Future Academy</h1>
        <div style="font-size:12px;color:#555;margin-top:6px;">Admission Form</div>
      </div>

      <div style="display:flex;gap:20px;margin-bottom:10px;">
        <div style="flex:1;">
          <div style="font-size:11px;color:#777;margin-bottom:6px;">Name</div>
          <div style="font-size:14px;font-weight:600;color:#111;">${escapeHtml(s.name || "")}</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:11px;color:#777;margin-bottom:6px;">Admission No</div>
          <div style="font-size:14px;font-weight:600;color:#111;">${escapeHtml(s.admissionNumber || "")}</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;margin-bottom:10px;">
        <div style="flex:1;">
          <div style="font-size:11px;color:#777;margin-bottom:6px;">Email</div>
          <div style="font-size:13px;color:#111;">${escapeHtml(s.email || "")}</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:11px;color:#777;margin-bottom:6px;">Phone</div>
          <div style="font-size:13px;color:#111;">${escapeHtml(s.phone || "")}</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;margin-bottom:10px;">
        <div style="flex:1;">
          <div style="font-size:11px;color:#777;margin-bottom:6px;">School</div>
          <div style="font-size:13px;color:#111;">${escapeHtml(s.school || "")}</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:11px;color:#777;margin-bottom:6px;">Grade</div>
          <div style="font-size:13px;color:#111;">${escapeHtml(s.grade || "")}</div>
        </div>
      </div>

      <div style="margin-top:12px;">
        <div style="font-size:11px;color:#777;margin-bottom:6px;">Comments</div>
        <div style="font-size:13px;color:#111;min-height:40px;border:1px dashed #e0e0e0;padding:10px;border-radius:6px;">${escapeHtml(s.message || "-")}</div>
      </div>

      <div style="margin-top:18px;font-size:12px;color:#555;">
        <div><strong>Submitted:</strong> ${escapeHtml(ts)}</div>
      </div>

      <div style="position:absolute;bottom:20mm;left:20mm;font-size:10px;color:#999;">
        Generated by Fluent Future Admin Panel
      </div>
    </div>
  `;
}

/* Download PDF (A4) */
function downloadPDF() {
  if (!currentSubmission) return alert("No submission selected.");
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";

  const opt = {
    margin: 10,
    filename: `admission-${(currentSubmission.admissionNumber || "form")}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(printArea).save().then(() => {
    printArea.style.display = "none";
    printArea.innerHTML = "";
  }).catch(() => {
    printArea.style.display = "none";
  });
}

/* Download Image (A4 PNG) */
function downloadImage() {
  if (!currentSubmission) return alert("No submission selected.");
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission);
  printArea.style.display = "block";

  html2canvas(printArea, { scale: 2, useCORS: true, backgroundColor: "#ffffff" }).then(canvas => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `admission-${(currentSubmission.admissionNumber || "form")}.png`;
    link.click();
    printArea.style.display = "none";
    printArea.innerHTML = "";
  }).catch(() => {
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
        // adapt to your sheet headers (case sensitive)
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
            message: raw.Message || raw.message || "",
            timestamp: raw.Timestamp || raw.timestamp || new Date().toISOString()
          });
        }
      });
      saveLocal(local);
      renderSubmissions();
    })
    .catch(err => {
      // If fetch fails, still render local data (no overwrite)
      console.warn("Fetch failed:", err);
      renderSubmissions();
    });
}

/* Init: attach event listeners */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnExportCSV").addEventListener("click", exportCSV);
  document.getElementById("btnClearAll").addEventListener("click", clearAll);
  document.getElementById("btnRefresh").addEventListener("click", fetchAndMerge);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("btnClose").addEventListener("click", closeModal);
  document.getElementById("btnDownloadPDF").addEventListener("click", downloadPDF);
  document.getElementById("btnDownloadImage").addEventListener("click", downloadImage);

  // initial render and try to fetch remote data
  renderSubmissions();
  fetchAndMerge();
});
