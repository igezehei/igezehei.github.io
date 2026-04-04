// Main JavaScript for Portfolio Site
// Handles UI interactions, Auth0, LLM chat, and navigation

// ==============================================
// Configuration and State
// ==============================================

let auth0Client = null;
let config = {
  auth0Domain: null,
  auth0ClientId: null,
  webhookUrl: null,
  llmApiUrl: null
};

// ==============================================
// Initialization
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('[init] Initializing portfolio site...');

  // Load configuration and initialize features
  loadConfiguration();

  // Setup UI components
  setupNavigation();
  setupModals();
  setupCountdown();
  setupLLMChat();
  setupTooltips();
  setCopyrightYear();

  console.log('[init] Initialization complete');
});

// ==============================================
// Configuration Loading
// ==============================================

async function loadConfiguration() {
  try {
    const response = await fetch('/auth-config.json');
    if (response.ok) {
      const data = await response.json();
      config = {
        auth0Domain: data.auth0Domain,
        auth0ClientId: data.auth0ClientId,
        webhookUrl: data.webhookUrl || null,
        llmApiUrl: data.llmApiUrl || null
      };
      console.log('[config] Configuration loaded successfully');

      // Initialize Auth0 if credentials are available
      if (config.auth0Domain && config.auth0ClientId) {
        await initializeAuth0();
      }
    } else {
      console.warn('[config] No auth-config.json found. Using defaults (features will be limited).');
    }
  } catch (error) {
    console.warn('[config] Failed to load configuration:', error.message);
  }
}

// ==============================================
// Auth0 Integration
// ==============================================

async function initializeAuth0() {
  try {
    // Check if Auth0 SDK is loaded
    if (typeof auth0 === 'undefined' || typeof auth0.createAuth0Client === 'undefined') {
      console.error('[auth] Auth0 SDK not loaded');
      return;
    }

    // Create Auth0 client
    auth0Client = await auth0.createAuth0Client({
      domain: config.auth0Domain,
      clientId: config.auth0ClientId,
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    });

    console.log('[auth] Auth0 client initialized');

    // Setup login button handlers
    setupAuthButtons();

    // Check if user is authenticated
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (isAuthenticated) {
      await handleAuthenticatedUser();
    }

    // Handle OAuth callback
    if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
      await handleAuthCallback();
    }
  } catch (error) {
    console.error('[auth] Failed to initialize Auth0:', error);
  }
}

function setupAuthButtons() {
  const authButtons = [
    { id: 'loginGoogle', connection: 'google-oauth2' },
    { id: 'loginGithub', connection: 'github' },
    { id: 'loginLinkedin', connection: 'linkedin' }
  ];

  authButtons.forEach(({ id, connection }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        loginWithConnection(connection);
      });
    }
  });
}

async function loginWithConnection(connection) {
  if (!auth0Client) {
    showAuthError('Authentication not configured. Please contact the site administrator.');
    return;
  }

  try {
    await auth0Client.loginWithRedirect({
      authorizationParams: {
        connection: connection,
        redirect_uri: window.location.origin
      }
    });
  } catch (error) {
    console.error('[auth] Login failed:', error);
    showAuthError('Login failed. Please try again.');
  }
}

async function handleAuthenticatedUser() {
  try {
    const user = await auth0Client.getUser();
    if (user) {
      displayUserInfo(user);

      // Send to webhook if configured
      if (config.webhookUrl) {
        sendLoginEvent(user);
      }
    }
  } catch (error) {
    console.error('[auth] Error handling authenticated user:', error);
  }
}

function displayUserInfo(user) {
  const userInfoEl = document.getElementById('userInfo');
  if (!userInfoEl) return;

  const displayName = user.name || user.email || 'User';
  const emailInfo = user.email && user.email !== user.name ? ` (${user.email})` : '';

  userInfoEl.innerHTML = `
    Logged in as <b>${displayName}</b>${emailInfo}
    <button id="logoutBtn" class="ml-2 text-blue-600 underline hover:text-blue-800">Logout</button>
  `;

  // Attach logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

async function logout() {
  if (!auth0Client) return;

  try {
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (error) {
    console.error('[auth] Logout failed:', error);
  }
}

async function handleAuthCallback() {
  try {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, '/');
    await handleAuthenticatedUser();

    // Close login modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.classList.add('hidden');
    }
  } catch (error) {
    console.error('[auth] Auth callback error:', error);
  }
}

function sendLoginEvent(user) {
  if (!config.webhookUrl) return;

  fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      sub: user.sub,
      provider: user.sub ? user.sub.split('|')[0] : null,
      timestamp: new Date().toISOString()
    })
  }).catch(error => {
    console.warn('[auth] Failed to send login event:', error);
  });
}

function showAuthError(message) {
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) {
    userInfoEl.innerHTML = `<span class="text-red-600">${message}</span>`;
  }
}

// ==============================================
// Navigation
// ==============================================

function setupNavigation() {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Desktop dropdown
  const desktopDropdownToggle = document.getElementById('desktopDropdownToggle');
  const desktopDropdown = document.getElementById('desktopDropdown');

  if (desktopDropdownToggle && desktopDropdown) {
    desktopDropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      desktopDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!desktopDropdown.contains(e.target) && !desktopDropdownToggle.contains(e.target)) {
        desktopDropdown.classList.add('hidden');
      }
    });
  }

  // Mobile dropdown
  const mobileDropdownToggle = document.getElementById('mobileDropdownToggle');
  const mobileDropdown = document.getElementById('mobileDropdown');

  if (mobileDropdownToggle && mobileDropdown) {
    mobileDropdownToggle.addEventListener('click', () => {
      mobileDropdown.classList.toggle('hidden');
    });
  }
}

// ==============================================
// Modals
// ==============================================

function setupModals() {
  // Login modal
  const closeLoginModal = document.getElementById('closeLoginModal');
  const loginModal = document.getElementById('loginModal');

  if (closeLoginModal && loginModal) {
    closeLoginModal.addEventListener('click', () => {
      loginModal.classList.add('hidden');
    });
  }

  // Global keyboard handler: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function closeAllModals() {
  const modals = ['loginModal', 'mobileMenu'];
  modals.forEach(id => {
    const modal = document.getElementById(id);
    if (modal && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }
  });

  // Close dropdowns
  const dropdowns = ['desktopDropdown', 'aiTrendsTooltip'];
  dropdowns.forEach(id => {
    const dropdown = document.getElementById(id);
    if (dropdown && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }
  });
}

// Global function for redirecting to login (used in HTML onclick)
window.redirectToLogin = function(targetUrl) {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.classList.remove('hidden');
  }
};

// ==============================================
// LLM Chat
// ==============================================

function setupLLMChat() {
  const chatHistory = document.getElementById('llmChatHistory');
  const chatInput = document.getElementById('llmChatInput');
  const chatSend = document.getElementById('llmChatSend');

  if (!chatHistory || !chatInput || !chatSend) {
    console.warn('[llm] Chat elements not found');
    return;
  }

  // Send button click
  chatSend.addEventListener('click', () => sendLLMMessage());

  // Enter key to send
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendLLMMessage();
    }
  });
}

function sendLLMMessage() {
  const chatHistory = document.getElementById('llmChatHistory');
  const chatInput = document.getElementById('llmChatInput');
  const chatSend = document.getElementById('llmChatSend');

  const query = chatInput.value.trim();
  if (!query) return;

  // Add user message
  appendMessage('user', query);
  chatInput.value = '';

  // Check if LLM API is configured
  if (!config.llmApiUrl) {
    appendMessage('llm', 'LLM chat is not configured. This is a demo feature. To enable it, add "llmApiUrl" to your auth-config.json file.');
    return;
  }

  // Add "thinking" message
  appendMessage('llm', 'Thinking...');

  // Disable inputs while waiting
  chatSend.disabled = true;
  chatInput.disabled = true;

  // Query LLM API
  fetch(config.llmApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: query })
  })
  .then(res => res.json())
  .then(data => {
    // Remove "thinking" message
    chatHistory.lastChild.remove();
    // Add response
    appendMessage('llm', data.answer || 'No answer received.');
  })
  .catch(error => {
    console.error('[llm] Query failed:', error);
    // Remove "thinking" message
    chatHistory.lastChild.remove();
    // Show error
    appendMessage('llm', 'Error: Unable to connect to LLM service. Please try again later.');
  })
  .finally(() => {
    chatSend.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  });
}

function appendMessage(sender, text) {
  const chatHistory = document.getElementById('llmChatHistory');
  if (!chatHistory) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = sender === 'user'
    ? 'text-right'
    : 'text-left bg-blue-50 rounded px-3 py-2';

  const senderName = sender === 'user' ? 'You' : 'Issak LLM';
  msgDiv.innerHTML = `<span class="font-semibold">${senderName}:</span> ${escapeHtml(text)}`;

  chatHistory.appendChild(msgDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ==============================================
// Tooltips
// ==============================================

function setupTooltips() {
  const aiTrendsTipBtn = document.getElementById('aiTrendsTipBtn');
  const aiTrendsTooltip = document.getElementById('aiTrendsTooltip');

  if (aiTrendsTipBtn && aiTrendsTooltip) {
    aiTrendsTipBtn.addEventListener('mouseenter', () => {
      aiTrendsTooltip.classList.remove('hidden');
    });

    aiTrendsTipBtn.addEventListener('mouseleave', () => {
      aiTrendsTooltip.classList.add('hidden');
    });

    aiTrendsTipBtn.addEventListener('focus', () => {
      aiTrendsTooltip.classList.remove('hidden');
    });

    aiTrendsTipBtn.addEventListener('blur', () => {
      aiTrendsTooltip.classList.add('hidden');
    });
  }
}

// ==============================================
// Countdown Timer
// ==============================================

function setupCountdown() {
  const countdownEl = document.getElementById('countdown2026');
  if (!countdownEl) return;

  function updateCountdown() {
    const target = new Date('2026-01-01T00:00:00');
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      countdownEl.textContent = '2026 is here!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownEl.textContent = `Countdown to 2026: ${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ==============================================
// Utilities
// ==============================================

function setCopyrightYear() {
  const yearEl = document.getElementById('copyrightYear');
  if (yearEl) {
    const year = new Date().getFullYear();
    yearEl.innerHTML = `&copy; ${year} Issak Gezehei. All rights reserved.`;
  }
}
