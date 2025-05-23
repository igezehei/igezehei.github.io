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