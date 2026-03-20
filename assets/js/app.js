// ===================================
// Conduit - Main JavaScript
// ===================================

// Global state
let allResources = [];
let currentFilter = 'All';
let currentSort = 'featured';
let _parallaxScrollHandler = null;

// ===================================
// Page Loader
// ===================================
function spinLogo() {
  const logo = document.querySelector('.logo-mark');
  if (!logo) return;
  logo.classList.add('logo-mark--spin');
  logo.addEventListener('animationend', () => logo.classList.remove('logo-mark--spin'), { once: true });
}

function initLoader() {
  if (document.getElementById('page-loader')) return;
  const loader = document.createElement('div');
  loader.id = 'page-loader';
  loader.innerHTML = `
    <div class="loader-inner">
      <svg class="loader-ring" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="33"/>
      </svg>
      <span class="loader-c"></span>
    </div>`;
  document.body.appendChild(loader);
}

function showLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.add('is-visible');
}

function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) loader.classList.remove('is-visible');
}

// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', function() {
  initLoader();
  spinLogo();
  setUpPage();
});

function setUpPage() {
  // Set active nav link
  setActiveNavLink();

  // Re-init auth UI (nav toggle + signup/login forms) after SPA navigation
  if (typeof initAuthUI === 'function') initAuthUI();

  // Update dynamic location display
  if (typeof updateLocationDisplay === 'function') updateLocationDisplay();

  // Mobile menu toggle
  setupMobileMenu();

  // Scroll reveal for all pages
  initScrollReveal();

  // Homepage-specific effects (parallax, nav transparency)
  if (document.querySelector('.hero-home')) {
    initHomepageEffects();
  }

  // Load resources for directory, map, and homepage
  if (document.getElementById('resources-container') || document.getElementById('map') || document.getElementById('featured-resources')) {
    loadResources();
  }

  // Setup form submission
  if (document.getElementById('submit-form')) {
    setupFormSubmission();
    initCharacterCount();
  }

  // Marquee testimonials (homepage)
  if (document.querySelector('.marquee-track')) {
    initMarquee();
  }

  // Back-to-top button (global)
  initBackToTop();

  // Setup homepage search
  if (document.querySelector('.search-box-home') || document.querySelector('.search-button-home')) {
    setupHomepageSearch();
  }

  // Load single resource page
  if (window.location.pathname.includes('resource.html') || document.getElementById('resource-title')) {
    loadSingleResource();
  }

  // Articles listing page
  if (document.getElementById('art-grid')) {
    loadArticlesPage();
  }

  // Recently viewed (homepage only)
  if (document.getElementById('recently-viewed-section')) initRecentlyViewed();

  // Global keyboard shortcuts
  setupKeyboardShortcuts();
}

// ===================================
// Scroll Reveal (runs on every page/navigation)
// ===================================
function initScrollReveal() {
  const sections = document.querySelectorAll('.reveal-section, .reveal-block');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        entry.target.classList.add('block-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  sections.forEach(el => observer.observe(el));
}

// ===================================
// Homepage Effects (parallax + transparent nav)
// ===================================
function initHomepageEffects() {
  const nav = document.getElementById('main-nav');
  const heroSection = document.querySelector('.hero-home');

  if (nav && heroSection) {
    const navObserver = new IntersectionObserver(
      ([entry]) => nav.classList.toggle('nav--scrolled', !entry.isIntersecting),
      { threshold: 0.05 }
    );
    navObserver.observe(heroSection);
  }

  // Parallax video — remove old listener first to avoid stacking
  if (_parallaxScrollHandler) {
    window.removeEventListener('scroll', _parallaxScrollHandler);
    _parallaxScrollHandler = null;
  }
  const videoContainer = document.querySelector('.hero-video-container');
  if (videoContainer) {
    let rafPending = false;
    _parallaxScrollHandler = () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          videoContainer.style.transform = `translateY(${window.scrollY * 0.3}px)`;
          rafPending = false;
        });
      }
    };
    window.addEventListener('scroll', _parallaxScrollHandler, { passive: true });
  }
}

// ===================================
// Navigation Functions
// ===================================
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

function setupMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks   = document.querySelector('.nav-links');
  const navAuth    = document.querySelector('.nav-auth');

  if (!menuToggle || !navLinks) return;

  // Build a pinned auth bar at the bottom of the overlay (no duplicate IDs)
  let authBar = document.getElementById('mobile-menu-auth');
  if (!authBar) {
    authBar = document.createElement('div');
    authBar.id = 'mobile-menu-auth';
    authBar.className = 'mobile-menu-auth';

    // Mirror auth state from nav-auth
    if (navAuth) {
      const signinEl  = navAuth.querySelector('.nav-signin-btn');
      const profileEl = navAuth.querySelector('.nav-profile-corner');

      if (signinEl) {
        const a = document.createElement('a');
        a.href = signinEl.href || 'login.html';
        a.className = 'nav-signin-btn';
        a.textContent = 'Sign In';
        authBar.appendChild(a);
      }
      if (profileEl) {
        const cloned = profileEl.cloneNode(true);
        // Remove IDs from clone to avoid duplicates
        cloned.removeAttribute('id');
        cloned.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        authBar.appendChild(cloned);
      }
    }
    document.body.appendChild(authBar);
  }

  // Sync visibility of signin vs profile in authBar with navAuth
  function syncAuthBar() {
    if (!navAuth) return;
    const navSignin  = navAuth.querySelector('.nav-signin-btn');
    const navProfile = navAuth.querySelector('.nav-profile-corner');
    const barSignin  = authBar.querySelector('.nav-signin-btn');
    const barProfile = authBar.querySelector('.nav-profile-corner');

    if (barSignin)  barSignin.style.display  = navSignin  && navSignin.style.display  !== 'none' ? '' : 'none';
    if (barProfile) barProfile.style.display = navProfile && navProfile.style.display !== 'none' ? '' : 'none';

    // Mirror avatar src
    const navAvatar = navAuth.querySelector('.nav-avatar-thumb');
    const barAvatar = authBar.querySelector('img');
    if (navAvatar && barAvatar) barAvatar.src = navAvatar.src;
  }

  const mainNav = document.getElementById('main-nav');

  function openMenu() {
    // Remove backdrop-filter so the fixed overlay isn't trapped inside the nav
    if (mainNav) {
      mainNav.style.backdropFilter = 'none';
      mainNav.style.webkitBackdropFilter = 'none';
    }
    navLinks.classList.add('active');
    menuToggle.classList.add('is-open');
    authBar.classList.add('active');
    document.body.style.overflow = 'hidden';
    syncAuthBar();
  }

  function closeMenu() {
    navLinks.classList.remove('active');
    menuToggle.classList.remove('is-open');
    authBar.classList.remove('active');
    document.body.style.overflow = '';
    // Restore backdrop-filter after overlay transition ends
    if (mainNav) {
      setTimeout(() => {
        mainNav.style.backdropFilter = '';
        mainNav.style.webkitBackdropFilter = '';
      }, 320);
    }
  }

  menuToggle.addEventListener('click', () => {
    navLinks.classList.contains('active') ? closeMenu() : openMenu();
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
  authBar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
}

window.navigation.addEventListener('navigate', (navigateEvent) => {
  const nextURL = new URL(navigateEvent.destination.url);

  // These pages must do a full page load (survey.js needs execution; map pages need Leaflet)
  if (nextURL.pathname.includes('survey.html')) return;
  if (nextURL.pathname.includes('map.html')) return;
  if (nextURL.pathname.includes('resource.html')) return;
  if (nextURL.pathname.includes('article.html')) return;
  if (nextURL.pathname.includes('donate.html')) return;

  if (!navigateEvent.canIntercept) return;
  navigateEvent.intercept({
    scroll: 'manual',
    async handler() {
      showLoader();
      const { mainHTML, headStyles } = await getNewContent(nextURL);

      // Swap page-specific <style> tags from <head>
      document.querySelectorAll('style[data-page-style]').forEach(el => el.remove());
      headStyles.forEach(css => {
        const style = document.createElement('style');
        style.setAttribute('data-page-style', '');
        style.textContent = css;
        document.head.appendChild(style);
      });

      if (document.startViewTransition) {
        const transition = document.startViewTransition(() => {
          const main = document.querySelector('main');
          if (main) main.innerHTML = mainHTML || "";
          setUpPage();
          hideLoader();
        });
        await transition.ready;
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        const main = document.querySelector('main');
        if (main) main.innerHTML = mainHTML;
        setUpPage();
        hideLoader();
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    },
  });
});

async function getNewContent(url) {
  const page = await fetch(url.href);
  const data = await page.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/html');

  const mainEl = doc.querySelector('main');
  const mainHTML = mainEl ? mainEl.innerHTML : "";

  // Extract all <style> blocks from the fetched page's <head>
  const headStyles = [...doc.querySelectorAll('head style')].map(s => s.textContent);

  return { mainHTML, headStyles };
}

// ===================================
// Homepage Search
// ===================================
function setupHomepageSearch() {
  const searchBox = document.querySelector('.search-box-home');
  const searchButton = document.querySelector('.search-button-home');
  
  function performSearch() {
    if (searchBox) {
      const searchTerm = searchBox.value.trim();
      if (searchTerm) {
        window.location.href = `directory.html?search=${encodeURIComponent(searchTerm)}`;
      }
    }
  }
  
  if (searchBox) {
    searchBox.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
  
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
}

// ===================================
// Load and Display Resources
// ===================================
//ai generated
async function loadResources() {
  try {
    const response = await fetch('assets/data/resources.json');
    if (!response.ok) {
        // Log a warning if the file is not found (e.g., when running on file://)
        console.error('Error loading resources. Check if "assets/data/resources.json" exists and if you are running on a web server.');
        // Display an error message to the user
        const container = document.getElementById('resources-container');
        if (container) {
             container.innerHTML = '<p style="text-align: center; color: red; padding: 2rem;">Error: Could not load resources data. Please ensure the resources.json file is correct and accessible.</p>';
        }
        return; 
    }
    allResources = await response.json();

    // If user has a survey city, restrict all resources to that city only
    const _loggedInUser = getCurrentUser();
    const _REGION_MAP = {
      'Springfield': 'Springfield',
      'Seattle':     'Seattle',
      'NYC':         'New York',
      'Los Angeles': 'Los Angeles',
    };
    const _surveyRegion = _loggedInUser?.survey?.city ? _REGION_MAP[_loggedInUser.survey.city] : null;
    if (_surveyRegion) {
      allResources = allResources.filter(r => r.region === _surveyRegion);
    }

    // Check for search/category parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    const categoryParam = urlParams.get('category');

    // Display resources on directory page
    if (document.getElementById('resources-container')) {
      setupDirectorySearch(); // Initialize the search and filter listeners
      setupCategoryFilters();
      setupExtraFilters();
      setupSort();

      if (categoryParam) {
        // Simulate clicking the matching filter button
        const targetBtn = document.querySelector(`.filter-btn[data-category="${categoryParam}"]`);
        if (targetBtn) targetBtn.click();
      } else if (searchTerm) {
        // Pre-fill search box and apply search filter from homepage
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = searchTerm;
        }
        displayResources(filterResources(searchTerm, currentFilter));
      } else {
        displayResources(allResources);
      }
    }
    
    // Display featured resources on homepage
    if (document.getElementById('featured-resources')) {
      displayFeaturedResources();
    }
    
    // Initialize map
    if (document.getElementById('map')) {
      initializeMap();
    }
  } catch (error) {
    console.error('An unexpected error occurred while processing resources:', error);
  }
}

// ===================================
// Sort Helpers
// ===================================
function applySort(resources) {
  if (currentSort === 'az') return [...resources].sort((a, b) => a.name.localeCompare(b.name));
  if (currentSort === 'za') return [...resources].sort((a, b) => b.name.localeCompare(a.name));
  // 'featured' — featured resources first, then original order
  return [...resources].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

// ===================================
// Saved Resources (Bookmarks)
// ===================================
function getSavedResources() {
  const user = getCurrentUser();
  if (!user) return [];
  return user.savedResources || [];
}

function setSavedResources(ids) {
  const userId = localStorage.getItem('currentUserId');
  if (!userId) return;
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx].savedResources = ids;
  localStorage.setItem('users', JSON.stringify(users));
}

window.toggleSave = function(id, btn) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const saved = getSavedResources();
  const idx = saved.indexOf(id);
  if (idx === -1) {
    saved.push(id);
    btn.classList.add('is-saved');
    btn.setAttribute('aria-label', 'Unsave resource');
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
    showToast('Resource saved to your profile', 'success');
  } else {
    saved.splice(idx, 1);
    btn.classList.remove('is-saved');
    btn.setAttribute('aria-label', 'Save resource');
    btn.querySelector('svg').setAttribute('fill', 'none');
    showToast('Removed from saved', 'info');
  }
  setSavedResources(saved);
};

// ===================================
// Display Resources
// ===================================
function displayResources(resources) {
  const container = document.getElementById('resources-container');
  if (!container) return;

  // Update result count display
  const countEl = document.getElementById('results-count');
  if (countEl) {
    if (resources.length === allResources.length) {
      countEl.innerHTML = `<strong>${resources.length}</strong> resources available`;
    } else {
      countEl.innerHTML = `Showing <strong>${resources.length}</strong> of <strong>${allResources.length}</strong> resources`;
    }
  }

  if (resources.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M16.5 16.5L21 21"/>
            <path d="M8 11h6M11 8v6" stroke-width="1.5"/>
          </svg>
        </div>
        <h3>No resources found</h3>
        <p>Try broadening your search or clearing some filters. There's always something here to help.</p>
        <button class="btn btn-primary" onclick="document.getElementById('search-input').value=''; currentFilter='All'; document.querySelector('.filter-btn[data-category=All]').click();">Clear all filters</button>
      </div>`;
    return;
  }

  const sorted = applySort(resources);
  const saved = getSavedResources();

  const CARD_CAT_COLORS = {
    'Food Assistance': '#156b3a', 'Healthcare': '#b83232', 'Education': '#1a55a0',
    'Employment': '#b84510', 'Housing': '#7c4daa', 'Legal': '#2e7d60', 'Community': '#2e7d60',
  };

  container.innerHTML = sorted.map(resource => {
    const isSaved = saved.includes(resource.id);
    const costClass = resource.cost === 'Free' ? 'free' : '';
    const costLabel = resource.cost || '';
    const accent = CARD_CAT_COLORS[resource.category] || '#2e7d60';
    return `
      <div class="resource-card" data-id="${resource.id}" data-category="${resource.category}" style="--cat-accent:${accent}">
        <div class="resource-img-wrap" onclick="openResource(${resource.id})">
          <img src="${resource.image}" alt="${resource.name}" class="resource-image" loading="lazy">
          ${costLabel ? `<span class="cost-badge ${costClass}">${costLabel}</span>` : ''}
          <button class="bookmark-btn ${isSaved ? 'is-saved' : ''}"
            aria-label="${isSaved ? 'Unsave resource' : 'Save resource'}"
            onclick="event.stopPropagation(); toggleSave(${resource.id}, this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button class="quick-view-btn" onclick="openQuickView(${resource.id}, event)" aria-label="Quick view ${resource.name}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Quick View
          </button>
        </div>
        <div class="resource-card-accent"></div>
        <div class="resource-content" onclick="openResource(${resource.id})" style="cursor:pointer;">
          <div class="resource-header">
            <h3>${resource.name}</h3>
            <span class="category-badge" style="background:${accent}18;color:${accent};border:1px solid ${accent}33;">${resource.category}</span>
          </div>
          <p>${resource.description.substring(0, 120)}…</p>
          <div class="resource-details">
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin-right:4px"><path d="M12 2C8.7 2 6 4.7 6 8c0 5 6 13 6 13s6-8 6-13c0-3.3-2.7-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg>${resource.address}</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${resource.hours || resource.phone}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ===================================
// Display Featured Resources (Homepage)
// ===================================
function displayFeaturedResources() {
  const container = document.getElementById('featured-resources');
  
  if (!container) return;
  
  let featuredResources = allResources.filter(r => r.featured).slice(0, 3);
  // Pad to 3: if fewer than 3 featured, fill with non-featured from the same city
  if (featuredResources.length < 3) {
    const featuredIds = new Set(featuredResources.map(r => r.id));
    const extras = allResources.filter(r => !featuredIds.has(r.id));
    featuredResources = [...featuredResources, ...extras].slice(0, 3);
  }
  
  container.innerHTML = featuredResources.map(resource => `
    <div class="featured-card" onclick="openResource(${resource.id})" style="cursor:pointer;">
      <img src="${resource.image}" alt="${resource.name}">
      <div class="featured-card-content">
        <div class="resource-header">
          <h3>${resource.name}</h3>
          <span class="category-badge">${resource.category}</span>
        </div>
        <p>${resource.description}</p>
        <div class="resource-details">
          <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin-right:4px"><path d="M12 2C8.7 2 6 4.7 6 8c0 5 6 13 6 13s6-8 6-13c0-3.3-2.7-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg>${resource.address}</span>
          <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin-right:4px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.59 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>${resource.phone}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  // Initialize stat counters after resources load
  initializeStatCounters();
}

// ===================================
// Animated Statistics Counters
// ===================================
function initializeStatCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  
  if (statNumbers.length === 0) return;
  
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // 2 seconds
  const increment = target / (duration / 16); // 60fps
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target + (target === 100 ? '%' : '+');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current) + (target === 100 ? '%' : '+');
    }
  }, 16);
}

// ===================================
// Search Functionality
// ===================================
function setupDirectorySearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn'); 

  // Function to filter and display resources
  const runSearch = () => {
    const searchTerm = searchInput.value.trim();
    
    //only need to apply the filter, the filterResources function handles the logic
    const filtered = filterResources(searchTerm, currentFilter);
    displayResources(filtered);
  };

  if (searchInput) {
    //Live Search
    searchInput.addEventListener('input', runSearch);

    //Search when pressing 'Enter' key
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        // Run search explicitly for instant update
        runSearch();
      }
    });
  }

  //Search when clicking the magnifying glass icon
  if (searchBtn) {
    searchBtn.addEventListener('click', runSearch);
  }
}

// ===================================
// Category Filters
// ===================================
function setupCategoryFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Update current filter
      currentFilter = this.dataset.category;
      
      // Filter and display
      const searchTerm = document.getElementById('search-input')?.value.trim() || '';
      const filtered = filterResources(searchTerm, currentFilter);
      displayResources(filtered);
    });
  });
}

// ===================================
// Filter Resources Function
// ===================================
function filterResources(searchTerm = '', category = 'All', cost = 'All', age = 'All') {
  let filtered = allResources;

  if (category && category !== 'All') {
    filtered = filtered.filter(r => r.category === category);
  }

  if (cost && cost !== 'All') {
    filtered = filtered.filter(r => r.cost === cost);
  }

  if (age && age !== 'All') {
    filtered = filtered.filter(r => r.age_group === age);
  }

  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(lower) ||
      r.description.toLowerCase().includes(lower) ||
      r.category.toLowerCase().includes(lower) ||
      r.address.toLowerCase().includes(lower)
    );
  }

  return filtered;
}

function setupExtraFilters() {
  const costFilter = document.getElementById('cost-filter');
  const ageFilter = document.getElementById('age-filter');

  if (!costFilter || !ageFilter) return;

  function applyFilters() {
    const searchTerm = document.getElementById('search-input')?.value.trim() || '';
    const cost = costFilter.value;
    const age = ageFilter.value;
    displayResources(filterResources(searchTerm, currentFilter, cost, age));
  }

  costFilter.addEventListener('change', applyFilters);
  ageFilter.addEventListener('change', applyFilters);
}

// ===================================
// Sort Dropdown
// ===================================
function setupSort() {
  const sortSelect = document.getElementById('sort-select');
  if (!sortSelect) return;
  sortSelect.value = currentSort;
  sortSelect.addEventListener('change', function() {
    currentSort = this.value;
    const searchTerm = document.getElementById('search-input')?.value.trim() || '';
    const cost = document.getElementById('cost-filter')?.value || 'All';
    const age = document.getElementById('age-filter')?.value || 'All';
    displayResources(filterResources(searchTerm, currentFilter, cost, age));
  });
}

// ===================================
// ===================================
// Marquee — duplicate cards for seamless loop
// ===================================
function initMarquee() {
  document.querySelectorAll('.marquee-track').forEach(track => {
    if (!track.dataset.duped) {
      track.innerHTML += track.innerHTML;
      track.dataset.duped = 'true';
    }
  });
}

// ===================================
// Back-to-Top Button
// ===================================
function initBackToTop() {
  // Only create once — button persists across SPA navigations
  if (document.getElementById('back-to-top')) return;
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12L12 5L19 12"/></svg>`;
  document.body.appendChild(btn);
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  }, { passive: true });
}

// ===================================
// Description Character Count
// ===================================
function initCharacterCount() {
  const textarea = document.getElementById('description');
  const counter = document.getElementById('desc-counter');
  if (!textarea || !counter) return;
  const max = 600;
  function update() {
    const len = textarea.value.length;
    counter.textContent = `${len} / ${max} characters`;
    counter.classList.toggle('over-limit', len > max);
  }
  textarea.addEventListener('input', update);
  update();
}

// ===================================
// Map Functionality
// ===================================
function initializeMap() {
  const user = getCurrentUser();
  const isLoggedIn = !!user;

  // Category → marker color
  const CATEGORY_COLORS = {
    'Food Assistance': '#156b3a',
    'Healthcare':      '#b83232',
    'Education':       '#1a55a0',
    'Employment':      '#b84510',
    'Housing':         '#7c4daa',
    'Legal':           '#2e7d60',
    'Community':       '#2e7d60',
  };

  // City quick-zoom targets
  const CITIES = {
    nyc:         { label: 'New York City', lat: 40.7128,  lng: -74.0060,  zoom: 12 },
    la:          { label: 'Los Angeles',   lat: 34.0522,  lng: -118.2437, zoom: 12 },
    seattle:     { label: 'Seattle',       lat: 47.6062,  lng: -122.3321, zoom: 12 },
    springfield: { label: 'Springfield',   lat: 39.7817,  lng: -89.6501,  zoom: 13 },
  };

  // Survey city → map key lookup
  const SURVEY_CITY_MAP = {
    'Springfield':  'springfield',
    'Seattle':      'seattle',
    'NYC':          'nyc',
    'Los Angeles':  'la',
  };
  const surveyCity = user?.survey?.city ? SURVEY_CITY_MAP[user.survey.city] : null;
  const surveyTarget = surveyCity ? CITIES[surveyCity] : null;

  // Start view: survey city if logged in + city set, else Springfield for logged-in, US for logged-out
  const startView = surveyTarget
    ? { lat: surveyTarget.lat, lng: surveyTarget.lng, zoom: surveyTarget.zoom }
    : isLoggedIn
      ? { lat: 39.7817, lng: -89.6501, zoom: 13 }
      : { lat: 39.5,    lng: -98.35,   zoom: 4  };

  const map = L.map('map', { zoomControl: false }).setView([startView.lat, startView.lng], startView.zoom);

  // Move zoom controls to top-right
  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // Hero subtitle
  const heroSub = document.getElementById('map-hero-sub');
  if (heroSub) {
    heroSub.textContent = isLoggedIn
      ? 'Centered on your location — click any marker to explore.'
      : 'Choose a city to explore, or click any marker for details.';
  }

  // Status badge helper
  const statusBadge = document.getElementById('map-status-badge');
  const statusText  = document.getElementById('map-status-text');
  function setStatus(text, show = true) {
    if (!statusBadge || !statusText) return;
    statusText.textContent = text;
    statusBadge.style.display = show ? 'inline-flex' : 'none';
  }

  // Resource count badge
  const countEl = document.getElementById('map-resource-count');
  if (countEl) countEl.textContent = `${allResources.length} resources on map`;

  // Locate button (works for all users)
  const locateBtn = document.getElementById('map-locate-btn');
  function flyToUserLocation() {
    if (!navigator.geolocation) return;
    if (locateBtn) { locateBtn.classList.add('is-loading'); locateBtn.disabled = true; }
    setStatus('Detecting location…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { animate: true, duration: 1.5 });
        setStatus('Near your location');
        if (locateBtn) { locateBtn.classList.remove('is-loading'); locateBtn.disabled = false; }
        if (heroSub) heroSub.textContent = 'Showing resources near your location.';
      },
      () => {
        setStatus('Location unavailable', false);
        if (locateBtn) { locateBtn.classList.remove('is-loading'); locateBtn.disabled = false; }
      },
      { timeout: 8000 }
    );
  }
  if (locateBtn) locateBtn.addEventListener('click', flyToUserLocation);

  // Logged-in + survey city → fly to their city, no GPS needed
  // Logged-in + no city → try geolocation
  if (isLoggedIn && surveyTarget) {
    setStatus(surveyTarget.label);
    if (heroSub) heroSub.textContent = `Showing resources in ${surveyTarget.label}.`;
  } else if (isLoggedIn) {
    flyToUserLocation();
  }

  // City buttons: hide for logged-in users with a survey city
  const cityBtnsEl = document.getElementById('map-city-btns');
  if (cityBtnsEl) {
    cityBtnsEl.style.display = (isLoggedIn && surveyTarget) ? 'none' : isLoggedIn ? 'none' : 'flex';
    cityBtnsEl.querySelectorAll('[data-city]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = CITIES[btn.dataset.city];
        if (!c) return;
        map.flyTo([c.lat, c.lng], c.zoom, { animate: true, duration: 1.2 });
        cityBtnsEl.querySelectorAll('[data-city]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        setStatus(c.label);
        if (heroSub) heroSub.textContent = `Exploring resources in ${c.label}.`;
      });
    });
  }

  // Colored markers per category
  function makeIcon(color) {
    return L.divIcon({
      className: '',
      html: `<div style="
        background:${color};
        width:28px; height:28px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 3px 8px rgba(0,0,0,0.35);
      "></div>`,
      iconSize:   [28, 28],
      iconAnchor: [14, 28],
      popupAnchor:[0, -28]
    });
  }

  // Category filter pills
  const allMarkers = [];
  const filterPills = document.querySelectorAll('[data-filter]');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      const filter = pill.dataset.filter;
      allMarkers.forEach(({ marker, category }) => {
        if (filter === 'All' || category === filter) {
          marker.addTo(map);
        } else {
          marker.remove();
        }
      });
      const visible = filter === 'All' ? allResources.length
        : allResources.filter(r => r.category === filter).length;
      if (countEl) countEl.textContent = `${visible} resource${visible !== 1 ? 's' : ''} shown`;
    });
  });

  // Add markers for all resources
  allResources.forEach(resource => {
    const color = CATEGORY_COLORS[resource.category] || '#2e7d60';
    const marker = L.marker([resource.lat, resource.lng], { icon: makeIcon(color) }).addTo(map);
    allMarkers.push({ marker, category: resource.category });

    const popupContent = `
      <div class="popup-content popup-content--map${resource.image ? ' popup-content--with-image' : ''}" style="min-width:230px;">
        ${resource.image ? `<img src="${resource.image}" alt="${resource.name}" class="popup-resource-image" loading="lazy">` : ''}
        <div class="popup-text-panel">
          <h3 style="margin:0 0 0.45rem;font-size:1rem;font-family:'Fraunces',serif;font-weight:700;color:#1a2e1f;">${resource.name}</h3>
          <span class="category-badge" style="background:${color}18;color:${color};border:1px solid ${color}40;">${resource.category}</span>
          <p style="margin:0.65rem 0 0.5rem;font-size:0.855rem;color:#555;line-height:1.5;">${resource.description.substring(0, 110)}…</p>
          <a href="resource.html?id=${resource.id}" style="display:inline-flex;align-items:center;gap:0.3rem;color:${color};font-weight:700;font-size:0.845rem;text-decoration:none;">
            View Details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, { maxWidth: 340, className: 'resource-popup' });
  });
}

// ===================================
// Form Submission
// ===================================
function setupFormSubmission() {
  const form = document.getElementById('submit-form');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const formData = {
        id: Date.now(),
        name: document.getElementById('name').value.trim(),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value.trim(),
        address: document.getElementById('address').value.trim(),
        website: (() => { let w = document.getElementById('website').value.trim(); if (w && !/^https?:\/\//i.test(w)) w = 'https://' + w; return w; })(),
        phone: document.getElementById('phone')?.value.trim() || '',
        featured: false,
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
        lat: 39.7817 + (Math.random() - 0.5) * 0.05,
        lng: -89.6501 + (Math.random() - 0.5) * 0.05,
        submittedAt: new Date().toISOString()
      };
      
      // Validate
      if (!formData.name || !formData.category || !formData.description || !formData.address) {
        showAlert('Please fill in all required fields.', 'error');
        return;
      }
      
      // Save to localStorage
      saveResourceToLocalStorage(formData);

      // Hide form, show thank-you card
      const successCard = document.getElementById('submit-success');
      if (successCard) {
        // The real header is the sibling before the success card
        const formHeader = successCard.previousElementSibling;
        form.style.display = 'none';
        if (formHeader) formHeader.style.display = 'none';
        document.querySelectorAll('.alert').forEach(el => el.remove());
        successCard.style.display = 'block';
        successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const anotherBtn = document.getElementById('submit-another-btn');
        if (anotherBtn) {
          // Replace with clone to avoid stacking duplicate listeners
          const freshBtn = anotherBtn.cloneNode(true);
          anotherBtn.replaceWith(freshBtn);
          freshBtn.addEventListener('click', () => {
            successCard.style.display = 'none';
            if (formHeader) formHeader.style.display = '';
            form.style.display = '';
            form.reset();
            formHeader
              ? formHeader.scrollIntoView({ behavior: 'smooth', block: 'start' })
              : form.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      } else {
        showAlert('Thank you! Your resource has been submitted and is pending review.', 'success');
        form.reset();
      }
    });
  }
}

// ===================================
// LocalStorage Functions
// ===================================
function saveResourceToLocalStorage(resource) {
  // Get existing submissions
  const submissions = JSON.parse(localStorage.getItem('resourceSubmissions') || '[]');
  
  // Add new submission
  submissions.push(resource);
  
  // Save back to localStorage
  localStorage.setItem('resourceSubmissions', JSON.stringify(submissions));
}

function getSubmittedResources() {
  return JSON.parse(localStorage.getItem('resourceSubmissions') || '[]');
}

// ===================================
// Alert Messages
// ===================================
function showAlert(message, type = 'success') {
  // Remove existing alerts
  const existingAlert = document.querySelector('.alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  // Create new alert
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  // Insert at top of form container
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    formContainer.insertBefore(alert, formContainer.firstChild);
  }
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    alert.style.transition = 'opacity 0.3s';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

// ===================================
// Single Resource Page
// ===================================
function openResource(id) {
  const resource = allResources.find(r => r.id === id);
  if (resource) trackRecentlyViewed(resource);
  window.location.href = `resource.html?id=${id}`;
}

async function loadSingleResource() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) return;

  try {
    const response = await fetch('assets/data/resources.json');
    const resources = await response.json();
    window._resourcesCache = resources;
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    // Track as recently viewed
    trackRecentlyViewed(resource);

    document.getElementById('resource-title').textContent = resource.name;
    document.getElementById('resource-category').textContent = resource.category;
    document.getElementById('resource-description').textContent = resource.description;
    document.getElementById('resource-address').textContent = resource.address;
    document.getElementById('resource-phone').textContent = resource.phone;
    document.getElementById('resource-website').href = resource.website;
    document.getElementById('resource-image').src = resource.image;

    if (resource.services) {
      document.getElementById('resource-services').innerHTML =
        resource.services.map(s => `<li>${s}</li>`).join('');
    }
    if (resource.requirements) {
      document.getElementById('resource-requirements').innerHTML =
        resource.requirements.map(r => `<li>${r}</li>`).join('');
    }
    if (resource.hours) {
      document.getElementById('resource-hours').textContent = resource.hours;
    }

    // Save + Share buttons
    const actionContainer = document.getElementById('resource-actions');
    if (actionContainer) {
      const saved = getSavedResources();
      const isSaved = saved.includes(resource.id);
      actionContainer.innerHTML = `
        <button class="btn-save ${isSaved ? 'is-saved' : ''}" id="save-btn" aria-label="${isSaved ? 'Unsave' : 'Save'} resource">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          ${isSaved ? 'Saved' : 'Save'}
        </button>
        <button class="btn-share" id="share-btn" aria-label="Share resource">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share
        </button>`;

      document.getElementById('save-btn').addEventListener('click', function() {
        const user = getCurrentUser();
        if (!user) { window.location.href = 'login.html'; return; }
        const s = getSavedResources();
        const i = s.indexOf(resource.id);
        if (i === -1) {
          s.push(resource.id);
          this.classList.add('is-saved');
          this.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved`;
          showToast('Resource saved to your profile', 'success');
        } else {
          s.splice(i, 1);
          this.classList.remove('is-saved');
          this.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save`;
          showToast('Removed from saved', 'info');
        }
        setSavedResources(s);
      });

      document.getElementById('share-btn').addEventListener('click', async function() {
        const shareData = {
          title: resource.name,
          text: resource.description.substring(0, 120) + '…',
          url: window.location.href
        };
        if (navigator.share) {
          try { await navigator.share(shareData); } catch (_) {}
        } else {
          try {
            await navigator.clipboard.writeText(window.location.href);
            showToast('Link copied to clipboard!', 'success');
          } catch (_) {
            showToast('Copy the URL from your browser\'s address bar', 'info');
          }
        }
      });
    }

    const mapElement = document.getElementById('resource-map');
    if (mapElement) {
      const map = L.map('resource-map').setView([resource.lat, resource.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      L.marker([resource.lat, resource.lng]).addTo(map);
      setTimeout(() => map.invalidateSize(), 100);
    }

    // Suggested article
    try {
      const artResp = await fetch('assets/data/articles.json');
      const articles = await artResp.json();
      const city = resource.region || '';
      const cat = resource.category || '';

      // Priority: city+category > All+category > city any cat > any
      let match =
        articles.find(a => a.regions.includes(city) && a.category === cat) ||
        articles.find(a => a.regions.includes('All') && a.category === cat) ||
        articles.find(a => a.regions.includes(city)) ||
        articles[0];

      if (match) {
        const sugWrap  = document.getElementById('resource-article-suggestion');
        const sugLink  = document.getElementById('sug-art-link');
        const sugImg   = document.getElementById('sug-art-img');
        const sugBadge = document.getElementById('sug-art-badge');
        const sugTitle = document.getElementById('sug-art-title');
        const sugMeta  = document.getElementById('sug-art-meta');
        if (sugWrap && sugLink) {
          sugLink.href = `article.html?id=${match.id}&from=resource&rid=${resource.id}&rname=${encodeURIComponent(resource.name)}`;
          if (sugImg)   { sugImg.src = match.image; sugImg.alt = match.title; }
          if (sugBadge) sugBadge.textContent = match.category;
          if (sugTitle) sugTitle.textContent = match.title;
          if (sugMeta)  sugMeta.textContent = `${match.date} · ${match.readTime}`;
          sugWrap.style.display = '';
        }
      }
    } catch (_) {}

    const similar = resources
      .filter(r => r.category === resource.category && r.id !== resource.id)
      .slice(0, 3);
    const similarEl = document.getElementById('similar-resources');
    if (similarEl) {
      const CARD_CAT_COLORS = {
        'Food Assistance': '#156b3a', 'Healthcare': '#b83232', 'Education': '#1a55a0',
        'Employment': '#b84510', 'Housing': '#7c4daa', 'Legal': '#2e7d60', 'Community': '#2e7d60',
      };
      const savedList = getSavedResources();
      similarEl.innerHTML = similar.map(r => {
        const accent = CARD_CAT_COLORS[r.category] || '#2e7d60';
        const isSaved = savedList.includes(r.id);
        return `
          <div class="resource-card" data-id="${r.id}" style="--cat-accent:${accent};cursor:pointer;" onclick="openResource(${r.id})">
            <div class="resource-img-wrap">
              <img src="${r.image}" alt="${r.name}" class="resource-image" loading="lazy">
              <span class="cost-badge ${r.cost === 'Free' ? 'free' : ''}">${r.cost || ''}</span>
              <button class="quick-view-btn" onclick="openQuickView(${r.id}, event)" aria-label="Quick view">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Quick View
              </button>
            </div>
            <div class="resource-card-accent"></div>
            <div class="resource-content">
              <div class="resource-header">
                <h3>${r.name}</h3>
                <span class="category-badge" style="background:${accent}18;color:${accent};border:1px solid ${accent}33;">${r.category}</span>
              </div>
              <p>${r.description.substring(0, 100)}…</p>
            </div>
          </div>`;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading resource:', error);
  }
}

const IMPACT_MESSAGES = {
  10:  ['Feeds a family for a week', 'Funds 2 resource listings', 'Covers printing for 50 flyers'],
  25:  ['Provides school supplies for a child', 'Funds outreach to 10 families', 'Covers a health screening co-pay'],
  50:  ['Sponsors a job training workshop', 'Funds a month of directory hosting', 'Helps 5 seniors access meals'],
  100: ['Supports a community resource fair', 'Funds platform improvements for a month', 'Helps 20 families find housing support'],
};

window.selectTier = function(tier, amount) {
  const tierElement = document.getElementById('selected-tier');
  const amountElement = document.getElementById('selected-amount');
  if (tierElement && amountElement) {
    tierElement.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    amountElement.textContent = amount;
  }

  // Update impact preview
  const impactEl = document.getElementById('donation-impact-preview');
  if (impactEl) {
    const impacts = IMPACT_MESSAGES[parseInt(amount)] || [];
    impactEl.innerHTML = impacts.length ? `
      <div class="impact-preview">
        <p class="impact-preview-label">Your $${amount} could:</p>
        <ul>${impacts.map(i => `<li><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>${i}</li>`).join('')}</ul>
      </div>` : '';
  }

  // Highlight selected tier card
  document.querySelectorAll('.impact-tile').forEach(el => el.classList.remove('is-selected'));
  const selected = document.querySelector(`.impact-tile[data-tier="${tier}"]`);
  if (selected) selected.classList.add('is-selected');

  const donateForm = document.getElementById('donate-form');
  if (donateForm) donateForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Donate page — amount picker
window.pickAmt = function(btn, url, amount) {
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('summary-amount').textContent = '$' + amount;
  document.getElementById('checkout-btn').href = url;
};

// Donation form submission
document.addEventListener('DOMContentLoaded', function() {
  const donationForm = document.getElementById('donation-form');
  if (donationForm) {
    donationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const tier = document.getElementById('selected-tier').textContent;
      const amount = document.getElementById('selected-amount').textContent;
      const name = document.getElementById('donor-name').value;
      const email = document.getElementById('donor-email').value;
      
      if (tier === 'None' || amount === '0') {
        showToast('Please select a donation tier first', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      showToast(`Thank you, ${name}! Your $${amount} donation is on its way.`, 'success');
      
      // Reset form
      donationForm.reset();
      document.getElementById('selected-tier').textContent = 'None';
      document.getElementById('selected-amount').textContent = '0';
    });
  }
});
// ===================================
// Toast Notifications
// ===================================
function showToast(message, type = 'success') {
  const existing = document.querySelectorAll('.conduit-toast');
  existing.forEach(t => t.remove());

  const icons = {
    success: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = `conduit-toast conduit-toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span><button class="toast-close" onclick="this.parentElement.remove()" aria-label="Dismiss">×</button>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-visible')));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 380);
  }, 3600);
}

// ===================================
// Recently Viewed Resources
// ===================================
function trackRecentlyViewed(resource) {
  const MAX = 5;
  let recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
  recent = recent.filter(r => r.id !== resource.id);
  recent.unshift({ id: resource.id, name: resource.name, category: resource.category, image: resource.image, description: resource.description });
  localStorage.setItem('recentlyViewed', JSON.stringify(recent.slice(0, MAX)));
}

function getRecentlyViewed() {
  return JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
}

// ===================================
// Articles Page
// ===================================
const ARTICLE_BADGE = {
  'Food Assistance': 'badge--food',
  'Housing':         'badge--housing',
  'Healthcare':      'badge--healthcare',
  'Employment':      'badge--employment',
  'Legal Aid':       'badge--legal',
  'Education':       'badge--education',
  'Community':       'badge--community'
};

async function loadArticlesPage() {
  const featuredSlot = document.getElementById('art-featured-slot');
  const grid = document.getElementById('art-grid');
  if (!grid) return;

  let articles;
  try {
    const res = await fetch('assets/data/articles.json');
    articles = await res.json();
  } catch(e) {
    grid.innerHTML = '<p class="art-empty">Unable to load articles.</p>';
    return;
  }

  let activeFilter = 'All';

  function badgeClass(cat) { return ARTICLE_BADGE[cat] || 'badge--community'; }

  function render(cat) {
    const filtered = cat === 'All' ? articles : articles.filter(a => a.category === cat);

    // Featured (first featured article in current filter, or just first)
    const featured = filtered.find(a => a.featured) || filtered[0];
    const rest = filtered.filter(a => a !== featured);

    if (featured && featuredSlot) {
      featuredSlot.innerHTML = `
        <a href="article.html?id=${featured.id}" class="art-featured">
          <div class="art-featured-img" style="background-image:url('${featured.image}')"></div>
          <div class="art-featured-body">
            <span class="art-category-badge ${badgeClass(featured.category)}">${featured.category}</span>
            <h2 class="art-featured-title">${featured.title}</h2>
            <p class="art-featured-excerpt">${featured.excerpt}</p>
            <div class="art-meta">
              <span>${featured.author}</span>
              <span class="art-meta-dot">·</span>
              <span>${featured.date}</span>
              <span class="art-meta-dot">·</span>
              <span>${featured.readTime}</span>
            </div>
          </div>
        </a>`;
    } else if (featuredSlot) {
      featuredSlot.innerHTML = '';
    }

    if (rest.length === 0 && !featured) {
      grid.innerHTML = '<p class="art-empty">No articles in this category yet.</p>';
      return;
    }

    grid.innerHTML = rest.map(a => `
      <a href="article.html?id=${a.id}" class="art-card">
        <div class="art-card-img" style="background-image:url('${a.image}')"></div>
        <div class="art-card-body">
          <span class="art-category-badge ${badgeClass(a.category)}" style="font-size:0.62rem;padding:0.25rem 0.65rem;margin-bottom:0.65rem;">${a.category}</span>
          <h3 class="art-card-title">${a.title}</h3>
          <p class="art-card-excerpt">${a.excerpt}</p>
          <div class="art-card-footer">
            <div class="art-meta">
              <span>${a.date}</span>
              <span class="art-meta-dot">·</span>
              <span>${a.readTime}</span>
            </div>
            <span class="art-read-more">Read
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12H19M13 6l6 6-6 6"/></svg>
            </span>
          </div>
        </div>
      </a>`).join('');
  }

  render('All');

  // Filter buttons
  document.querySelectorAll('.art-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.art-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      render(activeFilter);
    });
  });
}

function initRecentlyViewed() {
  const section = document.getElementById('recently-viewed-section');
  if (!section) return;
  const recent = getRecentlyViewed();
  if (recent.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const CARD_CAT_COLORS = {
    'Food Assistance': '#156b3a', 'Healthcare': '#b83232', 'Education': '#1a55a0',
    'Employment': '#b84510', 'Housing': '#7c4daa', 'Legal': '#2e7d60', 'Community': '#2e7d60',
  };
  const grid = section.querySelector('.rv-grid');
  if (grid) {
    grid.innerHTML = recent.map(r => {
      const accent = CARD_CAT_COLORS[r.category] || '#2e7d60';
      return `
        <a href="resource.html?id=${r.id}" class="rv-card">
          <div class="rv-card-img" style="background-image:url('${r.image}')">
            <span class="rv-cat-dot" style="background:${accent};"></span>
          </div>
          <div class="rv-card-body">
            <span class="rv-cat" style="color:${accent};">${r.category}</span>
            <h4 class="rv-name">${r.name}</h4>
            <p class="rv-desc">${r.description.substring(0, 70)}…</p>
          </div>
        </a>`;
    }).join('');
  }
}

// ===================================
// Personalized Welcome (Homepage)
// ===================================
function initPersonalizedWelcome() {
  const section = document.getElementById('personalized-welcome');
  if (!section) return;
  const user = getCurrentUser();
  if (!user) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const firstName = (user.name || 'there').split(' ')[0];
  const cityLabels = { Springfield: 'Springfield, IL', Seattle: 'Seattle, WA', NYC: 'New York City, NY', 'Los Angeles': 'Los Angeles, CA' };
  const city = user.survey?.city;
  const cityLabel = cityLabels[city] || city || null;
  const nameEl = section.querySelector('.pw-name');
  const cityEl = section.querySelector('.pw-location');
  const surveyEl = section.querySelector('.pw-take-survey');
  if (nameEl) nameEl.textContent = firstName;
  if (cityEl && cityLabel) { cityEl.textContent = cityLabel; cityEl.closest('.pw-location-wrap').style.display = 'flex'; }
  else if (cityEl) cityEl.closest('.pw-location-wrap').style.display = 'none';
  if (surveyEl) surveyEl.style.display = user.survey ? 'none' : 'flex';
  const avatarEl = document.getElementById('pw-avatar');
  if (avatarEl) {
    avatarEl.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=2E7D60&color=fff&size=80`;
    avatarEl.style.display = '';
  }
}

// ===================================
// Quick View Modal
// ===================================
const QUICK_CAT_COLORS = {
  'Food Assistance': '#156b3a', 'Healthcare': '#b83232', 'Education': '#1a55a0',
  'Employment': '#b84510', 'Housing': '#7c4daa', 'Legal': '#2e7d60', 'Community': '#2e7d60',
};

window.openQuickView = function(id, event) {
  if (event) event.stopPropagation();
  const resource = allResources.find(r => r.id === id) || (window._resourcesCache && window._resourcesCache.find(r => r.id === id));
  if (!resource) return;
  const existing = document.getElementById('quick-view-modal');
  if (existing) existing.remove();
  const color = QUICK_CAT_COLORS[resource.category] || '#2e7d60';
  const saved = getSavedResources();
  const isSaved = saved.includes(resource.id);
  const modal = document.createElement('div');
  modal.id = 'quick-view-modal';
  modal.className = 'qv-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', `Quick view: ${resource.name}`);
  modal.innerHTML = `
    <div class="qv-modal">
      <button class="qv-close" onclick="closeQuickView()" aria-label="Close quick view">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="qv-img-wrap">
        <img src="${resource.image}" alt="${resource.name}" class="qv-img" loading="lazy">
        <div class="qv-img-overlay" style="background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%);"></div>
        <span class="qv-cat-badge" style="background:${color};">${resource.category}</span>
        ${resource.cost ? `<span class="qv-cost-badge ${resource.cost === 'Free' ? 'free' : ''}">${resource.cost}</span>` : ''}
      </div>
      <div class="qv-body">
        <h2 class="qv-title">${resource.name}</h2>
        <p class="qv-desc">${resource.description}</p>
        <div class="qv-meta-grid">
          <div class="qv-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2C8.7 2 6 4.7 6 8c0 5 6 13 6 13s6-8 6-13c0-3.3-2.7-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg><span>${resource.address}</span></div>
          <div class="qv-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>${resource.hours || 'Hours vary'}</span></div>
          ${resource.phone ? `<div class="qv-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.59 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg><span>${resource.phone}</span></div>` : ''}
        </div>
        ${resource.services && resource.services.length ? `
        <div class="qv-services">
          <h4>Services Offered</h4>
          <ul>${resource.services.slice(0, 5).map(s => `<li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>${s}</li>`).join('')}</ul>
        </div>` : ''}
        <div class="qv-actions">
          <a href="resource.html?id=${resource.id}" class="qv-btn qv-btn--primary" style="background:${color};">
            Full Details
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12H19M13 6L19 12L13 18"/></svg>
          </a>
          <button class="qv-btn qv-btn--save ${isSaved ? 'is-saved' : ''}" id="qv-save-btn" onclick="toggleSaveQV(${resource.id}, this)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            ${isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
  modal.addEventListener('click', e => { if (e.target === modal) closeQuickView(); });
  document.addEventListener('keydown', _qvEscHandler);
};

function _qvEscHandler(e) { if (e.key === 'Escape') closeQuickView(); }

window.closeQuickView = function() {
  const modal = document.getElementById('quick-view-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', _qvEscHandler);
  setTimeout(() => modal.remove(), 360);
};

window.toggleSaveQV = function(id, btn) {
  const user = getCurrentUser();
  if (!user) { closeQuickView(); window.location.href = 'login.html'; return; }
  const saved = getSavedResources();
  const idx = saved.indexOf(id);
  if (idx === -1) {
    saved.push(id);
    btn.classList.add('is-saved');
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
    btn.lastChild.textContent = ' Saved';
    showToast('Resource saved to your profile', 'success');
  } else {
    saved.splice(idx, 1);
    btn.classList.remove('is-saved');
    btn.querySelector('svg').setAttribute('fill', 'none');
    btn.lastChild.textContent = ' Save';
    showToast('Removed from saved', 'info');
  }
  setSavedResources(saved);
  // Sync any matching bookmark btn on the page
  document.querySelectorAll(`.bookmark-btn[onclick*="toggleSave(${id},"]`).forEach(bBtn => {
    bBtn.classList.toggle('is-saved', idx === -1);
    bBtn.querySelector('svg')?.setAttribute('fill', idx === -1 ? 'currentColor' : 'none');
  });
};

// ===================================
// Keyboard Shortcuts
// ===================================
function setupKeyboardShortcuts() {
  if (document._kbShortcutsReady) return;
  document._kbShortcutsReady = true;
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const search = document.getElementById('search-input') || document.querySelector('.search-box-home');
      if (search) { search.focus(); search.select(); }
    }
  });
}
