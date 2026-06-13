document.addEventListener("DOMContentLoaded", () => {
  // Get admission ID from URL if it exists
  const urlParams = new URLSearchParams(window.location.search);
  const admissionId = urlParams.get('id');
  
  const admissionMessage = document.getElementById('admissionMessage');
  
  if (admissionId) {
    admissionMessage.innerHTML = `<strong>Your Admission ID:</strong><br>${admissionId}<br><br>Please save this ID for your records. You will need it for any future correspondence.`;
  }
  
  // Log all stored submissions (for debugging)
  const submissions = JSON.parse(localStorage.getItem("submissions") || "[]");
  console.log("Total submissions stored locally:", submissions.length);
  if (submissions.length > 0) {
    console.log("Latest submission:", submissions[submissions.length - 1]);
  }
  
  console.log("Thanks page loaded successfully");
});