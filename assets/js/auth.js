// ===================================
// Conduit - Helper
// ===================================

function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  const id = localStorage.getItem("currentUserId");
  if (!id) return null;
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

function setCurrentUser(id) {
  localStorage.setItem("currentUserId", id);
}

function logoutUser() {
  localStorage.removeItem("currentUserId");
  localStorage.removeItem("theme");
  document.documentElement.removeAttribute("data-theme");
  window.location.href = "index.html";
}

// ===================================
//          Dark Mode
// ===================================
function applyTheme() {
  const user = getCurrentUser();
  const isDark = user ? user.darkMode === true : localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  }
}

window.toggleDarkMode = function() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newVal = !isDark;

  if (newVal) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  }

  // Persist to user object if logged in
  const userId = localStorage.getItem('currentUserId');
  if (userId) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) { users[idx].darkMode = newVal; saveUsers(users); }
  }

  // Sync profile toggle
  const dmToggle = document.getElementById('dm-toggle');
  if (dmToggle) dmToggle.classList.toggle('is-on', newVal);
};

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
  }
  return user;
}
// ===================================
//          Nav toggle
// ===================================
function updateNavAuthLinks() {
  const currentUser = getCurrentUser();
  const signinBtn = document.getElementById('nav-signin-btn');
  const profileCorner = document.getElementById('nav-profile-corner');
  const avatarThumb = document.getElementById('nav-avatar-thumb');

  if (!signinBtn || !profileCorner) return;

  if (currentUser) {
    signinBtn.style.display = 'none';
    profileCorner.style.display = 'flex';
    if (avatarThumb) {
      avatarThumb.src = currentUser.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=2E7D60&color=fff&size=100`;
    }
  } else {
    signinBtn.style.display = '';
    profileCorner.style.display = 'none';
  }
}

function updateLocationDisplay() {
  const eyebrow = document.getElementById('hero-location-eyebrow');
  if (!eyebrow) return;

  const user = getCurrentUser();
  const cityLabels = {
    "Springfield":  "Springfield, IL",
    "Seattle":      "Seattle, WA",
    "NYC":          "New York City, NY",
    "Los Angeles":  "Los Angeles, CA"
  };

  if (user && user.survey && user.survey.city) {
    const label = cityLabels[user.survey.city] || user.survey.city;
    eyebrow.innerHTML = `<span class="eyebrow-dot"></span>${label}`;
    eyebrow.style.display = '';
  } else {
    eyebrow.style.display = 'none';
  }
}

function initAuthUI() {
  applyTheme();
  updateNavAuthLinks();
  updateLocationDisplay();
  const logoutLink = document.getElementById("nav-logout");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  if (!document.getElementById("theme-fab")) {
    const fab = document.createElement("button");
    fab.id = "theme-fab";
    fab.setAttribute("aria-label", "Toggle dark mode");
    fab.innerHTML = `
      <svg class="theme-icon theme-icon--moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="theme-icon theme-icon--sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    fab.addEventListener("click", () => toggleDarkMode());
    document.body.appendChild(fab);
  }
  initSignupForm();
  initLoginForm();
  initProfilePage();
}

function initProfilePage() {
  // Only run on profile page
  const communityBox = document.getElementById("profile-community-box");
  if (!communityBox) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // ── Member since (derived from user.id timestamp) ──
  let memberSince = "Recently";
  try {
    const ts = parseInt((user.id || "").replace("u_", ""), 10);
    if (!isNaN(ts)) {
      memberSince = new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  } catch (e) { /* ignore */ }

  // ── Hero: name / email / avatar ───────────────────
  const nameEl  = document.getElementById("profile-name");
  const emailEl = document.getElementById("profile-email");
  const avatarEl = document.getElementById("profile-avatar");

  if (nameEl)  nameEl.textContent  = user.name  || "User";
  if (emailEl) emailEl.textContent = user.email || "";

  const avatarSrc = user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=1a3a2a&color=fff&size=256`;
  if (avatarEl) avatarEl.src = avatarSrc;

  // ── Hero pills ────────────────────────────────────
  const sinceText   = document.getElementById("profile-since-text");
  const commText    = document.getElementById("profile-community-pill-text");
  const cityPill    = document.getElementById("profile-city-pill");
  const cityText    = document.getElementById("profile-city-pill-text");

  if (sinceText)  sinceText.textContent = "Member since " + memberSince;
  if (commText)   commText.textContent  = user.community || "No community yet";
  if (cityPill && cityText && user.survey && user.survey.city) {
    cityPill.style.display = "";
    cityText.textContent = user.survey.city;
  }

  // ── Avatar click-to-upload ────────────────────────
  const avatarInput = document.getElementById("avatar-input");
  if (avatarEl && avatarInput) {
    // Clone to remove any stale listeners from previous SPA navigations
    const fresh = avatarEl.cloneNode(true);
    avatarEl.parentNode.replaceChild(fresh, avatarEl);
    fresh.src = avatarSrc;
    fresh.addEventListener("click", () => avatarInput.click());
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        fresh.src = dataUrl;
        const users = getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) { users[idx].avatar = dataUrl; saveUsers(users); }
        const navThumb = document.getElementById("nav-avatar-thumb");
        if (navThumb) navThumb.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Community passport card ───────────────────────
  const communityIcons = {
    "STEM Innovators": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M9 3v7L5 17a2 2 0 0 0 1.72 3h10.56A2 2 0 0 0 19 17l-4-7V3"/><line x1="6.5" y1="14" x2="17.5" y2="14"/></svg>`,
    "Creative Arts Collective": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>`,
    "Community Service Leaders": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    "Neighborhood Connectors": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
  };
  const communityIcon = communityIcons[user.community] || `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`;

  if (user.community) {
    const city     = (user.survey && user.survey.city) || "—";
    communityBox.innerHTML = `
      <div class="community-passport">
        <div class="passport-shimmer"></div>
        <div class="passport-top">
          <div class="passport-status">
            <span class="passport-status-dot"></span>
            Active Member
          </div>
          <span class="passport-brand">Conduit</span>
        </div>
        <div class="passport-middle">
          <div class="passport-emblem">${communityIcon}</div>
          <div>
            <p class="passport-label">Your Community</p>
            <h3 class="passport-name">${user.community}</h3>
          </div>
        </div>
        <div class="passport-footer">
          <div class="passport-field">
            <span class="passport-field-label">City</span>
            <span class="passport-field-value">${city}</span>
          </div>
          <div class="passport-field">
            <span class="passport-field-label">Member Since</span>
            <span class="passport-field-value">${memberSince}</span>
          </div>
          <div class="passport-field">
            <span class="passport-field-label">Status</span>
            <span class="passport-field-value is-active">Active</span>
          </div>
        </div>
        <img src="assets/images/C_logo.svg" class="passport-botanical" alt="" aria-hidden="true">
      </div>`;
  } else {
    communityBox.innerHTML = `
      <div class="no-community-card">
        <p>Take the survey to get matched with your community group.</p>
        <a href="survey.html" class="btn btn-primary">Take the Survey →</a>
      </div>`;
  }

  // ── Survey section ────────────────────────────────
  const surveySection = document.getElementById("profile-survey");
  const noSurvey      = document.getElementById("profile-no-survey");
  if (user.survey) {
    if (surveySection) surveySection.style.display = "block";
    if (noSurvey)      noSurvey.style.display      = "none";
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || "—";
    };
    set("profile-interest",    user.survey.interest);
    set("profile-involvement", user.survey.involvement);
    set("profile-age",         user.survey.age);
    set("profile-city",        user.survey.city);
  } else {
    if (surveySection) surveySection.style.display = "none";
    if (noSurvey)      noSurvey.style.display      = "block";
  }

  // ── Saved resources ───────────────────────────────
  const savedSection = document.getElementById("profile-saved-section");
  const savedList    = document.getElementById("profile-saved-list");
  if (savedSection && savedList) {
    const savedIds = user.savedResources || [];
    if (savedIds.length > 0) {
      savedSection.style.display = "";
      fetch("assets/data/resources.json")
        .then(r => r.json())
        .then(resources => {
          const saved = resources.filter(r => savedIds.includes(r.id));
          if (saved.length === 0) { savedSection.style.display = "none"; return; }
          savedList.innerHTML = saved.map(r => `
            <a href="resource.html?id=${r.id}" class="saved-resource-row">
              <div class="srr-img" style="background-image:url('${r.image || ""}')"></div>
              <div class="srr-info">
                <span class="srr-name">${r.name}</span>
                <span class="srr-cat">${r.category || ""}</span>
              </div>
              <span class="srr-arrow">→</span>
            </a>`).join("");
        })
        .catch(() => { savedSection.style.display = "none"; });
    }
  }

  // ── Dark mode toggle initial state ────────────────
  const dmToggle = document.getElementById("dm-toggle");
  if (dmToggle && user.darkMode) dmToggle.classList.add("is-on");

  // ── Sign out button ───────────────────────────────
  const logoutBtn = document.getElementById("profile-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => logoutUser());
  }
}

function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;
  const msg = document.getElementById("signup-message");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password !== confirm) {
      msg.textContent = "Passwords do not match.";
      msg.style.color = "red";
      return;
    }

    const users = getUsers();
    const existing = users.find(u => u.email === email);
    if (existing) {
      msg.textContent = "An account with this email already exists. Try logging in.";
      msg.style.color = "red";
      return;
    }

    const newUser = {
      id: "u_" + Date.now(),
      name,
      email,
      password,
      survey: null,
      community: null,
      savedResources: []
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser.id);

    msg.textContent = "Account created! Taking you to the survey…";
    msg.style.color = "#2E7D60";

    setTimeout(() => {
      window.location.href = "survey.html";
    }, 800);
  });
}

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;
  const msg = document.getElementById("login-message");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.password !== password) {
      msg.textContent = "Invalid email or password.";
      msg.style.color = "red";
      return;
    }

    setCurrentUser(user.id);
    applyTheme();
    msg.textContent = "Login successful! Redirecting…";
    msg.style.color = "#2E7D60";

    setTimeout(() => {
      window.location.href = user.community ? "profile.html" : "survey.html";
    }, 800);
  });
}

document.addEventListener("DOMContentLoaded", initAuthUI);
