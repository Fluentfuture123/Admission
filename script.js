// ============================================
// Fluent Future - script.js (Form Submission)
// ============================================

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
    const response = await fetch(WEB_APP_URL + "?action=getAll");
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

/* ============================================================ */
/*  CUSTOM CALENDAR PICKER with Month/Year Dropdown             */
/* ============================================================ */

let calCurrentDate = new Date();
let calSelectedDate = null;

function initCalendar() {
  const dobInput = document.getElementById("dob");
  const calendar = document.getElementById("customCalendar");
  const calDays = document.getElementById("calDays");
  const calMonthBtn = document.getElementById("calMonthBtn");
  const calYearBtn = document.getElementById("calYearBtn");
  const calMonthDropdown = document.getElementById("calMonthDropdown");
  const calYearDropdown = document.getElementById("calYearDropdown");
  const calMonthOptions = document.getElementById("calMonthOptions");
  const calYearOptions = document.getElementById("calYearOptions");
  const calPrev = document.getElementById("calPrev");
  const calNext = document.getElementById("calNext");
  const calClear = document.getElementById("calClear");
  const calToday = document.getElementById("calToday");

  if (!dobInput || !calendar) return;

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  let openDropdown = null;

  function closeAllDropdowns() {
    if (openDropdown) {
      openDropdown.classList.remove("open");
      openDropdown.closest(".cal-select-wrapper").classList.remove("open");
      openDropdown = null;
    }
  }

  function toggleDropdown(dropdown) {
    if (openDropdown === dropdown) {
      closeAllDropdowns();
    } else {
      closeAllDropdowns();
      dropdown.classList.add("open");
      dropdown.closest(".cal-select-wrapper").classList.add("open");
      openDropdown = dropdown;
    }
  }

  function populateMonthDropdown() {
    calMonthOptions.innerHTML = "";
    monthNames.forEach((name, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-option";
      btn.textContent = name;
      if (idx === calCurrentDate.getMonth()) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => {
        calCurrentDate.setMonth(idx);
        closeAllDropdowns();
        renderCalendar();
      });
      calMonthOptions.appendChild(btn);
    });
  }

  function populateYearDropdown() {
    calYearOptions.innerHTML = "";
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 10;

    for (let year = endYear; year >= startYear; year--) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-option";
      btn.textContent = year;
      if (year === calCurrentDate.getFullYear()) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => {
        calCurrentDate.setFullYear(year);
        closeAllDropdowns();
        renderCalendar();
      });
      calYearOptions.appendChild(btn);
    }
  }

  function renderCalendar() {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();

    calMonthBtn.textContent = monthNames[month];
    calYearBtn.textContent = year;

    calDays.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day other-month";
      btn.textContent = day;
      btn.addEventListener("click", () => {
        calCurrentDate.setMonth(month - 1);
        calCurrentDate.setDate(day);
        selectDate(day);
      });
      calDays.appendChild(btn);
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.textContent = day;

      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        btn.classList.add("today");
      }

      if (calSelectedDate &&
          calSelectedDate.getDate() === day &&
          calSelectedDate.getMonth() === month &&
          calSelectedDate.getFullYear() === year) {
        btn.classList.add("selected");
      }

      btn.addEventListener("click", () => selectDate(day));
      calDays.appendChild(btn);
    }

    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day other-month";
      btn.textContent = day;
      btn.addEventListener("click", () => {
        calCurrentDate.setMonth(month + 1);
        calCurrentDate.setDate(day);
        selectDate(day);
      });
      calDays.appendChild(btn);
    }
  }

  function selectDate(day) {
    calSelectedDate = new Date(calCurrentDate.getFullYear(), calCurrentDate.getMonth(), day);
    const dd = String(day).padStart(2, '0');
    const mm = String(calSelectedDate.getMonth() + 1).padStart(2, '0');
    const yyyy = calSelectedDate.getFullYear();
    dobInput.value = `${dd}-${mm}-${yyyy}`;
    dobInput.classList.add("has-value");
    closeCalendar();
  }

  function openCalendar() {
    calendar.classList.add("open");
    populateMonthDropdown();
    populateYearDropdown();
    renderCalendar();
  }

  function closeCalendar() {
    calendar.classList.remove("open");
    closeAllDropdowns();
  }

  function toggleCalendar() {
    if (calendar.classList.contains("open")) {
      closeCalendar();
    } else {
      openCalendar();
    }
  }

  // Event listeners
  dobInput.addEventListener("click", (e) => {
    e.preventDefault();
    toggleCalendar();
  });

  calMonthBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    populateMonthDropdown();
    toggleDropdown(calMonthDropdown);
  });

  calYearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    populateYearDropdown();
    toggleDropdown(calYearDropdown);
  });

  calPrev.addEventListener("click", () => {
    calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
    renderCalendar();
  });

  calNext.addEventListener("click", () => {
    calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
    renderCalendar();
  });

  calClear.addEventListener("click", () => {
    calSelectedDate = null;
    dobInput.value = "";
    dobInput.classList.remove("has-value");
    renderCalendar();
  });

  calToday.addEventListener("click", () => {
    calCurrentDate = new Date();
    selectDate(calCurrentDate.getDate());
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!dobInput.closest(".dob-wrapper").contains(e.target)) {
      closeCalendar();
    }
  });

  // Prevent form submit on calendar buttons
  calendar.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

/* ============================================================ */
/*  FORM SUBMISSION                                             */
/* ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  initCalendar();

  const form = document.getElementById("admissionForm");
  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const age = document.getElementById("age").value.trim();
    const dob = document.getElementById("dob").value.trim();
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const gender = genderInput ? genderInput.value : "";
    const address = document.getElementById("address").value.trim();

    // Validate required fields
    if (!name || !email || !phone || !age || !dob || !gender) {
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
      dob: dob,
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

    // Save locally
    storeSubmissionData(formDataObj);

    // Save to Google Sheets with action and status
    const sheetData = {
      action: "submit",
      status: "Active",
      admissionNumber: admissionNumber,
      name: name,
      age: age,
      dob: dob,
      gender: gender,
      email: email,
      phone: phone,
      school: school,
      address: address,
      subjects: subjects,
      grade: grade,
      message: message
    };

    fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(sheetData),
      headers: { "Content-Type": "application/json" },
      mode: "no-cors"
    })
    .then(() => console.log("Sent to Google Sheets"))
    .catch(err => console.error("Error sending to Sheets:", err));

    // Redirect to thanks page
    window.location.href = "thanks.html?id=" + encodeURIComponent(admissionNumber);
  });
});
