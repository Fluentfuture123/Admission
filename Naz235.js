/* ============================================ */
/* FLUENT FUTURE - LOGIN SYSTEM                 */
/* Complete authentication with security features */
/* ============================================ */

// Default admin credentials
const DEFAULT_ADMIN = {
  email: "fluentfutureacademylk@gmail.com",
  password: "Nazry@123"
};

// Session keys
const SESSION_KEY = "ff_admin_session";
const THEME_KEY = "ff_admin_theme";
const REMEMBER_KEY = "ff_admin_remember";

// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const rememberMe = document.getElementById("rememberMe");
const loginBtn = document.getElementById("loginBtn");
const loginCard = document.getElementById("loginCard");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const particlesContainer = document.getElementById("particles");

/* ============================================ */
/* INITIALIZATION                               */
/* ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Check if already logged in
  if (isLoggedIn()) {
    redirectToAdmin();
    return;
  }

  // Initialize theme
  initTheme();

  // Create floating particles
  createParticles();

  // Load remembered email if any
  loadRememberedEmail();

  // Setup event listeners
  setupEventListeners();
});

/* ============================================ */
/* THEME MANAGEMENT                             */
/* ============================================ */

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
    updateThemeIcon(true);
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    updateThemeIcon(false);
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const newTheme = isDark ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  updateThemeIcon(!isDark);

  // Animate transition
  document.body.style.transition = "background 0.5s ease";
}

function updateThemeIcon(isDark) {
  const icon = themeToggle.querySelector('.theme-icon');
  icon.textContent = isDark ? '🌙' : '☀️';
  icon.style.animation = 'none';
  icon.offsetHeight; // Trigger reflow
  icon.style.animation = 'fadeInDown 0.3s ease';
}

/* ============================================ */
/* PARTICLE SYSTEM                              */
/* ============================================ */

function createParticles() {
  if (!particlesContainer) return;

  const particleCount = window.innerWidth < 768 ? 15 : 25;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (10 + Math.random() * 10) + 's';
    particle.style.width = (2 + Math.random() * 4) + 'px';
    particle.style.height = particle.style.width;

    // Random colors from theme
    const colors = ['#4CAF50', '#2196F3', '#81C784', '#42A5F5', '#66BB6A'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    particlesContainer.appendChild(particle);
  }
}

/* ============================================ */
/* REMEMBER ME FUNCTIONALITY                    */
/* ============================================ */

function loadRememberedEmail() {
  const remembered = localStorage.getItem(REMEMBER_KEY);
  if (remembered) {
    try {
      const data = JSON.parse(remembered);
      if (data.email) {
        emailInput.value = data.email;
        emailInput.classList.add("has-value");
        rememberMe.checked = true;
      }
    } catch (e) {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }
}

function saveRememberedEmail(email) {
  if (rememberMe.checked) {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: email }));
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

/* ============================================ */
/* PASSWORD TOGGLE                              */
/* ============================================ */

function togglePasswordVisibility() {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.querySelector('.eye-icon').textContent = isPassword ? '🙈' : '👁️';
}

/* ============================================ */
/* LOGIN FORM HANDLING                          */
/* ============================================ */

function handleLogin(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Clear previous errors
  clearErrors();

  // Validation
  let hasError = false;

  if (!email) {
    showInputError("emailGroup", "Please enter your email");
    hasError = true;
  } else if (!isValidEmail(email)) {
    showInputError("emailGroup", "Please enter a valid email");
    hasError = true;
  }

  if (!password) {
    showInputError("passwordGroup", "Please enter your password");
    hasError = true;
  }

  if (hasError) {
    shakeCard();
    return;
  }

  // Show loading state
  setLoading(true);

  // Simulate network delay for realism
  setTimeout(() => {
    // Check credentials
    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      // Success
      saveRememberedEmail(email);
      createSession(email);
      showSuccessAnimation();
    } else {
      // Failure
      setLoading(false);
      showToast("Invalid email or password. Please try again.", "error");
      shakeCard();
      passwordInput.value = "";
      passwordInput.focus();
    }
  }, 800);
}

/* ============================================ */
/* SESSION MANAGEMENT                           */
/* ============================================ */

function createSession(email) {
  const session = {
    email: email,
    loggedInAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };

  // Store session (in production, use httpOnly cookies)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Also store in sessionStorage for tab-specific session
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function isLoggedIn() {
  // Check both localStorage and sessionStorage
  const localSession = localStorage.getItem(SESSION_KEY);
  const sessionSession = sessionStorage.getItem(SESSION_KEY);

  const sessionData = localSession || sessionSession;

  if (!sessionData) return false;

  try {
    const session = JSON.parse(sessionData);
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now > expiresAt) {
      // Session expired
      logout();
      return false;
    }

    return true;
  } catch (e) {
    logout();
    return false;
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  // Don't remove theme preference or remember me
}

/* ============================================ */
/* UI FEEDBACK FUNCTIONS                        */
/* ============================================ */

function showInputError(groupId, message) {
  const group = document.getElementById(groupId);
  if (group) {
    group.classList.add("error");

    // Remove error after 3 seconds
    setTimeout(() => {
      group.classList.remove("error");
    }, 3000);
  }
}

function clearErrors() {
  document.querySelectorAll('.input-group').forEach(group => {
    group.classList.remove("error");
  });
}

function shakeCard() {
  loginCard.classList.add("shake");
  setTimeout(() => {
    loginCard.classList.remove("shake");
  }, 500);
}

function setLoading(loading) {
  if (loading) {
    loginBtn.classList.add("loading");
    loginBtn.querySelector('.btn-text').textContent = "Signing in...";
    loginBtn.querySelector('.btn-icon').textContent = "⏳";
  } else {
    loginBtn.classList.remove("loading");
    loginBtn.querySelector('.btn-text').textContent = "Sign In";
    loginBtn.querySelector('.btn-icon').textContent = "→";
  }
}

function showToast(message, type = "error") {
  toastMessage.textContent = message;

  const icon = toast.querySelector('.toast-icon');
  icon.textContent = type === "error" ? "⚠️" : "✅";

  toast.style.background = type === "error" 
    ? "rgba(244, 67, 54, 0.95)" 
    : "rgba(76, 175, 80, 0.95)";

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

function showSuccessAnimation() {
  loginCard.classList.add("flipped");

  // Redirect after animation
  setTimeout(() => {
    redirectToAdmin();
  }, 2500);
}

function redirectToAdmin() {
  window.location.href = "admin.html";
}

/* ============================================ */
/* UTILITY FUNCTIONS                            */
/* ============================================ */

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/* ============================================ */
/* EVENT LISTENERS                              */
/* ============================================ */

function setupEventListeners() {
  // Form submit
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Password toggle
  if (togglePassword) {
    togglePassword.addEventListener("click", togglePasswordVisibility);
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Input animations
  [emailInput, passwordInput].forEach(input => {
    if (input) {
      input.addEventListener("focus", () => {
        input.parentElement.classList.add("focused");
      });

      input.addEventListener("blur", () => {
        input.parentElement.classList.remove("focused");
      });

      // Remove error on input
      input.addEventListener("input", () => {
        input.parentElement.classList.remove("error");
      });
    }
  });

  // Prevent form autocomplete for security
  if (loginForm) {
    loginForm.setAttribute("autocomplete", "off");
  }

  // Keyboard shortcut for theme toggle (Ctrl/Cmd + Shift + L)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "L") {
      e.preventDefault();
      toggleTheme();
    }
  });
}

/* ============================================ */
/* FORGOT PASSWORD HANDLER                      */
/* ============================================ */

const forgotPassword = document.getElementById("forgotPassword");
if (forgotPassword) {
  forgotPassword.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Please contact the administrator to reset your password.", "info");
  });
}

/* ============================================ */
/* SECURITY: CLEAR SENSITIVE DATA ON EXIT       */
/* ============================================ */

window.addEventListener("beforeunload", () => {
  // Don't clear password on normal navigation, only on tab close
  // This is handled by sessionStorage which clears on tab close
});

// Clear password when page is hidden (user switches tabs)
document.addEventListener("visibilitychange", () => {
  if (document.hidden && passwordInput) {
    // Optional: clear password for extra security
    // passwordInput.value = "";
  }
});

console.log("🔐 Fluent Future Login System initialized");
console.log("💡 Press Ctrl+Shift+L to toggle dark mode");