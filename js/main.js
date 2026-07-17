// Main JavaScript for Portfolio Site
// Handles UI interactions, Auth0 Sign-In, visitor tracking, and navigation

// ==============================================
// Configuration and State
// ==============================================

let auth0Client = null;
let currentUser = null;
let config = {
  auth0Domain: null,
  auth0ClientId: null,
  firebaseUrl: null,
  webhookUrl: null,
  llmApiUrl: null
};

// ==============================================
// Initialization
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('[init] Initializing portfolio site...');

  loadConfiguration();

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
        auth0Domain: data.auth0Domain || null,
        auth0ClientId: data.auth0ClientId || null,
        firebaseUrl: data.firebaseUrl || null,
        webhookUrl: data.webhookUrl || null,
        llmApiUrl: data.llmApiUrl || null
      };
      console.log('[config] Configuration loaded successfully');

      if (config.auth0Domain && config.auth0ClientId) {
        await initAuth0();
      } else {
        document.getElementById('auth0SignInError')?.classList.remove('hidden');
        // Restore session from localStorage when Auth0 isn't configured
        const savedUser = localStorage.getItem('portfolioUser');
        if (savedUser) {
          try {
            currentUser = JSON.parse(savedUser);
            displayUserInfo(currentUser);
          } catch (e) {
            localStorage.removeItem('portfolioUser');
          }
        }
      }

      if (config.firebaseUrl) {
        trackPageVisit();
        updateVisitorCountDisplay();
      }

      if (config.llmApiUrl) {
        document.getElementById('llmChatContainer')?.classList.remove('hidden');
      }
    } else {
      console.warn('[config] No auth-config.json found. Features will be limited.');
      document.getElementById('auth0SignInError')?.classList.remove('hidden');
    }
  } catch (error) {
    console.warn('[config] Failed to load configuration:', error.message);
  }
}

// ==============================================
// Auth0
// ==============================================

async function initAuth0() {
  try {
    auth0Client = await window.auth0.createAuth0Client({
      domain: config.auth0Domain,
      clientId: config.auth0ClientId,
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    });

    // Handle redirect callback after Auth0 Universal Login
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') && params.has('state')) {
      try {
        const result = await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
        const user = await auth0Client.getUser();
        onSignedIn(user, result.appState?.returnTo);
      } catch (e) {
        console.error('[auth0] Redirect callback failed:', e);
      }
      return;
    }

    // Check for an active Auth0 session
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (isAuthenticated) {
      const user = await auth0Client.getUser();
      onSignedIn(user);
      return;
    }

    // Fallback: restore from localStorage for page refreshes
    const savedUser = localStorage.getItem('portfolioUser');
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        displayUserInfo(currentUser);
      } catch (e) {
        localStorage.removeItem('portfolioUser');
      }
    }
  } catch (err) {
    console.error('[auth0] Initialization failed:', err);
    document.getElementById('auth0SignInError')?.classList.remove('hidden');
  }
}

function onSignedIn(auth0User, returnTo) {
  currentUser = {
    name: auth0User.name,
    email: auth0User.email,
    picture: auth0User.picture,
    provider: auth0User.sub ? auth0User.sub.split('|')[0] : 'auth0'
  };

  localStorage.setItem('portfolioUser', JSON.stringify(currentUser));

  if (config.firebaseUrl) trackLogin(currentUser);
  if (config.webhookUrl) sendLoginEvent(currentUser);

  displayUserInfo(currentUser);
  document.getElementById('loginModal')?.classList.add('hidden');

  if (returnTo) {
    window.location.href = returnTo;
  }
}

window.login = async function(targetUrl) {
  if (!auth0Client) {
    document.getElementById('loginModal')?.classList.remove('hidden');
    return;
  }
  await auth0Client.loginWithRedirect({
    appState: { returnTo: targetUrl || null }
  });
};

async function logout() {
  currentUser = null;
  localStorage.removeItem('portfolioUser');

  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) userInfoEl.textContent = '';

  ['userNavInfo', 'userNavInfoMobile'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
    document.getElementById(id)?.classList.remove('flex');
  });
  ['loginNavBtn', 'loginNavBtnMobile'].forEach(id => {
    document.getElementById(id)?.classList.remove('hidden');
  });

  if (auth0Client) {
    await auth0Client.logout({
      logoutParams: { returnTo: window.location.origin }
    });
  }
}

function displayUserInfo(user) {
  // Footer display
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) {
    userInfoEl.textContent = '';
    const label = document.createTextNode('Logged in as ');
    const bold = document.createElement('b');
    bold.textContent = user.name || user.email;
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Logout';
    logoutBtn.className = 'ml-2 text-blue-600 underline hover:text-blue-800';
    logoutBtn.addEventListener('click', logout);
    userInfoEl.appendChild(label);
    userInfoEl.appendChild(bold);
    userInfoEl.appendChild(document.createTextNode(' '));
    userInfoEl.appendChild(logoutBtn);
  }

  // Desktop nav
  const navInfo = document.getElementById('userNavInfo');
  const navName = document.getElementById('userNavName');
  const navAvatar = document.getElementById('userNavAvatar');
  const loginNavBtn = document.getElementById('loginNavBtn');
  if (navInfo) { navInfo.classList.remove('hidden'); navInfo.classList.add('flex'); }
  if (navName) navName.textContent = user.name || user.email;
  if (navAvatar && user.picture) { navAvatar.src = user.picture; navAvatar.classList.remove('hidden'); }
  if (loginNavBtn) loginNavBtn.classList.add('hidden');

  // Mobile nav
  const mobileNavInfo = document.getElementById('userNavInfoMobile');
  const mobileNavName = document.getElementById('userNavNameMobile');
  const loginNavBtnMobile = document.getElementById('loginNavBtnMobile');
  if (mobileNavInfo) mobileNavInfo.classList.remove('hidden');
  if (mobileNavName) mobileNavName.textContent = user.name || user.email;
  if (loginNavBtnMobile) loginNavBtnMobile.classList.add('hidden');
}

function sendLoginEvent(user) {
  if (!config.webhookUrl) return;
  fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      provider: user.provider,
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.warn('[auth] Webhook failed:', err.message));
}

// ==============================================
// Visitor Tracking (Firebase Realtime Database)
// ==============================================

async function trackPageVisit() {
  if (!config.firebaseUrl || sessionStorage.getItem('visitTracked')) return;
  sessionStorage.setItem('visitTracked', '1');

  try {
    await fetch(`${config.firebaseUrl}/visits.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ts: new Date().toISOString() })
    });
  } catch (e) {
    console.warn('[tracking] Failed to track visit:', e.message);
  }
}

async function trackContentAccess() {
  if (!config.firebaseUrl || sessionStorage.getItem('accessTracked')) return;
  sessionStorage.setItem('accessTracked', '1');

  try {
    await fetch(`${config.firebaseUrl}/content_access.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ts: new Date().toISOString() })
    });
    updateVisitorCountDisplay();
  } catch (e) {
    console.warn('[tracking] Failed to track access:', e.message);
  }
}

async function trackLogin(user) {
  if (!config.firebaseUrl) return;

  try {
    await fetch(`${config.firebaseUrl}/logins.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, ts: new Date().toISOString() })
    });
    updateVisitorCountDisplay();
  } catch (e) {
    console.warn('[tracking] Failed to track login:', e.message);
  }
}

async function updateVisitorCountDisplay() {
  if (!config.firebaseUrl) return;

  try {
    const [accessRes, loginRes] = await Promise.all([
      fetch(`${config.firebaseUrl}/content_access.json?shallow=true`),
      fetch(`${config.firebaseUrl}/logins.json?shallow=true`)
    ]);

    const accessData = await accessRes.json();
    const loginData = await loginRes.json();

    const accessCount = accessData && typeof accessData === 'object' ? Object.keys(accessData).length : 0;
    const loginCount = loginData && typeof loginData === 'object' ? Object.keys(loginData).length : 0;

    const counterEl = document.getElementById('visitorCounter');
    if (counterEl) {
      counterEl.textContent = `${accessCount} visitor${accessCount !== 1 ? 's' : ''} · ${loginCount} sign-in${loginCount !== 1 ? 's' : ''}`;
      counterEl.classList.remove('hidden');
    }
  } catch (e) {
    console.warn('[tracking] Failed to load counts:', e.message);
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
      const isOpen = !mobileMenu.classList.contains('hidden');
      if (isOpen) {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
      } else {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('flex');
      }
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  // Desktop dropdown
  const desktopDropdownToggle = document.getElementById('desktopDropdownToggle');
  const desktopDropdown = document.getElementById('desktopDropdown');

  if (desktopDropdownToggle && desktopDropdown) {
    desktopDropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = !desktopDropdown.classList.contains('hidden');
      if (isOpen) {
        desktopDropdown.classList.add('hidden');
        desktopDropdown.classList.remove('flex');
        desktopDropdownToggle.setAttribute('aria-expanded', 'false');
      } else {
        desktopDropdown.classList.remove('hidden');
        desktopDropdown.classList.add('flex');
        desktopDropdownToggle.setAttribute('aria-expanded', 'true');
      }
    });

    document.addEventListener('click', (e) => {
      if (!desktopDropdown.contains(e.target) && !desktopDropdownToggle.contains(e.target)) {
        desktopDropdown.classList.add('hidden');
        desktopDropdown.classList.remove('flex');
        desktopDropdownToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Mobile dropdown
  const mobileDropdownToggle = document.getElementById('mobileDropdownToggle');
  const mobileDropdown = document.getElementById('mobileDropdown');

  if (mobileDropdownToggle && mobileDropdown) {
    mobileDropdownToggle.addEventListener('click', () => {
      const isOpen = !mobileDropdown.classList.contains('hidden');
      if (isOpen) {
        mobileDropdown.classList.add('hidden');
        mobileDropdown.classList.remove('flex');
        mobileDropdownToggle.setAttribute('aria-expanded', 'false');
      } else {
        mobileDropdown.classList.remove('hidden');
        mobileDropdown.classList.add('flex');
        mobileDropdownToggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  // Login buttons (desktop + mobile) trigger Auth0 Universal Login
  ['loginNavBtn', 'loginNavBtnMobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      closeMobileMenu();
      trackContentAccess();
      login();
    });
  });

  // Logout buttons (desktop + mobile)
  ['logoutNavBtn', 'logoutNavBtnMobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', logout);
  });

  // Close mobile menu when plain nav links are tapped
  const mobileMenuEl = document.getElementById('mobileMenu');
  if (mobileMenuEl) {
    mobileMenuEl.querySelectorAll('a[href]:not([onclick])').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }
}

// ==============================================
// Modals
// ==============================================

function setupModals() {
  const closeLoginModal = document.getElementById('closeLoginModal');
  const loginModal = document.getElementById('loginModal');

  if (closeLoginModal && loginModal) {
    closeLoginModal.addEventListener('click', () => {
      loginModal.classList.add('hidden');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function closeAllModals() {
  document.getElementById('loginModal')?.classList.add('hidden');
  closeMobileMenu();

  ['desktopDropdown', 'aiTrendsTooltip'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

window.redirectToLogin = function(targetUrl, e) {
  if (e) e.preventDefault();

  // Already logged in — go straight to content
  if (currentUser) {
    closeMobileMenu();
    if (targetUrl) window.location.href = targetUrl;
    return;
  }

  closeMobileMenu();
  trackContentAccess();
  login(targetUrl);
};

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const menuToggle = document.getElementById('menuToggle');
  const mobileDropdown = document.getElementById('mobileDropdown');
  const mobileDropdownToggle = document.getElementById('mobileDropdownToggle');
  if (mobileMenu) { mobileMenu.classList.add('hidden'); mobileMenu.classList.remove('flex'); }
  if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
  if (mobileDropdown) { mobileDropdown.classList.add('hidden'); mobileDropdown.classList.remove('flex'); }
  if (mobileDropdownToggle) mobileDropdownToggle.setAttribute('aria-expanded', 'false');
}

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

  chatSend.addEventListener('click', () => sendLLMMessage());
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendLLMMessage(); }
  });
}

function sendLLMMessage() {
  const chatHistory = document.getElementById('llmChatHistory');
  const chatInput = document.getElementById('llmChatInput');
  const chatSend = document.getElementById('llmChatSend');

  const query = chatInput.value.trim();
  if (!query) return;

  appendMessage('user', query);
  chatInput.value = '';

  if (!config.llmApiUrl) {
    appendMessage('llm', 'LLM chat is not configured. This is a demo feature. To enable it, add "llmApiUrl" to your auth-config.json file.');
    return;
  }

  appendMessage('llm', 'Thinking...');
  chatSend.disabled = true;
  chatInput.disabled = true;

  fetch(config.llmApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: query })
  })
  .then(res => res.json())
  .then(data => {
    chatHistory.lastChild.remove();
    appendMessage('llm', data.answer || 'No answer received.');
  })
  .catch(error => {
    console.error('[llm] Query failed:', error);
    chatHistory.lastChild.remove();
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
  msgDiv.className = sender === 'user' ? 'text-right' : 'text-left bg-blue-50 rounded px-3 py-2';
  const senderName = sender === 'user' ? 'You' : 'Issak LLM';
  msgDiv.innerHTML = `<span class="font-semibold">${senderName}:</span> ${escapeHtml(text)}`;
  chatHistory.appendChild(msgDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ==============================================
// Tooltips
// ==============================================

function setupTooltips() {
  const btn = document.getElementById('aiTrendsTipBtn');
  const tooltip = document.getElementById('aiTrendsTooltip');

  if (btn && tooltip) {
    btn.addEventListener('mouseenter', () => tooltip.classList.remove('hidden'));
    btn.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
    btn.addEventListener('focus', () => tooltip.classList.remove('hidden'));
    btn.addEventListener('blur', () => tooltip.classList.add('hidden'));
  }
}

// ==============================================
// Countdown Timer
// ==============================================

function setupCountdown() {
  const countdownEl = document.getElementById('countdown2026');
  if (!countdownEl) return;

  function updateCountdown() {
    const now = new Date();
    const target = new Date(now.getFullYear() + 1, 0, 1);
    const diff = target - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    countdownEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s until ${now.getFullYear() + 1}`;
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
    yearEl.innerHTML = `&copy; ${new Date().getFullYear()} Issak Gezehei. All rights reserved.`;
  }
}
