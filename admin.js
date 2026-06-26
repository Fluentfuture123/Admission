/* admin.js - Fluent Future Admin Panel */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

function loadLocal() {
  try { return JSON.parse(localStorage.getItem("submissions") || "[]"); }
  catch (e) { return []; }
}
function saveLocal(arr) { localStorage.setItem("submissions", JSON.stringify(arr)); }

let currentSubmission = null;

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

/* ============================================================ */
/*  RENDER LIST                                               */
/* ============================================================ */
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

/* ============================================================ */
/*  MODAL                                                     */
/* ============================================================ */
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
      <div class="detail-field"><div class="detail-label">Age</div><div class="detail-value">${escapeHtml(s.age || "—")}</div></div>
      <div class="detail-field"><div class="detail-label">Gender</div><div class="detail-value">${escapeHtml(s.gender || "—")}</div></div>
      <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value">${escapeHtml(s.email)}</div></div>
      <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value">${escapeHtml(s.phone)}</div></div>
      <div class="detail-field"><div class="detail-label">School</div><div class="detail-value">${escapeHtml(s.school)}</div></div>
      <div class="detail-field full"><div class="detail-label">Current Residential Address</div><div class="detail-value">${escapeHtml(s.address || "—")}</div></div>
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

function closeModal() {
  const modal = document.getElementById("detailModal");
  if (modal) modal.style.display = "none";
  currentSubmission = null;
}

function deleteSubmission(index) {
  if (!confirm("Delete this submission?")) return;
  const subs = loadLocal();
  if (index < 0 || index >= subs.length) return;
  subs.splice(index, 1);
  saveLocal(subs);
  renderSubmissions();
  closeModal();
}

function clearAll() {
  if (!confirm("Delete all submissions?")) return;
  localStorage.removeItem("submissions");
  renderSubmissions();
  closeModal();
}

function exportCSV() {
  const subs = loadLocal();
  if (!subs.length) return alert("No submissions!");
  const headers = ["Admission No", "Name", "Age", "Gender", "Email", "Phone", "School", "Address", "Grade", "Subjects", "Comments", "Timestamp"];
  const rows = subs.map(s => [
    s.admissionNumber || "",
    s.name || "",
    s.age || "",
    s.gender || "",
    s.email || "",
    s.phone || "",
    s.school || "",
    s.address || "",
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
/*  A4 HTML BUILDER (all pixels, no mm — html2canvas safe)    */
/* ============================================================ */
function buildA4HTML(s) {
  const ts = formatTimestamp(s.timestamp) || "";
  const subjects = getSubjectsValue(s) || "—";
  const logoPath = "IMG/logo.jpeg";

  // Simple green circle SVG as data URI for reliable fallback
  const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234CAF50'/%3E%3Cstop offset='100%25' stop-color='%232f8f3a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='24' cy='24' r='24' fill='url(%23g)'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='white' font-size='20' font-weight='bold' font-family='Arial'%3EFF%3C/text%3E%3C/svg%3E";

  return `
<div id="a4page" style="width:794px;height:1123px;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;color:#222;position:relative;overflow:hidden;box-sizing:border-box;margin:0;padding:0;line-height:1.3;">

  <!-- Top bar -->
  <div style="height:4px;background:linear-gradient(90deg,#1b5e20,#2f8f3a,#4CAF50,#2f8f3a,#1b5e20);"></div>

  <!-- Header -->
  <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;background:linear-gradient(135deg,#f1faff,#ffffff);border-bottom:1.5px solid #e6f4ea;">
    <div style="width:50px;height:50px;flex-shrink:0;background:#fff;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <img src="${logoPath}" style="width:46px;height:46px;object-fit:contain;display:block;"
        onerror="this.src='${fallbackSvg}';this.onerror=null;">
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:16px;font-weight:800;color:#2f8f3a;letter-spacing:0.8px;line-height:1.1;">FLUENT FUTURE ACADEMY</div>
      <div style="font-size:8px;color:#666;font-style:italic;margin-top:1px;">Shaping Minds, Building Futures</div>
      <div style="font-size:7px;color:#888;margin-top:2px;">📞 +94 768 980 815 | ✉️ fluentfutureacademylk@gmail.com</div>
    </div>
    <div style="background:linear-gradient(135deg,#2f8f3a,#4CAF50);color:#fff;padding:6px 10px;border-radius:6px;text-align:center;box-shadow:0 3px 8px rgba(47,143,58,0.25);flex-shrink:0;min-width:100px;">
      <div style="font-size:7px;text-transform:uppercase;letter-spacing:1px;opacity:0.9;font-weight:700;">Admission No</div>
      <div style="font-size:14px;font-weight:800;margin-top:1px;letter-spacing:0.3px;">${escapeHtml(s.admissionNumber || "")}</div>
      <div style="font-size:7px;opacity:0.85;margin-top:1px;font-weight:500;">${escapeHtml(ts)}</div>
    </div>
  </div>

  <!-- Watermark -->
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:60px;font-weight:900;color:rgba(47,143,58,0.03);letter-spacing:5px;pointer-events:none;z-index:0;white-space:nowrap;">FLUENT FUTURE</div>

  <!-- Body -->
  <div style="padding:8px 20px;position:relative;z-index:1;">

    <!-- Personal -->
    <div style="margin-bottom:5px;background:#fafbfc;border-radius:6px;border:1px solid #e8ecef;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
      <div style="display:flex;align-items:center;gap:5px;padding:4px 10px;background:linear-gradient(90deg,#e6f4ea,#f1faff);border-bottom:1px solid #d0eaff;">
        <span style="font-size:12px;line-height:1;">👤</span>
        <span style="font-size:8px;font-weight:700;color:#2f8f3a;text-transform:uppercase;letter-spacing:0.8px;">Personal Information</span>
      </div>
      <div style="display:grid;grid-template-columns:1.3fr 0.4fr 0.6fr;gap:5px;padding:5px 10px;">
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Full Name</div>
          <div style="font-size:11px;color:#222;font-weight:700;line-height:1.2;">${escapeHtml(s.name || "—")}</div>
        </div>
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Age</div>
          <div style="font-size:11px;color:#222;font-weight:700;">${escapeHtml(s.age || "—")}</div>
        </div>
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Gender</div>
          <div style="font-size:11px;color:#222;font-weight:700;">${escapeHtml(s.gender || "—")}</div>
        </div>
      </div>
    </div>

    <!-- Contact -->
    <div style="margin-bottom:5px;background:#fafbfc;border-radius:6px;border:1px solid #e8ecef;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
      <div style="display:flex;align-items:center;gap:5px;padding:4px 10px;background:linear-gradient(90deg,#e6f4ea,#f1faff);border-bottom:1px solid #d0eaff;">
        <span style="font-size:12px;line-height:1;">📞</span>
        <span style="font-size:8px;font-weight:700;color:#2f8f3a;text-transform:uppercase;letter-spacing:0.8px;">Contact Information</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:5px 10px;">
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Email Address</div>
          <div style="font-size:9px;color:#222;font-weight:600;line-height:1.2;word-break:break-all;">${escapeHtml(s.email || "—")}</div>
        </div>
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Phone Number</div>
          <div style="font-size:11px;color:#222;font-weight:700;">${escapeHtml(s.phone || "—")}</div>
        </div>
      </div>
      <div style="padding:0 10px 5px 10px;">
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">School Name</div>
          <div style="font-size:11px;color:#222;font-weight:700;">${escapeHtml(s.school || "—")}</div>
        </div>
      </div>
      <div style="padding:0 10px 5px 10px;">
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Current Residential Address</div>
          <div style="font-size:9px;color:#222;font-weight:600;line-height:1.2;">${escapeHtml(s.address || "—")}</div>
        </div>
      </div>
    </div>

    <!-- Academic -->
    <div style="margin-bottom:5px;background:#fafbfc;border-radius:6px;border:1px solid #e8ecef;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
      <div style="display:flex;align-items:center;gap:5px;padding:4px 10px;background:linear-gradient(90deg,#e6f4ea,#f1faff);border-bottom:1px solid #d0eaff;">
        <span style="font-size:12px;line-height:1;">📚</span>
        <span style="font-size:8px;font-weight:700;color:#2f8f3a;text-transform:uppercase;letter-spacing:0.8px;">Academic Information</span>
      </div>
      <div style="display:grid;grid-template-columns:0.5fr 1.5fr;gap:5px;padding:5px 10px;">
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Grade</div>
          <div style="font-size:11px;color:#222;font-weight:700;">${escapeHtml(s.grade || "—")}</div>
        </div>
        <div style="background:#fff;border:1px solid #e0e6ed;border-radius:4px;padding:4px 8px;">
          <div style="font-size:7px;color:#999;text-transform:uppercase;font-weight:700;margin-bottom:1px;letter-spacing:0.3px;">Selected Subjects</div>
          <div style="font-size:9px;color:#222;font-weight:600;line-height:1.2;">${escapeHtml(subjects)}</div>
        </div>
      </div>
    </div>

    <!-- Comments -->
    <div style="margin-bottom:5px;background:#fafbfc;border-radius:6px;border:1px solid #e8ecef;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
      <div style="display:flex;align-items:center;gap:5px;padding:4px 10px;background:linear-gradient(90deg,#e6f4ea,#f1faff);border-bottom:1px solid #d0eaff;">
        <span style="font-size:12px;line-height:1;">📝</span>
        <span style="font-size:8px;font-weight:700;color:#2f8f3a;text-transform:uppercase;letter-spacing:0.8px;">Additional Comments</span>
      </div>
      <div style="padding:5px 10px;">
        <div style="background:#fff;border:1px dashed #c8d6e5;border-radius:4px;padding:5px 8px;min-height:24px;font-size:9px;color:#444;line-height:1.3;">
          ${escapeHtml(s.message || "No additional comments provided.")}
        </div>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div style="position:absolute;bottom:18px;left:20px;right:20px;z-index:1;">
    <div style="display:flex;justify-content:space-between;gap:35px;margin-bottom:6px;">
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:1.5px solid #444;height:22px;"></div>
        <div style="font-size:8px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;margin-top:2px;">Student / Parent Signature</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:1.5px solid #444;height:22px;"></div>
        <div style="font-size:8px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;margin-top:2px;">Authorized By</div>
      </div>
    </div>
    <div style="text-align:center;font-size:7px;color:#aaa;line-height:1.4;border-top:1px solid #eee;padding-top:4px;">
      <div>📅 Generated on: ${escapeHtml(ts)} | Fluent Future Academy | www.fluentfuture.com</div>
      <div>This is a computer generated document.</div>
    </div>
  </div>

  <!-- Bottom bar -->
  <div style="height:3px;background:linear-gradient(90deg,#1b5e20,#2f8f3a,#4CAF50,#2f8f3a,#1b5e20);position:absolute;bottom:0;left:0;right:0;"></div>
</div>
  `;
}

/* ============================================================ */
/*  EXPORT HELPER — create visible off-screen element           */
/* ============================================================ */
function makeExportEl(html) {
  const old = document.getElementById("__exportTemp");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.id = "__exportTemp";
  wrap.innerHTML = html;
  // Position off-screen but rendered; html2canvas needs it in DOM and visible
  wrap.style.position = "absolute";
  wrap.style.left = "-9999px";
  wrap.style.top = "0";
  wrap.style.width = "794px";
  wrap.style.height = "1123px";
  wrap.style.overflow = "hidden";
  wrap.style.visibility = "visible";
  wrap.style.display = "block";
  document.body.appendChild(wrap);
  return wrap;
}

function waitImages(el) {
  const imgs = el.querySelectorAll("img");
  return Promise.all(Array.from(imgs).map(img => {
    return new Promise(resolve => {
      if (img.complete && img.naturalHeight !== 0) { resolve(); return; }
      img.onload = () => resolve();
      img.onerror = () => resolve();
      setTimeout(resolve, 1200);
    });
  }));
}

/* ============================================================ */
/*  IMAGE EXPORT                                                */
/* ============================================================ */
async function downloadImage() {
  if (!currentSubmission) { alert("No submission selected."); return; }
  console.log("[IMG] Starting export...");

  const el = makeExportEl(buildA4HTML(currentSubmission));

  try {
    await waitImages(el);
    await new Promise(r => setTimeout(r, 500));
    console.log("[IMG] Images ready, capturing...");

    const canvas = await html2canvas(el.firstElementChild, {
      scale: 2,
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
    console.log("[IMG] Saved successfully!");
  } catch (err) {
    console.error("[IMG] Error:", err);
    alert("Image export failed.\\nError: " + (err.message || err));
  } finally {
    el.remove();
    console.log("[IMG] Cleanup done.");
  }
}

/* ============================================================ */
/*  GOOGLE FETCH                                                */
/* ============================================================ */
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
            age: raw.Age || raw.age || "",
            gender: raw.Gender || raw.gender || "",
            email: raw.Email || raw.email || "",
            phone: raw.Phone || raw.phone || "",
            school: raw.School || raw.school || "",
            address: raw.Address || raw.address || "",
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

/* ============================================================ */
/*  INIT                                                        */
/* ============================================================ */
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
  const btnImage = document.getElementById("btnDownloadImage");
  if (btnImage) btnImage.addEventListener("click", downloadImage);

  renderSubmissions();
  fetchAndMerge();
});
