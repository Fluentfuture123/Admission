const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

function loadLocal() {
  return JSON.parse(localStorage.getItem("submissions") || "[]");
}
function saveLocal(arr) {
  localStorage.setItem("submissions", JSON.stringify(arr));
}

let currentSubmission = null;

/* Render submissions */
function renderSubmissions() {
  const subs = loadLocal();
  const list = document.getElementById("submissionsList");
  document.getElementById("totalCount").textContent = subs.length;
  document.getElementById("lastId").textContent = subs.length ? subs[subs.length-1].admissionNumber : "-";

  if (!subs.length) {
    list.innerHTML = '<div class="no-submissions">No submissions yet</div>';
    return;
  }

  list.innerHTML = subs.map((s,i)=>`
    <div class="submission-item">
      <div class="submission-header">
        <div class="submission-id">${s.admissionNumber}</div>
        <div class="submission-meta">
          <span><strong>Student:</strong> ${s.name}</span>
          <span><strong>Date:</strong> ${new Date(s.timestamp).toLocaleString("en-US")}</span>
        </div>
      </div>
      <div class="submission-actions">
        <button class="btn-view" onclick="viewDetails(${i})">👁️ View</button>
        <button class="btn-delete" onclick="deleteSubmission(${i})">🗑️ Delete</button>
      </div>
    </div>
  `).join("");
}

/* View details */
function viewDetails(index){
  const subs = loadLocal();
  currentSubmission = subs[index];
  if(!currentSubmission) return;
  document.getElementById("detailsContent").innerHTML = `
    <div class="detail-grid">
      <div class="detail-field"><div class="detail-label">Name</div><div class="detail-value">${currentSubmission.name}</div></div>
      <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value">${currentSubmission.email}</div></div>
      <div class="detail-field"><div class="detail-label">Phone</div><div class="detail-value">${currentSubmission.phone}</div></div>
      <div class="detail-field"><div class="detail-label">School</div><div class="detail-value">${currentSubmission.school}</div></div>
      <div class="detail-field"><div class="detail-label">Grade</div><div class="detail-value">${currentSubmission.grade}</div></div>
      <div class="detail-field"><div class="detail-label">Admission No</div><div class="detail-value">${currentSubmission.admissionNumber}</div></div>
      <div class="detail-field"><div class="detail-label">Timestamp</div><div class="detail-value">${new Date(currentSubmission.timestamp).toLocaleString("en-US")}</div></div>
      <div class="detail-field" style="grid-column:1/-1;">
        <div class="detail-label">Comments</div><div class="detail-value">${currentSubmission.message}</div>
      </div>
    </div>
  `;
  document.getElementById("detailModal").style.display="block";
}
function closeModal(){ document.getElementById("detailModal").style.display="none"; }

/* Delete single submission */
function deleteSubmission(index){
  const subs = loadLocal();
  subs.splice(index,1);
  saveLocal(subs);
  renderSubmissions();
}

/* Clear all */
function clearAll(){
  if(confirm("Delete all submissions?")){
    localStorage.removeItem("submissions");
    renderSubmissions();
  }
}

/* Export CSV */
function exportCSV(){
  const subs = loadLocal();
  if(!subs.length) return alert("No submissions!");
  const headers = ["Admission No","Name","Email","Phone","School","Grade","Comments","Timestamp"];
  const rows = subs.map(s=>[s.admissionNumber,s.name,s.email,s.phone,s.school,s.grade,s.message,new Date(s.timestamp).toLocaleString("en-US")]);
  const csv = [headers].concat(rows).map(r=>r.join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="submissions.csv"; a.click();
  URL.revokeObjectURL(url);
}

/* PDF & Image Export */
function buildPrintContent(s){
  return `
    <div class="print-header">
      <h1>Admission Form</h1>
      <p>Fluent Future Academy</p>
    </div>
    <div class="print-body">
      <div class="print-section"><span class="print-label">Name:</span> ${s.name}</div>
      <div class="print-section"><span class="print-label">Email:</span> ${s.email}</div>
      <div class="print-section"><span class="print-label">Phone:</span> ${s.phone}</div>
      <div class="print-section"><span class="print-label">School:</span> ${s.school}</div>
      <div class="print-section"><span class="print-label">Grade:</span> ${s.grade}</div>
      <div class="print-section"><span class="print-label">Admission No:</span> ${s.admissionNumber}</div>
      <div class="print-section"><span class="print-label">Date:</span> ${new Date(s.timestamp).toLocaleString("en-US")}</div>
      <div class="print-section"><span class="print-label">Comments:</span> ${s.message}</div>
    </div>
  `;
}
function downloadPDF(){
  if(!currentSubmission) return;
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission);
  html2pdf().from(printArea).save();
}
function downloadImage(){
  if(!currentSubmission) return;
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = buildPrintContent(currentSubmission)};