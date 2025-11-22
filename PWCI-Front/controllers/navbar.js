function initUserInfo() {
  if (window.PWCI && window.PWCI.session) {
    window.PWCI.session.refreshUI();
  }
}

function initNavbar() {
  const menuButton = document.getElementById('menuButton');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const closeMenuButton = document.getElementById('closeMenuButton');
  const menuOverlay = document.getElementById('menuOverlay');
  
  // Inicializar información del usuario
  initUserInfo();
  
  if (menuButton && sidebarMenu) {
    // Open menu
    menuButton.addEventListener('click', function() {
      console.log('Menu button clicked'); // Debug
      sidebarMenu.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
    
    // Close menu function
    function closeMenu() {
      console.log('Closing menu'); // Debug
      sidebarMenu.classList.add('hidden');
      document.body.style.overflow = 'auto'; // Restore scrolling
    }
    
    // Close menu events
    if (closeMenuButton) {
      closeMenuButton.addEventListener('click', closeMenu);
    }
    
    if (menuOverlay) {
      menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  } else {
    console.log('Menu elements not found'); // Debug
  }
}
