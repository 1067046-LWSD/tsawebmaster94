// ===================================
// Community Connect - Helper
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
  const navLogin = document.getElementById("nav-login");
  const navSignup = document.getElementById("nav-signup");
  const navProfile = document.getElementById("nav-profile");
  const navLogout = document.getElementById("nav-logout");

  if (!navLogin || !navSignup || !navProfile || !navLogout) return;

  if (currentUser) {
    navLogin.closest("li").style.display = "none";
    navSignup.closest("li").style.display = "none";
    navProfile.closest("li").style.display = "";
    navLogout.closest("li").style.display = "";
  } else {
    navLogin.closest("li").style.display = "";
    navSignup.closest("li").style.display = "";
    navProfile.closest("li").style.display = "none";
    navLogout.closest("li").style.display = "none";
  }
}

function initAuthUI() {
  updateNavAuthLinks();
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
    if (user.avatar) avatar.src = user.avatar;
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
      communityBox.innerHTML = `<div class="community-card assigned">${user.community}</div>`;
    } else {
      communityBox.innerHTML = `<p>No community assigned yet. <a href="survey.html">Take the survey</a> to get matched.</p>`;
    }
  }

  const surveySection = document.getElementById("profile-survey");
  const noSurvey = document.getElementById("profile-no-survey");
  if (user.survey) {
    if (surveySection) surveySection.style.display = "block";
    if (noSurvey) noSurvey.style.display = "none";
    document.getElementById("profile-interest").textContent = user.survey.interest;
    document.getElementById("profile-involvement").textContent = user.survey.involvement;
    document.getElementById("profile-age").textContent = user.survey.age;
  } else {
    if (surveySection) surveySection.style.display = "none";
    if (noSurvey) noSurvey.style.display = "block";
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
      community: null
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
