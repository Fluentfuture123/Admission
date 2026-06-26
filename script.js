// ADMISSION NUMBER SYSTEM
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

function getLastAdmissionNumber() {
  const raw = localStorage.getItem("lastAdmissionNumber");// ADMISSION NUMBER SYSTEM
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyDQ6U8AePO5mwcLEwj1ZjCZyYGYD84KTA-6eqPNEXTpZe4GSe5MmjbQx1IPHQM80E/exec";

function getLastAdmissionNumber() {
  const raw = localStorage.getItem("lastAdmissionNumber");
  return raw ? parseInt(raw, 10) : 1000;
}

function saveAdmissionNumber(num) {
  localStorage.setItem("lastAdmissionNumber", num);
}

async function fetchMaxAdmissionNumber() {
  try {
    const response = await fetch(WEB_APP_URL);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const nums = data.map(row => {
        const num = row.AdmissionNumber || row.admissionNumber || row["Admission No"] || "";
        const match = String(num).match(/FF-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      }).filter(n => n > 0);
      return nums.length ? Math.max(...nums) : 1000;
    }
  } catch (e) {
    console.warn("Failed to fetch global admission numbers:", e);
  }
  return getLastAdmissionNumber();
}

// Store submission data locally
function storeSubmissionData(formDataObj) {
  const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
  submissions.push(formDataObj);
  localStorage.setItem("submissions", JSON.stringify(submissions));
  console.log("Data stored locally. Total submissions:", submissions.length);
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("admissionForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const age = document.getElementById("age").value.trim();
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const gender = genderInput ? genderInput.value : "";
    const address = document.getElementById("address").value.trim();

    // Validate required fields
    if (!name || !email || !phone || !age || !gender) {
      alert("Please fill in all required fields before submitting.");
      return;
    }

    // Collect checked subjects manually
    const subjectCheckboxes = document.querySelectorAll('input[name="subjects[]"]:checked');
    const subjects = Array.from(subjectCheckboxes).map(cb => cb.value).join(", ");

    // Get other form values
    const school = document.getElementById("school").value.trim();
    const grade = document.getElementById("grade").value;
    const message = document.getElementById("message").value.trim();

    // Generate admission number (globally unique)
    const last = await fetchMaxAdmissionNumber();
    const newNumber = last + 1;
    saveAdmissionNumber(newNumber);
    const admissionNumber = `FF-${newNumber}`;

    // Create form data object for local storage
    const formDataObj = {
      name: name,
      age: age,
      gender: gender,
      email: email,
      phone: phone,
      school: school,
      address: address,
      subjects: subjects,
      grade: grade,
      message: message,
      admissionNumber: admissionNumber,
      timestamp: new Date().toLocaleString()
    };

    // ✅ Save locally
    storeSubmissionData(formDataObj);

    // ✅ Save to Google Sheets
    const formData = new FormData();
    for (const key in formDataObj) {
      formData.append(key, formDataObj[key]);
    }

    fetch(WEB_APP_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors"
    })
    .then(() => console.log("Sent to Google Sheets"))
    .catch(err => console.error("Error sending to Sheets:", err));

    // ✅ Redirect to thanks page
    window.location.href = "thanks.html?id=" + encodeURIComponent(admissionNumber);
  });
});
  return raw ? parseInt(raw, 10) : 1000;
}

function saveAdmissionNumber(num) {
  localStorage.setItem("lastAdmissionNumber", num);
}

async function fetchMaxAdmissionNumber() {
  try {
    const response = await fetch(WEB_APP_URL);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const nums = data.map(row => {
        const num = row.AdmissionNumber || row.admissionNumber || row["Admission No"] || "";
        const match = String(num).match(/FF-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      }).filter(n => n > 0);
      return nums.length ? Math.max(...nums) : 1000;
    }
  } catch (e) {
    console.warn("Failed to fetch global admission numbers:", e);
  }
  return getLastAdmissionNumber();
}

// Store submission data locally
function storeSubmissionData(formDataObj) {
  const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
  submissions.push(formDataObj);
  localStorage.setItem("submissions", JSON.stringify(submissions));
  console.log("Data stored locally. Total submissions:", submissions.length);
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("admissionForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const age = document.getElementById("age").value.trim();
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const gender = genderInput ? genderInput.value : "";
    const address = document.getElementById("address").value.trim();

    // Validate required fields
    if (!name || !email || !phone || !age || !gender) {
      alert("Please fill in all required fields before submitting.");
      return;
    }

    // Collect checked subjects manually
    const subjectCheckboxes = document.querySelectorAll('input[name="subjects[]"]:checked');
    const subjects = Array.from(subjectCheckboxes).map(cb => cb.value).join(", ");

    // Get other form values
    const school = document.getElementById("school").value.trim();
    const grade = document.getElementById("grade").value;
    const message = document.getElementById("message").value.trim();

    // Generate admission number (globally unique)
    const last = await fetchMaxAdmissionNumber();
    const newNumber = last + 1;
    saveAdmissionNumber(newNumber);
    const admissionNumber = `FF-${newNumber}`;

    // Create form data object for local storage
    const formDataObj = {
      name: name,
      age: age,
      gender: gender,
      email: email,
      phone: phone,
      school: school,
      address: address,
      subjects: subjects,
      grade: grade,
      message: message,
      admissionNumber: admissionNumber,
      timestamp: new Date().toLocaleString()
    };

    // ✅ Save locally
    storeSubmissionData(formDataObj);

    // ✅ Save to Google Sheets
    const formData = new FormData();
    for (const key in formDataObj) {
      formData.append(key, formDataObj[key]);
    }

    fetch(WEB_APP_URL, {
      method: "POST",
      body: formData,
      mode: "no-cors"
    })
    .then(() => console.log("Sent to Google Sheets"))
    .catch(err => console.error("Error sending to Sheets:", err));

    // ✅ Redirect to thanks page
    window.location.href = "thanks.html?id=" + encodeURIComponent(admissionNumber);
  });
});
