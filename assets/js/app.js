// ===================================
// Community Connect - Main JavaScript
// ===================================

// Global state
let allResources = [];
let currentFilter = 'All';

// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', function() {
  setUpPage();
});

function setUpPage() {
  // Set active nav link
  setActiveNavLink();
  
  // Mobile menu toggle
  setupMobileMenu();
  
  // Load resources for directory, map, and homepage
  if (document.getElementById('resources-container') || document.getElementById('map') || document.getElementById('featured-resources')) {
    loadResources();
  }
  
  // Setup form submission
  if (document.getElementById('submit-form')) {
    setupFormSubmission();
  }
   
  // Setup homepage search
  if (document.querySelector('.search-box-home') || document.querySelector('.search-button-home')) {
    setupHomepageSearch();
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
    });
  }
}

window.navigation.addEventListener('navigate', (navigateEvent) => {
  const nextURL = new URL(navigateEvent.destination.url);
  
  if (!navigateEvent.canIntercept) return;
  navigateEvent.intercept({
    async handler() {
      const newContent = await getNewContent(nextURL);
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          const main = document.querySelector('main');
          if (main) main.innerHTML = newContent || "";
          setUpPage();
        });
      } else {
        main.innerHTML = newContent;
      }
      

    },
  });
});

async function getNewContent(url) {
  const page = await fetch(url.href);
  const data = await page.text();
  const mainTagContent = data.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  return mainTagContent ? mainTagContent[1] : "";
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
    
    // Check for search parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    
    // Display resources on directory page
    if (document.getElementById('resources-container')) {
      setupDirectorySearch(); // Initialize the search and filter listeners
      setupCategoryFilters();
      
      if (searchTerm) {
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
// Display Resources
// ===================================
//ai generated
function displayResources(resources) {
  const container = document.getElementById('resources-container');
  
  if (!container) return;
  
  if (resources.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No resources found. Try adjusting your search or filters.</p>';
    return;
  }
  
  container.innerHTML = resources.map(resource => `
    <div class="resource-card" data-id="${resource.id}">
      <img src="${resource.image}" alt="${resource.name}" class="resource-image">
      <div class="resource-content">
        <div class="resource-header">
          <h3>${resource.name}</h3>
          <span class="category-badge">${resource.category}</span>
        </div>
        <p>${resource.description}</p>
        <div class="resource-details">
          <span>📍 ${resource.address}</span>
          <span>📞 ${resource.phone}</span>
          <span>🌐 <a href="${resource.website}" target="_blank" rel="noopener">Visit Website</a></span>
        </div>
      </div>
    </div>
  `).join('');
}

// ===================================
// Display Featured Resources (Homepage)
// ===================================
function displayFeaturedResources() {
  const container = document.getElementById('featured-resources');
  
  if (!container) return;
  
  const featuredResources = allResources.filter(r => r.featured).slice(0, 3);
  
  container.innerHTML = featuredResources.map(resource => `
    <div class="featured-card">
      <img src="${resource.image}" alt="${resource.name}">
      <div class="featured-card-content">
        <div class="resource-header">
          <h3>${resource.name}</h3>
          <span class="category-badge">${resource.category}</span>
        </div>
        <p>${resource.description}</p>
        <div class="resource-details">
          <span>📍 ${resource.address}</span>
          <span>📞 ${resource.phone}</span>
          <span>🌐 <a href="${resource.website}" target="_blank" rel="noopener">Visit Website</a></span>
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
function filterResources(searchTerm, category) {
  let filtered = allResources;
  
  // Filter by category
  if (category && category !== 'All') {
    filtered = filtered.filter(resource => resource.category === category);
  }
  
  // Filter by search term
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    filtered = filtered.filter(resource => 
      resource.name.toLowerCase().includes(lowerSearch) ||
      resource.description.toLowerCase().includes(lowerSearch) ||
      resource.category.toLowerCase().includes(lowerSearch) ||
      resource.address.toLowerCase().includes(lowerSearch)
    );
  }
  
  return filtered;
}

// ===================================
// Map Functionality
// ===================================
function initializeMap() {
  // Initialize Leaflet map centered on Springfield, IL
  const map = L.map('map').setView([39.7817, -89.6501], 13);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
  
  // Custom icon for markers
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background-color: #2E7D60; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
  
  // Add markers for each resource
  allResources.forEach(resource => {
    const marker = L.marker([resource.lat, resource.lng], { icon: customIcon }).addTo(map);
    
    // Create popup content
    const popupContent = `
      <div class="popup-content" style="min-width: 200px;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${resource.name}</h3>
        <span class="category-badge">${resource.category}</span>
        <p style="margin: 0.75rem 0; font-size: 0.9rem; color: #666;">${resource.description.substring(0, 100)}...</p>
        <div style="margin-top: 0.5rem;">
          <a href="${resource.website}" target="_blank" rel="noopener" style="color: #2E7D60; font-weight: 600; font-size: 0.9rem;">Visit Website →</a>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, { maxWidth: 300 });
    
    // Add click event to scroll to resource card if on directory page
    marker.on('click', function() {
      const card = document.querySelector(`[data-id="${resource.id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.backgroundColor = '#E7C45F20';
        setTimeout(() => {
          card.style.backgroundColor = '';
        }, 2000);
      }
    });
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