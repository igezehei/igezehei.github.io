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

// Login functionality
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('modalLoginForm');
  const errorMessage = document.getElementById('modalErrorMessage');

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('modalUsername').value.trim();
    const password = document.getElementById('modalPassword').value.trim();

    if (username === 'asmara' && password === 'product#2025') {
      // Hide the modal and redirect to the target URL
      document.getElementById('loginModal').classList.add('hidden');
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        window.location.href = redirectUrl;
      } else {
        alert('Login successful, but no redirect URL found.');
      }
    } else {
      errorMessage.textContent = 'Invalid username or password.';
      errorMessage.classList.remove('hidden');
    }
  });

  // Close the login modal when the close button is clicked
  document.getElementById('closeLoginModal').addEventListener('click', () => {
    document.getElementById('loginModal').classList.add('hidden');
  });
});