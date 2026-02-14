// Add hover and click delay functionality for the 'Past Work' menu
document.addEventListener('DOMContentLoaded', function () {
  const menuGroup = document.querySelector('.group');
  const dropdown = document.querySelector('#desktopDropdown');

  if (menuGroup && dropdown) {
    let hideTimeout;

    // Toggle submenu on click with delay
    menuGroup.addEventListener('click', function (event) {
      event.stopPropagation();
      clearTimeout(hideTimeout);
      menuGroup.classList.toggle('active');
    });

    // Add hover delay before showing submenu
    menuGroup.addEventListener('mouseenter', function () {
      clearTimeout(hideTimeout);
      menuGroup.classList.add('active');
    });

    // Add hover delay before hiding submenu
    menuGroup.addEventListener('mouseleave', function () {
      hideTimeout = setTimeout(() => {
        if (!dropdown.matches(':hover')) {
          menuGroup.classList.remove('active');
        }
      }, 300); // 300ms delay
    });

    // Prevent hiding when hovering over the submenu
    dropdown.addEventListener('mouseenter', function () {
      clearTimeout(hideTimeout);
    });

    dropdown.addEventListener('mouseleave', function () {
      hideTimeout = setTimeout(() => {
        menuGroup.classList.remove('active');
      }, 300); // 300ms delay
    });

    // Close submenu when clicking outside
    document.addEventListener('click', function () {
      menuGroup.classList.remove('active');
    });
  }
});

// Auth0 Configuration and Login
let auth0Client = null;

// Initialize Auth0 client
async function initializeAuth0() {
  try {
    // Load configuration from auth-config.json
    const response = await fetch('/auth-config.json');
    if (!response.ok) {
      console.error('auth-config.json not found. Please create this file with your Auth0 credentials.');
      return;
    }
    
    const config = await response.json();
    
    // Initialize Auth0 client
    auth0Client = await auth0.createAuth0Client({
      domain: config.auth0Domain,
      clientId: config.auth0ClientId,
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    });
    
    // Check if user is already logged in
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (isAuthenticated) {
      const user = await auth0Client.getUser();
      console.log('User is authenticated:', user);
    }
  } catch (error) {
    console.error('Failed to initialize Auth0:', error);
  }
}

// Redirect to Auth0 login
async function login() {
  try {
    // Store the redirect URL if provided
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    
    await auth0Client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: redirectUrl || window.location.origin
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Handle login button click (if present in modal)
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Auth0 first
  await initializeAuth0();
  
  // If modal login form exists, update it to use Auth0
  const loginForm = document.getElementById('modalLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await login();
    });
  }
  
  // Close the login modal when the close button is clicked
  const closeButton = document.getElementById('closeLoginModal');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      document.getElementById('loginModal').classList.add('hidden');
    });
  }
});