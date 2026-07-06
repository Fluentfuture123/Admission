/* ============================================ */
/* FLUENT FUTURE - HOME PAGE SCRIPT             */
/* Particle System + Interactions               */
/* ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  createParticles();
  setupArrowKeyboard();
});

/* ============================================ */
/* PARTICLE SYSTEM                              */
/* ============================================ */

function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  const particleCount = window.innerWidth < 768 ? 20 : 35;
  const colors = [
    "#4CAF50", "#81C784", "#2196F3", "#42A5F5",
    "#66BB6A", "#90CAF9", "#A5D6A7", "#64B5F6"
  ];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    const size = Math.random() * 6 + 3;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = Math.random() * 12 + 8;
    const delay = Math.random() * 10;

    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      left: ${left}%;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(particle);
  }
}

/* ============================================ */
/* ARROW KEYBOARD SUPPORT                       */
/* ============================================ */

function setupArrowKeyboard() {
  const arrowContainer = document.querySelector(".arrow-container");
  if (!arrowContainer) return;

  arrowContainer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToAdmission();
    }
  });
}

/* ============================================ */
/* GO TO ADMISSION FORM                         */
/* ============================================ */

function goToAdmission() {
  // Add a click ripple effect
  const arrow = document.querySelector(".arrow-btn");
  if (arrow) {
    arrow.style.transform = "scale(0.9)";
    setTimeout(() => {
      arrow.style.transform = "";
      window.location.href = "form.html";
    }, 200);
  } else {
    window.location.href = "form.html";
  }
}

/* ============================================ */
/* HANDLE RESIZE                                */
/* ============================================ */

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const container = document.getElementById("particles");
    if (container) {
      container.innerHTML = "";
      createParticles();
    }
  }, 300);
});

console.log("🏠 Fluent Future Home Page loaded successfully");