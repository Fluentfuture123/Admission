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
  
  let date;
  
  // If already a Date object
  if (ts instanceof Date && !isNaN(ts)) {
    date = ts;
  } 
  // Try parsing ISO format or other standard formats first
  else if (typeof ts === 'string') {
    const str = String(ts).trim();
    
    // Check if it's already in DD/MM/YYYY format — return as-is
    if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
      return str;
    }
    
    // Try ISO format (2026-06-27T02:35:00)
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
    if (isoMatch) {
      date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2])-1, parseInt(isoMatch[3]),
                      parseInt(isoMatch[4]), parseInt(isoMatch[5]), parseInt(isoMatch[6]));
    }
    // Try US format: "6/27/2026, 2:40:59 AM" or "6/27/2026, 2:40:59 PM"
    else {
      const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
      if (usMatch) {
        const month = parseInt(usMatch[1], 10) - 1;
        const day = parseInt(usMatch[2], 10);
        const year = parseInt(usMatch[3], 10);
        let hour = parseInt(usMatch[4], 10);
        const minute = parseInt(usMatch[5], 10);
        const second = parseInt(usMatch[6], 10);
        const ampm = usMatch[7].toUpperCase();
        
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        
        date = new Date(year, month, day, hour, minute, second);
      }
      // Try simple format: "6/27/2026" without time
      else {
        const simpleMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (simpleMatch) {
          date = new Date(parseInt(simpleMatch[3]), parseInt(simpleMatch[1])-1, parseInt(simpleMatch[2]));
        }
        else {
          // Last resort: try native Date.parse
          const parsed = Date.parse(str);
          if (!isNaN(parsed)) {
            date = new Date(parsed);
          }
        }
      }
    }
  }
  
  if (!date || isNaN(date)) return String(ts);
  
  // Format: DD/MM/YYYY, HH:MM:SS AM/PM
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  hours = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
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
/*  A4 HTML BUILDER — ALL FIELDS BOLD (700)                    */
/* ============================================================ */
function buildA4HTML(s) {
  const ts = formatTimestamp(s.timestamp) || "";
  const subjects = getSubjectsValue(s) || "—";
  const logoPath = "IMG/logo.jpeg";

  const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234CAF50'/%3E%3Cstop offset='100%25' stop-color='%232f8f3a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='24' cy='24' r='24' fill='url(%23g)'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='white' font-size='20' font-weight='bold' font-family='Arial'%3EFF%3C/text%3E%3C/svg%3E";

  return `
<div id="a4page" style="width:794px;height:1123px;background:#f8fafb;font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;position:relative;overflow:hidden;box-sizing:border-box;margin:0;padding:0;line-height:1.4;">

  <!-- Top accent bar -->
  <div style="height:6px;background:linear-gradient(90deg,#1b5e20,#2f8f3a,#4CAF50,#2f8f3a,#1b5e20);"></div>

  <!-- Header -->
  <div style="display:flex;align-items:center;gap:16px;padding:24px 32px;background:#ffffff;border-bottom:2px solid #e2e8f0;">
    <div style="width:64px;height:64px;flex-shrink:0;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #e2e8f0;">
      <img src="${logoPath}" style="width:56px;height:56px;object-fit:contain;display:block;"
        onerror="this.src='${fallbackSvg}';this.onerror=null;">
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:22px;font-weight:800;color:#1b5e20;letter-spacing:1px;line-height:1.2;">FLUENT FUTURE ACADEMY</div>
      <div style="font-size:12px;color:#64748b;font-style:italic;margin-top:3px;letter-spacing:0.3px;">Shaping Minds, Building Futures</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:4px;font-weight:500;">📞 +94 768 980 815 &nbsp;|&nbsp; ✉️ fluentfutureacademylk@gmail.com</div>
    </div>
    <div style="background:linear-gradient(135deg,#1b5e20,#2f8f3a);color:#fff;padding:14px 18px;border-radius:10px;text-align:center;box-shadow:0 4px 15px rgba(27,94,32,0.25);flex-shrink:0;min-width:130px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;opacity:0.9;font-weight:700;">Admission No</div>
      <div style="font-size:18px;font-weight:800;margin-top:3px;letter-spacing:0.5px;">${escapeHtml(s.admissionNumber || "")}</div>
      <div style="font-size:10px;opacity:0.85;margin-top:3px;font-weight:500;">${escapeHtml(ts)}</div>
    </div>
  </div>

  <!-- Watermark -->
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:72px;font-weight:900;color:rgba(27,94,32,0.025);letter-spacing:6px;pointer-events:none;z-index:0;white-space:nowrap;">FLUENT FUTURE</div>

  <!-- Body -->
  <div style="padding:24px 32px;position:relative;z-index:1;">

    <!-- Personal Information -->
    <div style="margin-bottom:16px;background:#ffffff;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(90deg,#f0fdf4,#ffffff);border-bottom:2px solid #bbf7d0;">
        <span style="font-size:16px;">👤</span>
        <span style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px;">Personal Information</span>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;padding:14px 16px;">
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Full Name</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;line-height:1.3;">${escapeHtml(s.name || "—")}</div>
        </div>
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Age</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;">${escapeHtml(s.age || "—")}</div>
        </div>
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Gender</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;">${escapeHtml(s.gender || "—")}</div>
        </div>
      </div>
    </div>

    <!-- Contact Information -->
    <div style="margin-bottom:16px;background:#ffffff;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(90deg,#f0fdf4,#ffffff);border-bottom:2px solid #bbf7d0;">
        <span style="font-size:16px;">📞</span>
        <span style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px;">Contact Information</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 16px;">
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Email Address</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;line-height:1.3;word-break:break-all;">${escapeHtml(s.email || "—")}</div>
        </div>
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Phone Number</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;">${escapeHtml(s.phone || "—")}</div>
        </div>
      </div>
      <div style="padding:0 16px 14px 16px;">
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">School Name</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;">${escapeHtml(s.school || "—")}</div>
        </div>
      </div>
      <div style="padding:0 16px 14px 16px;">
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Current Residential Address</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;line-height:1.4;">${escapeHtml(s.address || "—")}</div>
        </div>
      </div>
    </div>

    <!-- Academic Information -->
    <div style="margin-bottom:16px;background:#ffffff;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(90deg,#f0fdf4,#ffffff);border-bottom:2px solid #bbf7d0;">
        <span style="font-size:16px;">📚</span>
        <span style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px;">Academic Information</span>
      </div>
      <div style="display:grid;grid-template-columns:0.6fr 1.4fr;gap:12px;padding:14px 16px;">
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Grade</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;">${escapeHtml(s.grade || "—")}</div>
        </div>
        <div style="background:#f8fafb;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:3px;letter-spacing:0.5px;">Selected Subjects</div>
          <div style="font-size:14px;color:#1a202c;font-weight:700;line-height:1.4;">${escapeHtml(subjects)}</div>
        </div>
      </div>
    </div>

    <!-- Additional Comments -->
    <div style="margin-bottom:16px;background:#ffffff;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:linear-gradient(90deg,#f0fdf4,#ffffff);border-bottom:2px solid #bbf7d0;">
        <span style="font-size:16px;">📝</span>
        <span style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px;">Additional Comments</span>
      </div>
      <div style="padding:14px 16px;">
        <div style="background:#f8fafb;border:1px dashed #cbd5e1;border-radius:6px;padding:10px 12px;min-height:40px;font-size:14px;color:#1a202c;font-weight:700;line-height:1.5;">
          ${escapeHtml(s.message || "No additional comments provided.")}
        </div>
      </div>
    </div>

  </div>

  <!-- Signature Area -->
  <div style="position:absolute;bottom:70px;left:32px;right:32px;z-index:1;">
    <div style="display:flex;justify-content:space-between;gap:40px;">
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:2px solid #334155;height:30px;"></div>
        <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;">Student / Parent Signature</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:2px solid #334155;height:30px;"></div>
        <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;">Authorized By</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="position:absolute;bottom:24px;left:32px;right:32px;z-index:1;">
    <div style="text-align:center;font-size:9px;color:#94a3b8;line-height:1.6;border-top:1px solid #e2e8f0;padding-top:8px;">
      <div>📅 Generated on: ${escapeHtml(ts)} &nbsp;|&nbsp; Fluent Future Academy &nbsp;|&nbsp; www.fluentfuture.com</div>
      <div style="margin-top:2px;">This is a computer generated document. No signature required for digital copy.</div>
    </div>
  </div>

  <!-- Bottom accent bar -->
  <div style="height:4px;background:linear-gradient(90deg,#1b5e20,#2f8f3a,#4CAF50,#2f8f3a,#1b5e20);position:absolute;bottom:0;left:0;right:0;"></div>
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

  const btnClose = document.getElementById("btnClose");
  if (btnClose) btnClose.addEventListener("click", closeModal);

  const btnImage = document.getElementById("btnDownloadImage");
  if (btnImage) btnImage.addEventListener("click", downloadImage);

  renderSubmissions();
  fetchAndMerge();
});
