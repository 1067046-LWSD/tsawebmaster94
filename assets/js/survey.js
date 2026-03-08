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
  "Food Assistance": "🥗",
  "Healthcare":      "🏥",
  "Mental Health":   "💚",
  "Employment":      "💼",
  "Housing":         "🏠",
  "Education":       "📚",
  "Legal Aid":       "⚖️",
  "Youth Services":  "⭐",
  "Senior Services": "🌟",
  "Community":       "🤝"
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
        <div class="survey-spinner"></div>
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
        const icon = CATEGORY_ICONS[r.category] || '📋';
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
