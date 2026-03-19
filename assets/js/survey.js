// ===================================
// Community Survey — Step Wizard
// ===================================

const COMMUNITIES = {
  STEM:    "STEM Innovators",
  Arts:    "Creative Arts Collective",
  Service: "Community Service Leaders",
  General: "Neighborhood Connectors"
};

const CATEGORY_ICONS = {
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

const REGION_MAP = {
  "Springfield":  "Springfield",
  "Seattle":      "Seattle",
  "NYC":          "New York",
  "Los Angeles":  "Los Angeles"
};

const INTEREST_CATEGORIES = {
  "STEM":    ["Education", "Employment"],
  "Arts":    ["Community", "Education"],
  "Service": ["Community", "Food Assistance", "Healthcare"],
  "Other":   ["Healthcare", "Community", "Housing"]
};

function assignCommunity(answers) {
  const { interest, involvement } = answers;
  if (interest === "STEM")    return COMMUNITIES.STEM;
  if (interest === "Arts")    return COMMUNITIES.Arts;
  if (interest === "Service" || involvement === "Volunteering") return COMMUNITIES.Service;
  return COMMUNITIES.General;
}

function initSurveyPage() {
  const wizard = document.getElementById('survey-wizard');
  if (!wizard) return;

  const user = requireAuth();
  if (!user) return;

  const answers = {};
  let currentStep = 0;

  const panels    = Array.from(document.querySelectorAll('.wizard-panel'));
  const dots      = Array.from(document.querySelectorAll('.step-dot'));
  const stepNumEl = document.getElementById('step-num');
  const backBtn   = document.getElementById('wizard-back');

  panels.forEach((p, i) => { p.style.display = i === 0 ? 'block' : 'none'; });

  function updateProgress() {
    if (stepNumEl) stepNumEl.textContent = currentStep + 1;
    dots.forEach((d, i) => {
      d.classList.remove('active', 'done');
      if (i === currentStep) d.classList.add('active');
      else if (i < currentStep) d.classList.add('done');
    });
    if (backBtn) backBtn.style.display = currentStep > 0 ? 'flex' : 'none';
  }

  function goToStep(newStep) {
    const fromPanel = panels[currentStep];
    const toPanel   = panels[newStep];
    const dir       = newStep > currentStep ? 1 : -1;

    fromPanel.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
    fromPanel.style.opacity    = '0';
    fromPanel.style.transform  = `translateX(${dir * -28}px)`;

    setTimeout(() => {
      fromPanel.style.display    = 'none';
      fromPanel.style.transition = '';
      fromPanel.style.opacity    = '';
      fromPanel.style.transform  = '';

      currentStep = newStep;
      updateProgress();

      toPanel.style.opacity   = '0';
      toPanel.style.transform = `translateX(${dir * 28}px)`;
      toPanel.style.display   = 'block';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toPanel.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
          toPanel.style.opacity    = '1';
          toPanel.style.transform  = 'translateX(0)';
          setTimeout(() => {
            toPanel.style.transition = '';
            toPanel.style.opacity    = '';
            toPanel.style.transform  = '';
          }, 280);
        });
      });
    }, 220);
  }

  function saveAndRedirect(selectedIds) {
    const community = assignCommunity(answers);
    const users = getUsers();
    const idx   = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].survey         = answers;
      users[idx].community      = community;
      users[idx].savedResources = selectedIds || [];
      saveUsers(users);
    }
    window.location.href = 'profile.html';
  }

  async function showRecommendations() {
    // Save survey data immediately
    const community = assignCommunity(answers);
    const users = getUsers();
    const idx   = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx].survey    = answers;
      users[idx].community = community;
      saveUsers(users);
    }

    // Show loading state
    wizard.innerHTML = `
      <div class="survey-done">
        <div class="survey-done-icon">
          <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="1.5"/>
            <path d="M14 24L21 31L34 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Finding your matches…</h2>
        <p>Picking resources just for you.</p>
        <div class="loader-inner" style="margin: 0 auto;">
          <svg class="loader-ring" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="33"/></svg>
          <span class="loader-c"></span>
        </div>
      </div>`;

    let resources = [];
    try {
      const res = await fetch('assets/data/resources.json');
      resources = await res.json();
    } catch (e) {
      saveAndRedirect([]);
      return;
    }

    const region   = REGION_MAP[answers.city] || answers.city;
    const preferred = INTEREST_CATEGORIES[answers.interest] || [];

    const cityResources = resources.filter(r => r.region === region);
    const scored = cityResources.map(r => ({
      ...r,
      score: preferred.includes(r.category) ? 2 : 1
    }));
    // Sort by score, then shuffle within same score for variety
    scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
    const picks = scored.slice(0, 6);

    if (picks.length === 0) {
      saveAndRedirect([]);
      return;
    }

    const selectedIds = new Set();

    setTimeout(() => {
      wizard.innerHTML = `
        <div class="recs-header">
          <div class="recs-check-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="1.5"/>
              <path d="M14 24L21 31L34 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2>Resources picked for you</h2>
          <p>Select any that interest you — they'll be saved to your profile.</p>
        </div>
        <div class="recs-grid" id="recs-grid"></div>
        <div class="recs-actions">
          <button class="btn-save-recs" id="btn-save-recs">Save picks &amp; go to profile →</button>
          <a class="recs-skip" id="recs-skip">Not interested — I'll browse on my own</a>
        </div>`;

      const grid = document.getElementById('recs-grid');
      picks.forEach(r => {
        const card = document.createElement('button');
        card.className = 'rec-card';
        card.dataset.id = r.id;
        const icon = CATEGORY_ICONS[r.category] || `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/></svg>`;
        card.innerHTML = `
          <div class="rec-card-icon">${icon}</div>
          <div>
            <span class="rec-card-name">${r.name}</span>
            <span class="rec-card-cat">${r.category}</span>
          </div>`;
        card.addEventListener('click', () => {
          card.classList.toggle('selected');
          if (selectedIds.has(r.id)) selectedIds.delete(r.id);
          else selectedIds.add(r.id);
        });
        grid.appendChild(card);
      });

      document.getElementById('btn-save-recs').addEventListener('click', () => {
        saveAndRedirect([...selectedIds]);
      });

      document.getElementById('recs-skip').addEventListener('click', () => {
        saveAndRedirect([]);
      });
    }, 900);
  }

  // Wire up choice cards
  document.querySelectorAll('.choice-card').forEach(card => {
    card.addEventListener('click', () => {
      const field = card.dataset.field;
      const value = card.dataset.value;
      const step  = parseInt(card.dataset.step);

      answers[field] = value;

      document.querySelectorAll(`[data-field="${field}"]`).forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const nextStep = step + 1;
      if (nextStep < panels.length) {
        setTimeout(() => goToStep(nextStep), 260);
      } else {
        setTimeout(() => showRecommendations(), 350);
      }
    });
  });

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (currentStep > 0) goToStep(currentStep - 1);
    });
  }

  updateProgress();
}

document.addEventListener('DOMContentLoaded', initSurveyPage);
