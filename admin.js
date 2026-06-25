/* admin.js - Fluent Future Admin Panel (Fixed: Image + Single-Page A4) */
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

function formatTimestamp(ts) {
  if (!ts && ts !== 0) return "";
  if (ts instanceof Date && !isNaN(ts)) return ts.toLocaleString("en-US", { hour12: true });
  const parsed = Date.parse(ts);
  if (!isNaN(parsed)) return new Date(parsed).toLocaleString("en-US", { hour12: true });
  return String(ts);
}

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
/*  COMPACT SINGLE-PAGE A4 BUILDER (Inline styles = reliable) */
/* ============================================================ */
function buildA4Content(s) {
  const ts = formatTimestamp(s.timestamp) || "";
  const subjects = getSubjectsValue(s) || "—";
  const logoSrc = "IMG/logo.jpeg";

  return `
  <div style="width:210mm; height:297mm; background:#ffffff; font-family:'Segoe UI',Arial,sans-serif; color:#222; position:relative; overflow:hidden; box-sizing:border-box; margin:0; padding:0;">

    <!-- Top Green Bar -->
    <div style="height:5px; background:linear-gradient(90deg,#1b5e20,#2f8f3a,#4CAF50,#2f8f3a,#1b5e20);"></div>

    <!-- Header -->
    <div style="display:flex; align-items:center; gap:14px; padding:10px 18px; background:linear-gradient(135deg,#f1faff 0%,#ffffff 100%); border-bottom:1.5px solid #e6f4ea;">
      <div style="width:52px; height:52px; flex-shrink:0; background:#fff; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center; overflow:hidden;">
        <img src="${logoSrc}" style="width:48px; height:48px; object-fit:contain; display:block;"
          onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\'width:48px;height:48px;background:linear-gradient(135deg,#4CAF50,#2f8f3a);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;\\'>FF</div>';">
      </div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:17px; font-weight:800; color:#2f8f3a; letter-spacing:1px; line-height:1.2;">FLUENT FUTURE ACADEMY</div>
        <div style="font-size:9px; color:#666; font-style:italic; margin-top:1px;">Shaping Minds, Building Futures</div>
        <div style="font-size:8px; color:#888; margin-top:2px;">📞 +94 768 980 815 &nbsp;|&nbsp; ✉️ fluentfutureacademylk@gmail.com</div>
      </div>
      <div style="background:linear-gradient(135deg,#2f8f3a,#4CAF50); color:#fff; padding:7px 12px; border-radius:8px; text-align:center; box-shadow:0 3px 10px rgba(47,143,58,0.3); flex-shrink:0; min-width:110px;">
        <div style="font-size:7px; text-transform:uppercase; letter-spacing:1.2px; opacity:0.9; font-weight:700;">Admission No</div>
        <div style="font-size:15px; font-weight:800; margin-top:1px; letter-spacing:0.3px;">${escapeHtml(s.admissionNumber || "")}</div>
        <div style="font-size:7px; opacity:0.85; margin-top:1px; font-weight:500;">${escapeHtml(ts)}</div>
      </div>
    </div>

    <!-- Watermark -->
    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-25deg); font-size:64px; font-weight:900; color:rgba(47,143,58,0.035); letter-spacing:6px; pointer-events:none; z-index:0; white-space:nowrap;">FLUENT FUTURE</div>

    <!-- Body -->
    <div style="padding:8px 18px; position:relative; z-index:1;">

      <!-- Personal -->
      <div style="margin-bottom:6px; background:#fafbfc; border-radius:7px; border:1px solid #e8ecef; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; gap:6px; padding:5px 10px; background:linear-gradient(90deg,#e6f4ea,#f1faff); border-bottom:1px solid #d0eaff;">
          <span style="font-size:13px; line-height:1;">👤</span>
          <span style="font-size:9px; font-weight:700; color:#2f8f3a; text-transform:uppercase; letter-spacing:1px;">Personal Information</span>
        </div>
        <div style="display:grid; grid-template-columns:1.2fr 0.5fr 0.7fr; gap:6px; padding:6px 10px;">
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">Full Name</div>
            <div style="font-size:11px; color:#222; font-weight:700; line-height:1.3;">${escapeHtml(s.name || "—")}</div>
          </div>
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">Age</div>
            <div style="font-size:11px; color:#222; font-weight:700;">${escapeHtml(s.age || "—")}</div>
          </div>
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">Gender</div>
            <div style="font-size:11px; color:#222; font-weight:700;">${escapeHtml(s.gender || "—")}</div>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div style="margin-bottom:6px; background:#fafbfc; border-radius:7px; border:1px solid #e8ecef; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; gap:6px; padding:5px 10px; background:linear-gradient(90deg,#e6f4ea,#f1faff); border-bottom:1px solid #d0eaff;">
          <span style="font-size:13px; line-height:1;">📞</span>
          <span style="font-size:9px; font-weight:700; color:#2f8f3a; text-transform:uppercase; letter-spacing:1px;">Contact Information</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:6px 10px;">
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">Email Address</div>
            <div style="font-size:10px; color:#222; font-weight:600; line-height:1.3; word-break:break-all;">${escapeHtml(s.email || "—")}</div>
          </div>
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">Phone Number</div>
            <div style="font-size:11px; color:#222; font-weight:700;">${escapeHtml(s.phone || "—")}</div>
          </div>
        </div>
        <div style="padding:0 10px 6px 10px;">
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">School Name</div>
            <div style="font-size:11px; color:#222; font-weight:700;">${escapeHtml(s.school || "—")}</div>
          </div>
        </div>
      </div>

      <!-- Academic -->
      <div style="margin-bottom:6px; background:#fafbfc; border-radius:7px; border:1px solid #e8ecef; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; gap:6px; padding:5px 10px; background:linear-gradient(90deg,#e6f4ea,#f1faff); border-bottom:1px solid #d0eaff;">
          <span style="font-size:13px; line-height:1;">📚</span>
          <span style="font-size:9px; font-weight:700; color:#2f8f3a; text-transform:uppercase; letter-spacing:1px;">Academic Information</span>
        </div>
        <div style="display:grid; grid-template-columns:0.6fr 1.4fr; gap:6px; padding:6px 10px;">
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">Grade</div>
            <div style="font-size:11px; color:#222; font-weight:700;">${escapeHtml(s.grade || "—")}</div>
          </div>
          <div style="background:#fff; border:1px solid #e0e6ed; border-radius:5px; padding:5px 8px;">
            <div style="font-size:7px; color:#999; text-transform:uppercase; font-weight:700; margin-bottom:1px; letter-spacing:0.5px;">Selected Subjects</div>
            <div style="font-size:10px; color:#222; font-weight:600; line-height:1.3;">${escapeHtml(subjects)}</div>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div style="margin-bottom:6px; background:#fafbfc; border-radius:7px; border:1px solid #e8ecef; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; gap:6px; padding:5px 10px; background:linear-gradient(90deg,#e6f4ea,#f1faff); border-bottom:1px solid #d0eaff;">
          <span style="font-size:13px; line-height:1;">📝</span>
          <span style="font-size:9px; font-weight:700; color:#2f8f3a; text-transform:uppercase; letter-spacing:1px;">Additional Comments</span>
        </div>
        <div style="padding:6px 10px;">
          <div style="background:#fff; border:1px dashed #c8d6e5; border-radius:5px; padding:6px 8px; min-height:28px; font-size:10px; color:#444; line-height:1.4;">
            ${escapeHtml(s.message || "No additional comments provided.")}
          </div>
        </div>
      </div>

    </div>

    <!-- Footer / Signature -->
    <div style="position:absolute; bottom:22px; left:18px; right:18px; z-index:1;">
      <div style="display:flex; justify-content:space-between; gap:40px; margin-bottom:8px;">
        <div style="flex:1; text-align:center;">
          <div style="border-bottom:1.5px solid #444; height:28px;"></div>
          <div style="font-size:9px; color:#666; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:3px;">Student / Parent Signature</div>
        </div>
        <div style="flex:1; text-align:center;">
          <div style="border-bottom:1.5px solid #444; height:28px;"></div>
          <div style="font-size:9px; color:#666; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-top:3px;">Authorized By</div>
        </div>
      </div>
      <div style="text-align:center; font-size:8px; color:#aaa; line-height:1.5; border-top:1px solid #eee; padding-top:5px;">
        <div>📅 Generated on: ${escapeHtml(ts)} &nbsp;|&nbsp; Fluent Future Academy &nbsp;|&nbsp; www.fluentfuture.com</div>
        <div>This is a computer generated document.</div>
      </div>
    </div>

    <!-- Bottom Green Bar -->
    <div style="height:4px; background:linear-gradient(90deg,#1b5e20,#2f8f3a,#4CAF50,#2f8f3a,#1b5e20); position:absolute; bottom:0; left:0; right:0;"></div>
  </div>
  `;
}

/* ============================================================ */
/*  CREATE TEMP EXPORT ELEMENT (outside modal, off-screen)      */
/* ============================================================ */
function createExportElement(htmlContent) {
  // Remove any old temp element
  const old = document.getElementById("__exportTemp");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "__exportTemp";
  div.innerHTML = htmlContent;

  // Critical: place off-screen but rendered, NOT inside modal
  div.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    background: #fff;
    z-index: 99999;
    visibility: visible;
    display: block;
  `;

  document.body.appendChild(div);
  return div;
}

/* Wait for all images inside element to load */
function waitForImages(element) {
  const imgs = element.querySelectorAll("img");
  const promises = Array.from(imgs).map(img => {
    return new Promise(resolve => {
      if (img.complete && img.naturalHeight !== 0) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 1500); // safety
      }
    });
  });
  return Promise.all(promises);
}

/* ============================================================ */
/*  PDF EXPORT (single page A4)                                 */
/* ============================================================ */
async function downloadPDF() {
  if (!currentSubmission) return alert("No submission selected.");

  const temp = createExportElement(buildA4Content(currentSubmission));

  try {
    await waitForImages(temp);
    await new Promise(r => setTimeout(r, 400)); // layout settle

    const opt = {
      margin: 0,
      filename: `admission-${(currentSubmission.admissionNumber || "form")}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2.2,
        useCORS: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        height: 1123
      },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(temp).save();
  } catch (err) {
    console.error("PDF export error:", err);
    alert("PDF export failed. Check console.");
  } finally {
    temp.remove();
  }
}

/* ============================================================ */
/*  IMAGE EXPORT (PNG, single page A4)                          */
/* ============================================================ */
async function downloadImage() {
  if (!currentSubmission) return alert("No submission selected.");

  const temp = createExportElement(buildA4Content(currentSubmission));

  try {
    await waitForImages(temp);
    await new Promise(r => setTimeout(r, 400));

    const canvas = await html2canvas(temp, {
      scale: 2.2,
      useCORS: false,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
      height: 1123
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `admission-${(currentSubmission.admissionNumber || "form")}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Image export error:", err);
    alert("Image export failed. Check console.");
  } finally {
    temp.remove();
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
