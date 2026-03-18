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
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
      menuToggle.classList.toggle('is-open');
    });
    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('is-open');
      });
    });
  }
}

window.navigation.addEventListener('navigate', (navigateEvent) => {
  const nextURL = new URL(navigateEvent.destination.url);

  // survey.html must do a full page load so survey.js executes normally
  if (nextURL.pathname.includes('survey.html')) return;

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
  return JSON.parse(localStorage.getItem('savedResources') || '[]');
}

window.toggleSave = function(id, btn) {
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
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
  } else {
    saved.splice(idx, 1);
    btn.classList.remove('is-saved');
    btn.setAttribute('aria-label', 'Save resource');
    btn.querySelector('svg').setAttribute('fill', 'none');
  }
  localStorage.setItem('savedResources', JSON.stringify(saved));
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

  container.innerHTML = sorted.map(resource => {
    const isSaved = saved.includes(resource.id);
    const costClass = resource.cost === 'Free' ? 'free' : '';
    const costLabel = resource.cost || '';
    return `
      <div class="resource-card" data-id="${resource.id}">
        <div class="resource-img-wrap" onclick="openResource(${resource.id})">
          <img src="${resource.image}" alt="${resource.name}" class="resource-image" loading="lazy">
          ${costLabel ? `<span class="cost-badge ${costClass}">${costLabel}</span>` : ''}
          <button class="bookmark-btn ${isSaved ? 'is-saved' : ''}"
            aria-label="${isSaved ? 'Unsave resource' : 'Save resource'}"
            onclick="event.stopPropagation(); toggleSave(${resource.id}, this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        <div class="resource-content" onclick="openResource(${resource.id})" style="cursor:pointer;">
          <div class="resource-header">
            <h3>${resource.name}</h3>
            <span class="category-badge">${resource.category}</span>
          </div>
          <p>${resource.description.substring(0, 120)}…</p>
          <div class="resource-details">
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin-right:4px"><path d="M12 2C8.7 2 6 4.7 6 8c0 5 6 13 6 13s6-8 6-13c0-3.3-2.7-6-6-6z"/><circle cx="12" cy="8" r="2"/></svg>${resource.address}</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:middle;margin-right:4px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.59 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>${resource.phone}</span>
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
  
  const featuredResources = allResources.filter(r => r.featured).slice(0, 3);
  
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
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
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

  // Logged-out → show whole US; logged-in → Springfield until geolocation resolves
  const startView = isLoggedIn
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

  // Auto-geolocate for logged-in users
  if (isLoggedIn) flyToUserLocation();

  // City buttons (always wired, shown for logged-out)
  const cityBtnsEl = document.getElementById('map-city-btns');
  if (cityBtnsEl) {
    cityBtnsEl.style.display = isLoggedIn ? 'none' : 'flex';
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

  // Add markers for all resources
  allResources.forEach(resource => {
    const color = CATEGORY_COLORS[resource.category] || '#2e7d60';
    const marker = L.marker([resource.lat, resource.lng], { icon: makeIcon(color) }).addTo(map);

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
        website: document.getElementById('website').value.trim(),
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
      
      // Show success message
      showAlert('Thank you! Your resource has been submitted successfully and is pending review.', 'success');
      
      // Reset form
      form.reset();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
  window.location.href = `resource.html?id=${id}`;
}

async function loadSingleResource() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) return;

  try {
    const response = await fetch('assets/data/resources.json');
    const resources = await response.json();
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

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
        const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
        if (!user) { window.location.href = 'login.html'; return; }
        const s = getSavedResources();
        const i = s.indexOf(resource.id);
        if (i === -1) {
          s.push(resource.id);
          this.classList.add('is-saved');
          this.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Saved`;
        } else {
          s.splice(i, 1);
          this.classList.remove('is-saved');
          this.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Save`;
        }
        localStorage.setItem('savedResources', JSON.stringify(s));
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
          await navigator.clipboard.writeText(window.location.href);
          const orig = this.innerHTML;
          this.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
          setTimeout(() => { this.innerHTML = orig; }, 2000);
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

    const similar = resources
      .filter(r => r.category === resource.category && r.id !== resource.id)
      .slice(0, 3);
    const similarEl = document.getElementById('similar-resources');
    if (similarEl) {
      similarEl.innerHTML = similar.map(r => `
        <div onclick="openResource(${r.id})" class="resource-card" style="cursor:pointer;">
          <h3>${r.name}</h3>
          <p>${r.description.substring(0, 80)}...</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading resource:', error);
  }
}

window.selectTier = function(tier, amount) {
  console.log('selectTier called with:', tier, amount); // Debug log
  
  // Update the selected tier and amount display
  const tierElement = document.getElementById('selected-tier');
  const amountElement = document.getElementById('selected-amount');
  
  console.log('Found elements:', tierElement, amountElement); // Debug log
  
  if (tierElement && amountElement) {
    tierElement.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    amountElement.textContent = amount;
    console.log('Updated to:', tierElement.textContent, amountElement.textContent); // Debug log
  }
  
  // Smooth scroll to form
  const donateForm = document.getElementById('donate-form');
  if (donateForm) {
    donateForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
        alert('Please select a donation tier first!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Show success message
      alert(`Thank you for your ${tier} tier donation of $${amount}, ${name}! In a production environment, this would redirect to a payment processor like Stripe or PayPal.`);
      
      // Reset form
      donationForm.reset();
      document.getElementById('selected-tier').textContent = 'None';
      document.getElementById('selected-amount').textContent = '0';
    });
  }
});