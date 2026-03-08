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
          "Food Assistance":"🥗","Healthcare":"🏥","Mental Health":"💚",
          "Employment":"💼","Housing":"🏠","Education":"📚",
          "Legal Aid":"⚖️","Youth Services":"⭐","Senior Services":"🌟","Community":"🤝"
        };
        box.style.display = "block";
        const grid = box.querySelector(".saved-resources-grid");
        if (!grid) return;
        grid.innerHTML = saved.map(r => `
          <a href="resource.html?id=${r.id}" class="saved-resource-chip">
            <span class="saved-resource-chip-icon">${catIcons[r.category] || "📋"}</span>
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
