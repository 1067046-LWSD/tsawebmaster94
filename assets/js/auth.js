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
  window.location.href = "index.html";
}

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
  updateNavAuthLinks();
  updateLocationDisplay();
  const logoutLink = document.getElementById("nav-logout");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  }
  initSignupForm();
  initLoginForm();
  initProfilePage();
}

function initProfilePage() {
  if (!document.getElementById("profile-name")) return;

  const user = requireAuth();
  if (!user) return;

  // Profile picture
  const avatar = document.getElementById("profile-avatar");
  const avatarInput = document.getElementById("avatar-input");
  if (avatar && avatarInput) {
    avatar.src = user.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=2E7D60&color=fff&size=136`;
    avatar.addEventListener("click", () => avatarInput.click());
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        avatar.src = ev.target.result;
        const users = getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          users[idx].avatar = ev.target.result;
          saveUsers(users);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  document.getElementById("profile-name").textContent = user.name || "Community Member";
  document.getElementById("profile-email").textContent = user.email;

  const communityBox = document.getElementById("profile-community-box");
  if (communityBox) {
    if (user.community) {
      const initial = (user.community || "C")[0].toUpperCase();
      communityBox.innerHTML = `
        <div class="passport-card">
          <div class="passport-left">
            <div class="passport-emblem">${initial}</div>
            <span class="passport-left-label">Member</span>
          </div>
          <div class="passport-right">
            <span class="passport-eyebrow">Your Community Match</span>
            <h3 class="passport-community-name">${user.community}</h3>
            <p class="passport-desc">You're part of something meaningful. Welcome to your community.</p>
            <span class="passport-status"><span class="passport-status-dot"></span> Active Member</span>
            <div class="passport-deco" aria-hidden="true">
              <svg viewBox="0 0 80 120" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M40 5 C18 18 5 52 22 88 C30 105 50 105 58 88 C75 52 62 18 40 5Z"/>
                <path d="M40 5 L40 100"/>
                <path d="M40 30 C30 37 18 52 22 68"/>
                <path d="M40 30 C50 37 62 52 58 68"/>
              </svg>
            </div>
          </div>
        </div>`;
    } else {
      communityBox.innerHTML = `
        <div class="no-community-card">
          <div class="no-community-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <circle cx="12" cy="8" r="4"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
            </svg>
          </div>
          <h3>No community yet</h3>
          <p>Take the survey to get matched with your community.</p>
          <a href="survey.html" class="profile-action-btn profile-action-btn--primary">Take the Survey →</a>
        </div>`;
    }
  }

  const surveySection = document.getElementById("profile-survey");
  const noSurvey = document.getElementById("profile-no-survey");
  if (user.survey) {
    if (surveySection) surveySection.style.display = "block";
    if (noSurvey) noSurvey.style.display = "none";
    const interest = document.getElementById("profile-interest");
    const involvement = document.getElementById("profile-involvement");
    const age = document.getElementById("profile-age");
    const city = document.getElementById("profile-city");
    if (interest) interest.textContent = user.survey.interest;
    if (involvement) involvement.textContent = user.survey.involvement;
    if (age) age.textContent = user.survey.age;
    if (city) city.textContent = user.survey.city || "—";
    // Populate stat city tile
    const statCity = document.getElementById("stat-city-short");
    if (statCity && user.survey.city) {
      const cityMap = { "Springfield": "SPR", "Seattle": "SEA", "NYC": "NYC", "Los Angeles": "LA" };
      statCity.textContent = cityMap[user.survey.city] || user.survey.city.substring(0, 3).toUpperCase();
    }
  } else {
    if (surveySection) surveySection.style.display = "none";
    if (noSurvey) noSurvey.style.display = "block";
  }

  // Load saved resources
  if (user.savedResources && user.savedResources.length > 0) {
    fetch("assets/data/resources.json")
      .then(r => r.json())
      .then(all => {
        const saved = all.filter(r => user.savedResources.includes(r.id));
        const box = document.getElementById("profile-saved-resources");
        if (!box || saved.length === 0) return;
        const catIcons = {
          "Food Assistance": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 2v7c0 1.7 1.3 3 3 3s3-1.3 3-3V2M6 12v10M18 2c0 0-3 3-3 7s3 7 3 7"/><path d="M18 22V9"/></svg>`,
          "Healthcare":      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`,
          "Mental Health":   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
          "Employment":      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
          "Housing":         `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
          "Education":       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
          "Legal Aid":       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M4 21h16"/><path d="M7 6l-4 8h8L7 6zM17 6l-4 8h8l-4-8z"/></svg>`,
          "Youth Services":  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
          "Senior Services": `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
          "Community":       `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
        };
        box.style.display = "block";
        const grid = box.querySelector(".saved-resources-grid");
        if (!grid) return;
        grid.innerHTML = saved.map(r => `
          <a href="resource.html?id=${r.id}" class="saved-resource-chip">
            <span class="saved-resource-chip-icon">${catIcons[r.category] || `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/></svg>`}</span>
            <span class="saved-resource-chip-body">
              <span class="saved-resource-chip-name">${r.name}</span>
              <span class="saved-resource-chip-cat">${r.category}</span>
            </span>
          </a>`).join("");
      });
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
    msg.textContent = "Login successful! Redirecting…";
    msg.style.color = "#2E7D60";

    setTimeout(() => {
      window.location.href = user.community ? "profile.html" : "survey.html";
    }, 800);
  });
}

document.addEventListener("DOMContentLoaded", initAuthUI);
