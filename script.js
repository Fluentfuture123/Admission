// ADMISSION NUMBER SYSTEM
function getLastAdmissionNumber() {
  const raw = localStorage.getItem("lastAdmissionNumber");
  return raw ? parseInt(raw, 10) : 1000;
}

function saveAdmissionNumber(num) {
  localStorage.setItem("lastAdmissionNumber", num);
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const age = document.getElementById("age").value.trim();
    const genderInput = document.querySelector('input[name="gender"]:checked');
    const gender = genderInput ? genderInput.value : "";

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

    // Generate admission number
    const last = getLastAdmissionNumber();
    const newNumber = last + 1;
    saveAdmissionNumber(newNumber);
    const admissionNumber = `FF-${newNumber}`;

    // Create form data object for storage
    const formDataObj = {
      name: name,
      age: age,
      gender: gender,
      email: email,
      phone: phone,
      school: school,
      subjects: subjects,
      grade: grade,
      message: message,
      admissionNumber: admissionNumber,
      timestamp: new Date().toLocaleString()
    };

    // Store data locally (always save)
    storeSubmissionData(formDataObj);

    // Create FormData for Google Sheets
    const formData = new FormData();
    formData.append("name", name);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("school", school);
    formData.append("subjects", subjects);
    formData.append("grade", grade);
    formData.append("message", message);
    formData.append("admissionNumber", admissionNumber);
    formData.append("timestamp", new Date().toLocaleString());

    // Google Sheets Web App URL - Replace with your own Google Sheets URL
    var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbybE-1qyrOjDnvRUwWP7Qzsyt072conHzLnXGMLpHsAS6xfjlQDJkTaLg48eg0LiKs_QQ/exec';

    // Try to send to Google Sheets with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );

    const fetchPromise = fetch(WEB_APP_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    }).then(function(res) {
      return res.ok ? res : Promise.reject(new Error('Server error'));
    });

    Promise.race([fetchPromise, timeoutPromise])
      .then(function() {
        console.log('Successfully sent to Google Sheets');
        window.location.href = 'thanks.html?id=' + encodeURIComponent(admissionNumber);
      })
      .catch(function(err) {
        // Even if Google Sheets fails, we have data stored locally
        console.warn('Google Sheets submission failed, but data saved locally:', err);
        window.location.href = 'thanks.html?id=' + encodeURIComponent(admissionNumber);
      });
  });
});

